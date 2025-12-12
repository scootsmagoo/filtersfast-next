/**
 * Admin Category API (Single)
 * GET - Get category by ID
 * PUT - Update category
 * DELETE - Delete category
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth-admin';
import { getCategoryById, updateCategory, deleteCategory } from '@/lib/db/categories';
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
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Validate file path to prevent path traversal
function validateFilePath(path: string | null | undefined): boolean {
  if (!path) return true;
  const safePattern = /^\/ProdImages\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|gif|webp)$/i;
  return safePattern.test(path);
}

// Validation schema (partial for updates)
const categoryUpdateSchema = z.object({
  categoryDesc: z.string().min(1).max(100).trim().optional(),
  idParentCategory: z.number().int().min(0).optional(),
  categoryFeatured: z.enum(['Y', 'N']).optional(),
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
  metatitle: z.string().max(255).optional().nullable().transform((val) => val?.trim() || null),
  metadesc: z.string().max(500).optional().nullable().transform((val) => val?.trim() || null),
  metacat: z.string().max(500).optional().nullable().transform((val) => val?.trim() || null),
});

/**
 * GET /api/admin/categories/[id]
 * Get category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!checkRateLimit(`admin-category-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = getCategoryById(id);
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error getting category:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to get category' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/categories/[id]
 * Update category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!checkRateLimit(`admin-category-update-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = categoryUpdateSchema.parse(body);

    // Update category
    const category = updateCategory(id, validated as CategoryFormData, userId);

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error updating category:', error);
    
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
        error: isDev && error instanceof Error ? error.message : 'Failed to update category' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!checkRateLimit(`admin-category-delete-${userId}`)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Delete category
    deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        success: false, 
        error: isDev && error instanceof Error ? error.message : 'Failed to delete category' 
      },
      { status: 500 }
    );
  }
}

