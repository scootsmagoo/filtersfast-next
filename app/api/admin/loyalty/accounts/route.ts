import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import {
  getLoyaltyAccountByEmail,
  getLoyaltyTransactions,
  adjustLoyaltyPoints,
} from '@/lib/db/loyalty';
import { rateLimit } from '@/lib/rate-limit-admin';
import { z } from 'zod';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 300,
});

// GET - Get loyalty account by email
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 30);
    }

    const { searchParams } = new URL(request.url);
    const rawEmail = searchParams.get('email');

    if (!rawEmail) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = emailRegex.test(rawEmail) ? rawEmail.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const account = getLoyaltyAccountByEmail(email);
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Loyalty account not found' },
        { status: 404 }
      );
    }

    // Get recent transactions
    const transactions = getLoyaltyTransactions(email, 20, 0);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        customerEmail: account.customer_email,
        pointsBalance: account.points_balance,
        lifetimePoints: account.lifetime_points,
        tierLevel: account.tier_level,
        tierName: account.tier_name,
        lastActivityAt: account.last_activity_at,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.transaction_type,
        points: t.points,
        balanceAfter: t.balance_after,
        orderId: t.order_id,
        orderNumber: t.order_number,
        description: t.description,
        performedBy: t.performed_by_name,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load loyalty account' },
      { status: 500 }
    );
  }
}

// POST - Adjust loyalty points
const adjustSchema = z.object({
  email: z.string().email(),
  points: z.number().int(),
  description: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (process.env.NODE_ENV !== 'development') {
      await limiter.check(session.user.id, 20);
    }

    const body = await request.json();
    const result = adjustSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', issues: result.error.flatten() },
        { status: 400 }
      );
    }

    const transaction = adjustLoyaltyPoints({
      customerEmail: result.data.email,
      points: result.data.points,
      description: result.data.description,
      performedBy: {
        id: session.user.id,
        name: session.user.name || 'Admin',
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        points: transaction.points,
        balanceAfter: transaction.balance_after,
        description: transaction.description,
      },
    });
  } catch (error: any) {
    console.error('Error adjusting loyalty points:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to adjust loyalty points' },
      { status: 400 }
    );
  }
}

