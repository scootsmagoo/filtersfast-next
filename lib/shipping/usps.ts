/**
 * USPS Shipping API Integration
 * Uses USPS Web Tools API for domestic and international shipping rates and tracking
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type {
  ShippingRate,
  ShippingRateRequest,
  ShippingRateError,
  TrackingInfo,
  TrackingEvent,
  TrackingRequest,
  USPSCredentials,
  USPSServiceType,
  ShipmentStatus,
} from '@/lib/types/shipping';

const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';
const USPS_TEST_URL = 'https://secure.shippingapis.com/ShippingAPITest.dll';

export class USPSShippingClient {
  private credentials: USPSCredentials;
  private isProduction: boolean;
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  constructor(credentials: USPSCredentials, isProduction = true) {
    this.credentials = credentials;
    this.isProduction = isProduction;
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
  }

  /**
   * Get shipping rates for domestic shipments
   */
  async getDomesticRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    const rates: ShippingRate[] = [];
    
    try {
      // Build XML request
      const xmlRequest = this.buildDomesticRateRequest(request);
      
      // Make API call with timeout
      const apiUrl = this.isProduction ? USPS_API_URL : USPS_TEST_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `${apiUrl}?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('USPS API request failed');
        }
        
        const xmlResponse = await response.text();
        const parsed = this.xmlParser.parse(xmlResponse);
        
        // Handle errors
        if (parsed.Error) {
          throw new Error('USPS rate calculation failed');
        }
        
        // Parse rates
        if (parsed.RateV4Response?.Package) {
          const packages = Array.isArray(parsed.RateV4Response.Package) 
            ? parsed.RateV4Response.Package 
            : [parsed.RateV4Response.Package];
        
          for (const pkg of packages) {
            if (pkg.Error) {
              continue; // Skip packages with errors
            }
            
            // Parse postage rates
            if (pkg.Postage) {
              const postages = Array.isArray(pkg.Postage) ? pkg.Postage : [pkg.Postage];
              
              for (const postage of postages) {
                rates.push({
                  carrier: 'usps',
                  service_name: `USPS ${postage.MailService}`,
                  service_code: this.mapServiceToCode(postage.MailService),
                  rate: parseFloat(postage.Rate),
                  currency: 'USD',
                  retail_rate: postage.CommercialRate ? parseFloat(postage.Rate) : undefined,
                  delivery_days: this.parseDeliveryDays(postage.MailService),
                  raw_response: postage,
                });
              }
            }
          }
        }
        
        return rates;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('USPS API request timeout');
        }
        throw error;
      }
    } catch (error) {
      console.error('USPS domestic rates error:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates for international shipments
   */
  async getInternationalRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    const rates: ShippingRate[] = [];
    
    try {
      // Build XML request
      const xmlRequest = this.buildInternationalRateRequest(request);
      
      // Make API call with timeout
      const apiUrl = this.isProduction ? USPS_API_URL : USPS_TEST_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `${apiUrl}?API=IntlRateV2&XML=${encodeURIComponent(xmlRequest)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('USPS API request failed');
        }
        
        const xmlResponse = await response.text();
        const parsed = this.xmlParser.parse(xmlResponse);
        
        // Handle errors
        if (parsed.Error) {
          throw new Error('USPS rate calculation failed');
        }
      
        // Parse rates
        if (parsed.IntlRateV2Response?.Package) {
          const packages = Array.isArray(parsed.IntlRateV2Response.Package)
            ? parsed.IntlRateV2Response.Package
            : [parsed.IntlRateV2Response.Package];
          
          for (const pkg of packages) {
            if (pkg.Error) {
              continue;
            }
            
            // Parse service rates
            if (pkg.Service) {
              const services = Array.isArray(pkg.Service) ? pkg.Service : [pkg.Service];
              
              for (const service of services) {
                rates.push({
                  carrier: 'usps',
                  service_name: `USPS ${service.SvcDescription}`,
                  service_code: service['@_ID'],
                  rate: parseFloat(service.Postage),
                  currency: 'USD',
                  retail_rate: service.CommercialPostage ? parseFloat(service.Postage) : undefined,
                  delivery_days: this.parseDeliveryDays(service.SvcDescription),
                  raw_response: service,
                });
              }
            }
          }
        }
        
        return rates;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('USPS API request timeout');
        }
        throw error;
      }
    } catch (error) {
      console.error('USPS international rates error:', error);
      throw error;
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingInfo> {
    try {
      // Build XML request
      const xmlRequest = this.buildTrackingRequest(request.tracking_number);
      
      // Make API call with timeout
      const apiUrl = this.isProduction ? USPS_API_URL : USPS_TEST_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `${apiUrl}?API=TrackV2&XML=${encodeURIComponent(xmlRequest)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('USPS tracking request failed');
        }
        
        const xmlResponse = await response.text();
        const parsed = this.xmlParser.parse(xmlResponse);
        
        // Handle errors
        if (parsed.Error) {
          throw new Error('Tracking information not available');
        }
      
        // Parse tracking info
        if (parsed.TrackResponse?.TrackInfo) {
          const trackInfo = parsed.TrackResponse.TrackInfo;
          
          const events: TrackingEvent[] = [];
          if (trackInfo.TrackSummary) {
            events.push(this.parseTrackingEvent(trackInfo.TrackSummary));
          }
          
          if (trackInfo.TrackDetail) {
            const details = Array.isArray(trackInfo.TrackDetail)
              ? trackInfo.TrackDetail
              : [trackInfo.TrackDetail];
            
            for (const detail of details) {
              events.push(this.parseTrackingEvent(detail));
            }
          }
          
          return {
            carrier: 'usps',
            tracking_number: request.tracking_number,
            status: this.mapTrackingStatus(trackInfo.Status || trackInfo.StatusSummary),
            estimated_delivery_date: trackInfo.ExpectedDeliveryDate,
            events,
            updated_at: Date.now(),
            raw_response: trackInfo,
          };
        }
        
        throw new Error('Tracking information not available');
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('USPS tracking request timeout');
        }
        throw error;
      }
    } catch (error) {
      console.error('USPS tracking error:', error);
      throw error;
    }
  }

  /**
   * Build domestic rate request XML
   */
  private buildDomesticRateRequest(request: ShippingRateRequest): string {
    const packages = request.packages.map((pkg, index) => {
      const pounds = Math.floor(pkg.weight);
      const ounces = Math.round((pkg.weight - pounds) * 16);
      
      return {
        '@_ID': index,
        Service: 'ALL',
        ZipOrigination: request.origin.postal_code,
        ZipDestination: request.destination.postal_code,
        Pounds: pounds,
        Ounces: ounces,
        Container: 'VARIABLE',
        Size: this.determineSize(pkg),
        ...(pkg.length && pkg.width && pkg.height ? {
          Width: pkg.width,
          Length: pkg.length,
          Height: pkg.height,
        } : {}),
      };
    });
    
    const requestObj = {
      RateV4Request: {
        '@_USERID': this.credentials.user_id,
        Package: packages,
      },
    };
    
    return this.xmlBuilder.build(requestObj);
  }

  /**
   * Build international rate request XML
   */
  private buildInternationalRateRequest(request: ShippingRateRequest): string {
    const packages = request.packages.map((pkg, index) => {
      const pounds = Math.floor(pkg.weight);
      const ounces = Math.round((pkg.weight - pounds) * 16);
      
      return {
        '@_ID': index,
        Pounds: pounds,
        Ounces: ounces,
        MailType: 'Package',
        GXG: {
          POBoxFlag: 'N',
          GiftFlag: 'N',
        },
        ValueOfContents: pkg.insured_value || 0,
        Country: request.destination.country,
        Container: 'RECTANGULAR',
        Size: this.determineSize(pkg),
        ...(pkg.length && pkg.width && pkg.height ? {
          Width: pkg.width,
          Length: pkg.length,
          Height: pkg.height,
          Girth: (pkg.width + pkg.height) * 2,
        } : {}),
        OriginZip: request.origin.postal_code,
      };
    });
    
    const requestObj = {
      IntlRateV2Request: {
        '@_USERID': this.credentials.user_id,
        Package: packages,
      },
    };
    
    return this.xmlBuilder.build(requestObj);
  }

  /**
   * Build tracking request XML
   */
  private buildTrackingRequest(trackingNumber: string): string {
    const requestObj = {
      TrackRequest: {
        '@_USERID': this.credentials.user_id,
        TrackID: {
          '@_ID': trackingNumber,
        },
      },
    };
    
    return this.xmlBuilder.build(requestObj);
  }

  /**
   * Determine package size based on dimensions
   */
  private determineSize(pkg: { weight: number; length?: number; width?: number; height?: number }): string {
    if (!pkg.length || !pkg.width || !pkg.height) {
      return 'REGULAR';
    }
    
    const girth = (pkg.width + pkg.height) * 2;
    const lengthPlusGirth = pkg.length + girth;
    
    if (lengthPlusGirth > 108) {
      return 'OVERSIZE';
    } else if (lengthPlusGirth > 84) {
      return 'LARGE';
    }
    
    return 'REGULAR';
  }

  /**
   * Parse delivery days from service name
   */
  private parseDeliveryDays(serviceName: string): number | undefined {
    if (serviceName.includes('Priority Mail Express')) return 1;
    if (serviceName.includes('Priority Mail')) return 2;
    if (serviceName.includes('First-Class')) return 3;
    if (serviceName.includes('Parcel Select')) return 5;
    return undefined;
  }

  /**
   * Map service name to standardized code
   */
  private mapServiceToCode(serviceName: string): string {
    const serviceMap: Record<string, string> = {
      'Priority Mail Express': 'PRIORITY_EXPRESS',
      'Priority Mail': 'PRIORITY',
      'First-Class Package Service': 'FIRST_CLASS',
      'Parcel Select Ground': 'PARCEL_SELECT',
      'Media Mail': 'MEDIA_MAIL',
      'Library Mail': 'LIBRARY_MAIL',
    };
    
    for (const [key, value] of Object.entries(serviceMap)) {
      if (serviceName.includes(key)) {
        return value;
      }
    }
    
    return serviceName.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Parse tracking event from XML response
   */
  private parseTrackingEvent(eventData: any): TrackingEvent {
    const eventDate = eventData.EventDate || eventData.Date;
    const eventTime = eventData.EventTime || eventData.Time;
    
    let timestamp = Date.now();
    if (eventDate && eventTime) {
      try {
        timestamp = new Date(`${eventDate} ${eventTime}`).getTime();
      } catch (e) {
        // Use current time if parse fails
      }
    }
    
    return {
      timestamp,
      status: eventData.Event || eventData.EventCode || 'Unknown',
      description: eventData.EventSummary || eventData.Event || '',
      location: eventData.EventCity ? 
        `${eventData.EventCity}, ${eventData.EventState} ${eventData.EventZIPCode}` : 
        undefined,
      city: eventData.EventCity,
      state: eventData.EventState,
      postal_code: eventData.EventZIPCode,
      country: eventData.EventCountry || 'US',
    };
  }

  /**
   * Map USPS tracking status to standardized status
   */
  private mapTrackingStatus(status: string): ShipmentStatus {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('delivered')) return 'delivered';
    if (statusLower.includes('out for delivery')) return 'out_for_delivery';
    if (statusLower.includes('in transit')) return 'in_transit';
    if (statusLower.includes('accepted') || statusLower.includes('picked up')) return 'in_transit';
    if (statusLower.includes('exception')) return 'exception';
    if (statusLower.includes('returned')) return 'returned';
    
    return 'in_transit';
  }
}

/**
 * Get USPS credentials from environment
 * @throws {Error} If credentials are not configured
 */
export function getUSPSCredentials(): USPSCredentials {
  const userId = process.env.USPS_USER_ID;
  
  if (!userId) {
    throw new Error('USPS API credentials not configured');
  }
  
  return {
    user_id: userId,
    password: process.env.USPS_PASSWORD,
  };
}

/**
 * Create USPS client instance
 */
export function createUSPSClient(isProduction = true): USPSShippingClient {
  const credentials = getUSPSCredentials();
  return new USPSShippingClient(credentials, isProduction);
}

