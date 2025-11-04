/**
 * Database Operations for Multi-Language Support
 */

import Database from 'better-sqlite3';
import path from 'path';
import type {
  Language,
  LanguageCode,
  Translation,
  TranslationInput,
  ProductTranslation,
  ProductTranslationInput,
  CategoryTranslation,
  CategoryTranslationInput,
  ContentTranslation,
  ContentTranslationInput,
  TranslationCategory
} from '../types/i18n';

const dbPath = path.join(process.cwd(), 'filtersfast.db');

function getDb() {
  const db = new Database(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

// ============================================
// LANGUAGES
// ============================================

/**
 * Get all active languages
 */
export function getActiveLanguages(): Language[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM languages 
      WHERE is_active = 1 
      ORDER BY is_default DESC, name ASC
    `);
    return stmt.all() as Language[];
  } finally {
    db.close();
  }
}

/**
 * Get language by code
 */
export function getLanguage(code: LanguageCode): Language | null {
  const db = getDb();
  try {
    const stmt = db.prepare('SELECT * FROM languages WHERE code = ?');
    return (stmt.get(code) as Language) || null;
  } finally {
    db.close();
  }
}

/**
 * Get default language
 */
export function getDefaultLanguage(): Language {
  const db = getDb();
  try {
    const stmt = db.prepare('SELECT * FROM languages WHERE is_default = 1 LIMIT 1');
    const result = stmt.get() as Language;
    return result || { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸', direction: 'ltr', is_active: true, is_default: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  } finally {
    db.close();
  }
}

// ============================================
// TRANSLATIONS
// ============================================

/**
 * Get translation by key and language
 */
export function getTranslation(key: string, languageCode: LanguageCode): Translation | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM translations 
      WHERE key = ? AND language_code = ?
    `);
    return (stmt.get(key, languageCode) as Translation) || null;
  } finally {
    db.close();
  }
}

/**
 * Get all translations for a language
 */
export function getTranslationsByLanguage(languageCode: LanguageCode): Translation[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM translations 
      WHERE language_code = ?
      ORDER BY category, key
    `);
    return stmt.all(languageCode) as Translation[];
  } finally {
    db.close();
  }
}

/**
 * Get translations as key-value map
 */
export function getTranslationsMap(languageCode: LanguageCode): Record<string, string> {
  const translations = getTranslationsByLanguage(languageCode);
  const map: Record<string, string> = {};
  for (const trans of translations) {
    map[trans.key] = trans.value;
  }
  return map;
}

/**
 * Get translations by category
 */
export function getTranslationsByCategory(
  languageCode: LanguageCode,
  category: TranslationCategory
): Translation[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM translations 
      WHERE language_code = ? AND category = ?
      ORDER BY key
    `);
    return stmt.all(languageCode, category) as Translation[];
  } finally {
    db.close();
  }
}

/**
 * Get multiple translations at once
 */
export function getTranslationsByKeys(
  keys: string[],
  languageCode: LanguageCode
): Record<string, string> {
  if (keys.length === 0) return {};
  
  const db = getDb();
  try {
    const placeholders = keys.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT key, value FROM translations 
      WHERE key IN (${placeholders}) AND language_code = ?
    `);
    const results = stmt.all(...keys, languageCode) as { key: string; value: string }[];
    
    const map: Record<string, string> = {};
    for (const result of results) {
      map[result.key] = result.value;
    }
    return map;
  } finally {
    db.close();
  }
}

/**
 * Create or update translation
 */
export function upsertTranslation(input: TranslationInput): Translation {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO translations (key, language_code, value, category, context, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(key, language_code) DO UPDATE SET
        value = excluded.value,
        category = excluded.category,
        context = excluded.context,
        updated_at = datetime('now')
      RETURNING *
    `);
    
    return stmt.get(
      input.key,
      input.language_code,
      input.value,
      input.category || 'general',
      input.context || null
    ) as Translation;
  } finally {
    db.close();
  }
}

/**
 * Delete translation
 */
export function deleteTranslation(key: string, languageCode: LanguageCode): boolean {
  const db = getDb();
  try {
    const stmt = db.prepare('DELETE FROM translations WHERE key = ? AND language_code = ?');
    const result = stmt.run(key, languageCode);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

// ============================================
// PRODUCT TRANSLATIONS
// ============================================

/**
 * Get product translation
 */
export function getProductTranslation(
  productId: string,
  languageCode: LanguageCode
): ProductTranslation | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM product_translations 
      WHERE product_id = ? AND language_code = ?
    `);
    return (stmt.get(productId, languageCode) as ProductTranslation) || null;
  } finally {
    db.close();
  }
}

/**
 * Get all translations for a product
 */
export function getProductTranslations(productId: string): ProductTranslation[] {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM product_translations 
      WHERE product_id = ?
      ORDER BY language_code
    `);
    return stmt.all(productId) as ProductTranslation[];
  } finally {
    db.close();
  }
}

/**
 * Create or update product translation
 */
export function upsertProductTranslation(input: ProductTranslationInput): ProductTranslation {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO product_translations (product_id, language_code, name, description, features, specifications, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(product_id, language_code) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        features = excluded.features,
        specifications = excluded.specifications,
        updated_at = datetime('now')
      RETURNING *
    `);
    
    return stmt.get(
      input.product_id,
      input.language_code,
      input.name,
      input.description || null,
      input.features || null,
      input.specifications || null
    ) as ProductTranslation;
  } finally {
    db.close();
  }
}

// ============================================
// CATEGORY TRANSLATIONS
// ============================================

/**
 * Get category translation
 */
export function getCategoryTranslation(
  categoryId: string,
  languageCode: LanguageCode
): CategoryTranslation | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM category_translations 
      WHERE category_id = ? AND language_code = ?
    `);
    return (stmt.get(categoryId, languageCode) as CategoryTranslation) || null;
  } finally {
    db.close();
  }
}

/**
 * Create or update category translation
 */
export function upsertCategoryTranslation(input: CategoryTranslationInput): CategoryTranslation {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO category_translations (category_id, language_code, name, description, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(category_id, language_code) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        updated_at = datetime('now')
      RETURNING *
    `);
    
    return stmt.get(
      input.category_id,
      input.language_code,
      input.name,
      input.description || null
    ) as CategoryTranslation;
  } finally {
    db.close();
  }
}

// ============================================
// CONTENT TRANSLATIONS
// ============================================

/**
 * Get content translation
 */
export function getContentTranslation(
  contentId: string,
  contentType: ContentTranslation['content_type'],
  languageCode: LanguageCode
): ContentTranslation | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      SELECT * FROM content_translations 
      WHERE content_id = ? AND content_type = ? AND language_code = ?
    `);
    return (stmt.get(contentId, contentType, languageCode) as ContentTranslation) || null;
  } finally {
    db.close();
  }
}

/**
 * Create or update content translation
 */
export function upsertContentTranslation(input: ContentTranslationInput): ContentTranslation {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO content_translations 
        (content_id, content_type, language_code, title, body, meta_description, meta_keywords, slug, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(content_id, content_type, language_code) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        meta_description = excluded.meta_description,
        meta_keywords = excluded.meta_keywords,
        slug = excluded.slug,
        updated_at = datetime('now')
      RETURNING *
    `);
    
    return stmt.get(
      input.content_id,
      input.content_type,
      input.language_code,
      input.title,
      input.body || null,
      input.meta_description || null,
      input.meta_keywords || null,
      input.slug || null
    ) as ContentTranslation;
  } finally {
    db.close();
  }
}


