-- Marketplace Channels & Orders Schema

CREATE TABLE IF NOT EXISTS marketplace_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  sync_enabled INTEGER NOT NULL DEFAULT 1 CHECK(sync_enabled IN (0, 1)),
  sync_frequency_minutes INTEGER,
  last_synced_at INTEGER,
  last_successful_sync_at INTEGER,
  last_sync_status TEXT,
  last_sync_message TEXT,
  credentials TEXT,
  settings TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_number TEXT,
  status TEXT NOT NULL,
  financial_status TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL,
  purchase_date INTEGER NOT NULL,
  imported_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  acknowledged_at INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal REAL NOT NULL DEFAULT 0,
  shipping REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  marketplace_fees REAL NOT NULL DEFAULT 0,
  promo_codes TEXT,
  shipping_address TEXT,
  data TEXT,
  FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE CASCADE,
  UNIQUE(channel_id, external_id)
);

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  marketplace_fee REAL NOT NULL DEFAULT 0,
  data TEXT,
  FOREIGN KEY(order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS marketplace_order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time INTEGER NOT NULL,
  message TEXT,
  data TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES marketplace_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS marketplace_sync_runs (
  id TEXT PRIMARY KEY,
  channel_id TEXT,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  imported_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  metadata TEXT,
  FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS marketplace_tax_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  state_code TEXT NOT NULL,
  added_at INTEGER NOT NULL,
  UNIQUE(channel_id, state_code),
  FOREIGN KEY(channel_id) REFERENCES marketplace_channels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_channel_purchase
  ON marketplace_orders(channel_id, purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_external
  ON marketplace_orders(channel_id, external_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order
  ON marketplace_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_runs_started
  ON marketplace_sync_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_tax_states_channel
  ON marketplace_tax_states(channel_id);


