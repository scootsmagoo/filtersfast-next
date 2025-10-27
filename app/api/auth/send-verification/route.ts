import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, verifyOrigin, validatePayloadSize } from '@/lib/security';
import { canRequestVerification, generateVerificationToken } from '@/lib/email-verification';

/**
 * Send Email Verification
 * 
 * Security Features:
 * - Rate limiting: 3 verification emails per hour per email
 * - CSRF protection via origin verification
 * - Secure token generation (256-bit)
 * - 24-hour token expiration
 * - Invalidates old tokens automatically
 * - Payload size validation
 */
export async function POST(request: NextRequest) {
  try {
    // Security: CSRF protection
    if (!verifyOrigin(request)) {
      console.warn('🚨 CSRF attempt detected on send-verification endpoint');
      return NextResponse.json({ 
        success: false,
        message: 'Invalid request origin'
      }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Security: Validate payload size
    if (!validatePayloadSize(body, 10)) {
      return NextResponse.json({ 
        success: false,
        message: 'Request payload too large'
      }, { status: 413 });
    }
    
    const { email } = body;
    
    // Security: Validate email format
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid email address'
      }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Security: Rate limiting check
    const rateCheck = canRequestVerification(normalizedEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        success: false,
        message: `Too many requests. Please try again in ${Math.ceil(rateCheck.retryAfter! / 60)} minutes.`
      }, { status: 429 });
    }
    
    // Generate verification token (invalidates old ones automatically)
    const verificationToken = generateVerificationToken(normalizedEmail);
    
    // Generate verification URL
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${verificationToken}`;
    
    // TODO: Send email with verification link using email service
    // Example with SendGrid or similar:
    // await sendVerificationEmail(normalizedEmail, verificationLink);
    
    // Development: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n===========================================');
      console.log('📧 EMAIL VERIFICATION');
      console.log('===========================================');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Expires: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}`);
      console.log('===========================================\n');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully'
    });
    
  } catch (error) {
    console.error('Send verification error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Failed to send verification email'
    }, { status: 500 });
  }
}

