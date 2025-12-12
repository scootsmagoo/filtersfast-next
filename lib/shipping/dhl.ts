/**
 * DHL eCommerce Shipping API Integration
 * Supports label creation and tracking
 */

import type {
  CreateShipmentRequest,
  DHLCredentials,
  DHLServiceCode,
  Package,
  Shipment,
  ShipmentStatus,
  ShippingRate,
  ShippingRateRequest,
  TrackingEvent,
  TrackingInfo,
  TrackingRequest,
} from '@/lib/types/shipping';

const DHL_AUTH_URL = {
  sandbox: 'https://api-sandbox.dhlecs.com/auth/v4/token',
  production: 'https://api.dhlecs.com/auth/v4/token',
} as const;

const DHL_API_BASE = {
  sandbox: 'https://api-sandbox.dhlecs.com',
  production: 'https://api.dhlecs.com',
} as const;

export class DHLShippingClient {
  private credentials: DHLCredentials;
  private isProduction: boolean;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(credentials: DHLCredentials, isProduction = false) {
    this.credentials = credentials;
    this.isProduction = isProduction;
  }

  /**
   * Create a shipment and generate a label
   */
  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const body = this.buildShipmentRequest(request);
    const endpoint = request.is_return_label
      ? '/returns/v4/label?format=PNG'
      : '/shipping/v1/labels/merchant';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DHL create shipment error:', errorText);
      throw new Error('DHL shipment creation failed');
    }

    const data = await response.json();
    return this.parseShipmentResponse(data, request);
  }

  /**
   * Fetch shipping rates (limited support)
   * DHL eCommerce primarily uses pre-negotiated products; return empty array by default.
   */
  async getRates(_request: ShippingRateRequest): Promise<ShippingRate[]> {
    return [];
  }

  /**
   * Track a DHL shipment
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingInfo> {
    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(
      `${baseUrl}/tracking/shipments/${encodeURIComponent(request.tracking_number)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DHL tracking error:', errorText);
      throw new Error('Failed to retrieve DHL tracking information');
    }

    const data = await response.json();
    return this.parseTrackingResponse(data, request.tracking_number);
  }

  /**
   * Retrieve (or refresh) access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.credentials.access_token) {
      return this.credentials.access_token;
    }

    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = this.isProduction ? DHL_AUTH_URL.production : DHL_AUTH_URL.sandbox;
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: this.credentials.client_id,
        clientSecret: this.credentials.client_secret,
        grantType: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DHL authentication error:', errorText);
      throw new Error('DHL authentication failed');
    }

    const data = await response.json();
    this.accessToken = data.accessToken || data.access_token;
    const expiresIn = data.expiresIn || data.expires_in || 3500;
    this.tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

    if (!this.accessToken) {
      throw new Error('DHL authentication response missing access token');
    }

    return this.accessToken;
  }

  /**
   * Build DHL shipment request payload
   */
  private buildShipmentRequest(request: CreateShipmentRequest) {
    const shipper = request.is_return_label ? request.destination : request.origin;
    const recipient = request.is_return_label ? request.origin : request.destination;

    const packages = request.packages.map((pkg, index) => this.mapPackage(pkg, index));

    return {
      pickup: this.credentials.pickup_account || request.pickup_account_number,
      orderedProductId: this.mapServiceCode(request.service_code),
      merchantId: this.credentials.merchant_id || undefined,
      shipmentDetails: {
        orderNumber: request.reference_number,
        isReturn: Boolean(request.is_return_label),
      },
      shipperAddress: this.mapAddress(shipper),
      recipientAddress: this.mapAddress(recipient),
      packageDetails: packages,
    };
  }

  /**
   * Map internal package to DHL representation
   */
  private mapPackage(pkg: Package, index: number) {
    const weight = Math.max(pkg.weight ?? 0, 0.1);
    const dim = {
      length: pkg.length ? Number(pkg.length.toFixed(2)) : undefined,
      width: pkg.width ? Number(pkg.width.toFixed(2)) : undefined,
      height: pkg.height ? Number(pkg.height.toFixed(2)) : undefined,
    };

    return {
      reference: `PKG-${index + 1}`,
      weight: {
        value: Number(weight.toFixed(2)),
        unitOfMeasure: 'LB',
      },
      dimensions: dim.length && dim.width && dim.height ? {
        length: dim.length,
        width: dim.width,
        height: dim.height,
        unitOfMeasure: 'IN',
      } : undefined,
      description: pkg.description || pkg.contents_type || 'General Merchandise',
      insuredValue: pkg.insured_value
        ? { amount: pkg.insured_value, currency: 'USD' }
        : undefined,
    };
  }

  /**
   * Map address to DHL format
   */
  private mapAddress(address: CreateShipmentRequest['origin']) {
    return {
      name: address.name || address.company || 'Recipient',
      companyName: address.company || undefined,
      address1: address.address_line1,
      address2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postal_code,
      email: address.phone ? undefined : undefined,
      phone: address.phone || '0000000000',
    };
  }

  /**
   * Convert service code to DHL ordered product
   */
  private mapServiceCode(code: string): DHLServiceCode {
    const normalized = code.toUpperCase();
    const serviceMap: Record<string, DHLServiceCode> = {
      'RLT': 'DLH_SM_RETURN_LIGHT',
      'RGN': 'DLH_SM_RETURN_GROUND',
      'PARCEL_DIRECT': 'DLH_ECOM_PARCL_DIRECT',
      'PARCEL_EXPRESS': 'DLH_ECOM_PARCEL_EXPRESS',
    };

    return serviceMap[normalized] || (normalized as DHLServiceCode);
  }

  /**
   * Parse DHL shipment response into internal Shipment type
   */
  private parseShipmentResponse(data: any, request: CreateShipmentRequest): Shipment {
    const result = Array.isArray(data?.data) ? data.data[0] : data;

    const trackingNumber =
      result?.trackingNumber ||
      result?.parcelNumber ||
      result?.shipments?.[0]?.trackingNumber;

    const labelBase64 =
      result?.label?.content ||
      result?.label ||
      result?.labels?.[0]?.content ||
      result?.shipmentLabels?.[0]?.content;

    const currency =
      result?.pricing?.total?.currency ||
      result?.price?.currency ||
      'USD';

    const rate =
      parseFloat(result?.pricing?.total?.amount ?? result?.price?.total ?? '0') || 0;

    if (!trackingNumber || !labelBase64) {
      console.error('Unexpected DHL shipment response', data);
      throw new Error('Invalid DHL shipment response');
    }

    return {
      id: crypto.randomUUID(),
      carrier: 'dhl',
      service_name: this.getServiceName(request.service_code),
      service_code: request.service_code,
      tracking_number: trackingNumber,
      label_url: labelBase64,
      label_format: request.label_format || 'PNG',
      rate,
      currency,
      origin: request.origin,
      destination: request.destination,
      status: 'label_created',
      order_id: request.reference_number,
      reference_number: request.reference_number,
      created_at: Date.now(),
      carrier_shipment_id: result?.shipmentId || result?.shipmentIdNumber,
      raw_response: data,
      metadata: request.metadata,
    };
  }

  /**
   * Parse DHL tracking response
   */
  private parseTrackingResponse(data: any, trackingNumber: string): TrackingInfo {
    const shipment = Array.isArray(data?.shipments) ? data.shipments[0] : data?.shipments;
    const eventsData = shipment?.events || shipment?.trackingEvents || [];

    const events: TrackingEvent[] = eventsData.map((event: any) => ({
      timestamp: event?.timestamp ? Date.parse(event.timestamp) : Date.now(),
      status: event?.status || event?.description || 'Update',
      description: event?.description || event?.status || 'Shipment update',
      location: event?.location?.addressLocality,
      city: event?.location?.addressLocality,
      state: event?.location?.administrativeArea,
      postal_code: event?.location?.postalCode,
      country: event?.location?.countryCode,
    }));

    return {
      carrier: 'dhl',
      tracking_number: trackingNumber,
      status: this.mapTrackingStatus(shipment?.status || shipment?.statusCode || ''),
      estimated_delivery_date: shipment?.estimatedDeliveryDate,
      actual_delivery_date: shipment?.delivery?.date,
      delivery_signature: shipment?.delivery?.signedBy,
      current_location: eventsData[0]?.location?.addressLocality,
      events,
      updated_at: Date.now(),
      raw_response: data,
    };
  }

  /**
   * Map DHL status code to internal status
   */
  private mapTrackingStatus(status: string): ShipmentStatus {
    const normalized = (status || '').toLowerCase();

    if (normalized.includes('delivered')) return 'delivered';
    if (normalized.includes('out for delivery')) return 'out_for_delivery';
    if (normalized.includes('in transit')) return 'in_transit';
    if (normalized.includes('processed') || normalized.includes('arrived')) return 'in_transit';
    if (normalized.includes('exception') || normalized.includes('failure')) return 'exception';
    if (normalized.includes('return')) return 'returned';

    return 'in_transit';
  }

  /**
   * Map service code to friendly name
   */
  private getServiceName(code: string): string {
    const normalized = code.toUpperCase();
    const serviceNames: Record<string, string> = {
      'DLH_SM_RETURN_LIGHT': 'DHL eCommerce Return Light',
      'DLH_SM_RETURN_GROUND': 'DHL eCommerce Return Ground',
      'DLH_EXPRESS_WORLDWIDE': 'DHL Express Worldwide',
      'DLH_EXPRESS_12': 'DHL Express 12:00',
      'DLH_EXPRESS_9': 'DHL Express 9:00',
      'DLH_ECOM_PARCL_DIRECT': 'DHL eCommerce Parcel Direct',
      'DLH_ECOM_PARCEL_EXPRESS': 'DHL eCommerce Parcel Express',
      'DLH_ECOM_PARCEL_PLUS': 'DHL eCommerce Parcel Plus',
    };

    return serviceNames[normalized] || `DHL ${normalized}`;
  }

  private getBaseUrl() {
    return this.isProduction ? DHL_API_BASE.production : DHL_API_BASE.sandbox;
  }
}

/**
 * Resolve DHL credentials from environment variables
 */
export function getDHLCredentials(): DHLCredentials {
  const clientId = process.env.DHL_CLIENT_ID;
  const clientSecret = process.env.DHL_CLIENT_SECRET;
  const pickupAccount = process.env.DHL_PICKUP_ACCOUNT;
  const merchantId = process.env.DHL_MERCHANT_ID;
  const accessToken = process.env.DHL_ACCESS_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('DHL API credentials not configured');
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    pickup_account: pickupAccount || undefined,
    merchant_id: merchantId || undefined,
    access_token: accessToken || undefined,
  };
}

/**
 * Create DHL client instance
 */
export function createDHLClient(isProduction = false): DHLShippingClient {
  const credentials = getDHLCredentials();
  return new DHLShippingClient(credentials, isProduction);
}

