-- PostgreSQL schema for RShop
-- Run with: psql $DATABASE_URL -f create_tables.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  email TEXT,
  display_name TEXT,
  profile_picture TEXT,
  status TEXT DEFAULT 'ACTIVE',
  lock_until TIMESTAMPTZ,
  is_google BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  download_url TEXT,
  img_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (username, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  status TEXT DEFAULT 'AWAITING_SLIP',
  total_price NUMERIC(12,2) DEFAULT 0,
  products_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_slips (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  filename TEXT,
  original_name TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  approved BOOLEAN DEFAULT false,
  admin_comment TEXT
);

CREATE TABLE IF NOT EXISTS bought_items (
  id SERIAL PRIMARY KEY,
  username TEXT,
  item_title TEXT
);
