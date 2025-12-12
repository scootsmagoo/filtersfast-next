/**
 * Admin Categories API
 * GET - List categories
 * POST - Create new category
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { listCategories, createCategory } from '@/lib/db/categories';
import type { CategoryFormData } from '@/lib/types/category';
import { headers } from 'next/headers';
import { z } from 'zod';

// Rate limiting
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Validate file path to prevent path traversal
function validateFilePath(path: string | null | undefined): boolean {
  if (!path) return true;
  // Only allow relative paths starting with /ProdImages/ or similar safe patterns
  const safePattern = /^\/ProdImages\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i;
  return safePattern.test(path);
}

// Validation schema
const categorySchema = z.object({
  categoryDesc: z.string().min(1).max(100).trim(),
  idParentCategory: z.number().int().min(0),
  categoryFeatured: z.enum(['Y', 'N']),
  categoryHTML: z.string().max(255).optional().nullable().transform(sanitizeHtml),
  categoryHTMLLong: z.string().optional().nullable().transform(sanitizeHtml),
  sortOrder: z.number().int().min(0).max(99999).optional().nullable(),
  categoryGraphic: z.string().max(255).optional().nullable().refine(validateFilePath, {
    message: 'Invalid file path. Must be a relative path to ProdImages folder.'
  }),
  categoryImage: z.string().max(255).optional().nullable().refine(validateFilePath, {
    message: 'Invalid file path. Must be a relative path to ProdImages folder.'
  }),
  categoryContentLocation: z.number().int().min(0).max(1).optional(),
  categoryType: z.enum(['', 'Brands', 'Size', 'Type', 'Filtration Level', 'Deal', 'MarketingPromos']).optional(),
  hideFromListings: z.number().int().min(0).max(1).optional(),
  pagname: z.string().max(100).optional().nullable().refine(
    (val) => !val || /^[a-z0-9-]+-cat\.asp$/i.test(val),
    { message: 'Page name must contain "-cat" and end with ".asp"' }
  ),
  metatitle: z.string().max(255).optional().nullable().transform((val) => val?.trim() || null),
  metadesc: z.string().max(500).optional().nullable().transform((val) => val?.trim() || null),
  metacat: z.string().max(500).optional().nullable().transform((val) => val?.trim() || null),
});

/**
 * GET /api/admin/categories
 * List categories with optional parent filter
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Rate limiting
    const userId = session.user.id;
    if (!checkRateLimit(`admin-categories-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query parameters with validation
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get('parentId');
    
    let parentId: number | undefined;
    if (parentIdParam) {
      const parsed = parseInt(parentIdParam);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= Number.MAX_SAFE_INTEGER) {
        parentId = parsed;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid parent ID' },
          { status: 400 }
        );
      }
    }
    
    const categories = listCategories(parentId);

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Error listing categories:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to list categories' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Create new category
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !hasAdminAccess(session.user)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Rate limiting
    const userId = session.user.id;
    if (!checkRateLimit(`admin-categories-create-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = categorySchema.parse(body);

    // Create category
    const category = createCategory(validated as CategoryFormData, userId);

    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to create category' 
      },
      { status: 500 }
    );
  }
}

