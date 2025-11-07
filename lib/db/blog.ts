/**
 * Blog Database Operations
 * Helper functions for CRUD operations on blog posts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import type { BlogPost, BlogCategory } from '../types/blog';

const dbPath = join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // Ensure tables exist
  initializeTables(db);
  
  return db;
}

/**
 * Initialize blog tables if they don't exist
 */
function initializeTables(db: Database.Database) {
  try {
    // Check if blog_posts table exists
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='blog_posts'
    `).get();
    
    if (!tableCheck) {
      // Create blog_posts table
      db.exec(`
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          author_name TEXT NOT NULL,
          author_slug TEXT NOT NULL,
          published_at INTEGER,
          updated_at INTEGER NOT NULL,
          category TEXT NOT NULL DEFAULT 'general',
          tags TEXT,
          featured_image TEXT,
          comments_count INTEGER NOT NULL DEFAULT 0,
          is_published INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          created_by INTEGER,
          updated_by INTEGER
        );
        
        CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
      `);
    }
  } catch (error) {
    console.error('Error initializing blog tables:', error);
    // Don't throw - let the calling function handle it
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_slug: string;
  published_at: number | null;
  updated_at: number;
  category: BlogCategory;
  tags: string | null;
  featured_image: string | null;
  comments_count: number;
  is_published: number;
  created_at: number;
  created_by: number | null;
  updated_by: number | null;
}

export interface BlogPostFormData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorSlug: string;
  publishedAt?: string;
  category: BlogCategory;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert database row to BlogPost type
 */
function rowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id.toString(),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: {
      name: row.author_name,
      slug: row.author_slug,
    },
    publishedAt: row.published_at ? new Date(row.published_at * 1000).toISOString() : new Date(row.created_at * 1000).toISOString(),
    updatedAt: new Date(row.updated_at * 1000).toISOString(),
    category: row.category,
    tags: row.tags ? JSON.parse(row.tags) : [],
    featuredImage: row.featured_image || undefined,
    commentsCount: row.comments_count,
  };
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export function ensureUniqueSlug(slug: string, excludeId?: number): string {
  const db = getDb();
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const existing = db.prepare(`
      SELECT id FROM blog_posts 
      WHERE slug = ? AND (? IS NULL OR id != ?)
    `).get(uniqueSlug, excludeId || null, excludeId || null) as { id: number } | undefined;
    
    if (!existing) {
      break;
    }
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  db.close();
  return uniqueSlug;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all blog posts (admin view - includes drafts)
 */
export function getAllBlogPosts(includeDrafts: boolean = true): BlogPost[] {
  const db = getDb();
  
  try {
    const query = includeDrafts
      ? `SELECT * FROM blog_posts ORDER BY created_at DESC`
      : `SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC, created_at DESC`;
    
    const rows = db.prepare(query).all() as BlogPostRow[];
    const posts = rows.map(rowToBlogPost);
    
    return posts;
  } finally {
    db.close();
  }
}

/**
 * Get published blog posts only (public view)
 */
export function getPublishedBlogPosts(): BlogPost[] {
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT * FROM blog_posts 
      WHERE is_published = 1 
      ORDER BY published_at DESC, created_at DESC
    `).all() as BlogPostRow[];
    
    return rows.map(rowToBlogPost);
  } finally {
    db.close();
  }
}

/**
 * Get blog post by ID
 */
export function getBlogPostById(id: number): BlogPost | null {
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT * FROM blog_posts WHERE id = ?
    `).get(id) as BlogPostRow | undefined;
    
    if (!row) {
      return null;
    }
    
    return rowToBlogPost(row);
  } finally {
    db.close();
  }
}

/**
 * Get blog post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | null {
  const db = getDb();
  
  try {
    const row = db.prepare(`
      SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1
    `).get(slug) as BlogPostRow | undefined;
    
    if (!row) {
      return null;
    }
    
    return rowToBlogPost(row);
  } finally {
    db.close();
  }
}

/**
 * Get blog posts by category
 */
export function getBlogPostsByCategory(category: BlogCategory, includeDrafts: boolean = false): BlogPost[] {
  const db = getDb();
  
  try {
    const query = includeDrafts
      ? `SELECT * FROM blog_posts WHERE category = ? ORDER BY created_at DESC`
      : `SELECT * FROM blog_posts WHERE category = ? AND is_published = 1 ORDER BY published_at DESC, created_at DESC`;
    
    const rows = db.prepare(query).all(category) as BlogPostRow[];
    return rows.map(rowToBlogPost);
  } finally {
    db.close();
  }
}

/**
 * Search blog posts
 */
export function searchBlogPosts(query: string, includeDrafts: boolean = false): BlogPost[] {
  const db = getDb();
  
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    const sql = includeDrafts
      ? `SELECT * FROM blog_posts 
         WHERE (LOWER(title) LIKE ? OR LOWER(excerpt) LIKE ? OR LOWER(content) LIKE ?)
         ORDER BY created_at DESC`
      : `SELECT * FROM blog_posts 
         WHERE is_published = 1 
         AND (LOWER(title) LIKE ? OR LOWER(excerpt) LIKE ? OR LOWER(content) LIKE ?)
         ORDER BY published_at DESC, created_at DESC`;
    
    const rows = db.prepare(sql).all(searchTerm, searchTerm, searchTerm) as BlogPostRow[];
    return rows.map(rowToBlogPost);
  } finally {
    db.close();
  }
}

/**
 * Create a new blog post
 */
export function createBlogPost(data: BlogPostFormData, createdBy?: number): BlogPost {
  const db = getDb();
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const publishedAt = data.isPublished && data.publishedAt
      ? Math.floor(new Date(data.publishedAt).getTime() / 1000)
      : null;
    
    // Ensure unique slug
    const uniqueSlug = ensureUniqueSlug(data.slug);
    
    const result = db.prepare(`
      INSERT INTO blog_posts (
        slug, title, excerpt, content,
        author_name, author_slug,
        published_at, updated_at,
        category, tags, featured_image,
        comments_count, is_published,
        created_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uniqueSlug,
      data.title,
      data.excerpt,
      data.content,
      data.authorName,
      data.authorSlug,
      publishedAt,
      now,
      data.category,
      data.tags ? JSON.stringify(data.tags) : null,
      data.featuredImage || null,
      0,
      data.isPublished ? 1 : 0,
      now,
      createdBy || null,
      createdBy || null
    );
    
    const newPost = getBlogPostById(result.lastInsertRowid as number);
    if (!newPost) {
      throw new Error('Failed to retrieve created blog post');
    }
    
    return newPost;
  } finally {
    db.close();
  }
}

