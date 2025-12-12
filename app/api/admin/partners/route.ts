/**
 * Admin Partners API Routes
 * GET /api/admin/partners - Get all partners (admin)
 * POST /api/admin/partners - Create new partner
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllPartners, 
  createPartner, 
  isSlugAvailable,
  generateUniqueSlug
} from '@/lib/db/partners';
import { CreatePartnerInput } from '@/lib/types/partner';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize';
import { checkRateLimit, getClientIdentifier, rateLimitPresets } from '@/lib/rate-limit';
import { hasAdminAccess } from '@/lib/auth-admin';

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', userId: null };
  }
  
  // Proper admin role check
  if (!hasAdminAccess(session.user)) {
    return { authorized: false, error: 'Forbidden - Admin access required', userId: session.user.id };
  }
  
  return { authorized: true, userId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }
    
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error.includes('Forbidden') ? 403 : 401 }
      );
    }
    
    const partners = getAllPartners();
    
    return NextResponse.json(partners, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error) {
    // Secure error handling - don't leak details
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners API] Error fetching partners:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, rateLimitPresets.strict);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          }
        }
      );
    }
    
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error.includes('Forbidden') ? 403 : 401 }
      );
    }
    
    // Request size check (max 1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1048576) {
      return NextResponse.json(
        { error: 'Request too large. Maximum size is 1MB.' },
        { status: 413 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.shortDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, shortDescription' },
        { status: 400 }
      );
    }
    
    // Validate input lengths
    if (body.name.length > 200) {
      return NextResponse.json(
        { error: 'Name must be 200 characters or less' },
        { status: 400 }
      );
    }
    
    if (body.shortDescription.length > 500) {
      return NextResponse.json(
        { error: 'Short description must be 500 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate partner type
    const validTypes = ['charity', 'corporate', 'discount_program'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid partner type. Must be charity, corporate, or discount_program' },
        { status: 400 }
      );
    }
    
    // Validate URLs if provided
    if (body.websiteUrl) {
      const urlValidation = sanitizeUrl(body.websiteUrl);
      if (!urlValidation) {
        return NextResponse.json(
          { error: 'Invalid website URL. Must be a valid HTTP or HTTPS URL.' },
          { status: 400 }
        );
      }
    }
    
    // Validate content blocks JSON
    if (body.contentBlocks) {
      if (!Array.isArray(body.contentBlocks)) {
        return NextResponse.json(
          { error: 'Content blocks must be an array' },
          { status: 400 }
        );
      }
      
      // Validate each content block
      for (const block of body.contentBlocks) {
        if (!block.id || !block.type || block.order === undefined || !block.data) {
          return NextResponse.json(
            { error: 'Invalid content block structure. Each block must have id, type, order, and data.' },
            { status: 400 }
          );
        }
      }
    }
    
    // Generate slug if not provided
    let slug = body.slug;
    if (!slug) {
      slug = generateUniqueSlug(body.name);
    } else {
      // Check if slug is available
      if (!isSlugAvailable(slug)) {
        return NextResponse.json(
          { error: 'Slug is already in use' },
          { status: 400 }
        );
      }
    }
    
    // Sanitize text fields
    const input: CreatePartnerInput = {
      name: sanitizeText(body.name),
      slug,
      type: body.type,
      shortDescription: sanitizeText(body.shortDescription),
      description: body.description ? sanitizeText(body.description) : undefined,
      logo: body.logo,
      heroImage: body.heroImage,
      partnershipStartDate: body.partnershipStartDate ? new Date(body.partnershipStartDate) : undefined,
      missionStatement: body.missionStatement ? sanitizeText(body.missionStatement) : undefined,
      websiteUrl: body.websiteUrl,
      discountCode: body.discountCode,
      discountDescription: body.discountDescription ? sanitizeText(body.discountDescription) : undefined,
      metaTitle: body.metaTitle ? sanitizeText(body.metaTitle) : undefined,
      metaDescription: body.metaDescription ? sanitizeText(body.metaDescription) : undefined,
      contentBlocks: body.contentBlocks || [],
      active: body.active !== undefined ? body.active : true,
      featured: body.featured !== undefined ? body.featured : false,
      displayOrder: body.displayOrder !== undefined ? body.displayOrder : 0,
    };
    
    const partner = createPartner(input);
    
    // Audit log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] Partner created: ${partner.id} by user ${authCheck.userId}`);
    }
    
    return NextResponse.json(partner, { 
      status: 201,
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error: any) {
    // Secure error handling
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners API] Error creating partner:', error);
    }
    
    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'development' && error.message 
      ? error.message 
      : 'Failed to create partner';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

