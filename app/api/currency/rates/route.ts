/**
 * Currency Rates API
 * GET /api/currency/rates - Get all current exchange rates
 * 
 * OWASP Compliance:
 * - A04: Rate limiting (30 req/min)
 * - A03: No user input, safe from injection
 * - A09: Error logging without exposing internal details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllCurrencyRates } from '@/lib/db/currency';

export const dynamic = 'force-dynamic';

// Rate limiting: Track requests per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    const rates = getAllCurrencyRates();
    
    // Transform to a simpler format for client consumption
    const ratesMap = rates.reduce((acc, rate) => {
      acc[rate.code] = {
        rate: rate.rate,
        symbol: rate.symbol,
        name: rate.name,
        lastUpdated: rate.lastUpdated,
      };
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json({
      success: true,
      rates: ratesMap,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error: any) {
    // Security: Log error details but don't expose to client
    console.error('[Currency Rates API] Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch currency rates'
        // No error.message exposed to prevent information disclosure
      },
      { status: 500 }
    );
  }
}

