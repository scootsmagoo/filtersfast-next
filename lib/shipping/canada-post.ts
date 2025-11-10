/**
 * Canada Post Shipping API Integration
 * Supports shipment creation and tracking
 */

import {
  XMLBuilder,
  XMLParser,
} from 'fast-xml-parser';

import type {
  CanadaPostCredentials,
  CanadaPostServiceCode,
  CreateShipmentRequest,
  Package,
  Shipment,
  ShipmentStatus,
  ShippingRate,
  ShippingRateRequest,
  TrackingEvent,
  TrackingInfo,
  TrackingRequest,
} from '@/lib/types/shipping';

const CANADAPOST_BASE_URL = {
  staging: 'https://ct.soa-gw.canadapost.ca',
  production: 'https://soa-gw.canadapost.ca',
} as const;

export class CanadaPostShippingClient {
  private credentials: CanadaPostCredentials;

  constructor(credentials: CanadaPostCredentials) {
    this.credentials = credentials;
  }

  /**
   * Create a shipment (label) with Canada Post
   */
  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    const endpoint = this.getShipmentEndpoint();
    const xmlBody = this.buildShipmentRequest(request);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/vnd.cpc.shipment-v8+xml',
        'Accept': 'application/vnd.cpc.shipment-v8+xml',
      },
      body: xmlBody,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Canada Post create shipment error:', text);
      throw new Error('Canada Post shipment creation failed');
    }

    const responseText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
    });

    const data = parser.parse(responseText);
    const shipmentInfo = data?.['shipment-info'];

    if (!shipmentInfo) {
      console.error('Unexpected Canada Post shipment response', data);
      throw new Error('Invalid Canada Post shipment response');
    }

    const trackingNumber = shipmentInfo['tracking-pin'];
    const shipmentId = shipmentInfo['shipment-id'];
    const links = Array.isArray(shipmentInfo.links?.link)
      ? shipmentInfo.links.link
      : shipmentInfo.links?.link
        ? [shipmentInfo.links.link]
        : [];

    const labelLink = links.find((link: any) => link.rel === 'label');

    if (!trackingNumber || !labelLink?.href) {
      throw new Error('Canada Post response missing tracking number or label link');
    }

    const labelBase64 = await this.fetchLabel(labelLink.href);
    const rateDue = shipmentInfo['shipment-price']?.['due']?.amount ?? '0';
    const currency = shipmentInfo['shipment-price']?.['due']?.currency ?? 'CAD';

    return {
      id: crypto.randomUUID(),
      carrier: 'canada_post',
      service_name: this.getServiceName(request.service_code),
      service_code: request.service_code,
      tracking_number: trackingNumber,
      label_url: labelBase64,
      label_format: 'PDF',
      rate: parseFloat(rateDue),
      currency,
      origin: request.origin,
      destination: request.destination,
      status: 'label_created',
      order_id: request.reference_number,
      reference_number: request.reference_number,
      created_at: Date.now(),
      carrier_shipment_id: shipmentId,
      raw_response: data,
      metadata: request.metadata,
    };
  }

  /**
   * Canada Post rate API requires additional certification; return empty array.
   */
  async getRates(_request: ShippingRateRequest): Promise<ShippingRate[]> {
    return [];
  }

  /**
   * Track a shipment via Canada Post tracking API
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingInfo> {
    const endpoint = this.getTrackingEndpoint(request.tracking_number);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/vnd.cpc.track-v2+xml',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Canada Post tracking error:', text);
      throw new Error('Failed to retrieve Canada Post tracking information');
    }

    const body = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
    });

    const data = parser.parse(body);
    const details = data?.['tracking-detail'] || data?.['track-detail'];

    if (!details) {
      throw new Error('Invalid Canada Post tracking response');
    }

    const eventsRaw = details.events?.event || details.event || [];
    const eventsArray = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];

    const events: TrackingEvent[] = eventsArray
      .filter(Boolean)
      .map((event: any) => ({
        timestamp: event?.datetime ? Date.parse(event.datetime) : Date.now(),
        status: event?.description || 'Shipment update',
        description: event?.description || event?.event-type || 'Shipment update',
        location: event?.location,
        city: event?.city,
        state: event?.province,
        postal_code: event?.postal-code,
        country: event?.country,
      }));

    return {
      carrier: 'canada_post',
      tracking_number: request.tracking_number,
      status: this.mapTrackingStatus(details['event-description'] || details['status-description'] || ''),
      estimated_delivery_date: details['expected-delivery-date'],
      actual_delivery_date: details['actual-delivery-date'],
      delivery_signature: details['signatory-name'],
      current_location: details['event-location'],
      events,
      updated_at: Date.now(),
      raw_response: data,
    };
  }

  /**
   * Build XML payload for shipment creation
   */
  private buildShipmentRequest(request: CreateShipmentRequest) {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      format: true,
    });

    const origin = request.is_return_label ? request.destination : request.origin;
    const destination = request.is_return_label ? request.origin : request.destination;

    const packageNode = this.mapPackage(request.packages[0]);

    const payload = {
      shipment: {
        '@xmlns': 'http://www.canadapost.ca/ws/shipment-v8',
        'customer-request-id': request.reference_number || crypto.randomUUID(),
        'pickup-indicator': request.is_return_label ? 'false' : 'true',
        'delivery-spec': {
          'service-code': this.mapServiceCode(request.service_code),
          'sender': this.mapAddress(origin),
          'destination': this.mapDestination(destination),
          'parcel-characteristics': packageNode,
          'options': this.buildOptions(request),
          'notification': request.metadata?.notification_email
            ? {
              'email': request.metadata.notification_email,
              'on-shipment': 'true',
              'on-exception': 'true',
            }
            : undefined,
          'references': request.reference_number
            ? {
              'customer-reference': request.reference_number,
            }
            : undefined,
        },
      },
    };

    return builder.build(payload);
  }

  /**
   * Map package data to Canada Post schema
   */
  private mapPackage(pkg: Package) {
    const weight = Math.max(pkg.weight ?? 0, 0.1);

    return {
      weight: Number(weight.toFixed(2)),
      'weight-unit': 'lb',
      dimensions: pkg.length && pkg.width && pkg.height
        ? {
          length: Number(pkg.length.toFixed(2)),
          width: Number(pkg.width.toFixed(2)),
          height: Number(pkg.height.toFixed(2)),
          'dimension-unit': 'in',
        }
        : undefined,
    };
  }

  /**
   * Map address to sender/destination nodes
   */
  private mapAddress(address: CreateShipmentRequest['origin']) {
    return {
      name: address.name || address.company || 'Sender',
      company: address.company || '',
      'contact-phone': address.phone || '0000000000',
      address: {
        'address-line-1': address.address_line1,
        'address-line-2': address.address_line2 || undefined,
        city: address.city,
        province: address.state,
        'postal-code': address.postal_code,
        country: address.country,
      },
    };
  }

  private mapDestination(address: CreateShipmentRequest['destination']) {
    return {
      name: address.name || address.company || 'Recipient',
      company: address.company || '',
      'contact-phone': address.phone || '0000000000',
      address: {
        'address-line-1': address.address_line1,
        'address-line-2': address.address_line2 || undefined,
        city: address.city,
        province: address.state,
        'postal-code': address.postal_code,
        country: address.country,
      },
    };
  }

  /**
   * Build options node
   */
  private buildOptions(request: CreateShipmentRequest) {
    const options: any[] = [];

    if (request.signature_required) {
      options.push({
        option: {
          'option-code': 'SO',
        },
      });
    }

    if (request.saturday_delivery) {
      options.push({
        option: {
          'option-code': 'SD',
        },
      });
    }

    if (request.insurance_amount && request.insurance_amount > 0) {
      options.push({
        option: {
          'option-code': 'COV',
          'option-amount': {
            amount: request.insurance_amount.toFixed(2),
            currency: 'CAD',
          },
        },
      });
    }

    return options.length > 0 ? options : undefined;
  }

  /**
   * Convert service code to Canada Post format
   */
  private mapServiceCode(code: string): CanadaPostServiceCode {
    const normalized = code.toUpperCase();
    const map: Record<string, CanadaPostServiceCode> = {
      'EXPEDITED_PARCEL': 'DOM.EP',
      'XPRESSPOST': 'DOM.XP',
      'PRIORITY': 'DOM.PC',
      'REGULAR_PARCEL': 'DOM.RP',
      'XPRESSPOST_USA': 'USA.XP',
      'EXPEDITED_PARCEL_USA': 'USA.EP',
      'XPRESSPOST_INTL': 'INT.XP',
    };

    return map[normalized] || (normalized as CanadaPostServiceCode);
  }

  /**
   * Fetch label PDF and convert to base64
   */
  private async fetchLabel(url: string): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Canada Post label download error:', text);
      throw new Error('Failed to download Canada Post label');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString('base64');
  }

  /**
   * Map Canada Post tracking status
   */
  private mapTrackingStatus(status: string): ShipmentStatus {
    const normalized = (status || '').toLowerCase();

    if (normalized.includes('delivered')) return 'delivered';
    if (normalized.includes('out for delivery')) return 'out_for_delivery';
    if (normalized.includes('in transit')) return 'in_transit';
    if (normalized.includes('attempted')) return 'exception';
    if (normalized.includes('returned')) return 'returned';
    if (normalized.includes('cancelled')) return 'cancelled';

    return 'in_transit';
  }

  private getServiceName(code: string): string {
    const normalized = code.toUpperCase();
    const names: Record<string, string> = {
      'DOM.EP': 'Expedited Parcel',
      'DOM.XP': 'Xpresspost',
      'DOM.PC': 'Priority',
      'DOM.RP': 'Regular Parcel',
      'USA.EP': 'Expedited Parcel USA',
      'USA.XP': 'Xpresspost USA',
      'INT.XP': 'Xpresspost International',
    };

    return names[normalized] || `Canada Post ${normalized}`;
  }

  private getShipmentEndpoint() {
    const base = this.credentials.environment === 'production'
      ? CANADAPOST_BASE_URL.production
      : CANADAPOST_BASE_URL.staging;

    const mailedBy = this.credentials.contract_id || this.credentials.customer_number;
    return `${base}/rs/${mailedBy}/${this.credentials.customer_number}/shipment`;
  }

  private getTrackingEndpoint(trackingNumber: string) {
    const base = this.credentials.environment === 'production'
      ? CANADAPOST_BASE_URL.production
      : CANADAPOST_BASE_URL.staging;

    const mailedBy = this.credentials.contract_id || this.credentials.customer_number;
    return `${base}/rs/${mailedBy}/track/pin/${encodeURIComponent(trackingNumber)}`;
  }

  private getAuthHeader() {
    const credentials = `${this.credentials.username}:${this.credentials.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }
}

/**
 * Resolve Canada Post credentials from environment variables
 */
export function getCanadaPostCredentials(): CanadaPostCredentials {
  const username = process.env.CANADAPOST_USERNAME;
  const password = process.env.CANADAPOST_PASSWORD;
  const customerNumber = process.env.CANADAPOST_CUSTOMER_NUMBER;
  const contractId = process.env.CANADAPOST_CONTRACT_ID;
  const mailingPlan = process.env.CANADAPOST_MAILING_PLAN;
  const environment = process.env.CANADAPOST_ENVIRONMENT as CanadaPostCredentials['environment'];

  if (!username || !password || !customerNumber) {
    throw new Error('Canada Post API credentials not configured');
  }

  return {
    username,
    password,
    customer_number: customerNumber,
    contract_id: contractId || undefined,
    mailing_plan: mailingPlan || undefined,
    environment: environment || 'staging',
  };
}

/**
 * Create Canada Post client instance
 */
export function createCanadaPostClient(): CanadaPostShippingClient {
  const credentials = getCanadaPostCredentials();
  return new CanadaPostShippingClient(credentials);
}

