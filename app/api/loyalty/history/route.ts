import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyTransactions, getLoyaltyAccountByEmail, getLoyaltyAccountByUserId, getOrCreateLoyaltyAccount } from '@/lib/db/loyalty';
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
    
    // Validate and sanitize limit/offset
    const rawLimit = request.nextUrl.searchParams.get('limit') || '50';
    const rawOffset = request.nextUrl.searchParams.get('offset') || '0';
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100); // Clamp between 1-100
    const offset = Math.max(parseInt(rawOffset, 10) || 0, 0); // Must be >= 0

    let customerEmail: string | null = null;

    if (session?.user?.email) {
      // Authenticated user - get or create account
      let account;
      try {
        account = getLoyaltyAccountByUserId(session.user.id);
      } catch (err: any) {
        // Try by email instead
        try {
          account = getLoyaltyAccountByEmail(session.user.email);
        } catch (err2: any) {
          // Create account if it doesn't exist
          try {
            account = getOrCreateLoyaltyAccount(session.user.email, session.user.id);
          } catch (err3: any) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[Loyalty History] Error creating account:', err3.message);
            }
            throw err3;
          }
        }
      }
      
      if (!account) {
        // Account doesn't exist, create it
        try {
          account = getOrCreateLoyaltyAccount(session.user.email, session.user.id);
        } catch (err: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Loyalty History] Error creating account:', err.message);
          }
          throw err;
        }
      }
      
      customerEmail = account.customer_email || session.user.email;
    } else if (email) {
      // Guest lookup by email - auto-create if doesn't exist
      // Note: Guest lookup should be limited or require additional verification
      let account;
      try {
        account = getLoyaltyAccountByEmail(email);
        if (!account) {
          account = getOrCreateLoyaltyAccount(email);
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Loyalty History] Error in guest lookup:', err.message);
        }
        throw err;
      }
      customerEmail = account.customer_email || email;
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

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loyalty account not found.',
          error_code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const transactions = getLoyaltyTransactions(customerEmail, limit, offset);

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.transaction_type,
        points: t.points,
        balanceAfter: t.balance_after,
        orderId: t.order_id,
        orderNumber: t.order_number,
        description: t.description,
        createdAt: t.created_at,
      })),
    });
  } catch (error: any) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Loyalty History] Error fetching loyalty history:', error);
      console.error('[Loyalty History] Error stack:', error?.stack);
    } else {
      console.error('[Loyalty History] Error:', error?.message || 'Unknown error');
    }
    
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || '';
    
    // Only return "not initialized" error if it's actually a "no such table" SQLite error
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
        error: errorMessage || 'Unable to fetch loyalty history.',
        error_code: 'HISTORY_LOOKUP_FAILED',
      },
      { status: 500 }
    );
  }
}

