/**
 * Admin Blog API
 * GET - List blog posts with filters
 * POST - Create new blog post
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllBlogPosts, 
  createBlogPost, 
  getBlogPostCounts,
  searchBlogPosts,
  generateSlug,
  type BlogPostFormData
} from '@/lib/db/blog';
import { requirePermission, PERMISSION_LEVEL } from '@/lib/admin-permissions';
import { z } from 'zod';

// Blog post validation schema
const blogPostSchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(500),
  excerpt: z.string().min(1).max(1000),
  content: z.string().min(1),
  authorName: z.string().min(1).max(100),
  authorSlug: z.string().min(1).max(100),
  publishedAt: z.string().datetime().optional(),
  category: z.enum(['water', 'air', 'buyers-guides', 'business', 'just-for-you', 'general']),
  tags: z.array(z.string().max(50)).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

/**
 * GET /api/admin/blog
 * List blog posts with filters
 */
export const GET = requirePermission('Blog', PERMISSION_LEVEL.READ_ONLY)(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      
      const includeDrafts = searchParams.get('includeDrafts') !== 'false';
      const category = searchParams.get('category') || undefined;
      const search = searchParams.get('search') || undefined;
      
      let posts;
      
      if (search) {
        posts = searchBlogPosts(search, includeDrafts);
      } else if (category) {
        const { getBlogPostsByCategory } = await import('@/lib/db/blog');
        posts = getBlogPostsByCategory(category as any, includeDrafts);
      } else {
        posts = getAllBlogPosts(includeDrafts);
      }
      
      const counts = getBlogPostCounts();
      
      return NextResponse.json({
        success: true,
        posts,
        counts
      });
    } catch (error) {
      console.error('Error listing blog posts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to list blog posts' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/admin/blog
 * Create new blog post
 */
export const POST = requirePermission('Blog', PERMISSION_LEVEL.FULL_CONTROL)(
  async (request: NextRequest, { user, admin }: { user: any; admin: any }) => {
    try {
      const body = await request.json();
      
      // Validate input
      const validationResult = blogPostSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      const data = validationResult.data;
      const tags = (data.tags || []).map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      // Generate slug if not provided
      const slug = data.slug || generateSlug(data.title);
      
      // Prepare form data
      const formData: BlogPostFormData = {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        authorName: data.authorName,
        authorSlug: data.authorSlug,
        publishedAt: data.publishedAt,
        category: data.category,
        tags,
        featuredImage: data.featuredImage || undefined,
        isPublished: data.isPublished || false,
      };
      
      // Create blog post
      const post = createBlogPost(formData, admin.id);
      
      return NextResponse.json({
        success: true,
        post
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create blog post' },
        { status: 500 }
      );
    }
  }
);

