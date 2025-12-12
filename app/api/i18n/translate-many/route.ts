/**
 * POST /api/i18n/translate-many
 * Get multiple translations at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTranslationsByKeys } from '@/lib/db/i18n';
import type { LanguageCode } from '@/lib/types/i18n';
import { DEFAULT_LANGUAGE, isLanguageSupported } from '@/lib/types/i18n';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys, language } = body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keys array is required' },
        { status: 400 }
      );
    }

    const lang = language || DEFAULT_LANGUAGE;
    if (!isLanguageSupported(lang)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    const translations = getTranslationsByKeys(keys, lang as LanguageCode);
    
    // Fill in missing translations with fallback to English or key itself
    const result: Record<string, string> = {};
    for (const key of keys) {
      if (translations[key]) {
        result[key] = translations[key];
      } else if (lang !== DEFAULT_LANGUAGE) {
        // Try English fallback
        const enTranslations = getTranslationsByKeys([key], DEFAULT_LANGUAGE);
        result[key] = enTranslations[key] || key;
      } else {
        result[key] = key;
      }
    }

    return NextResponse.json({
      success: true,
      translations: result,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

