/**
 * Admin API for managing translations
 * GET /api/admin/translations - Get all translations
 * POST /api/admin/translations - Create or update translation
 * DELETE /api/admin/translations - Delete translation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-admin';
import { 
  getTranslationsByLanguage, 
  upsertTranslation, 
  deleteTranslation 
} from '@/lib/db/i18n';
import type { LanguageCode, TranslationInput } from '@/lib/types/i18n';
import { isLanguageSupported, DEFAULT_LANGUAGE } from '@/lib/types/i18n';
import { auditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all translations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || DEFAULT_LANGUAGE;

    if (!isLanguageSupported(lang)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const translations = getTranslationsByLanguage(lang as LanguageCode);

    return NextResponse.json({
      success: true,
      translations,
      language: lang,
      count: translations.length
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update translation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, language_code, value, category, context } = body;

    if (!key || !language_code || !value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, language_code, value' },
        { status: 400 }
      );
    }

    if (!isLanguageSupported(language_code)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const input: TranslationInput = {
      key,
      language_code: language_code as LanguageCode,
      value,
      category,
      context
    };

    const translation = upsertTranslation(input);

    // Audit log
    await auditLog({
      action: 'update_translation',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'translation',
      resourceId: `${key}:${language_code}`,
      status: 'success',
      details: { key, language_code, message: `Updated translation for key "${key}" in ${language_code}` }
    });

    return NextResponse.json({
      success: true,
      translation,
      message: 'Translation saved successfully'
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save translation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete translation (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const language_code = searchParams.get('lang');

    if (!key || !language_code) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: key, lang' },
        { status: 400 }
      );
    }

    if (!isLanguageSupported(language_code)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const deleted = deleteTranslation(key, language_code as LanguageCode);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Translation not found' },
        { status: 404 }
      );
    }

    // Audit log
    await auditLog({
      action: 'delete_translation',
      userId: session.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'translation',
      resourceId: `${key}:${language_code}`,
      status: 'success',
      details: { key, language_code, message: `Deleted translation for key "${key}" in ${language_code}` }
    });

    return NextResponse.json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting translation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}

