import { NextRequest, NextResponse } from 'next/server';
import { getMFAFactor } from '@/lib/db/mfa';
import { sanitizeInput } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import Database from 'better-sqlite3';

/**
 * POST /api/mfa/check-required
 * Check if an email address has MFA enabled (public endpoint for login flow)
 * Note: This doesn't reveal if user exists (returns false for non-existent users)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const email = sanitizeInput(body.email || '').toLowerCase().trim();

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { required: false }, // Don't reveal invalid email
        { status: 200 }
      );
    }

    // Look up user by email to get userId
    const dbPath = process.env.DATABASE_URL || "./auth.db";
    const db = new Database(dbPath);
    
    try {
      const user = db.prepare('SELECT id FROM user WHERE email = ?').get(email) as { id: string } | undefined;
      
      if (!user) {
        // User doesn't exist - return false without revealing
        return NextResponse.json({ required: false });
      }

      // Check if user has MFA enabled using userId
      const factor = getMFAFactor(user.id);

      return NextResponse.json({
        required: !!factor,
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('MFA check-required error:', error);
    // Security: Don't reveal errors, just return false
    return NextResponse.json({ required: false });
  }
}

