import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, verifyOrigin, validatePayloadSize } from '@/lib/security';
import { canRequestReset, generateResetToken } from '@/lib/password-reset';

/**
 * Password Reset Request Handler
 * 
 * Security Features:
 * - Rate limiting: 3 requests per hour per email
 * - CSRF protection via origin verification
 * - Anti-enumeration: Always returns success
 * - Invalidates old tokens automatically
 * - Secure token generation (256-bit)
 * - Input validation
 * - Payload size limits
 */
export async function POST(request: NextRequest) {
  try {
    // Security: CSRF protection - verify origin
    if (!verifyOrigin(request)) {
      console.warn('🚨 CSRF attempt detected on forgot-password endpoint');
      // Don't reveal CSRF rejection
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a reset link has been sent'
      });
    }
    
    const body = await request.json();
    
    // Security: Validate payload size (prevent DOS)
    if (!validatePayloadSize(body, 10)) {
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a reset link has been sent'
      });
    }
    const { email } = body;
    
    // Security: Validate email format
    if (!email || !validateEmail(email)) {
      // Security: Return success even for invalid email to prevent enumeration
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a reset link has been sent'
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Security: Rate limiting check
    const rateCheck = canRequestReset(normalizedEmail);
    if (!rateCheck.allowed) {
      // Security: Don't reveal rate limiting to prevent enumeration
      // Log for monitoring but return success message
      console.warn(`⚠️ Rate limit exceeded for email: ${normalizedEmail}, retry after ${rateCheck.retryAfter}s`);
      
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists, a reset link has been sent'
      });
    }
    
    // Generate reset token (invalidates old ones automatically)
    const resetToken = generateResetToken(normalizedEmail);
    
    // Generate reset URL
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;
    
    // TODO: Send email with reset link using email service
    // Example with SendGrid or similar:
    // await sendPasswordResetEmail(normalizedEmail, resetLink);
    
    // Development: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n===========================================');
      console.log('🔐 PASSWORD RESET REQUEST');
      console.log('===========================================');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Expires: ${new Date(Date.now() + 30 * 60 * 1000).toLocaleString()}`);
      console.log('===========================================\n');
    }
    
    // Security: Always return success to prevent user enumeration
    return NextResponse.json({ 
      success: true,
      message: 'If an account exists, a reset link has been sent'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Security: Don't reveal internal errors
    return NextResponse.json({ 
      success: true,
      message: 'If an account exists, a reset link has been sent'
    });
  }
}


