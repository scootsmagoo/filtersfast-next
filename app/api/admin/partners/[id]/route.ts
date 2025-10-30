/**
 * Admin Single Partner API Routes
 * GET /api/admin/partners/[id] - Get partner by ID
 * PUT /api/admin/partners/[id] - Update partner
 * DELETE /api/admin/partners/[id] - Delete partner
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getPartnerById, 
  updatePartner, 
  deletePartner,
  isSlugAvailable 
} from '@/lib/db/partners';
import { UpdatePartnerInput } from '@/lib/types/partner';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const partner = getPartnerById(params.id);
    
    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(partner, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners API] Error fetching partner:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch partner' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const partner = getPartnerById(params.id);
    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
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
    
    // Validate input lengths if provided
    if (body.name && body.name.length > 200) {
      return NextResponse.json(
        { error: 'Name must be 200 characters or less' },
        { status: 400 }
      );
    }
    
    if (body.shortDescription && body.shortDescription.length > 500) {
      return NextResponse.json(
        { error: 'Short description must be 500 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate partner type if being changed
    if (body.type) {
      const validTypes = ['charity', 'corporate', 'discount_program'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid partner type. Must be charity, corporate, or discount_program' },
          { status: 400 }
        );
      }
    }
    
    // Validate URL if provided
    if (body.websiteUrl !== undefined && body.websiteUrl) {
      const urlValidation = sanitizeUrl(body.websiteUrl);
      if (!urlValidation) {
        return NextResponse.json(
          { error: 'Invalid website URL. Must be a valid HTTP or HTTPS URL.' },
          { status: 400 }
        );
      }
    }
    
    // Validate content blocks if provided
    if (body.contentBlocks) {
      if (!Array.isArray(body.contentBlocks)) {
        return NextResponse.json(
          { error: 'Content blocks must be an array' },
          { status: 400 }
        );
      }
      
      for (const block of body.contentBlocks) {
        if (!block.id || !block.type || block.order === undefined || !block.data) {
          return NextResponse.json(
            { error: 'Invalid content block structure' },
            { status: 400 }
          );
        }
      }
    }
    
    // Check slug availability if being changed
    if (body.slug && body.slug !== partner.slug) {
      if (!isSlugAvailable(body.slug, params.id)) {
        return NextResponse.json(
          { error: 'Slug is already in use' },
          { status: 400 }
        );
      }
    }
    
    // Build update input
    const input: UpdatePartnerInput = {
      id: params.id,
    };
    
    if (body.name !== undefined) input.name = sanitizeText(body.name);
    if (body.slug !== undefined) input.slug = body.slug;
    if (body.type !== undefined) input.type = body.type;
    if (body.shortDescription !== undefined) input.shortDescription = sanitizeText(body.shortDescription);
    if (body.description !== undefined) input.description = body.description ? sanitizeText(body.description) : undefined;
    if (body.logo !== undefined) input.logo = body.logo;
    if (body.heroImage !== undefined) input.heroImage = body.heroImage;
    if (body.partnershipStartDate !== undefined) input.partnershipStartDate = body.partnershipStartDate ? new Date(body.partnershipStartDate) : undefined;
    if (body.missionStatement !== undefined) input.missionStatement = body.missionStatement ? sanitizeText(body.missionStatement) : undefined;
    if (body.websiteUrl !== undefined) input.websiteUrl = body.websiteUrl;
    if (body.discountCode !== undefined) input.discountCode = body.discountCode;
    if (body.discountDescription !== undefined) input.discountDescription = body.discountDescription ? sanitizeText(body.discountDescription) : undefined;
    if (body.metaTitle !== undefined) input.metaTitle = body.metaTitle ? sanitizeText(body.metaTitle) : undefined;
    if (body.metaDescription !== undefined) input.metaDescription = body.metaDescription ? sanitizeText(body.metaDescription) : undefined;
    if (body.contentBlocks !== undefined) input.contentBlocks = body.contentBlocks;
    if (body.active !== undefined) input.active = body.active;
    if (body.featured !== undefined) input.featured = body.featured;
    if (body.displayOrder !== undefined) input.displayOrder = body.displayOrder;
    
    const updatedPartner = updatePartner(input);
    
    // Audit log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] Partner updated: ${params.id} by user ${authCheck.userId}`);
    }
    
    return NextResponse.json(updatedPartner, {
      headers: {
        'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      }
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners API] Error updating partner:', error);
    }
    
    const message = process.env.NODE_ENV === 'development' && error.message 
      ? error.message 
      : 'Failed to update partner';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const partner = getPartnerById(params.id);
    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }
    
    const deleted = deletePartner(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete partner' },
        { status: 500 }
      );
    }
    
    // Audit log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] Partner deleted: ${params.id} (${partner.name}) by user ${authCheck.userId}`);
    }
    
    return NextResponse.json(
      { success: true, message: 'Partner deleted successfully' },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitPresets.strict.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Partners API] Error deleting partner:', error);
    }
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}

