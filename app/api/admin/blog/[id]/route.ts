/**
 * Admin Blog Post API
 * GET - Get blog post by ID
 * PUT - Update blog post
 * DELETE - Delete blog post
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getBlogPostById, 
  updateBlogPost, 
  deleteBlogPost,
  generateSlug,
  type BlogPostFormData
} from '@/lib/db/blog';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';
import { z } from 'zod';

// Blog post update validation schema
const blogPostUpdateSchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().min(1).max(1000).optional(),
  content: z.string().min(1).optional(),
  authorName: z.string().min(1).max(100).optional(),
  authorSlug: z.string().min(1).max(100).optional(),
  publishedAt: z.string().datetime().optional(),
  category: z.enum(['water', 'air', 'buyers-guides', 'business', 'just-for-you', 'general']).optional(),
  tags: z.array(z.string().max(50)).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

/**
 * GET /api/admin/blog/[id]
 * Get blog post by ID
 */
export const GET = requirePermission('Blog', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid post ID' },
          { status: 400 }
        );
      }
      
      const post = getBlogPostById(postId);
      
      if (!post) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        post
      });
    } catch (error) {
      console.error('Error getting blog post:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get blog post' },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/admin/blog/[id]
 * Update blog post
 */
export const PUT = requirePermission('Blog', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, { params, user, admin }: { params: Promise<{ id: string }>; user: any; admin: any }) => {
    try {
      const { id } = await params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid post ID' },
          { status: 400 }
        );
      }
      
      const body = await request.json();
      
      // Validate input
      const validationResult = blogPostUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      const data = validationResult.data;
      
      // Prepare form data (only include fields that are provided)
      const formData: Partial<BlogPostFormData> = {};
      
      if (data.slug !== undefined) formData.slug = generateSlug(data.slug);
      if (data.title !== undefined) formData.title = data.title;
      if (data.excerpt !== undefined) formData.excerpt = data.excerpt;
      if (data.content !== undefined) formData.content = data.content;
      if (data.authorName !== undefined) formData.authorName = data.authorName;
      if (data.authorSlug !== undefined) formData.authorSlug = data.authorSlug;
      if (data.publishedAt !== undefined) formData.publishedAt = data.publishedAt;
      if (data.category !== undefined) formData.category = data.category;
      if (data.tags !== undefined) {
        formData.tags = data.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      if (data.featuredImage !== undefined) formData.featuredImage = data.featuredImage || undefined;
      if (data.isPublished !== undefined) formData.isPublished = data.isPublished;
      
      // Update blog post
      const post = updateBlogPost(postId, formData, admin.id);
      
      if (!post) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        post
      });
    } catch (error) {
      console.error('Error updating blog post:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update blog post' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/admin/blog/[id]
 * Delete blog post
 */
export const DELETE = requirePermission('Blog', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const postId = parseInt(id);
      
      if (isNaN(postId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid post ID' },
          { status: 400 }
        );
      }
      
      const success = deleteBlogPost(postId);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete blog post' },
        { status: 500 }
      );
    }
  }
);

