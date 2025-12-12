/**
 * GET /api/i18n/translations
 * Get all translations for a language (optionally filtered by category)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTranslationsMap, getTranslationsByCategory } from '@/lib/db/i18n';
import type { LanguageCode, TranslationCategory } from '@/lib/types/i18n';
import { DEFAULT_LANGUAGE, isLanguageSupported } from '@/lib/types/i18n';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || DEFAULT_LANGUAGE;
    const category = searchParams.get('category') as TranslationCategory | null;

    if (!isLanguageSupported(lang)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    let translations: Record<string, string> = {};
    
    try {
      if (category) {
        const categoryTranslations = getTranslationsByCategory(lang as LanguageCode, category);
        for (const trans of categoryTranslations) {
          translations[trans.key] = trans.value;
        }
      } else {
        translations = getTranslationsMap(lang as LanguageCode);
      }
    } catch (dbError) {
      // If translations table doesn't exist yet, return empty object
      console.log('Translations table not initialized yet, returning empty translations');
      translations = {};
    }

    return NextResponse.json({
      success: true,
      translations,
      language: lang,
      category: category || 'all'
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    // Return empty translations instead of 500 error
    return NextResponse.json({
      success: true,
      translations: {},
      language: DEFAULT_LANGUAGE,
      category: 'all'
    });
  }
}

