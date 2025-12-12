/**
 * POST /api/admin/translations/generate
 * Generate translations using AI (OpenAI GPT-4)
 * Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getTranslationsByLanguage, upsertTranslation } from '@/lib/db/i18n';
import type { LanguageCode } from '@/lib/types/i18n';
import { isLanguageSupported, DEFAULT_LANGUAGE } from '@/lib/types/i18n';
import { auditLog } from '@/lib/audit-log';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for AI generation

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

/**
 * POST - Generate translations using AI
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.email || !isAdmin(permissionCheck.user.email)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { target_language, overwrite = false } = body;

    if (!target_language || !isLanguageSupported(target_language)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target language' },
        { status: 400 }
      );
    }

    const targetLang = target_language as LanguageCode;

    // Get English translations
    const englishTranslations = getTranslationsByLanguage(DEFAULT_LANGUAGE);

    if (englishTranslations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No English translations found to translate from' },
        { status: 400 }
      );
    }

    // Get existing translations for target language
    const existingTranslations = getTranslationsByLanguage(targetLang);
    const existingKeys = new Set(existingTranslations.map(t => t.key));

    // Filter translations to generate
    const translationsToGenerate = overwrite 
      ? englishTranslations 
      : englishTranslations.filter(t => !existingKeys.has(t.key));

    if (translationsToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new translations to generate',
        generated: 0
      });
    }

    // Map language codes to full names for AI
    const languageNames: Record<LanguageCode, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'fr-ca': 'French Canadian'
    };

    const targetLanguageName = languageNames[targetLang];

    // Generate translations in batches
    const batchSize = 50; // Process 50 translations at a time
    let generatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < translationsToGenerate.length; i += batchSize) {
      const batch = translationsToGenerate.slice(i, i + batchSize);
      
      try {
        // Prepare batch for translation
        const translationMap = batch.reduce((acc, t) => {
          acc[t.key] = t.value;
          return acc;
        }, {} as Record<string, string>);

        const prompt = `You are a professional translator for an e-commerce filtration website (FiltersFast). Translate the following English text keys to ${targetLanguageName}. 

IMPORTANT: 
- Keep placeholders like {name}, {price}, {count} exactly as they are
- Maintain HTML tags if present
- Keep brand names unchanged
- Use appropriate e-commerce terminology
- For French Canadian (fr-ca), use Canadian French conventions (e.g., "magasiner" vs "acheter")

Respond with ONLY a JSON object where keys match the input keys and values are the translations. No additional text or explanation.

Input:
${JSON.stringify(translationMap, null, 2)}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are a professional translator specializing in e-commerce and technical translations for ${targetLanguageName}. You always return valid JSON with no extra text.` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent translations
          response_format: { type: 'json_object' }
        });

        const translatedText = completion.choices[0].message.content;
        if (!translatedText) {
          throw new Error('Empty response from OpenAI');
        }

        const translations = JSON.parse(translatedText);

        // Save translations to database
        for (const [key, value] of Object.entries(translations)) {
          if (typeof value === 'string') {
            const original = batch.find(t => t.key === key);
            if (original) {
              upsertTranslation({
                key,
                language_code: targetLang,
                value,
                category: original.category,
                context: original.context || undefined
              });
              generatedCount++;
            }
          }
        }

      } catch (batchError) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, batchError);
        errors.push(`Batch ${i / batchSize + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    // Audit log
    await auditLog({
      action: 'generate_translations',
      userId: permissionCheck.user.id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'translation',
      resourceId: targetLang,
      status: 'success',
      details: { 
        targetLanguage: targetLang, 
        targetLanguageName: targetLanguageName,
        generatedCount,
        message: `Generated ${generatedCount} translations for ${targetLanguageName} using AI` 
      }
    });

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      total: translationsToGenerate.length,
      language: targetLang,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully generated ${generatedCount} ${targetLanguageName} translations`
    });

  } catch (error) {
    console.error('Error generating translations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate translations' },
      { status: 500 }
    );
  }
}

