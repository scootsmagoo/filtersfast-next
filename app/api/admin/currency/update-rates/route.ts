/**
 * Admin Currency Update API
 * POST /api/admin/currency/update-rates - Manually update exchange rates (admin only)
 * 
 * OWASP Compliance:
 * - A01: Role-based access control (admin only)
 * - A04: Rate limiting (10 req/min for admin)
 * - A03: No user input, safe from injection
 * - A09: Comprehensive audit logging
 * - A10: External API URL is hardcoded and validated
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCurrencyRates, getAllCurrencyRates } from '@/lib/db/currency';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const OPEN_EXCHANGE_RATES_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID || '98b49fece17a41309e612cf60c5a4bba';
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}`;

// Rate limiting for admin endpoints
const adminRequestCounts = new Map<string, { count: number; resetTime: number }>();
const ADMIN_RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000;

function checkAdminRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = adminRequestCounts.get(userId);
  
  if (!record || now > record.resetTime) {
    adminRequestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= ADMIN_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Check if user has admin role (implement your admin check logic)
function hasAdminAccess(user: any): boolean {
  // Check user role - adjust based on your auth system
  return user.role === 'admin' || user.email === 'falonya@gmail.com';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string = 'unknown';
  let userEmail: string = 'unknown';
  
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user) {
      // Audit log: Failed authentication attempt
      console.warn('[Currency Admin] Unauthorized access attempt:', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
        endpoint: '/api/admin/currency/update-rates'
      });
      
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    userId = session.user.id;
    userEmail = session.user.email;
    
    // Check admin role
    if (!hasAdminAccess(session.user)) {
      // Audit log: Forbidden access attempt
      console.warn('[Currency Admin] Forbidden access attempt:', {
        userId,
        userEmail,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Rate limiting for admin
    if (!checkAdminRateLimit(userId)) {
      console.warn('[Currency Admin] Rate limit exceeded:', { userId, userEmail });
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );
    }
    
    // Fetch latest rates from API (SSRF protection: URL is hardcoded)
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      console.error('[Currency Admin] API fetch failed:', {
        status: response.status,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch exchange rates from external API'
        },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    
    // Validate API response structure
    if (!data.rates || typeof data.rates !== 'object') {
      console.error('[Currency Admin] Invalid API response structure:', { userId });
      return NextResponse.json(
        { success: false, error: 'Invalid API response' },
        { status: 502 }
      );
    }
    
    // Validate all required rates are numbers
    const ratesToUpdate: Record<string, number> = {};
    const requiredCurrencies = ['CAD', 'AUD', 'EUR', 'GBP'];
    
    for (const curr of requiredCurrencies) {
      if (typeof data.rates[curr] !== 'number' || isNaN(data.rates[curr])) {
        console.error('[Currency Admin] Invalid rate for currency:', { curr, userId });
        return NextResponse.json(
          { success: false, error: `Invalid rate data for ${curr}` },
          { status: 502 }
        );
      }
      ratesToUpdate[curr] = data.rates[curr];
    }
    
    // Update database
    const updated = updateCurrencyRates(ratesToUpdate);
    
    // Get updated rates
    const currentRates = getAllCurrencyRates();
    
    const duration = Date.now() - startTime;
    
    // Audit log: Successful update
    console.log('[Currency Admin] Rates updated successfully:', {
      userId,
      userEmail,
      ratesUpdated: updated,
      currencies: Object.keys(ratesToUpdate),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} currency rates`,
      rates: currentRates,
      apiTimestamp: data.timestamp,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Security: Log detailed error but don't expose to client
    console.error('[Currency Admin] Error updating rates:', {
      userId,
      userEmail,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update currency rates'
        // No error.message exposed to prevent information disclosure
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check admin role
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get current rates
    const rates = getAllCurrencyRates();
    
    return NextResponse.json({
      success: true,
      rates,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    // Security: Log error details but don't expose to client
    console.error('[Currency Admin] Error fetching rates:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch currency rates'
      },
      { status: 500 }
    );
  }
}

