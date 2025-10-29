import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || './auth.db');

export interface SupportCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportArticle {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface SupportArticleWithCategory extends SupportArticle {
  category_name: string;
  category_slug: string;
}

export interface SupportView {
  id: number;
  article_id: number;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
}

export interface SupportFeedback {
  id: number;
  article_id: number;
  user_id: number | null;
  is_helpful: boolean;
  comment: string | null;
  created_at: string;
}

// Initialize support tables
export function initializeSupportTables() {
  // Support Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Support Articles
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      excerpt TEXT,
      is_published BOOLEAN DEFAULT 0,
      is_featured BOOLEAN DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      not_helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (category_id) REFERENCES support_categories(id) ON DELETE CASCADE
    )
  `);

  // Support Article Views (for analytics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_article_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      user_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES support_articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
    )
  `);

  // Support Article Feedback
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_article_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      user_id INTEGER,
      is_helpful BOOLEAN NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES support_articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_support_articles_category ON support_articles(category_id);
    CREATE INDEX IF NOT EXISTS idx_support_articles_slug ON support_articles(slug);
    CREATE INDEX IF NOT EXISTS idx_support_articles_published ON support_articles(is_published);
    CREATE INDEX IF NOT EXISTS idx_support_article_views_article ON support_article_views(article_id);
    CREATE INDEX IF NOT EXISTS idx_support_article_feedback_article ON support_article_feedback(article_id);
  `);
}

// Category Functions
export function getAllCategories(activeOnly = false): SupportCategory[] {
  const sql = activeOnly
    ? 'SELECT * FROM support_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
    : 'SELECT * FROM support_categories ORDER BY sort_order ASC, name ASC';
  return db.prepare(sql).all() as SupportCategory[];
}

export function getCategoryBySlug(slug: string): SupportCategory | null {
  const sql = 'SELECT * FROM support_categories WHERE slug = ? LIMIT 1';
  return (db.prepare(sql).get(slug) as SupportCategory) || null;
}

export function getCategoryById(id: number): SupportCategory | null {
  const sql = 'SELECT * FROM support_categories WHERE id = ? LIMIT 1';
  return (db.prepare(sql).get(id) as SupportCategory) || null;
}

export function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}): number {
  const sql = `
    INSERT INTO support_categories (name, slug, description, icon, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `;
  const result = db.prepare(sql).run(
    data.name,
    data.slug,
    data.description || null,
    data.icon || null,
    data.sort_order || 0
  );
  return Number(result.lastInsertRowid);
}

export function updateCategory(
  id: number,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
  }>
): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?');
    values.push(data.slug);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.icon !== undefined) {
    fields.push('icon = ?');
    values.push(data.icon);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(data.sort_order);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const sql = `UPDATE support_categories SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

export function deleteCategory(id: number): void {
  db.prepare('DELETE FROM support_categories WHERE id = ?').run(id);
}

// Article Functions
export function getAllArticles(options: {
  publishedOnly?: boolean;
  categoryId?: number;
  limit?: number;
  offset?: number;
} = {}): SupportArticleWithCategory[] {
  let sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options.publishedOnly) {
    sql += ' AND a.is_published = 1';
  }

  if (options.categoryId) {
    sql += ' AND a.category_id = ?';
    params.push(options.categoryId);
  }

  sql += ' ORDER BY a.sort_order ASC, a.created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  return db.prepare(sql).all(...params) as SupportArticleWithCategory[];
}

export function getArticleBySlug(slug: string): SupportArticleWithCategory | null {
  const sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE a.slug = ?
    LIMIT 1
  `;
  return (db.prepare(sql).get(slug) as SupportArticleWithCategory) || null;
}

export function getArticleById(id: number): SupportArticleWithCategory | null {
  const sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE a.id = ?
    LIMIT 1
  `;
  return (db.prepare(sql).get(id) as SupportArticleWithCategory) || null;
}

export function getFeaturedArticles(limit = 5): SupportArticleWithCategory[] {
  const sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE a.is_published = 1 AND a.is_featured = 1
    ORDER BY a.sort_order ASC, a.views DESC
    LIMIT ?
  `;
  return db.prepare(sql).all(limit) as SupportArticleWithCategory[];
}

export function getPopularArticles(limit = 10): SupportArticleWithCategory[] {
  const sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE a.is_published = 1
    ORDER BY a.views DESC, a.helpful_count DESC
    LIMIT ?
  `;
  return db.prepare(sql).all(limit) as SupportArticleWithCategory[];
}

export function searchArticles(query: string, publishedOnly = true): SupportArticleWithCategory[] {
  const searchTerm = `%${query}%`;
  let sql = `
    SELECT 
      a.*,
      c.name as category_name,
      c.slug as category_slug
    FROM support_articles a
    JOIN support_categories c ON a.category_id = c.id
    WHERE (a.title LIKE ? OR a.content LIKE ? OR a.excerpt LIKE ?)
  `;

  if (publishedOnly) {
    sql += ' AND a.is_published = 1';
  }

  sql += ' ORDER BY a.views DESC, a.sort_order ASC LIMIT 50';

  return db.prepare(sql).all(searchTerm, searchTerm, searchTerm) as SupportArticleWithCategory[];
}

