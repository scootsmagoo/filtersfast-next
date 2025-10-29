import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/db/support';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    // Sanitize search query
    const sanitizedQuery = sanitizeText(query).slice(0, 100);

    // Search articles
    const results = searchArticles(sanitizedQuery, true);

    return NextResponse.json({
      success: true,
      query: sanitizedQuery,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search articles',
      },
      { status: 500 }
    );
  }
}

