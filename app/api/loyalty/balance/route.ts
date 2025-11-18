import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyAccountByEmail, getLoyaltyAccountByUserId, getOrCreateLoyaltyAccount } from '@/lib/db/loyalty';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const identifier = getClientIdentifier(request);
      const result = await rateLimit(identifier, 20, 60);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests. Please wait a moment and try again.',
            error_code: 'RATE_LIMIT_EXCEEDED',
          },
          { status: 429 }
        );
      }
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        error_code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    );
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const rawEmail = request.nextUrl.searchParams.get('email') || '';

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = rawEmail && emailRegex.test(rawEmail) ? rawEmail.trim().toLowerCase() : '';

    let account;

    if (session?.user?.email) {
      // Authenticated user - get or create by user ID or email
      try {
        account = getLoyaltyAccountByUserId(session.user.id);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Loyalty Balance] Error in getLoyaltyAccountByUserId:', err.message);
        }
        throw err;
      }
      
      if (!account) {
        try {
          account = getLoyaltyAccountByEmail(session.user.email);
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Loyalty Balance] Error in getLoyaltyAccountByEmail:', err.message);
          }
          throw err;
        }
      }
      
      // Auto-create account if it doesn't exist
      if (!account) {
        try {
          account = getOrCreateLoyaltyAccount(session.user.email, session.user.id);
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Loyalty Balance] Error in getOrCreateLoyaltyAccount:', err.message);
          }
          throw err;
        }
      }
    } else if (email) {
      // Guest lookup by email - auto-create if doesn't exist
      // Note: Guest lookup should be limited or require additional verification
      try {
        account = getLoyaltyAccountByEmail(email);
        if (!account) {
          account = getOrCreateLoyaltyAccount(email);
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Loyalty Balance] Error in guest lookup:', err.message);
        }
        throw err;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required or email parameter needed.',
          error_code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      account: {
        pointsBalance: account.points_balance,
        lifetimePoints: account.lifetime_points,
        tierLevel: account.tier_level,
        tierName: account.tier_name,
        lastActivityAt: account.last_activity_at,
      },
    });
  } catch (error: any) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Loyalty Balance] Error checking loyalty balance:', error);
      console.error('[Loyalty Balance] Error stack:', error?.stack);
    } else {
      console.error('[Loyalty Balance] Error:', error?.message || 'Unknown error');
    }
    
    // Check if it's a database table error - only if it's actually a "no such table" error
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || '';
    
    // Check if it's a database table error - only if it's actually a "no such table" error
    if (errorCode === 'SQLITE_ERROR' && errorMessage && errorMessage.toLowerCase().includes('no such table')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loyalty program database tables not initialized. Please run: npm run init:loyalty',
          error_code: 'DATABASE_NOT_INITIALIZED',
        },
        { status: 500 }
      );
    }
    
    // If the error message itself says "not initialized", pass it through (from our DB helpers)
    if (errorMessage && errorMessage.includes('not initialized')) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          error_code: 'DATABASE_NOT_INITIALIZED',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Unable to look up loyalty balance.',
        error_code: 'BALANCE_LOOKUP_FAILED',
      },
      { status: 500 }
    );
  }
}

