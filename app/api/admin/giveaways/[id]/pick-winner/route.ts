/**
 * Admin Giveaways API - Pick Winner
 * POST /api/admin/giveaways/[id]/pick-winner - Randomly select a winner
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { 
  getGiveawayById, 
  selectRandomWinner,
  markWinnerNotified
} from '@/lib/db/giveaways';
import { Giveaway, GiveawayEntry } from '@/lib/types/giveaway';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sendGiveawayWinnerEmail } from '@/lib/email-templates/giveaway';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!hasAdminAccess(session.user)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier + ':admin-giveaways-winner', 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const giveawayId = parseInt(params.id);
    if (isNaN(giveawayId)) {
      return NextResponse.json({ error: 'Invalid giveaway ID' }, { status: 400 });
    }

    // Get giveaway
    const giveaway = getGiveawayById(giveawayId) as Giveaway | undefined;
    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway not found' }, { status: 404 });
    }

    // Check if winner already selected
    if (giveaway.winner_id) {
      return NextResponse.json(
        { error: 'Winner already selected for this giveaway' },
        { status: 400 }
      );
    }

    // Select random winner
    const winner = selectRandomWinner(giveawayId) as GiveawayEntry | null;
    
    if (!winner) {
      return NextResponse.json(
        { error: 'No eligible entries found' },
        { status: 400 }
      );
    }

    // Parse request body for optional email sending
    let body: { sendEmail?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    // Send winner notification email if requested
    if (body.sendEmail) {
      try {
        const emailData = sendGiveawayWinnerEmail({
          email: winner.email,
          firstName: winner.first_name,
          giveawayTitle: giveaway.title,
          prizeDescription: giveaway.prize_description
        });
        
        const result = await sendEmail(emailData);
        if (result.success) {
          markWinnerNotified(giveawayId);
        } else {
          console.error('SendGrid failed to deliver winner email:', result.error);
        }
      } catch (emailError) {
        console.error('Error sending winner email:', emailError);
        // Continue anyway - admin can manually notify
      }
    }

    // Audit log
    await auditLog({
      action: 'giveaway.pick_winner',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'giveaway',
      resourceId: giveawayId.toString(),
      status: 'success',
      details: { 
        winnerId: winner.id,
        winnerEmail: winner.email,
        emailSent: body.sendEmail || false
      }
    });

    return NextResponse.json({
      success: true,
      winner: {
        id: winner.id,
        firstName: winner.first_name,
        lastName: winner.last_name,
        email: winner.email,
        entryDate: winner.entry_date
      },
      emailSent: body.sendEmail || false,
      message: 'Winner selected successfully'
    });

  } catch (error) {
    console.error('Error selecting winner:', error);
    return NextResponse.json(
      { error: 'Failed to select winner' },
      { status: 500 }
    );
  }
}

