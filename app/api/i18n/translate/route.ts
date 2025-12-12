/**
 * GET /api/i18n/translate
 * Get a single translation by key and language
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTranslation } from '@/lib/db/i18n';
import type { LanguageCode } from '@/lib/types/i18n';
import { DEFAULT_LANGUAGE, isLanguageSupported } from '@/lib/types/i18n';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const lang = searchParams.get('lang') || DEFAULT_LANGUAGE;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Translation key is required' },
        { status: 400 }
      );
    }

    if (!isLanguageSupported(lang)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const translation = getTranslation(key, lang as LanguageCode);
    
    if (!translation) {
      // Try to fall back to English
      if (lang !== DEFAULT_LANGUAGE) {
        const enTranslation = getTranslation(key, DEFAULT_LANGUAGE);
        if (enTranslation) {
          return NextResponse.json({
            success: true,
            key,
            value: enTranslation.value,
            language: DEFAULT_LANGUAGE,
            fallback: true
          });
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Translation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      key,
      value: translation.value,
      language: lang,
      category: translation.category
    });
  } catch (error) {
    console.error('Error fetching translation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}

