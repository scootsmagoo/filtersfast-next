/**
 * User Preferences Database Functions
 * Handles storing and retrieving user preferences including email notifications
 */

import Database from 'better-sqlite3';

export interface UserPreferences {
  userId: string;
  emailNotifications: boolean;
  productReminders: boolean;
  newsletter: boolean;
  smsNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  updatedAt: number;
}

const getDb = () => {
  return new Database('filtersfast.db');
};

/**
 * Initialize user preferences table
 */
export function initUserPreferencesTable() {
  const db = getDb();
  
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        email_notifications INTEGER DEFAULT 1,
        product_reminders INTEGER DEFAULT 1,
        newsletter INTEGER DEFAULT 1,
        sms_notifications INTEGER DEFAULT 0,
        theme TEXT DEFAULT 'system',
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ User preferences table initialized');
  } catch (error) {
    console.error('Error initializing user preferences table:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Get user preferences
 */
export function getUserPreferences(userId: string): UserPreferences {
  const db = getDb();
  
  try {
    const stmt = db.prepare(`
      SELECT 
        user_id as userId,
        email_notifications as emailNotifications,
        product_reminders as productReminders,
        newsletter,
        sms_notifications as smsNotifications,
        theme,
        updated_at as updatedAt
      FROM user_preferences
      WHERE user_id = ?
    `);
    
    let preferences = stmt.get(userId) as UserPreferences | undefined;
    
    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPrefs: UserPreferences = {
        userId,
        emailNotifications: true,
        productReminders: true,
        newsletter: true,
        smsNotifications: false,
        theme: 'system',
        updatedAt: Date.now(),
      };
      
      createUserPreferences(userId, defaultPrefs);
      preferences = defaultPrefs;
    }
    
    // Convert SQLite integers to booleans
    return {
      ...preferences,
      emailNotifications: Boolean(preferences.emailNotifications),
      productReminders: Boolean(preferences.productReminders),
      newsletter: Boolean(preferences.newsletter),
      smsNotifications: Boolean(preferences.smsNotifications),
    };
  } finally {
    db.close();
  }
}

/**
 * Create user preferences
 */
export function createUserPreferences(userId: string, preferences: Partial<UserPreferences>): boolean {
  const db = getDb();
  
  try {
    // Validate theme value before inserting
    const theme = preferences.theme || 'system';
    if (!['light', 'dark', 'system'].includes(theme)) {
      throw new Error('Invalid theme value');
    }
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO user_preferences (
        user_id,
        email_notifications,
        product_reminders,
        newsletter,
        sms_notifications,
        theme,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      preferences.emailNotifications ? 1 : 0,
      preferences.productReminders ? 1 : 0,
      preferences.newsletter ? 1 : 0,
      preferences.smsNotifications ? 1 : 0,
      theme,
      Date.now()
    );
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Update user preferences
 */
export function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): boolean {
  const db = getDb();
  
  try {
    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (preferences.emailNotifications !== undefined) {
      updates.push('email_notifications = ?');
      values.push(preferences.emailNotifications ? 1 : 0);
    }
    
    if (preferences.productReminders !== undefined) {
      updates.push('product_reminders = ?');
      values.push(preferences.productReminders ? 1 : 0);
    }
    
    if (preferences.newsletter !== undefined) {
      updates.push('newsletter = ?');
      values.push(preferences.newsletter ? 1 : 0);
    }
    
    if (preferences.smsNotifications !== undefined) {
      updates.push('sms_notifications = ?');
      values.push(preferences.smsNotifications ? 1 : 0);
    }
    
    if (preferences.theme !== undefined) {
      // Validate theme value before updating
      if (!['light', 'dark', 'system'].includes(preferences.theme)) {
        throw new Error('Invalid theme value');
      }
      updates.push('theme = ?');
      values.push(preferences.theme);
    }
    
    updates.push('updated_at = ?');
    values.push(Date.now());
    
    values.push(userId);
    
    const stmt = db.prepare(`
      UPDATE user_preferences
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `);
    
    const result = stmt.run(...values);
    
    // If no rows were updated, create the preferences
    if (result.changes === 0) {
      return createUserPreferences(userId, preferences);
    }
    
    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Delete user preferences (cleanup on user deletion)
 */
export function deleteUserPreferences(userId: string): boolean {
  const db = getDb();
  
  try {
    const stmt = db.prepare('DELETE FROM user_preferences WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  } finally {
    db.close();
  }
}

