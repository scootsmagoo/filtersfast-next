/**
 * FedEx Shipping API Integration
 * Uses FedEx REST API (OAuth 2.0) for shipping rates and tracking
 */

import type {
  ShippingRate,
  ShippingRateRequest,
  TrackingInfo,
  TrackingEvent,
  TrackingRequest,
  FedExCredentials,
  FedExServiceType,
  ShipmentStatus,
  Shipment,
  CreateShipmentRequest,
} from '@/lib/types/shipping';

const FEDEX_AUTH_URL = 'https://apis-sandbox.fedex.com/oauth/token'; // Test
const FEDEX_AUTH_URL_PROD = 'https://apis.fedex.com/oauth/token'; // Production

const FEDEX_API_URL = 'https://apis-sandbox.fedex.com'; // Test
const FEDEX_API_URL_PROD = 'https://apis.fedex.com'; // Production

export class FedExShippingClient {
  private credentials: FedExCredentials;
  private isProduction: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: FedExCredentials, isProduction = false) {
    this.credentials = credentials;
    this.isProduction = isProduction;
  }

  /**
   * Get or refresh OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authUrl = this.isProduction ? FEDEX_AUTH_URL_PROD : FEDEX_AUTH_URL;

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.credentials.key,
          client_secret: this.credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error('FedEx authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('FedEx authentication error:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates
   */
  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? FEDEX_API_URL_PROD : FEDEX_API_URL;

    try {
      const requestBody = this.buildRateRequest(request);

      const response = await fetch(`${baseUrl}/rate/v1/rates/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('FedEx rate calculation failed');
      }

      const data = await response.json();
      return this.parseRateResponse(data);
    } catch (error) {
      console.error('FedEx rates error:', error);
      throw error;
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingInfo> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? FEDEX_API_URL_PROD : FEDEX_API_URL;

    try {
      const requestBody = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: request.tracking_number,
            },
          },
        ],
      };

      const response = await fetch(`${baseUrl}/track/v1/trackingnumbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('FedEx tracking request failed');
      }

      const data = await response.json();
      return this.parseTrackingResponse(data, request.tracking_number);
    } catch (error) {
      console.error('FedEx tracking error:', error);
      throw error;
    }
  }

  /**
   * Create a shipment and generate label
   */
  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? FEDEX_API_URL_PROD : FEDEX_API_URL;

    try {
      const requestBody = this.buildShipmentRequest(request);

      const response = await fetch(`${baseUrl}/ship/v1/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-locale': 'en_US',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('FedEx shipment creation failed');
      }

      const data = await response.json();
      return this.parseShipmentResponse(data, request);
    } catch (error) {
      console.error('FedEx create shipment error:', error);
      throw error;
    }
  }

  /**
   * Build rate request payload
   */
  private buildRateRequest(request: ShippingRateRequest) {
    const pkg = request.packages[0];

    return {
      accountNumber: {
        value: this.credentials.account_number,
      },
      requestedShipment: {
        shipper: {
          address: {
            streetLines: [request.origin.address_line1],
            city: request.origin.city,
            stateOrProvinceCode: request.origin.state,
            postalCode: request.origin.postal_code,
            countryCode: request.origin.country,
          },
        },
        recipient: {
          address: {
            streetLines: [request.destination.address_line1],
            city: request.destination.city,
            stateOrProvinceCode: request.destination.state,
            postalCode: request.destination.postal_code,
            countryCode: request.destination.country,
            residential: request.destination.is_residential || false,
          },
        },
        pickupType: 'USE_SCHEDULED_PICKUP',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: pkg.weight,
            },
            dimensions: pkg.length && pkg.width && pkg.height ? {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: 'IN',
            } : undefined,
          },
        ],
      },
    };
  }

  /**
   * Build shipment request payload
   */
  private buildShipmentRequest(request: CreateShipmentRequest) {
    const pkg = request.packages[0];

    return {
      labelResponseOptions: 'LABEL',
      requestedShipment: {
        shipper: {
          contact: {
            personName: request.origin.name,
            phoneNumber: request.origin.phone || '0000000000',
            companyName: request.origin.company,
          },
          address: {
            streetLines: [request.origin.address_line1],
            city: request.origin.city,
            stateOrProvinceCode: request.origin.state,
            postalCode: request.origin.postal_code,
            countryCode: request.origin.country,
          },
        },
        recipients: [
          {
            contact: {
              personName: request.destination.name || 'Customer',
              phoneNumber: request.destination.phone || '0000000000',
              companyName: request.destination.company,
            },
            address: {
              streetLines: [request.destination.address_line1],
              city: request.destination.city,
              stateOrProvinceCode: request.destination.state,
              postalCode: request.destination.postal_code,
              countryCode: request.destination.country,
              residential: request.destination.is_residential || false,
            },
          },
        ],
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType: request.service_code,
        packagingType: 'YOUR_PACKAGING',
        pickupType: 'USE_SCHEDULED_PICKUP',
        blockInsightVisibility: false,
        shippingChargesPayment: {
          paymentType: 'SENDER',
        },
        labelSpecification: {
          imageType: request.label_format === 'ZPL' ? 'ZPLII' : 'PDF',
          labelStockType: request.label_size === '8x11' ? 'PAPER_85X11_TOP_HALF_LABEL' : 'PAPER_4X6',
        },
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: pkg.weight,
            },
            dimensions: pkg.length && pkg.width && pkg.height ? {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height,
              units: 'IN',
            } : undefined,
          },
        ],
      },
      accountNumber: {
        value: this.credentials.account_number,
      },
    };
  }

  /**
   * Parse rate response from FedEx API
   */
  private parseRateResponse(data: any): ShippingRate[] {
    const rates: ShippingRate[] = [];

    if (data.output?.rateReplyDetails) {
      const rateDetails = data.output.rateReplyDetails;

      for (const detail of rateDetails) {
        const serviceName = this.getServiceName(detail.serviceType);
        const ratedShipmentDetail = detail.ratedShipmentDetails?.[0];

        if (!ratedShipmentDetail) continue;

        rates.push({
          carrier: 'fedex',
          service_name: serviceName,
          service_code: detail.serviceType,
          rate: parseFloat(ratedShipmentDetail.totalNetCharge || '0'),
          currency: ratedShipmentDetail.currency || 'USD',
          retail_rate: parseFloat(ratedShipmentDetail.totalBaseCharge || '0'),
          delivery_days: this.parseTransitTime(detail.commit?.dateDetail),
          delivery_date: detail.commit?.dateDetail?.dayFormat,
          billable_weight: parseFloat(ratedShipmentDetail.totalBillingWeight?.value || '0'),
          raw_response: detail,
        });
      }
    }

    return rates;
  }

  /**
   * Parse tracking response from FedEx API
   */
  private parseTrackingResponse(data: any, trackingNumber: string): TrackingInfo {
    const trackingResults = data.output?.completeTrackResults?.[0]?.trackResults?.[0];

    if (!trackingResults) {
      throw new Error('No tracking information found');
    }

    const scanEvents = trackingResults.scanEvents || [];

    const events: TrackingEvent[] = scanEvents.map((scan: any) => ({
      timestamp: new Date(scan.date).getTime(),
      status: scan.eventDescription || 'Unknown',
      description: scan.eventDescription || '',
      location: scan.scanLocation?.city ?
        `${scan.scanLocation.city}, ${scan.scanLocation.stateOrProvinceCode}` :
        undefined,
      city: scan.scanLocation?.city,
      state: scan.scanLocation?.stateOrProvinceCode,
      postal_code: scan.scanLocation?.postalCode,
      country: scan.scanLocation?.countryCode,
    }));

    const latestStatus = trackingResults.latestStatusDetail;
    const deliveryDetails = trackingResults.deliveryDetails;

    return {
      carrier: 'fedex',
      tracking_number: trackingNumber,
      status: this.mapTrackingStatus(latestStatus?.statusByLocale || latestStatus?.code || ''),
      estimated_delivery_date: deliveryDetails?.estimatedDeliveryTimestamp,
      actual_delivery_date: deliveryDetails?.actualDeliveryTimestamp,
      delivery_signature: deliveryDetails?.receivedByName,
      current_location: latestStatus?.scanLocation?.city ?
        `${latestStatus.scanLocation.city}, ${latestStatus.scanLocation.stateOrProvinceCode}` :
        undefined,
      events,
      updated_at: Date.now(),
      raw_response: data,
    };
  }

  /**
   * Parse shipment response
   */
  private parseShipmentResponse(data: any, request: CreateShipmentRequest): Shipment {
    const shipmentOutput = data.output?.transactionShipments?.[0];
    const pieceResponses = shipmentOutput?.pieceResponses?.[0];

    if (!pieceResponses) {
      throw new Error('Failed to create FedEx shipment');
    }

    return {
      id: crypto.randomUUID(),
      carrier: 'fedex',
      service_name: this.getServiceName(request.service_code),
      service_code: request.service_code,
      tracking_number: pieceResponses.trackingNumber,
      label_url: pieceResponses.packageDocuments?.[0]?.encodedLabel, // Base64 encoded
      rate: parseFloat(shipmentOutput.shipmentAdvisoryDetails?.totalNetCharge || '0'),
      currency: 'USD',
      origin: request.origin,
      destination: request.destination,
      status: 'label_created',
      order_id: request.reference_number,
      reference_number: request.reference_number,
      created_at: Date.now(),
      carrier_shipment_id: shipmentOutput.masterTrackingNumber,
      raw_response: data,
    };
  }

  /**
   * Get service name from code
   */
  private getServiceName(code: string): string {
    const serviceNames: Record<string, string> = {
      'FEDEX_GROUND': 'FedEx Ground',
      'GROUND_HOME_DELIVERY': 'FedEx Home Delivery',
      'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
      'FEDEX_2_DAY': 'FedEx 2Day',
      'FEDEX_2_DAY_AM': 'FedEx 2Day AM',
      'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
      'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
      'FIRST_OVERNIGHT': 'FedEx First Overnight',
      'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
      'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
      'INTERNATIONAL_FIRST': 'FedEx International First',
    };

    return serviceNames[code] || `FedEx ${code}`;
  }

  /**
   * Parse transit time from delivery date detail
   */
  private parseTransitTime(dateDetail: any): number | undefined {
    if (!dateDetail?.transitDays) {
      return undefined;
    }

    return parseInt(dateDetail.transitDays, 10);
  }

  /**
   * Map FedEx tracking status to standardized status
   */
  private mapTrackingStatus(status: string): ShipmentStatus {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('delivered')) return 'delivered';
    if (statusLower.includes('out for delivery')) return 'out_for_delivery';
    if (statusLower.includes('in transit')) return 'in_transit';
    if (statusLower.includes('picked up')) return 'in_transit';
    if (statusLower.includes('exception')) return 'exception';
    if (statusLower.includes('returned')) return 'returned';

    return 'in_transit';
  }
}

/**
 * Get FedEx credentials from environment
 * @throws {Error} If credentials are not configured
 */
export function getFedExCredentials(): FedExCredentials {
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;
  const meterNumber = process.env.FEDEX_METER_NUMBER;
  const key = process.env.FEDEX_API_KEY;
  const password = process.env.FEDEX_API_SECRET;

  if (!accountNumber || !meterNumber || !key || !password) {
    throw new Error('FedEx API credentials not configured');
  }

  return {
    account_number: accountNumber,
    meter_number: meterNumber,
    key,
    password,
  };
}

/**
 * Create FedEx client instance
 */
export function createFedExClient(isProduction = false): FedExShippingClient {
  const credentials = getFedExCredentials();
  return new FedExShippingClient(credentials, isProduction);
}

