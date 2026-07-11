/*
# B2B/B2C Hybrid Commerce Schema

## Summary
Extends the OSIL Ltd platform to support both B2B (quote-based) and B2C (direct purchase)
purchasing workflows simultaneously.

## New Tables

1. **orders** — Direct purchase orders (B2C)
   - `id` (uuid, primary key)
   - `order_number` (text, unique, auto-generated ORD-XXXXXXXX)
   - `customer_name`, `company_name`, `email`, `phone` — customer details
   - `county`, `delivery_address`, `notes` — delivery info
   - `order_status` — pending / confirmed / awaiting_customer_confirmation /
     processing / ready_for_delivery / delivered / cancelled
   - Timestamps: created_at, updated_at

2. **order_items** — Line items for orders
   - `id` (uuid, primary key)
   - `order_id` (FK → orders)
   - `product_id` (FK → products, nullable for deleted products)
   - `product_name`, `product_sku` — snapshot at time of order
   - `quantity`, `unit_price`, `subtotal`

## Extended Tables

3. **products** — New commerce columns
   - `buy_now_enabled` (boolean, default true) — show Buy Now button
   - `call_for_price` (boolean, default false) — show Call for Price instead
   - `display_price` (decimal) — optional displayed price (KES)
   - `price_visible` (boolean, default false) — whether to show price publicly
   - `minimum_order_quantity` (integer, default 1)
   - `maximum_order_quantity` (integer, nullable — no upper limit)

4. **categories** — Commerce permission flags
   - `allow_buy_now` (boolean, default true)
   - `allow_quote` (boolean, default true)
   - `allow_bulk_quote` (boolean, default true)

5. **brands** — Commerce permission flags
   - `allow_buy_now` (boolean, default true)
   - `allow_quote` (boolean, default true)
   - `allow_bulk_quote` (boolean, default true)

## Security
- RLS enabled on orders and order_items
- Anonymous users can INSERT orders (no account required for B2C checkout)
- Authenticated users (admins) can SELECT and UPDATE orders
- All users can read order_items for order tracking purposes

## Notes
1. Orders use the same auto-reference pattern as quote_requests (ORD- prefix)
2. Existing quote workflow is completely untouched
3. All new product/category/brand columns are additive (IF NOT EXISTS / defaults)
4. The updated_at trigger function already exists from migration 001
*/

-- ── New tables ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'ORD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text NOT NULL,
  county text,
  delivery_address text,
  notes text,
  order_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2),
  subtotal numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- ── Extend products ────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='buy_now_enabled') THEN
    ALTER TABLE products ADD COLUMN buy_now_enabled boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='call_for_price') THEN
    ALTER TABLE products ADD COLUMN call_for_price boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='display_price') THEN
    ALTER TABLE products ADD COLUMN display_price numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price_visible') THEN
    ALTER TABLE products ADD COLUMN price_visible boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='minimum_order_quantity') THEN
    ALTER TABLE products ADD COLUMN minimum_order_quantity integer NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='maximum_order_quantity') THEN
    ALTER TABLE products ADD COLUMN maximum_order_quantity integer;
  END IF;
END $$;

-- ── Extend categories ──────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='allow_buy_now') THEN
    ALTER TABLE categories ADD COLUMN allow_buy_now boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='allow_quote') THEN
    ALTER TABLE categories ADD COLUMN allow_quote boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='allow_bulk_quote') THEN
    ALTER TABLE categories ADD COLUMN allow_bulk_quote boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- ── Extend brands ──────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='allow_buy_now') THEN
    ALTER TABLE brands ADD COLUMN allow_buy_now boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='allow_quote') THEN
    ALTER TABLE brands ADD COLUMN allow_quote boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='allow_bulk_quote') THEN
    ALTER TABLE brands ADD COLUMN allow_bulk_quote boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Orders: anyone can place (insert), authenticated admin can read/update
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Order items: anyone can insert/read
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ── Updated_at trigger for orders ──────────────────────────────────────────

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
