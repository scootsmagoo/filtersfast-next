import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, getFeaturedArticles, getPopularArticles } from '@/lib/db/support';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'all', 'featured', 'popular'
    const categoryId = searchParams.get('categoryId');
    const limit = searchParams.get('limit');

    let articles;

    if (type === 'featured') {
      articles = getFeaturedArticles(limit ? parseInt(limit) : 5);
    } else if (type === 'popular') {
      articles = getPopularArticles(limit ? parseInt(limit) : 10);
    } else {
      articles = getAllArticles({
        publishedOnly: true,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles',
      },
      { status: 500 }
    );
  }
}