export function createArticle(data: {
  category_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  is_published?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}): number {
  const sql = `
    INSERT INTO support_articles (
      category_id, title, slug, content, excerpt, 
      is_published, is_featured, sort_order, published_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const publishedAt = data.is_published ? new Date().toISOString() : null;
  
  const result = db.prepare(sql).run(
    data.category_id,
    data.title,
    data.slug,
    data.content,
    data.excerpt || null,
    data.is_published ? 1 : 0,
    data.is_featured ? 1 : 0,
    data.sort_order || 0,
    publishedAt
  );
  return Number(result.lastInsertRowid);
}

export function updateArticle(
  id: number,
  data: Partial<{
    category_id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    is_published: boolean;
    is_featured: boolean;
    sort_order: number;
  }>
): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(data.category_id);
  }
  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?');
    values.push(data.slug);
  }
  if (data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content);
  }
  if (data.excerpt !== undefined) {
    fields.push('excerpt = ?');
    values.push(data.excerpt);
  }
  if (data.is_published !== undefined) {
    fields.push('is_published = ?');
    values.push(data.is_published ? 1 : 0);
    
    // Set published_at if publishing for the first time
    if (data.is_published) {
      const article = getArticleById(id);
      if (article && !article.published_at) {
        fields.push('published_at = CURRENT_TIMESTAMP');
      }
    }
  }
  if (data.is_featured !== undefined) {
    fields.push('is_featured = ?');
    values.push(data.is_featured ? 1 : 0);
  }
  if (data.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(data.sort_order);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const sql = `UPDATE support_articles SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

export function deleteArticle(id: number): void {
  db.prepare('DELETE FROM support_articles WHERE id = ?').run(id);
}

export function incrementArticleViews(id: number): void {
  db.prepare('UPDATE support_articles SET views = views + 1 WHERE id = ?').run(id);
}

export function recordArticleView(data: {
  article_id: number;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
}): void {
  const sql = `
    INSERT INTO support_article_views (article_id, user_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?)
  `;
  db.prepare(sql).run(
    data.article_id,
    data.user_id || null,
    data.ip_address || null,
    data.user_agent || null
  );
  incrementArticleViews(data.article_id);
}

export function recordArticleFeedback(data: {
  article_id: number;
  user_id?: number;
  is_helpful: boolean;
  comment?: string;
}): number {
  const sql = `
    INSERT INTO support_article_feedback (article_id, user_id, is_helpful, comment)
    VALUES (?, ?, ?, ?)
  `;
  const result = db.prepare(sql).run(
    data.article_id,
    data.user_id || null,
    data.is_helpful ? 1 : 0,
    data.comment || null
  );

  // Update helpful counts
  const field = data.is_helpful ? 'helpful_count' : 'not_helpful_count';
  db.prepare(`UPDATE support_articles SET ${field} = ${field} + 1 WHERE id = ?`).run(data.article_id);

  return Number(result.lastInsertRowid);
}

// Analytics Functions
export function getSupportAnalytics() {
  const totalArticles = db.prepare('SELECT COUNT(*) as count FROM support_articles WHERE is_published = 1').get() as { count: number };
  const totalCategories = db.prepare('SELECT COUNT(*) as count FROM support_categories WHERE is_active = 1').get() as { count: number };
  const totalViews = db.prepare('SELECT SUM(views) as total FROM support_articles').get() as { total: number | null };
  const viewsLast30Days = db.prepare(`
    SELECT COUNT(*) as count 
    FROM support_article_views 
    WHERE viewed_at >= datetime('now', '-30 days')
  `).get() as { count: number };
  
  const helpfulRating = db.prepare(`
    SELECT 
      SUM(helpful_count) as helpful,
      SUM(not_helpful_count) as not_helpful
    FROM support_articles
  `).get() as { helpful: number; not_helpful: number };

  const totalFeedback = (helpfulRating.helpful || 0) + (helpfulRating.not_helpful || 0);
  const helpfulPercentage = totalFeedback > 0 
    ? Math.round((helpfulRating.helpful / totalFeedback) * 100) 
    : 0;

  return {
    total_articles: totalArticles.count,
    total_categories: totalCategories.count,
    total_views: totalViews.total || 0,
    views_last_30_days: viewsLast30Days.count,
    helpful_percentage: helpfulPercentage,
    total_feedback: totalFeedback,
  };
}

export function getCategoryAnalytics() {
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.slug,
      COUNT(a.id) as article_count,
      SUM(a.views) as total_views,
      SUM(a.helpful_count) as helpful_count
    FROM support_categories c
    LEFT JOIN support_articles a ON c.id = a.category_id AND a.is_published = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY total_views DESC
  `;
  return db.prepare(sql).all();
}

