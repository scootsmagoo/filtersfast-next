import { NextRequest, NextResponse } from 'next/server';
import { openai, CHATBOT_SYSTEM_PROMPT } from '@/lib/openai';
import { searchSupportArticles, formatArticlesForContext } from '@/lib/chatbot-search';
import { saveChatbotMessage, getChatbotHistory } from '@/lib/db/support';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // OWASP: Rate limiting to prevent abuse
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const ip = getClientIdentifier(request);
    
    console.log('🤖 Chatbot request received:', {
      isDevelopment,
      NODE_ENV: process.env.NODE_ENV,
      ip,
      rateLimit: isDevelopment ? 1000 : 20
    });
    
    // Apply rate limiting (more lenient in development)
    if (!isDevelopment) {
      const rateLimitResult = await rateLimit(ip, 20, 60); // 20 requests per 60 seconds
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { message, sessionId, userId } = body;

    // OWASP: Input validation - length limits to prevent DoS
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Please keep messages under 2000 characters.' },
        { status: 400 }
      );
    }

    // OWASP: Validate session ID format (alphanumeric, underscores, max 100 chars)
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // OWASP: Sanitize user input - strip HTML tags but preserve normal text
    // React's {text} rendering already prevents XSS, so we just need to remove tags
    const sanitizedMessage = message
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
      .replace(/<embed\b[^>]*>/gi, '') // Remove embed tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI chatbot is not configured. Please contact support.',
          fallbackToHuman: true 
        },
        { status: 503 }
      );
    }

    // Search for relevant support articles (use sanitized message for search)
    const relevantArticles = searchSupportArticles(sanitizedMessage, 3);
    const articlesContext = formatArticlesForContext(relevantArticles);

    // Get conversation history
    const history = getChatbotHistory(sessionId, 10);

    // Save user message (with sanitized content)
    saveChatbotMessage({
      session_id: sessionId,
      user_id: userId,
      message_role: 'user',
      message_content: sanitizedMessage,
    });

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: `${CHATBOT_SYSTEM_PROMPT}

Relevant support articles for context:
${articlesContext}

Use these articles to help answer the user's question. If the articles don't contain relevant information, use your general knowledge about FiltersFast and e-commerce best practices.`,
      },
      // Add conversation history (excluding system messages)
      ...history
        .filter((msg) => msg.message_role !== 'system')
        .map((msg) => ({
          role: msg.message_role as 'user' | 'assistant',
          content: msg.message_content,
        })),
      // Add current user message (use sanitized version)
      {
        role: 'user' as const,
        content: sanitizedMessage,
      },
    ];

    // Call OpenAI API
    let assistantMessage: string;
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = completion.choices[0]?.message?.content || 
        "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (openaiError: any) {
      // Handle quota/billing errors gracefully
      if (openaiError?.status === 429 || openaiError?.code === 'insufficient_quota') {
        console.warn('⚠️ OpenAI quota exceeded - using fallback response');
        
        // Fallback: Use article content directly
        if (relevantArticles.length > 0) {
          const topArticle = relevantArticles[0];
          assistantMessage = `I found this information that might help:\n\n${stripHtml(topArticle.content).substring(0, 400)}...\n\nFor more details, check out: ${topArticle.title}`;
        } else {
          assistantMessage = "I'd be happy to help! Our team is available at:\n\n📞 Phone: 1-888-775-7101\n📧 Email: support@filtersfast.com\n🕐 Hours: Mon-Fri 9am-5pm EST\n\nYou can also browse our support articles at /support";
        }
      } else {
        throw openaiError; // Re-throw other errors
      }
    }

    function stripHtml(html: string): string {
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // OWASP: Sanitize assistant response - remove dangerous HTML but keep normal text
    // React will handle XSS prevention when rendering {text}
    const sanitizedResponse = assistantMessage
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    // Save assistant message
    const messageId = saveChatbotMessage({
      session_id: sessionId,
      user_id: userId,
      message_role: 'assistant',
      message_content: sanitizedResponse,
      articles_referenced: relevantArticles.length > 0 
        ? relevantArticles.map(a => a.id).join(',')
        : undefined,
    });

    return NextResponse.json({
      message: sanitizedResponse,
      messageId,
      articlesReferenced: relevantArticles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        category_slug: article.category_slug,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // OWASP: Don't expose internal error details to client
    console.error('Chatbot error:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'AI service is temporarily unavailable. Please try again later or contact support.',
          fallbackToHuman: true 
        },
        { status: 503 }
      );
    }

    // Generic error message (don't leak stack traces or DB errors)
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your message. Please try again.',
        fallbackToHuman: false 
      },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    // OWASP: Validate session ID (same validation as POST)
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const history = getChatbotHistory(sessionId);

    return NextResponse.json({
      history: history.map(msg => ({
        id: msg.id,
        role: msg.message_role,
        content: msg.message_content,
        timestamp: msg.created_at,
      })),
    });

  } catch (error) {
    // OWASP: Don't expose internal errors
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

