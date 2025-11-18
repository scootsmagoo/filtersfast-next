import { NextRequest, NextResponse } from 'next/server';
import { redeemLoyaltyPoints, getLoyaltySettings } from '@/lib/db/loyalty';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const identifier = getClientIdentifier(request);
      const result = await rateLimit(identifier, 10, 60);
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
    
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required.',
          error_code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { points, orderId, orderNumber, description } = body;

    // Validate and sanitize points
    const pointsValue = typeof points === 'number' ? Math.floor(points) : parseInt(String(points), 10);
    if (!pointsValue || isNaN(pointsValue) || pointsValue <= 0 || pointsValue > 1000000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid points amount is required.',
          error_code: 'INVALID_POINTS',
        },
        { status: 400 }
      );
    }

    // Check settings
    const settings = getLoyaltySettings();
    if (!settings.is_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loyalty program is currently disabled.',
          error_code: 'PROGRAM_DISABLED',
        },
        { status: 403 }
      );
    }

    if (points < settings.min_redeem_amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum redemption is ${settings.min_redeem_amount} points.`,
          error_code: 'MIN_REDEMPTION_NOT_MET',
        },
        { status: 400 }
      );
    }

    // Sanitize optional fields
    const sanitizedOrderId = orderId && typeof orderId === 'string' ? orderId.trim().substring(0, 100) : undefined;
    const sanitizedOrderNumber = orderNumber && typeof orderNumber === 'string' ? orderNumber.trim().substring(0, 50) : undefined;
    const sanitizedDescription = description && typeof description === 'string' ? description.trim().substring(0, 500) : undefined;

    // Redeem points
    const transaction = redeemLoyaltyPoints({
      customerEmail: session.user.email,
      userId: session.user.id,
      points: pointsValue,
      orderId: sanitizedOrderId,
      orderNumber: sanitizedOrderNumber,
      description: sanitizedDescription,
    });

    // Calculate discount amount
    const discountAmount = (pointsValue / settings.redemption_rate).toFixed(2);

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        points: transaction.points,
        balanceAfter: transaction.balance_after,
        discountAmount: parseFloat(discountAmount),
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error redeeming loyalty points:', error);
    } else {
      console.error('Error redeeming loyalty points:', error?.message || 'Unknown error');
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unable to redeem loyalty points.',
        error_code: 'REDEMPTION_FAILED',
      },
      { status: 400 }
    );
  }
}

