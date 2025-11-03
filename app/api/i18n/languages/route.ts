/**
 * GET /api/i18n/languages
 * Get all active languages
 */

import { NextResponse } from 'next/server';
import { getActiveLanguages } from '@/lib/db/i18n';

export async function GET() {
  try {
    const languages = getActiveLanguages();
    
    return NextResponse.json({ 
      success: true,
      languages 
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

