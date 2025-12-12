import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidCurrency } from '@/lib/currency-utils';

const CURRENCY_COOKIE_NAME = 'ff_currency';
const CURRENCY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const MAX_BODY_SIZE = 1024; // 1KB

function forbiddenResponse(message: string) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const expectedOrigin = request.nextUrl.origin;

    if (origin && origin !== expectedOrigin) {
      return forbiddenResponse('Cross-origin requests are not allowed');
    }

    const referer = request.headers.get('referer');
    if (referer && !referer.startsWith(expectedOrigin)) {
      return forbiddenResponse('Invalid referer header');
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Request payload too large' },
        {
          status: 413,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const body = await request.json().catch(() => null);
    const { currency } = (body ?? {}) as { currency?: unknown };

    if (!currency || typeof currency !== 'string' || !isValidCurrency(currency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid currency code' },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const normalizedCurrency = currency.toUpperCase();
    const cookieStore = await cookies();

    cookieStore.set(CURRENCY_COOKIE_NAME, normalizedCurrency, {
      path: '/',
      maxAge: CURRENCY_COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json(
      {
        success: true,
        currency: normalizedCurrency,
        message: 'Currency preference updated',
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Error setting currency preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set currency preference' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}

