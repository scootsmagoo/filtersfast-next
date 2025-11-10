/**
 * Admin Shipping Labels API
 * Create shipping labels and retrieve shipment history
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { sanitize } from '@/lib/sanitize';
import {
  getShippingConfig,
  getActiveCarriers,
} from '@/lib/db/shipping-config';
import {
  recordShipment,
  listShipments,
  type ShipmentHistoryFilters,
} from '@/lib/db/shipment-history';

import { createUSPSClient } from '@/lib/shipping/usps';
import { createUPSClient } from '@/lib/shipping/ups';
import { createFedExClient } from '@/lib/shipping/fedex';
import { createDHLClient } from '@/lib/shipping/dhl';
import { createCanadaPostClient } from '@/lib/shipping/canada-post';

import type {
  CreateShipmentRequest,
  Package,
  ShippingCarrier,
  ShippingDestinationAddress,
  ShippingOriginAddress,
} from '@/lib/types/shipping';

/**
 * GET /api/admin/shipping/labels
 * Retrieve shipment history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: ShipmentHistoryFilters = {};

    const orderId = searchParams.get('order_id');
    const carrier = searchParams.get('carrier') as ShippingCarrier | null;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (orderId) filters.order_id = sanitize(orderId);
    if (carrier) filters.carrier = carrier;
    if (status) filters.status = status as any;
    if (search) filters.search = sanitize(search);
    if (from) filters.from = Number(from);
    if (to) filters.to = Number(to);
    if (limit) filters.limit = Number(limit);
    if (offset) filters.offset = Number(offset);

    const shipments = listShipments(filters);
    return NextResponse.json({ data: shipments });
  } catch (error) {
    console.error('Get shipping labels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment history' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/shipping/labels
 * Create a new shipping label
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      const text = await request.text();
      if (text.length > 100_000) {
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 },
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    const validationError = validateCreateLabelPayload(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 },
      );
    }

    const carrier = body.carrier as ShippingCarrier;
    const orderId = sanitize(body.order_id);
    const referenceNumber = sanitize(body.reference_number || body.order_id);

    const config = getShippingConfig(carrier);
    if (!config || !config.is_active) {
      return NextResponse.json(
        { error: `${carrier} is not configured or active` },
        { status: 400 },
      );
    }

    // Build shipment request
    let originAddress: ShippingOriginAddress;
    let destinationAddress: ShippingDestinationAddress;
    let packages: Package[];
    let metadata: Record<string, string> | undefined;
    let labelFormat: CreateShipmentRequest['label_format'];
    let labelSize: CreateShipmentRequest['label_size'];
    let insuranceAmount: number | undefined;
    let pickupAccountNumber: string | undefined;
    let billingAccountNumber: string | undefined;
    let customsDeclaration: ReturnType<typeof sanitizeCustomsDeclaration>;

    try {
      labelFormat = normalizeLabelFormat(body.label_format);
      labelSize = normalizeLabelSize(body.label_size);
      originAddress = sanitizeAddress('origin', body.origin || config.origin_address) as ShippingOriginAddress;
      destinationAddress = sanitizeAddress('destination', body.destination) as ShippingDestinationAddress;
      packages = sanitizePackages(body.packages);
      metadata = sanitizeMetadata(body.metadata);
      insuranceAmount = normalizeInsuranceAmount(body.insurance_amount);
      pickupAccountNumber = sanitizeOptionalString(body.pickup_account_number, 'pickup_account_number');
      billingAccountNumber = sanitizeOptionalString(body.billing_account_number, 'billing_account_number');
      customsDeclaration = sanitizeCustomsDeclaration(body.customs_declaration);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid request payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const shipmentRequest: CreateShipmentRequest = {
      carrier,
      service_code: sanitize(body.service_code),
      origin: originAddress,
      destination: destinationAddress,
      packages,
      label_format: labelFormat,
      label_size: labelSize,
      signature_required: Boolean(body.signature_required),
      saturday_delivery: Boolean(body.saturday_delivery),
      insurance_amount: insuranceAmount,
      reference_number: referenceNumber,
      customs_declaration: customsDeclaration,
      is_return_label: Boolean(body.is_return_label),
      pickup_account_number: pickupAccountNumber,
      billing_account_number: billingAccountNumber,
      metadata,
    };

    const isProduction = process.env.NODE_ENV === 'production';

    const shipment = await createCarrierShipment(shipmentRequest, isProduction);
    shipment.order_id = orderId;

    const stored = recordShipment(shipment as Shipment & { order_id: string });

    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    console.error('Create shipping label error:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping label' },
      { status: 500 },
    );
  }
}

/**
 * Create shipment using correct carrier client
 */
