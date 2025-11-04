/**
 * Admin API for managing translations
 * GET /api/admin/translations - Get all translations
 * POST /api/admin/translations - Create or update translation
 * DELETE /api/admin/translations - Delete translation
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { 
  getTranslationsByLanguage, 
  upsertTranslation, 
  deleteTranslation 
} from '@/lib/db/i18n';
import type { LanguageCode, TranslationInput } from '@/lib/types/i18n';
import { isLanguageSupported, DEFAULT_LANGUAGE } from '@/lib/types/i18n';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all translations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Translations', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
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

    let translations = [];
    try {
      translations = getTranslationsByLanguage(lang as LanguageCode);
    } catch (dbError) {
      // If translations table doesn't exist yet, return empty array
      console.log('Translations table not initialized yet, returning empty translations');
      translations = [];
    }

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
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Translations', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
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
    // Check permissions
    const permissionCheck = await checkPermission(request, 'Translations', 'write');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
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

