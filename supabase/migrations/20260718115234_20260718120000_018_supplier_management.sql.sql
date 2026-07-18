/*
# Supplier Management Foundation

Creates the full supplier-management schema for Milestone 5.3.

1. New Tables
- `supplier_categories` — classification of suppliers (e.g. Distributor, Manufacturer, Service Provider).
  Columns: id, name (unique), slug (unique), description, created_at.
- `suppliers` — core supplier record.
  Columns: id, name, slug (unique), category_id (FK supplier_categories), supplier_type
  (distributor/manufacturer/reseller/service_provider), status (active/inactive/blacklisted),
  tax_id, registration_number, website, description, address, city, country, postal_code,
  phone, email, currency (default KES), payment_terms_id (FK supplier_payment_terms),
  lead_time_days (default 0), min_order_value, is_preferred (default false),
  preferred_since, distributor_code, distributor_region, distributor_exclusivity (boolean),
  parent_distributor_id (self-FK suppliers, for sub-distributors), rating (0-5, default 0),
  rating_count (default 0), rating_breakdown (jsonb), notes, created_at, updated_at.
- `supplier_contacts` — people at a supplier.
  Columns: id, supplier_id (FK suppliers CASCADE), name, position, email, phone, is_primary,
  notes, created_at.
- `supplier_lead_times` — per-product or per-category typical lead times for a supplier.
  Columns: id, supplier_id (FK suppliers CASCADE), product_id (FK products CASCADE, nullable),
  category_slug (text, nullable), standard_days, expedited_days, notes, created_at.
  Exactly one of product_id / category_slug should be set.
- `supplier_payment_terms` — reusable payment-terms catalog (e.g. "Net 30").
  Columns: id, name (unique), code (unique), description, default_days, is_active (default true),
  created_at.
- `supplier_ratings` — individual rating submissions that roll up into suppliers.rating.
  Columns: id, supplier_id (FK suppliers CASCADE), rated_by, rating (1-5), delivery_score,
  quality_score, price_score, communication_score, review, created_at.
- `supplier_product_catalog` — which products a supplier provides and at what cost.
  Columns: id, supplier_id (FK suppliers CASCADE), product_id (FK products CASCADE),
  supplier_sku, cost_price, moq (minimum order qty), pack_size, is_primary_supplier (boolean),
  last_cost_update, created_at, updated_at. Unique(supplier_id, product_id).

2. Security — RLS
- All tables are admin-managed (authenticated CRUD). The public storefront does not need
  to read supplier data, so policies are scoped `TO authenticated` with `USING (true) /
  WITH CHECK (true)` — matching the existing admin-catalog pattern in migration 004.
- supplier_categories, supplier_payment_terms, suppliers, supplier_contacts,
  supplier_lead_times, supplier_ratings, supplier_product_catalog each get 4 policies
  (select/insert/update/delete).

3. Indexes
- suppliers: category_id, status, is_preferred, parent_distributor_id.
- supplier_contacts: supplier_id.
- supplier_lead_times: supplier_id, product_id.
- supplier_ratings: supplier_id.
- supplier_product_catalog: supplier_id, product_id, is_primary_supplier.

4. Notes
- suppliers.rating / rating_count / rating_breakdown are maintained by the application
  layer by averaging supplier_ratings rows. A trigger keeps them in sync on insert/update/delete.
- suppliers.slug is unique and lowercased by the application.
- parent_distributor_id lets a regional sub-distributor point to its parent distributor.
*/

-- ── supplier_categories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_supplier_categories" ON supplier_categories;
CREATE POLICY "auth_select_supplier_categories" ON supplier_categories FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_categories" ON supplier_categories;
CREATE POLICY "auth_insert_supplier_categories" ON supplier_categories FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_categories" ON supplier_categories;
CREATE POLICY "auth_update_supplier_categories" ON supplier_categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_categories" ON supplier_categories;
CREATE POLICY "auth_delete_supplier_categories" ON supplier_categories FOR DELETE
  TO authenticated USING (true);

-- ── supplier_payment_terms ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  default_days int NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supplier_payment_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_supplier_payment_terms" ON supplier_payment_terms;
CREATE POLICY "auth_select_supplier_payment_terms" ON supplier_payment_terms FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_payment_terms" ON supplier_payment_terms;
CREATE POLICY "auth_insert_supplier_payment_terms" ON supplier_payment_terms FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_payment_terms" ON supplier_payment_terms;
CREATE POLICY "auth_update_supplier_payment_terms" ON supplier_payment_terms FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_payment_terms" ON supplier_payment_terms;
CREATE POLICY "auth_delete_supplier_payment_terms" ON supplier_payment_terms FOR DELETE
  TO authenticated USING (true);

