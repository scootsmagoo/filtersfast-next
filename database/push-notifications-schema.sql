-- Push Notification Subscriptions Schema
-- Stores user push notification subscriptions for PWA

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Push Notification Preferences
-- Stores user preferences for what types of notifications they want to receive

CREATE TABLE IF NOT EXISTS push_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  order_updates INTEGER NOT NULL DEFAULT 1,
  deals_promotions INTEGER NOT NULL DEFAULT 1,
  abandoned_carts INTEGER NOT NULL DEFAULT 1,
  back_in_stock INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_preferences_user_id ON push_notification_preferences(user_id);

-- Push Notification Log
-- Logs sent push notifications for debugging and analytics

CREATE TABLE IF NOT EXISTS push_notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  subscription_id INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT, -- JSON string
  sent_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_push_log_user_id ON push_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notification_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_push_log_status ON push_notification_log(status);

