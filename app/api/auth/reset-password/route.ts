import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, verifyOrigin, validatePayloadSize } from '@/lib/security';
import { getEmailFromToken, consumeResetToken, verifyResetToken } from '@/lib/password-reset';
import { auth } from '@/lib/auth';
import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';

/**
 * Password Reset Handler
 * 
 * Security Features:
 * - CSRF protection via origin verification
 * - Token validation with constant-time comparison
 * - Server-side password strength enforcement
 * - One-time token use
 * - Session invalidation after reset
 * - Secure password hashing (bcrypt)
 * - Rate limiting via password-reset module
 * - Payload size validation
 */
export async function POST(request: NextRequest) {
  try {
    // Security: CSRF protection
    if (!verifyOrigin(request)) {
      console.warn('🚨 CSRF attempt detected on reset-password endpoint');
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
    const { token, password } = body;
    
    // Security: Validate inputs exist
    if (!token || !password) {
      return NextResponse.json({ 
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Security: Validate token format (prevent DOS with huge tokens)
    if (typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid token format'
      }, { status: 400 });
    }
    
    // Security: Validate password strength on server
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        success: false,
        message: passwordValidation.error || 'Password does not meet requirements'
      }, { status: 400 });
    }
    
    // Get email from token
    const email = getEmailFromToken(token);
    
    if (!email) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }
    
    // Verify token one more time (with attempt counting)
    const verification = verifyResetToken(email, token);
    
    if (!verification.valid) {
      return NextResponse.json({ 
        success: false,
        message: verification.error || 'Invalid or expired reset token'
      }, { status: 400 });
    }
    
    // CRITICAL FIX: Actually update the password in the database
    try {
      // Get database instance
      const dbPath = process.env.DATABASE_URL || "./auth.db";
      const db = new Database(dbPath);
      
      // Hash password using bcrypt (Better Auth's default)
      // Work factor 10 = 2^10 iterations (good balance of security and performance)
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user's password in the database
      const stmt = db.prepare('UPDATE user SET password = ? WHERE email = ?');
      const result = stmt.run(hashedPassword, email);
      
      if (result.changes === 0) {
        // User not found
        db.close();
        return NextResponse.json({ 
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }
      
      // CRITICAL FIX: Invalidate all existing sessions for this user
      // Security: Force re-login after password change
      const userStmt = db.prepare('SELECT id FROM user WHERE email = ?');
      const user = userStmt.get(email) as { id: string } | undefined;
      
      if (user) {
        const deleteSessionsStmt = db.prepare('DELETE FROM session WHERE userId = ?');
        deleteSessionsStmt.run(user.id);
        
        console.log(`🔐 Invalidated all sessions for user: ${email}`);
      }
      
      db.close();
      
    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      return NextResponse.json({ 
        success: false,
        message: 'Failed to update password'
      }, { status: 500 });
    }
    
    // CRITICAL FIX: Consume the reset token (one-time use)
    consumeResetToken(email);
    
    // Log success for security monitoring
    console.log(`✅ Password reset successful for: ${email} at ${new Date().toISOString()}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset successful'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'An error occurred while resetting your password'
    }, { status: 500 });
  }
}


