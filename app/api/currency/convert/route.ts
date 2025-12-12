/**
 * Currency Conversion API
 * POST /api/currency/convert - Convert amount between currencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertBetweenCurrencies } from '@/lib/db/currency';
import { isValidCurrency } from '@/lib/currency-utils';

export const dynamic = 'force-dynamic';

interface ConvertRequest {
  amount: number;
  from: string;
  to: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConvertRequest = await request.json();
    
    const { amount, from, to } = body;
    
    // Validate input
    if (!amount || isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'Missing currency codes' },
        { status: 400 }
      );
    }
    
    if (!isValidCurrency(from) || !isValidCurrency(to)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported currency' },
        { status: 400 }
      );
    }
    
    // Perform conversion
    const convertedAmount = convertBetweenCurrencies(amount, from, to);
    
    return NextResponse.json({
      success: true,
      from,
      to,
      amount,
      convertedAmount,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to convert currency',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

