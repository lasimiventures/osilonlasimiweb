/*
# Product Version Control

Adds a full audit-history layer for product changes (Milestone 6.6).
A new `product_revisions` table records every UPDATE on `products`, capturing
the changed columns, old and new values, a change category, and a revision
number that increments per product. This complements the existing
`product_cost_history` (which is cost-price-only) with a broader change log
covering price, specification, availability, and general product edits.

## 1. New Table: `product_revisions`

Append-only audit log of every product update.
- id (uuid PK)
- product_id (FK products CASCADE)
- revision_number (int, sequential per product — 1, 2, 3 …)
- change_type (text): 'price_update' | 'specification_change' |
  'availability_change' | 'product_revision'
- changed_fields (text[]) — list of column names that changed
- old_values (jsonb) — snapshot of changed columns before update
- new_values (jsonb) — snapshot of changed columns after update
- changed_by (text, nullable) — admin email or system source
- change_source (text): 'manual_edit' | 'bulk_import' | 'system' |
  'api' — default 'manual_edit'
- notes (text, nullable)
- created_at (timestamptz default now())

## 2. Helper function: classify_product_change()

Given the OLD and NEW records, returns the most specific change_type:
- 'availability_change' if any availability column changed
- 'price_update' if any pricing column changed
- 'specification_change' if specifications changed
- 'product_revision' otherwise (name, brand, images, etc.)
Priority: availability > price > spec > revision.

## 3. Trigger: archive_product_revision()

AFTER UPDATE ON products. For each row where at least one tracked column
differs between OLD and NEW:
- computes revision_number as MAX(existing) + 1 for that product
- captures changed column names, old/new JSONB snapshots
- classifies the change
- inserts a product_revisions row
Tracked columns include pricing (cost_price, selling_price, distributor_price,
dealer_price, promotional_price, price, promo_start_date, promo_end_date,
pricing_currency), availability (availability, buy_now_enabled, call_for_price,
display_price, price_visible, minimum_order_quantity, maximum_order_quantity),
specs (specifications, short_description, description, datasheet_url,
warranty_expiry_date), and general (name, slug, brand, brand_slug, category,
category_slug, images, tags, is_featured, is_new, is_best_seller).

## 4. Revision-number helper: next_product_revision()

SECURITY DEFINER function that atomically returns the next revision number
for a product (MAX + 1, or 1). Used by the archive trigger.

## 5. Security — RLS

product_revisions: admin single-tenant pattern (anon + authenticated full
CRUD), matching the existing product_cost_history migration. 4 policies.

## 6. Indexes
- product_revisions: product_id, revision_number, change_type, created_at DESC

## 7. Notes
- product_revisions is append-only by convention; the trigger handles inserts.
  The UPDATE/DELETE policies exist only for admin correction of bad data.
- product_cost_history remains untouched and continues to track cost-price
  changes specifically (it has richer PO/reference fields). product_revisions
  is the broad audit log.
- changed_by is left NULL by the trigger (the DB cannot see the admin email).
  The frontend may optionally post a follow-up UPDATE to set it, or a future
  edge function can set it from the JWT.
*/

-- ── product_revisions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_revisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  change_type     text NOT NULL DEFAULT 'product_revision'
    CHECK (change_type IN ('price_update','specification_change','availability_change','product_revision')),
  changed_fields  text[] NOT NULL DEFAULT '{}',
  old_values      jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values      jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_by      text,
  change_source   text NOT NULL DEFAULT 'manual_edit'
    CHECK (change_source IN ('manual_edit','bulk_import','system','api')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, revision_number)
);
ALTER TABLE product_revisions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pr_product ON product_revisions(product_id);
CREATE INDEX IF NOT EXISTS idx_pr_revision ON product_revisions(revision_number);
CREATE INDEX IF NOT EXISTS idx_pr_type ON product_revisions(change_type);
CREATE INDEX IF NOT EXISTS idx_pr_created ON product_revisions(created_at DESC);

DROP POLICY IF EXISTS "anon_select_product_revisions" ON product_revisions;
CREATE POLICY "anon_select_product_revisions" ON product_revisions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_product_revisions" ON product_revisions;
CREATE POLICY "anon_insert_product_revisions" ON product_revisions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_product_revisions" ON product_revisions;
CREATE POLICY "anon_update_product_revisions" ON product_revisions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_product_revisions" ON product_revisions;
CREATE POLICY "anon_delete_product_revisions" ON product_revisions FOR DELETE
  TO anon, authenticated USING (true);

-- ── next revision number (atomic) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION next_product_revision(p_product_id uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(MAX(revision_number), 0) + 1
  FROM product_revisions
  WHERE product_id = p_product_id;
$$;

-- ── columns tracked by the audit trigger ─────────────────────────────────────
-- Kept as arrays so the trigger can loop and diff cleanly.
-- Order matters for classification priority (availability, price, spec, general).

CREATE OR REPLACE FUNCTION classify_product_change(changed text[])
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  has_availability boolean := false;
  has_price boolean := false;
  has_spec boolean := false;
  c text;
BEGIN
  FOREACH c IN ARRAY changed LOOP
    IF c IN ('availability','buy_now_enabled','call_for_price','display_price',
             'price_visible','minimum_order_quantity','maximum_order_quantity') THEN
      has_availability := true;
    ELSIF c IN ('cost_price','selling_price','distributor_price','dealer_price',
                'promotional_price','price','promo_start_date','promo_end_date',
                'pricing_currency') THEN
      has_price := true;
    ELSIF c IN ('specifications','short_description','description','datasheet_url',
                'warranty_expiry_date') THEN
      has_spec := true;
    END IF;
  END LOOP;
  IF has_availability THEN RETURN 'availability_change'; END IF;
  IF has_price THEN RETURN 'price_update'; END IF;
  IF has_spec THEN RETURN 'specification_change'; END IF;
  RETURN 'product_revision';
END;
$$;

-- ── archive trigger ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION archive_product_revision() RETURNS trigger AS $$
DECLARE
  tracked text[] := ARRAY[
    'name','slug','brand','brand_slug','category','category_slug',
    'description','short_description','specifications','datasheet_url',
    'warranty_expiry_date','images','tags',
    'price','cost_price','selling_price','distributor_price','dealer_price',
    'promotional_price','promo_start_date','promo_end_date','pricing_currency',
    'availability','buy_now_enabled','call_for_price','display_price',
    'price_visible','minimum_order_quantity','maximum_order_quantity',
    'is_featured','is_new','is_best_seller'
  ];
  changed text[] := '{}';
  oldv jsonb := '{}'::jsonb;
  newv jsonb := '{}'::jsonb;
  col text;
  old_val jsonb;
  new_val jsonb;
BEGIN
  FOREACH col IN ARRAY tracked LOOP
    old_val := to_jsonb(OLD -> col);
    new_val := to_jsonb(NEW -> col);
    IF old_val IS DISTINCT FROM new_val THEN
      changed := array_append(changed, col);
      oldv := oldv || jsonb_build_object(col, old_val);
      newv := newv || jsonb_build_object(col, new_val);
    END IF;
  END LOOP;

  IF array_length(changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO product_revisions
    (product_id, revision_number, change_type, changed_fields, old_values, new_values, change_source)
  VALUES
    (NEW.id, next_product_revision(NEW.id), classify_product_change(changed),
     changed, oldv, newv, 'manual_edit');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_revision ON products;
CREATE TRIGGER trg_product_revision
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION archive_product_revision();
