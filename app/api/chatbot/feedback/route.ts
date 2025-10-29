import { NextRequest, NextResponse } from 'next/server';
import { recordChatbotFeedback } from '@/lib/db/support';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // OWASP: Rate limiting to prevent abuse
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!isDevelopment) {
      const ip = getClientIdentifier(request);
      const rateLimitResult = await rateLimit(ip, 50, 60); // 50 feedback per minute
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { messageId, feedback } = body;

    // OWASP: Validate messageId is positive integer
    if (!messageId || typeof messageId !== 'number' || messageId < 1 || !Number.isInteger(messageId)) {
      return NextResponse.json(
        { error: 'Valid message ID is required' },
        { status: 400 }
      );
    }

    // OWASP: Strict whitelist validation for feedback value
    if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Valid feedback is required (helpful or not_helpful)' },
        { status: 400 }
      );
    }

    recordChatbotFeedback(messageId, feedback);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });

  } catch (error) {
    // OWASP: Don't expose internal errors to client
    console.error('Error recording chatbot feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

