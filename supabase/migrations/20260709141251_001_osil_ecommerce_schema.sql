/*
# OSIL E-Commerce Schema

This migration creates the complete database schema for the OSIL Ltd Kenya e-commerce platform.

## Tables Created

1. **categories** - Product categories (Laptops, Desktops, Servers, etc.)
   - `id` (uuid, primary key)
   - `name` (text, unique, not null)
   - `slug` (text, unique, not null) - URL-friendly identifier
   - `description` (text)
   - `image` (text) - URL to category image
   - `icon` (text) - Lucide icon name
   - `product_count` (integer, default 0)
   - `created_at` (timestamp)

2. **brands** - Technology brands (Dell, HP, Lenovo, etc.)
   - `id` (uuid, primary key)
   - `name` (text, unique, not null)
   - `slug` (text, unique, not null)
   - `description` (text)
   - `logo` (text) - URL to brand logo
   - `category` (text) - Primary category type
   - `category_slug` (text)
   - `product_count` (integer, default 0)
   - `website` (text) - Official brand website
   - `created_at` (timestamp)

3. **products** - Product catalog
   - `id` (uuid, primary key)
   - `name` (text, not null)
   - `slug` (text, unique, not null)
   - `sku` (text, unique, not null)
   - `brand` (text, not null)
   - `brand_slug` (text, not null)
   - `category` (text, not null)
   - `category_slug` (text, not null)
   - `description` (text)
   - `short_description` (text)
   - `images` (jsonb, array of image URLs)
   - `specifications` (jsonb, key-value pairs)
   - `price` (decimal, nullable - quote-based pricing)
   - `availability` (text) - 'in-stock', 'low-stock', 'out-of-stock', 'pre-order'
   - `is_featured` (boolean, default false)
   - `is_new` (boolean, default false)
   - `is_best_seller` (boolean, default false)
   - `related_products` (jsonb, array of product IDs)
   - `tags` (jsonb, array of tags)
   - `datasheet_url` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **faqs** - Frequently asked questions
   - `id` (uuid, primary key)
   - `question` (text, not null)
   - `answer` (text, not null)
   - `category` (text) - 'products', 'services', 'quotations', 'delivery', 'warranty'
   - `sort_order` (integer, default 0)
   - `is_active` (boolean, default true)
   - `created_at` (timestamp)

5. **quote_requests** - Customer quote submissions
   - `id` (uuid, primary key)
   - `reference` (text, unique) - Human-readable reference (e.g., QT-ABC123)
   - `customer_name` (text, not null)
   - `customer_email` (text, not null)
   - `customer_phone` (text, not null)
   - `company` (text)
   - `position` (text)
   - `address` (text)
   - `city` (text)
   - `country` (text, default 'Kenya')
   - `message` (text)
   - `status` (text) - 'pending', 'reviewing', 'quoted', 'accepted', 'declined'
   - `total_items` (integer, default 0)
   - `notes` (text) - Internal notes
   - `submitted_at` (timestamp)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

6. **quote_items** - Line items for quote requests
   - `id` (uuid, primary key)
   - `quote_request_id` (uuid, foreign key)
   - `product_id` (uuid, foreign key)
   - `product_name` (text, not null)
   - `product_sku` (text)
   - `quantity` (integer, default 1)
   - `unit_price` (decimal, nullable)
   - `notes` (text)
   - `created_at` (timestamp)

## Security

- RLS enabled on all tables
- Public read access for catalog tables (categories, brands, products, faqs)
- Public write access for quote_requests and quote_items (anonymous submissions)
- No user authentication required - single-tenant public catalog

## Notes

1. Products use JSONB for specifications (flexible key-value pairs) and arrays (images, tags)
2. Quote requests generate a human-readable reference for customer communication
3. Product prices are nullable because this is a quote-based model, not direct checkout
4. All tables have created_at timestamps for audit trails
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image text,
  icon text,
  product_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo text,
  category text,
  category_slug text,
  product_count integer DEFAULT 0,
  website text,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sku text UNIQUE NOT NULL,
  brand text NOT NULL,
  brand_slug text NOT NULL,
  category text NOT NULL,
  category_slug text NOT NULL,
  description text,
  short_description text,
  images jsonb DEFAULT '[]'::jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  price numeric(12,2),
  availability text NOT NULL DEFAULT 'in-stock',
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_best_seller boolean DEFAULT false,
  related_products jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  datasheet_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'products',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Quote requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT 'QT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  company text,
  position text,
  address text,
  city text,
  country text DEFAULT 'Kenya',
  message text,
  status text NOT NULL DEFAULT 'pending',
  total_items integer DEFAULT 0,
  notes text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Brands policies (public read)
DROP POLICY IF EXISTS "anon_read_brands" ON brands;
CREATE POLICY "anon_read_brands" ON brands FOR SELECT
  TO anon, authenticated USING (true);

-- Products policies (public read)
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- FAQs policies (public read for active FAQs)
DROP POLICY IF EXISTS "anon_read_faqs" ON faqs;
CREATE POLICY "anon_read_faqs" ON faqs FOR SELECT
  TO anon, authenticated USING (is_active = true);

-- Quote requests policies (public insert for anonymous submissions)
DROP POLICY IF EXISTS "anon_insert_quote_requests" ON quote_requests;
CREATE POLICY "anon_insert_quote_requests" ON quote_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_quote_requests" ON quote_requests;
CREATE POLICY "anon_read_quote_requests" ON quote_requests FOR SELECT
  TO anon, authenticated USING (true);

-- Quote items policies (public insert/re read)
DROP POLICY IF EXISTS "anon_insert_quote_items" ON quote_items;
CREATE POLICY "anon_insert_quote_items" ON quote_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_quote_items" ON quote_items;
CREATE POLICY "anon_read_quote_items" ON quote_items FOR SELECT
  TO anon, authenticated USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand_slug ON products(brand_slug);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_request_id ON quote_items(quote_request_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();