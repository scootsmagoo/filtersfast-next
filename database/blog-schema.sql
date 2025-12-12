-- ========================================
-- BLOG SCHEMA
-- ========================================
-- Purpose: Blog post content management
-- Date: January 2025
-- ========================================

-- ========================================
-- 1. BLOG_POSTS TABLE
-- ========================================
-- Main blog posts table
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
    tags TEXT, -- JSON array of tags
    featured_image TEXT,
    comments_count INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0, -- 0 = draft, 1 = published
    created_at INTEGER NOT NULL,
    created_by INTEGER, -- Admin user ID who created the post
    updated_by INTEGER -- Admin user ID who last updated the post
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);

