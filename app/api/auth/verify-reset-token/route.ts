import { NextRequest, NextResponse } from 'next/server';
import { verifyOrigin, validatePayloadSize } from '@/lib/security';
import { getEmailFromToken } from '@/lib/password-reset';

/**
 * Verify Password Reset Token
 * 
 * Security Features:
 * - CSRF protection via origin verification
 * - No email exposure (prevents information disclosure)
 * - Token length validation (prevents DOS)
 * - Rate limiting via password-reset module
 * - Constant-time comparison
 * - Payload size validation
 */
export async function POST(request: NextRequest) {
  try {
    // Security: CSRF protection
    if (!verifyOrigin(request)) {
      console.warn('🚨 CSRF attempt detected on verify-reset-token endpoint');
      return NextResponse.json({ valid: false });
    }
    
    const body = await request.json();
    
    // Security: Validate payload size
    if (!validatePayloadSize(body, 10)) {
      return NextResponse.json({ valid: false });
    }
    const { token } = body;
    
    // Security: Validate token exists and is correct length
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ valid: false });
    }
    
    // Check if token exists and is not expired
    const email = getEmailFromToken(token);
    
    // Security: Don't expose email address
    return NextResponse.json({ 
      valid: email !== null
      // Removed: email exposure
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Security: Generic error response
    return NextResponse.json({ valid: false });
  }
}

