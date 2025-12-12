/**
 * UPS Shipping API Integration
 * Uses UPS REST API (OAuth 2.0) for shipping rates and tracking
 */

import type {
  ShippingRate,
  ShippingRateRequest,
  TrackingInfo,
  TrackingEvent,
  TrackingRequest,
  UPSCredentials,
  UPSServiceCode,
  ShipmentStatus,
  Shipment,
  CreateShipmentRequest,
} from '@/lib/types/shipping';

const UPS_AUTH_URL = 'https://wwwcie.ups.com/security/v1/oauth/token'; // Test
const UPS_AUTH_URL_PROD = 'https://onlinetools.ups.com/security/v1/oauth/token'; // Production

const UPS_API_URL = 'https://wwwcie.ups.com'; // Test
const UPS_API_URL_PROD = 'https://onlinetools.ups.com'; // Production

export class UPSShippingClient {
  private credentials: UPSCredentials;
  private isProduction: boolean;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: UPSCredentials, isProduction = false) {
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

    const authUrl = this.isProduction ? UPS_AUTH_URL_PROD : UPS_AUTH_URL;
    const credentials = Buffer.from(
      `${this.credentials.client_id}:${this.credentials.client_secret}`
    ).toString('base64');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
          body: 'grant_type=client_credentials',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('UPS authentication failed');
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

        return this.accessToken;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('UPS authentication timeout');
        }
        throw error;
      }
    } catch (error) {
      console.error('UPS authentication error:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates
   */
  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? UPS_API_URL_PROD : UPS_API_URL;

    try {
      const requestBody = this.buildRateRequest(request);

      const response = await fetch(`${baseUrl}/api/rating/v1/Rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'transId': `ff-${Date.now()}`,
          'transactionSrc': 'FiltersFast',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('UPS rate calculation failed');
      }

      const data = await response.json();
      return this.parseRateResponse(data);
    } catch (error) {
      console.error('UPS rates error:', error);
      throw error;
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingInfo> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? UPS_API_URL_PROD : UPS_API_URL;

    try {
      const response = await fetch(
        `${baseUrl}/api/track/v1/details/${request.tracking_number}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'transId': `ff-track-${Date.now()}`,
            'transactionSrc': 'FiltersFast',
          },
        }
      );

      if (!response.ok) {
        throw new Error('UPS tracking request failed');
      }

      const data = await response.json();
      return this.parseTrackingResponse(data, request.tracking_number);
    } catch (error) {
      console.error('UPS tracking error:', error);
      throw error;
    }
  }

  /**
   * Create a shipment and generate label
   */
  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    const token = await this.getAccessToken();
    const baseUrl = this.isProduction ? UPS_API_URL_PROD : UPS_API_URL;

    try {
      const requestBody = this.buildShipmentRequest(request);

      const response = await fetch(`${baseUrl}/api/shipments/v1/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'transId': `ff-ship-${Date.now()}`,
          'transactionSrc': 'FiltersFast',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('UPS shipment creation failed');
      }

      const data = await response.json();
      return this.parseShipmentResponse(data, request);
    } catch (error) {
      console.error('UPS create shipment error:', error);
      throw error;
    }
  }

  /**
   * Build rate request payload
   */
  private buildRateRequest(request: ShippingRateRequest) {
    const pkg = request.packages[0]; // UPS API handles one package at a time
    
    return {
      RateRequest: {
        Request: {
          SubVersion: '1703',
          TransactionReference: {
            CustomerContext: 'FiltersFast Rating',
          },
        },
        Shipment: {
          Shipper: {
            Name: request.origin.company || request.origin.name,
            ShipperNumber: this.credentials.account_number,
            Address: {
              AddressLine: [request.origin.address_line1],
              City: request.origin.city,
              StateProvinceCode: request.origin.state,
              PostalCode: request.origin.postal_code,
              CountryCode: request.origin.country,
            },
          },
          ShipTo: {
            Name: request.destination.name || 'Customer',
            Address: {
              AddressLine: [request.destination.address_line1],
              City: request.destination.city,
              StateProvinceCode: request.destination.state,
              PostalCode: request.destination.postal_code,
              CountryCode: request.destination.country,
              ResidentialAddressIndicator: request.destination.is_residential ? 'Y' : 'N',
            },
          },
          ShipFrom: {
            Name: request.origin.company || request.origin.name,
            Address: {
              AddressLine: [request.origin.address_line1],
              City: request.origin.city,
              StateProvinceCode: request.origin.state,
              PostalCode: request.origin.postal_code,
              CountryCode: request.origin.country,
            },
          },
          Package: {
            PackagingType: {
              Code: '02', // Package
            },
            Dimensions: pkg.length && pkg.width && pkg.height ? {
              UnitOfMeasurement: {
                Code: 'IN',
              },
              Length: pkg.length.toString(),
              Width: pkg.width.toString(),
              Height: pkg.height.toString(),
            } : undefined,
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'LBS',
              },
              Weight: pkg.weight.toString(),
            },
          },
        },
      },
    };
  }

  /**
   * Build shipment request payload
   */
  private buildShipmentRequest(request: CreateShipmentRequest) {
    const pkg = request.packages[0];
    
    return {
      ShipmentRequest: {
        Request: {
          SubVersion: '1703',
          TransactionReference: {
            CustomerContext: request.reference_number || 'FiltersFast Shipment',
          },
        },
        Shipment: {
          Description: 'Filter Products',
          Shipper: {
            Name: request.origin.company || request.origin.name,
            ShipperNumber: this.credentials.account_number,
            Address: {
              AddressLine: [request.origin.address_line1],
              City: request.origin.city,
              StateProvinceCode: request.origin.state,
              PostalCode: request.origin.postal_code,
              CountryCode: request.origin.country,
            },
          },
          ShipTo: {
            Name: request.destination.name || 'Customer',
            Address: {
              AddressLine: [request.destination.address_line1],
              City: request.destination.city,
              StateProvinceCode: request.destination.state,
              PostalCode: request.destination.postal_code,
              CountryCode: request.destination.country,
            },
          },
          ShipFrom: {
            Name: request.origin.company || request.origin.name,
            Address: {
              AddressLine: [request.origin.address_line1],
              City: request.origin.city,
              StateProvinceCode: request.origin.state,
              PostalCode: request.origin.postal_code,
              CountryCode: request.origin.country,
            },
          },
          PaymentInformation: {
            ShipmentCharge: {
              Type: '01', // Transportation
              BillShipper: {
                AccountNumber: this.credentials.account_number,
              },
            },
          },
          Service: {
            Code: request.service_code,
          },
          Package: {
            Packaging: {
              Code: '02', // Package
            },
            Dimensions: pkg.length && pkg.width && pkg.height ? {
              UnitOfMeasurement: {
                Code: 'IN',
              },
              Length: pkg.length.toString(),
              Width: pkg.width.toString(),
              Height: pkg.height.toString(),
            } : undefined,
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'LBS',
              },
              Weight: pkg.weight.toString(),
            },
          },
        },
        LabelSpecification: {
          LabelImageFormat: {
            Code: request.label_format === 'ZPL' ? 'ZPL' : 'GIF',
          },
          HTTPUserAgent: 'Mozilla/5.0',
          LabelStockSize: {
            Height: request.label_size === '8x11' ? '11' : '6',
            Width: request.label_size === '8x11' ? '8' : '4',
          },
        },
      },
    };
  }

  /**
   * Parse rate response from UPS API
   */
  private parseRateResponse(data: any): ShippingRate[] {
    const rates: ShippingRate[] = [];

    if (data.RateResponse?.RatedShipment) {
      const shipments = Array.isArray(data.RateResponse.RatedShipment)
        ? data.RateResponse.RatedShipment
        : [data.RateResponse.RatedShipment];

      for (const shipment of shipments) {
        const serviceCode = shipment.Service?.Code || '';
        
        rates.push({
          carrier: 'ups',
          service_name: this.getServiceName(serviceCode),
          service_code: serviceCode,
          rate: parseFloat(shipment.TotalCharges?.MonetaryValue || '0'),
          currency: shipment.TotalCharges?.CurrencyCode || 'USD',
          retail_rate: parseFloat(shipment.NegotiatedRateCharges?.TotalCharge?.MonetaryValue || '0'),
          delivery_days: this.getDeliveryDays(serviceCode),
          billable_weight: parseFloat(shipment.BillingWeight?.Weight || '0'),
          raw_response: shipment,
        });
      }
    }

    return rates;
  }

  /**
   * Parse tracking response from UPS API
   */
  private parseTrackingResponse(data: any, trackingNumber: string): TrackingInfo {
    const trackResponse = data.trackResponse;
    const shipment = trackResponse?.shipment?.[0];

    if (!shipment) {
      throw new Error('No tracking information found');
    }

    const pkg = shipment.package?.[0];
    const activities = pkg?.activity || [];

    const events: TrackingEvent[] = activities.map((activity: any) => ({
      timestamp: new Date(activity.date + ' ' + activity.time).getTime(),
      status: activity.status?.description || 'Unknown',
      description: activity.status?.description || '',
      location: activity.location?.address?.city ?
        `${activity.location.address.city}, ${activity.location.address.stateProvince}` :
        undefined,
      city: activity.location?.address?.city,
      state: activity.location?.address?.stateProvince,
      postal_code: activity.location?.address?.postalCode,
      country: activity.location?.address?.countryCode,
    }));

    const latestActivity = activities[0];
    const deliveryDate = pkg.deliveryDate?.[0];

    return {
      carrier: 'ups',
      tracking_number: trackingNumber,
      status: this.mapTrackingStatus(latestActivity?.status?.type || ''),
      estimated_delivery_date: deliveryDate?.date,
      actual_delivery_date: latestActivity?.status?.type === 'D' ? 
        latestActivity?.date : 
        undefined,
      current_location: latestActivity?.location?.address?.city ?
        `${latestActivity.location.address.city}, ${latestActivity.location.address.stateProvince}` :
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
    const shipmentResponse = data.ShipmentResponse;
    const shipmentResults = shipmentResponse.ShipmentResults;
    const packageResults = shipmentResults.PackageResults;

    return {
      id: crypto.randomUUID(),
      carrier: 'ups',
      service_name: this.getServiceName(request.service_code),
      service_code: request.service_code,
      tracking_number: packageResults.TrackingNumber,
      label_url: packageResults.ShippingLabel.GraphicImage, // Base64 encoded
      rate: parseFloat(shipmentResults.ShipmentCharges.TotalCharges.MonetaryValue),
      currency: shipmentResults.ShipmentCharges.TotalCharges.CurrencyCode,
      origin: request.origin,
      destination: request.destination,
      status: 'label_created',
      order_id: request.reference_number,
      reference_number: request.reference_number,
      created_at: Date.now(),
      carrier_shipment_id: shipmentResults.ShipmentIdentificationNumber,
      raw_response: data,
    };
  }

  /**
   * Get service name from code
   */
  private getServiceName(code: string): string {
    const serviceNames: Record<string, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Worldwide Express',
      '08': 'UPS Worldwide Expedited',
      '11': 'UPS Standard',
      '12': 'UPS 3 Day Select',
      '13': 'UPS Next Day Air Saver',
      '14': 'UPS Next Day Air Early',
      '54': 'UPS Worldwide Express Plus',
      '59': 'UPS 2nd Day Air AM',
      '65': 'UPS Express Saver',
      '96': 'UPS Worldwide Express Freight',
    };

    return serviceNames[code] || `UPS Service ${code}`;
  }

  /**
   * Get estimated delivery days from service code
   */
  private getDeliveryDays(code: string): number | undefined {
    const deliveryDays: Record<string, number> = {
      '01': 1,  // Next Day Air
      '13': 1,  // Next Day Air Saver
      '14': 1,  // Next Day Air Early
      '02': 2,  // 2nd Day Air
      '59': 2,  // 2nd Day Air AM
      '12': 3,  // 3 Day Select
      '03': 5,  // Ground
    };

    return deliveryDays[code];
  }

  /**
   * Map UPS tracking status to standardized status
   */
  private mapTrackingStatus(statusType: string): ShipmentStatus {
    const statusMap: Record<string, ShipmentStatus> = {
      'D': 'delivered',
      'I': 'in_transit',
      'M': 'in_transit',
      'P': 'in_transit',
      'X': 'exception',
    };

    return statusMap[statusType] || 'in_transit';
  }
}

/**
 * Get UPS credentials from environment
 * @throws {Error} If credentials are not configured
 */
export function getUPSCredentials(): UPSCredentials {
  const clientId = process.env.UPS_CLIENT_ID;
  const clientSecret = process.env.UPS_CLIENT_SECRET;
  const accountNumber = process.env.UPS_ACCOUNT_NUMBER;

  if (!clientId || !clientSecret || !accountNumber) {
    throw new Error('UPS API credentials not configured');
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    account_number: accountNumber,
  };
}

/**
 * Create UPS client instance
 */
export function createUPSClient(isProduction = false): UPSShippingClient {
  const credentials = getUPSCredentials();
  return new UPSShippingClient(credentials, isProduction);
}

