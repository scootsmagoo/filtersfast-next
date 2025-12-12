/**
 * POST /api/i18n/set-language
 * Set user's preferred language (saves to cookie and user preferences if logged in)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isLanguageSupported } from '@/lib/types/i18n';
import type { LanguageCode } from '@/lib/types/i18n';
import { auth } from '@/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';
import { checkRateLimit } from '@/lib/rate-limit-i18n';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per 10 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (checkRateLimit(ip, 30, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { language } = body;

    if (!language || !isLanguageSupported(language)) {
      return NextResponse.json(
        { success: false, error: 'Invalid language code' },
        { status: 400 }
      );
    }

    const lang = language as LanguageCode;

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('language', lang, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      httpOnly: true, // Protect from XSS attacks
      secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    });

    // If user is logged in, update their preferences
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (session?.user?.id) {
      try {
        const dbPath = path.join(process.cwd(), 'filtersfast.db');
        const db = new Database(dbPath);
        
        db.exec('PRAGMA foreign_keys = ON;');
        
        const stmt = db.prepare(`
          INSERT INTO user_preferences (user_id, language, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET
            language = excluded.language,
            updated_at = datetime('now')
        `);
        
        stmt.run(session.user.id, lang);
        db.close();
      } catch (dbError) {
        console.error('Failed to save language preference to database:', dbError);
        // Continue anyway - cookie is set
      }
    }

    return NextResponse.json({
      success: true,
      language: lang,
      message: 'Language preference updated'
    });
  } catch (error) {
    console.error('Error setting language:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set language' },
      { status: 500 }
    );
  }
}

