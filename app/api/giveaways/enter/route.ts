/**
 * Public Giveaways API - Submit Entry
 * POST /api/giveaways/enter - Submit a giveaway entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { 
  getGiveawayById, 
  getGiveawayByCampaignName, 
  createEntry, 
  hasEntered 
} from '@/lib/db/giveaways';
import { SubmitEntryRequest } from '@/lib/types/giveaway';
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sendGiveawayConfirmationEmail } from '@/lib/email-templates/giveaway';
import { sendEmail } from '@/lib/email';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - aggressive to prevent spam
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier + ':giveaways-enter', 5, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many entry attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: SubmitEntryRequest = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    if (!body.giveawayId && !body.campaignName) {
      return NextResponse.json(
        { error: 'Giveaway ID or campaign name is required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (!body.recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification required' },
        { status: 400 }
      );
    }

    const recaptchaValid = await verifyRecaptcha(body.recaptchaToken);
    if (!recaptchaValid) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Get giveaway
    let giveaway;
    if (body.giveawayId) {
      giveaway = getGiveawayById(body.giveawayId);
    } else if (body.campaignName) {
      giveaway = getGiveawayByCampaignName(body.campaignName);
    }

    if (!giveaway) {
      return NextResponse.json(
        { error: 'Giveaway not found' },
        { status: 404 }
      );
    }

    // Check if giveaway is active
    if (!giveaway.is_active) {
      return NextResponse.json(
        { error: 'This giveaway is not currently active' },
        { status: 400 }
      );
    }

    // Check dates
    const now = new Date();
    const startDate = new Date(giveaway.start_date);
    const endDate = new Date(giveaway.end_date);

    if (now < startDate) {
      return NextResponse.json(
        { error: 'This giveaway has not started yet' },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'This giveaway has ended' },
        { status: 400 }
      );
    }

    // Check if already entered
    if (hasEntered(giveaway.id, body.email)) {
      return NextResponse.json(
        { error: 'You have already entered this giveaway' },
        { status: 400 }
      );
    }

    // Get session (optional - to link customer)
    let session = null;
    try {
      session = await auth.api.getSession({ headers: await headers() });
    } catch {
      // Not logged in - that's okay
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create entry with sanitized input (OWASP A03:2021 - Injection Prevention)
    const result = createEntry({
      giveawayId: giveaway.id,
      customerId: session?.user?.id ? parseInt(session.user.id) : undefined,
      firstName: sanitizeText(body.firstName),
      lastName: sanitizeText(body.lastName),
      email: sanitizeEmail(body.email),
      ipAddress,
      userAgent
    });

    if (!result.success) {
      if (result.error === 'duplicate_entry') {
        return NextResponse.json(
          { error: 'You have already entered this giveaway' },
          { status: 400 }
        );
      }
      throw new Error('Failed to create entry');
    }

    // Send confirmation email (don't wait for it)
    const emailData = sendGiveawayConfirmationEmail({
      email: body.email,
      firstName: body.firstName,
      giveawayTitle: giveaway.title,
      prizeDescription: giveaway.prize_description,
      endDate: giveaway.end_date
    });
    
    sendEmail(emailData)
      .then(result => {
        if (!result.success) {
          console.error('Giveaway confirmation email reported failure:', result.error);
        }
      })
      .catch(error => {
        console.error('Error sending confirmation email:', error);
        // Don't fail the entry if email fails
      });

    return NextResponse.json({
      success: true,
      message: 'Entry submitted successfully! Good luck!',
      entryId: result.id
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting giveaway entry:', error);
    return NextResponse.json(
      { error: 'Failed to submit entry. Please try again.' },
      { status: 500 }
    );
  }
}

