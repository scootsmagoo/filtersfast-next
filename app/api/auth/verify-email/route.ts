import { NextRequest, NextResponse } from 'next/server';
import { verifyOrigin, validatePayloadSize } from '@/lib/security';
import { getEmailFromVerificationToken, consumeVerificationToken, verifyEmailToken } from '@/lib/email-verification';
import Database from 'better-sqlite3';

/**
 * Verify Email Address
 * 
 * Security Features:
 * - Token validation with constant-time comparison
 * - One-time token use
 * - 24-hour expiration
 * - Rate limiting (10 attempts per token)
 * - CSRF protection
 * - Payload size validation
 */
export async function POST(request: NextRequest) {
  try {
    // Security: CSRF protection
    if (!verifyOrigin(request)) {
      console.warn('🚨 CSRF attempt detected on verify-email endpoint');
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
    
    const { token } = body;
    
    // Security: Validate token format (prevent DOS with huge tokens)
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid token format'
      }, { status: 400 });
    }
    
    // Get email from token
    const email = getEmailFromVerificationToken(token);
    
    if (!email) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid or expired verification token'
      }, { status: 400 });
    }
    
    // Verify token (with attempt counting)
    const verification = verifyEmailToken(email, token);
    
    if (!verification.valid) {
      return NextResponse.json({ 
        success: false,
        message: verification.error || 'Invalid or expired verification token'
      }, { status: 400 });
    }
    
    // Update user's email verification status in database
    try {
      const dbPath = process.env.DATABASE_URL || "./auth.db";
      const db = new Database(dbPath);
      
      // Update emailVerified field in user table
      const stmt = db.prepare('UPDATE user SET emailVerified = 1 WHERE email = ?');
      const result = stmt.run(email);
      
      db.close();
      
      if (result.changes === 0) {
        return NextResponse.json({ 
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }
      
      // Consume the verification token (one-time use)
      consumeVerificationToken(email);
      
      console.log(`✅ Email verified for: ${email} at ${new Date().toISOString()}`);
      
      return NextResponse.json({ 
        success: true,
        message: 'Email verified successfully'
      });
      
    } catch (dbError) {
      console.error('Database error during email verification:', dbError);
      return NextResponse.json({ 
        success: false,
        message: 'Failed to verify email'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Verify email error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'An error occurred while verifying your email'
    }, { status: 500 });
  }
}