async function createCarrierShipment(
  request: CreateShipmentRequest,
  isProduction: boolean,
) {
  switch (request.carrier) {
    case 'usps': {
      const client = createUSPSClient(isProduction);
      return client.createShipment(request);
    }

    case 'ups': {
      const client = createUPSClient(isProduction);
      return client.createShipment(request);
    }

    case 'fedex': {
      const client = createFedExClient(isProduction);
      return client.createShipment(request);
    }

    case 'dhl': {
      const client = createDHLClient(isProduction);
      return client.createShipment(request);
    }

    case 'canada_post': {
      const client = createCanadaPostClient();
      return client.createShipment(request);
    }

    default:
      throw new Error(`Unsupported carrier: ${request.carrier}`);
  }
}

/**
 * Validate label creation payload
 */
function validateCreateLabelPayload(body: any): string | null {
  const requiredFields = ['order_id', 'carrier', 'service_code', 'destination', 'packages'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }

  if (!Array.isArray(body.packages) || body.packages.length === 0) {
    return 'At least one package is required';
  }

  const validCarriers: ShippingCarrier[] = ['fedex', 'ups', 'usps', 'dhl', 'canada_post'];
  if (!validCarriers.includes(body.carrier)) {
    return 'Invalid carrier';
  }

  return null;
}

function sanitizeAddress(
  type: 'origin' | 'destination',
  address: ShippingOriginAddress | ShippingDestinationAddress,
): ShippingOriginAddress | ShippingDestinationAddress {
  if (!address) {
    throw new Error(`${type} address is required`);
  }

  const sanitizedAddress: ShippingOriginAddress | ShippingDestinationAddress = {
    name: address.name ? sanitize(address.name) : undefined,
    company: address.company ? sanitize(address.company) : undefined,
    address_line1: sanitize(address.address_line1),
    address_line2: address.address_line2 ? sanitize(address.address_line2) : undefined,
    city: sanitize(address.city),
    state: sanitize(address.state),
    postal_code: sanitize(address.postal_code),
    country: sanitize(address.country),
    phone: address.phone ? sanitize(address.phone) : undefined,
    is_residential: (address as ShippingDestinationAddress).is_residential,
  };

  const requiredFields: Array<keyof ShippingOriginAddress> = [
    'address_line1',
    'city',
    'state',
    'postal_code',
    'country',
  ];

  for (const field of requiredFields) {
    const value = (sanitizedAddress as Record<string, unknown>)[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid ${type} ${field.replace('_', ' ')}`);
    }
  }

  return sanitizedAddress;
}

function sanitizePackages(packages: Package[]): Package[] {
  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('At least one package is required');
  }

  if (packages.length > 10) {
    throw new Error('Maximum of 10 packages allowed per shipment');
  }

  return packages.map((pkg, index) => {
    const weight = Number(pkg.weight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 150) {
      throw new Error(`Invalid package weight for package ${index + 1}`);
    }

    const dimKeys: Array<keyof Package> = ['length', 'width', 'height'];
    const dimensions: Partial<Package> = {};

    for (const key of dimKeys) {
      const value = pkg[key];
      if (value === undefined || value === null || value === '') continue;

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 108) {
        throw new Error(`Invalid package ${key} for package ${index + 1}`);
      }

      dimensions[key] = numericValue;
    }

    let insuredValue: number | undefined;
    if (pkg.insured_value !== undefined && pkg.insured_value !== null && pkg.insured_value !== '') {
      insuredValue = Number(pkg.insured_value);
      if (!Number.isFinite(insuredValue) || insuredValue < 0) {
        throw new Error(`Invalid insured value for package ${index + 1}`);
      }
    }

    return {
      weight,
      ...dimensions,
      insured_value: insuredValue,
      contents_type: pkg.contents_type,
      description: pkg.description ? sanitize(pkg.description) : undefined,
    };
  });
}

function normalizeLabelFormat(format: unknown): CreateShipmentRequest['label_format'] {
  if (typeof format !== 'string') {
    return 'PDF';
  }

  const normalised = format.toUpperCase();
  const allowed: CreateShipmentRequest['label_format'][] = ['PDF', 'PNG', 'ZPL'];
  if (!allowed.includes(normalised as CreateShipmentRequest['label_format'])) {
    throw new Error('Invalid label format');
  }

  return normalised as CreateShipmentRequest['label_format'];
}

function normalizeLabelSize(size: unknown): CreateShipmentRequest['label_size'] {
  if (typeof size !== 'string') {
    return '4x6';
  }

  const normalised = size.toLowerCase();
  const allowed: CreateShipmentRequest['label_size'][] = ['4x6', '8x11'];
  if (!allowed.includes(normalised as CreateShipmentRequest['label_size'])) {
    throw new Error('Invalid label size');
  }

  return normalised as CreateShipmentRequest['label_size'];
}

function normalizeInsuranceAmount(amount: unknown): number | undefined {
  if (amount === undefined || amount === null || amount === '') {
    return undefined;
  }

  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Invalid insurance amount');
  }

  return value;
}

function sanitizeMetadata(metadata: unknown): Record<string, string> | undefined {
  if (metadata === undefined || metadata === null) {
    return undefined;
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Metadata must be a key-value object');
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      throw new Error('Metadata values must be strings');
    }
    sanitized[sanitize(key)] = sanitize(value);
  }

  return sanitized;
}

function sanitizeOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid value for ${field}`);
  }

  return sanitize(value);
}

