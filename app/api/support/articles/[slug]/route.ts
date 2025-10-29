import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, recordArticleView } from '@/lib/db/support';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    // Don't show unpublished articles to non-admin users
    if (!article.is_published) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    // Record view (async, don't wait for it)
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    try {
      recordArticleView({
        article_id: article.id,
        ip_address: ip.substring(0, 45), // Limit IP length for IPv6
        user_agent: userAgent.substring(0, 255), // Limit user agent length
      });
    } catch (viewError) {
      // Don't fail the request if view recording fails
      console.error('Failed to record article view:', viewError);
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch article',
      },
      { status: 500 }
    );
  }
}

