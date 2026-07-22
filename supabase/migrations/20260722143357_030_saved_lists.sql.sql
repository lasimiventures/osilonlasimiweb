/*
# Saved Lists Tables

## Purpose
Creates tables for customers to save and organize product lists:
- Favourite product lists (custom named collections of products)
- Saved shopping carts (snapshot of cart contents for later use)
- Saved quote lists (snapshot of quote cart contents for later use)

Reorder of previous purchases is handled by reading from the existing
`order_items` table, so no new table is needed for that feature.

## New Tables

### 1. `saved_lists`
A named collection of products belonging to a customer.
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users, default auth.uid()) — owner
- `name` (text) — list name, e.g. "Office Equipment", "Server Room Build"
- `list_type` (text, default 'favourites') — favourites | cart | quote
- `description` (text, nullable) — optional description
- `order_id` (uuid, nullable) — if this list was created from a past order (for reorder)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `saved_list_items`
Products within a saved list.
- `id` (uuid, PK)
- `list_id` (uuid, FK saved_lists ON DELETE CASCADE)
- `product_id` (uuid, nullable) — FK to products table (nullable for products that may be deleted)
- `product_name` (text) — snapshot of product name
- `product_sku` (text, nullable) — snapshot of SKU
- `product_slug` (text, nullable) — snapshot of slug for linking
- `brand` (text, nullable) — snapshot of brand
- `image` (text, nullable) — snapshot of first image URL
- `quantity` (integer, default 1)
- `unit_price` (numeric, nullable) — snapshot of price at time of saving
- `created_at` (timestamptz)

## Security (RLS)

Both tables have RLS enabled with owner-scoped policies.
For saved_list_items, ownership is checked via the parent list's user_id.

## Notes
1. user_id defaults to auth.uid() so inserts work without explicitly passing it.
2. Product snapshots (name, sku, slug, brand, image, price) are stored at save
   time so lists remain readable even if a product is later deleted or modified.
3. No data is lost — all tables are new.
*/

-- ─── Saved Lists ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  list_type text NOT NULL DEFAULT 'favourites',
  description text,
  order_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_lists" ON saved_lists;
CREATE POLICY "select_own_saved_lists" ON saved_lists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_lists" ON saved_lists;
CREATE POLICY "insert_own_saved_lists" ON saved_lists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_lists" ON saved_lists;
CREATE POLICY "update_own_saved_lists" ON saved_lists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_lists" ON saved_lists;
CREATE POLICY "delete_own_saved_lists" ON saved_lists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_lists_user ON saved_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_lists_type ON saved_lists(list_type);

-- ─── Saved List Items ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES saved_lists(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  product_sku text,
  product_slug text,
  brand text,
  image text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_list_items" ON saved_list_items;
CREATE POLICY "select_own_saved_list_items" ON saved_list_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM saved_lists WHERE saved_lists.id = saved_list_items.list_id AND saved_lists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_saved_list_items" ON saved_list_items;
CREATE POLICY "insert_own_saved_list_items" ON saved_list_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM saved_lists WHERE saved_lists.id = saved_list_items.list_id AND saved_lists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_saved_list_items" ON saved_list_items;
CREATE POLICY "update_own_saved_list_items" ON saved_list_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM saved_lists WHERE saved_lists.id = saved_list_items.list_id AND saved_lists.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM saved_lists WHERE saved_lists.id = saved_list_items.list_id AND saved_lists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_saved_list_items" ON saved_list_items;
CREATE POLICY "delete_own_saved_list_items" ON saved_list_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM saved_lists WHERE saved_lists.id = saved_list_items.list_id AND saved_lists.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_saved_list_items_list ON saved_list_items(list_id);

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_lists_updated ON saved_lists;
CREATE TRIGGER trg_saved_lists_updated BEFORE UPDATE ON saved_lists
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