function sanitizeCustomsDeclaration(declaration: unknown): CreateShipmentRequest['customs_declaration'] {
  if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration)) {
    return undefined;
  }

  const sanitizedDeclaration = { ...(declaration as Record<string, unknown>) };

  if (typeof sanitizedDeclaration.contents_type === 'string') {
    sanitizedDeclaration.contents_type = sanitize(sanitizedDeclaration.contents_type);
  }

  if (typeof sanitizedDeclaration.contents_explanation === 'string') {
    sanitizedDeclaration.contents_explanation = sanitize(sanitizedDeclaration.contents_explanation);
  }

  if (typeof sanitizedDeclaration.invoice_number === 'string') {
    sanitizedDeclaration.invoice_number = sanitize(sanitizedDeclaration.invoice_number);
  }

  if (typeof sanitizedDeclaration.non_delivery_option === 'string') {
    sanitizedDeclaration.non_delivery_option = sanitize(sanitizedDeclaration.non_delivery_option);
  }

  if (Array.isArray(sanitizedDeclaration.items)) {
    sanitizedDeclaration.items = sanitizedDeclaration.items.map((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`Invalid customs item at index ${index}`);
      }

      const sanitizedItem = { ...(item as Record<string, unknown>) };
      if (typeof sanitizedItem.description === 'string') {
        sanitizedItem.description = sanitize(sanitizedItem.description);
      }
      if (typeof sanitizedItem.origin_country === 'string') {
        sanitizedItem.origin_country = sanitize(sanitizedItem.origin_country);
      }
      if (typeof sanitizedItem.hs_tariff_code === 'string') {
        sanitizedItem.hs_tariff_code = sanitize(sanitizedItem.hs_tariff_code);
      }

      return sanitizedItem;
    });
  }

  return sanitizedDeclaration as CreateShipmentRequest['customs_declaration'];
}

/**
 * Utility to list active carriers (optional helper)
 */
export function getEnabledCarrierCodes(): ShippingCarrier[] {
  return getActiveCarriers().map((config) => config.carrier);
}