/**
 * Update an existing blog post
 */
export function updateBlogPost(id: number, data: Partial<BlogPostFormData>, updatedBy?: number): BlogPost | null {
  const db = getDb();
  
  try {
    const existing = getBlogPostById(id);
    if (!existing) {
      return null;
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // If publishing for the first time, set published_at
    let publishedAt = data.publishedAt
      ? Math.floor(new Date(data.publishedAt).getTime() / 1000)
      : null;
    
    // If was draft and now publishing, set published_at to now if not provided
    if (data.isPublished && !publishedAt) {
      const row = db.prepare(`SELECT published_at, is_published FROM blog_posts WHERE id = ?`).get(id) as { published_at: number | null; is_published: number };
      if (!row.published_at && row.is_published === 0) {
        publishedAt = now;
      } else {
        publishedAt = row.published_at;
      }
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(data.excerpt);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
    }
    if (data.authorName !== undefined) {
      updates.push('author_name = ?');
      values.push(data.authorName);
    }
    if (data.authorSlug !== undefined) {
      updates.push('author_slug = ?');
      values.push(data.authorSlug);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(data.tags.length > 0 ? JSON.stringify(data.tags) : null);
    }
    if (data.featuredImage !== undefined) {
      updates.push('featured_image = ?');
      values.push(data.featuredImage || null);
    }
    if (data.isPublished !== undefined) {
      updates.push('is_published = ?');
      values.push(data.isPublished ? 1 : 0);
    }
    if (publishedAt !== undefined) {
      updates.push('published_at = ?');
      values.push(publishedAt);
    }
    
    updates.push('updated_at = ?');
    values.push(now);
    
    if (updatedBy !== undefined) {
      updates.push('updated_by = ?');
      values.push(updatedBy);
    }
    
    // Handle slug update separately to ensure uniqueness
    if (data.slug !== undefined && data.slug !== existing.slug) {
      const uniqueSlug = ensureUniqueSlug(data.slug, id);
      updates.push('slug = ?');
      values.push(uniqueSlug);
    }
    
    values.push(id);
    
    db.prepare(`
      UPDATE blog_posts 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return getBlogPostById(id);
  } finally {
    db.close();
  }
}

/**
 * Delete a blog post
 */
export function deleteBlogPost(id: number): boolean {
  const db = getDb();
  
  try {
    const result = db.prepare(`
      DELETE FROM blog_posts WHERE id = ?
    `).run(id);
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Get featured posts (for sidebar/homepage)
 */
export function getFeaturedPosts(limit: number = 3): BlogPost[] {
  const db = getDb();
  
  try {
    const rows = db.prepare(`
      SELECT * FROM blog_posts 
      WHERE is_published = 1 
      ORDER BY published_at DESC, created_at DESC
      LIMIT ?
    `).all(limit) as BlogPostRow[];
    
    return rows.map(rowToBlogPost);
  } finally {
    db.close();
  }
}

/**
 * Get post count by status
 */
export function getBlogPostCounts(): { total: number; published: number; drafts: number } {
  const db = getDb();
  
  try {
    const total = db.prepare(`SELECT COUNT(*) as count FROM blog_posts`).get() as { count: number };
    const published = db.prepare(`SELECT COUNT(*) as count FROM blog_posts WHERE is_published = 1`).get() as { count: number };
    const drafts = db.prepare(`SELECT COUNT(*) as count FROM blog_posts WHERE is_published = 0`).get() as { count: number };
    
    return {
      total: total.count,
      published: published.count,
      drafts: drafts.count,
    };
  } finally {
    db.close();
  }
}