-- ── suppliers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES supplier_categories(id) ON DELETE SET NULL,
  supplier_type text NOT NULL DEFAULT 'distributor'
    CHECK (supplier_type IN ('distributor','manufacturer','reseller','service_provider')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','blacklisted')),
  tax_id text,
  registration_number text,
  website text,
  description text,
  address text,
  city text,
  country text,
  postal_code text,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'KES',
  payment_terms_id uuid REFERENCES supplier_payment_terms(id) ON DELETE SET NULL,
  lead_time_days int NOT NULL DEFAULT 0,
  min_order_value numeric(12,2) NOT NULL DEFAULT 0,
  is_preferred boolean NOT NULL DEFAULT false,
  preferred_since timestamptz,
  distributor_code text,
  distributor_region text,
  distributor_exclusivity boolean NOT NULL DEFAULT false,
  parent_distributor_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  rating_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_preferred ON suppliers(is_preferred);
CREATE INDEX IF NOT EXISTS idx_suppliers_parent ON suppliers(parent_distributor_id);

DROP POLICY IF EXISTS "auth_select_suppliers" ON suppliers;
CREATE POLICY "auth_select_suppliers" ON suppliers FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_suppliers" ON suppliers;
CREATE POLICY "auth_insert_suppliers" ON suppliers FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_suppliers" ON suppliers;
CREATE POLICY "auth_update_suppliers" ON suppliers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_suppliers" ON suppliers;
CREATE POLICY "auth_delete_suppliers" ON suppliers FOR DELETE
  TO authenticated USING (true);

-- ── supplier_contacts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text,
  email text,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);

DROP POLICY IF EXISTS "auth_select_supplier_contacts" ON supplier_contacts;
CREATE POLICY "auth_select_supplier_contacts" ON supplier_contacts FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_contacts" ON supplier_contacts;
CREATE POLICY "auth_insert_supplier_contacts" ON supplier_contacts FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_contacts" ON supplier_contacts;
CREATE POLICY "auth_update_supplier_contacts" ON supplier_contacts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_contacts" ON supplier_contacts;
CREATE POLICY "auth_delete_supplier_contacts" ON supplier_contacts FOR DELETE
  TO authenticated USING (true);

-- ── supplier_lead_times ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_lead_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_slug text,
  standard_days int NOT NULL DEFAULT 0,
  expedited_days int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_lead_times_one_target CHECK (
    (product_id IS NOT NULL AND category_slug IS NULL) OR
    (product_id IS NULL AND category_slug IS NOT NULL)
  )
);
ALTER TABLE supplier_lead_times ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_supplier_lead_times_supplier ON supplier_lead_times(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_lead_times_product ON supplier_lead_times(product_id);

DROP POLICY IF EXISTS "auth_select_supplier_lead_times" ON supplier_lead_times;
CREATE POLICY "auth_select_supplier_lead_times" ON supplier_lead_times FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_lead_times" ON supplier_lead_times;
CREATE POLICY "auth_insert_supplier_lead_times" ON supplier_lead_times FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_lead_times" ON supplier_lead_times;
CREATE POLICY "auth_update_supplier_lead_times" ON supplier_lead_times FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_lead_times" ON supplier_lead_times;
CREATE POLICY "auth_delete_supplier_lead_times" ON supplier_lead_times FOR DELETE
  TO authenticated USING (true);

-- ── supplier_ratings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  rated_by text,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  delivery_score int CHECK (delivery_score IS NULL OR (delivery_score >= 1 AND delivery_score <= 5)),
  quality_score int CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 5)),
  price_score int CHECK (price_score IS NULL OR (price_score >= 1 AND price_score <= 5)),
  communication_score int CHECK (communication_score IS NULL OR (communication_score >= 1 AND communication_score <= 5)),
  review text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supplier_ratings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier ON supplier_ratings(supplier_id);

