import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, recordArticleFeedback } from '@/lib/db/support';
import { rateLimit as rateLimitFn } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const rateLimitResult = await rateLimitFn(ip, 3, 600); // 3 requests per 10 minutes
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many feedback submissions. Please try again later.',
        },
        { status: 429 }
      );
    }

    const article = getArticleBySlug(slug);

    if (!article || !article.is_published) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { is_helpful, comment } = body;

    // Validate input
    if (typeof is_helpful !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'is_helpful must be a boolean',
        },
        { status: 400 }
      );
    }

    // Sanitize optional comment
    const sanitizedComment = comment ? sanitizeText(comment).slice(0, 500) : undefined;

    // Record feedback
    recordArticleFeedback({
      article_id: article.id,
      is_helpful,
      comment: sanitizedComment,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit feedback',
      },
      { status: 500 }
    );
  }
}