DROP POLICY IF EXISTS "auth_select_supplier_ratings" ON supplier_ratings;
CREATE POLICY "auth_select_supplier_ratings" ON supplier_ratings FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_ratings" ON supplier_ratings;
CREATE POLICY "auth_insert_supplier_ratings" ON supplier_ratings FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_ratings" ON supplier_ratings;
CREATE POLICY "auth_update_supplier_ratings" ON supplier_ratings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_ratings" ON supplier_ratings;
CREATE POLICY "auth_delete_supplier_ratings" ON supplier_ratings FOR DELETE
  TO authenticated USING (true);

-- ── supplier_product_catalog ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_sku text,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  moq int NOT NULL DEFAULT 1,
  pack_size int NOT NULL DEFAULT 1,
  is_primary_supplier boolean NOT NULL DEFAULT false,
  last_cost_update date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);
ALTER TABLE supplier_product_catalog ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_supplier_product_catalog_supplier ON supplier_product_catalog(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_product_catalog_product ON supplier_product_catalog(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_product_catalog_primary ON supplier_product_catalog(is_primary_supplier);

DROP POLICY IF EXISTS "auth_select_supplier_product_catalog" ON supplier_product_catalog;
CREATE POLICY "auth_select_supplier_product_catalog" ON supplier_product_catalog FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_supplier_product_catalog" ON supplier_product_catalog;
CREATE POLICY "auth_insert_supplier_product_catalog" ON supplier_product_catalog FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_supplier_product_catalog" ON supplier_product_catalog;
CREATE POLICY "auth_update_supplier_product_catalog" ON supplier_product_catalog FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_supplier_product_catalog" ON supplier_product_catalog;
CREATE POLICY "auth_delete_supplier_product_catalog" ON supplier_product_catalog FOR DELETE
  TO authenticated USING (true);

-- ── Rating rollup trigger ───────────────────────────────────────────────────
-- Keeps suppliers.rating, rating_count, rating_breakdown in sync with supplier_ratings.
CREATE OR REPLACE FUNCTION recompute_supplier_rating() RETURNS trigger AS $$
DECLARE
  s_id uuid;
BEGIN
  s_id := COALESCE(NEW.supplier_id, OLD.supplier_id);
  UPDATE suppliers SET
    rating_count = (SELECT COUNT(*) FROM supplier_ratings WHERE supplier_id = s_id),
    rating = COALESCE(
      (SELECT AVG(rating)::numeric(2,1) FROM supplier_ratings WHERE supplier_id = s_id),
      0
    ),
    rating_breakdown = COALESCE((
      SELECT jsonb_build_object(
        'delivery', AVG(delivery_score)::numeric(2,1),
        'quality', AVG(quality_score)::numeric(2,1),
        'price', AVG(price_score)::numeric(2,1),
        'communication', AVG(communication_score)::numeric(2,1)
      )
      FROM supplier_ratings WHERE supplier_id = s_id
    ), '{}'::jsonb),
    updated_at = now()
  WHERE id = s_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supplier_rating_rollup ON supplier_ratings;
CREATE TRIGGER trg_supplier_rating_rollup
  AFTER INSERT OR UPDATE OR DELETE ON supplier_ratings
  FOR EACH ROW EXECUTE FUNCTION recompute_supplier_rating();

-- ── updated_at trigger for suppliers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_supplier_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION touch_supplier_updated_at();

-- ── Seed default payment terms ──────────────────────────────────────────────
INSERT INTO supplier_payment_terms (name, code, description, default_days) VALUES
  ('Cash on Delivery', 'COD', 'Payment due on delivery', 0),
  ('Prepaid',          'PPD', 'Payment in advance of shipment', 0),
  ('Net 15',           'N15', 'Payment due within 15 days', 15),
  ('Net 30',           'N30', 'Payment due within 30 days', 30),
  ('Net 45',           'N45', 'Payment due within 45 days', 45),
  ('Net 60',           'N60', 'Payment due within 60 days', 60),
  ('2/10 Net 30',      '2N30','2% discount if paid in 10 days, otherwise net 30', 30)
ON CONFLICT (name) DO NOTHING;

-- ── Seed default supplier categories ────────────────────────────────────────
INSERT INTO supplier_categories (name, slug, description) VALUES
  ('Distributor',       'distributor',       'Authorized distributor that resells manufacturer products'),
  ('Manufacturer',      'manufacturer',      'Original equipment manufacturer'),
  ('Reseller',          'reseller',          'Reseller or channel partner'),
  ('Service Provider',  'service-provider',  'Provides installation, maintenance, or warranty services')
ON CONFLICT (name) DO NOTHING;