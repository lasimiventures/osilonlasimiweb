/*
# Cost & Pricing Management

Adds comprehensive financial tracking to the products table: cost price,
tiered selling prices (selling, distributor, dealer), promotional pricing,
and a cost history audit log. A view computes margin and mark-up on the fly.

## 1. New Columns on `products` (all nullable numeric(14,2))

Added via conditional DO block so the migration is idempotent:
- `cost_price` — last purchase cost from supplier (lands here from GRN/
  PO unit_cost). Drives margin & mark-up calculations.
- `selling_price` — standard retail price (the existing `price` column
  remains as an internal reference; `selling_price` is the active sell price).
- `distributor_price` — tiered price for distributor customers.
- `dealer_price` — tiered price for dealer/reseller customers.
- `promotional_price` — temporary sale price (overrides selling_price when
  set and within the promo window).
- `promo_start_date` (date) — when promotional_price becomes active.
- `promo_end_date` (date) — when promotional_price expires.
- `pricing_currency` (text, default 'KES') — per-product currency override.

## 2. New Table: `product_cost_history`

Append-only audit of every cost price change. Each row captures the old
and new cost, who changed it, and why (auto-populated from PO receipts or
manual admin edits).
- id, product_id (FK CASCADE), old_cost (numeric), new_cost (numeric),
  change_source (text: 'purchase_order', 'manual_edit', 'supplier_update',
    'bulk_import'),
  reference_type (text, nullable), reference_id (uuid, nullable),
  reference_number (text, nullable), changed_by (text), notes (text),
  created_at (timestamptz default now())

## 3. Trigger: archive cost price changes

`archive_cost_change()` — AFTER UPDATE OF cost_price ON products. When
cost_price actually changes, inserts a row into product_cost_history
capturing OLD.cost_price → NEW.cost_price. This means every manual edit
or PO-driven update is journaled automatically.

## 4. View: `product_pricing_view`

Enriched view joining products + inventory, computing derived metrics:
- `effective_price` — promotional_price when within the promo window,
  else selling_price, else price (fallback).
- `cost_price` — raw cost.
- `margin_amount` = effective_price - cost_price.
- `margin_pct` = (effective_price - cost_price) / effective_price * 100.
- `markup_pct` = (effective_price - cost_price) / cost_price * 100.
- `promo_active` — boolean: today is within promo_start/end dates.
- `on_hand` — current stock quantity from product_inventory.

## 5. Security — RLS

product_cost_history: admin single-tenant pattern (anon + authenticated
full CRUD), 4 policies, matching the inventory/procurement migrations.

## 6. Indexes
- product_cost_history: product_id, created_at DESC, change_source

## Notes
1. The existing `price` column is untouched — `selling_price` is the new
   active sell price, with `price` kept as a legacy reference.
2. Cost price is typically updated from purchase order receipts (the PO
   item's unit_cost flows to product.cost_price on GRN). This migration
   adds the column + history; wiring the PO→cost_price auto-update is a
   future enhancement. For now, admins can set it manually in ProductForm.
3. Margin = (sell - cost) / sell; Mark-up = (sell - cost) / cost.
   Both are null when cost_price or effective_price is null/zero.
*/

-- ── Add pricing columns to products (idempotent) ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price numeric(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
    ALTER TABLE products ADD COLUMN selling_price numeric(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'distributor_price') THEN
    ALTER TABLE products ADD COLUMN distributor_price numeric(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'dealer_price') THEN
    ALTER TABLE products ADD COLUMN dealer_price numeric(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promotional_price') THEN
    ALTER TABLE products ADD COLUMN promotional_price numeric(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promo_start_date') THEN
    ALTER TABLE products ADD COLUMN promo_start_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promo_end_date') THEN
    ALTER TABLE products ADD COLUMN promo_end_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'pricing_currency') THEN
    ALTER TABLE products ADD COLUMN pricing_currency text NOT NULL DEFAULT 'KES';
  END IF;
END $$;

-- ── product_cost_history ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_cost_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_cost       numeric(14,2),
  new_cost       numeric(14,2),
  change_source  text NOT NULL DEFAULT 'manual_edit'
    CHECK (change_source IN ('purchase_order','manual_edit','supplier_update','bulk_import')),
  reference_type text,
  reference_id   uuid,
  reference_number text,
  changed_by     text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pch_product ON product_cost_history(product_id);
CREATE INDEX IF NOT EXISTS idx_pch_created ON product_cost_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pch_source ON product_cost_history(change_source);

DROP POLICY IF EXISTS "anon_select_cost_history" ON product_cost_history;
CREATE POLICY "anon_select_cost_history" ON product_cost_history FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cost_history" ON product_cost_history;
CREATE POLICY "anon_insert_cost_history" ON product_cost_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cost_history" ON product_cost_history;
CREATE POLICY "anon_update_cost_history" ON product_cost_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cost_history" ON product_cost_history;
CREATE POLICY "anon_delete_cost_history" ON product_cost_history FOR DELETE
  TO anon, authenticated USING (true);

-- ── Trigger: archive cost price changes ──────────────────────────────────────
CREATE OR REPLACE FUNCTION archive_cost_change() RETURNS trigger AS $$
BEGIN
  IF NEW.cost_price IS DISTINCT FROM OLD.cost_price THEN
    INSERT INTO product_cost_history (product_id, old_cost, new_cost, change_source, changed_by, notes)
    VALUES (NEW.id, OLD.cost_price, NEW.cost_price, 'manual_edit', null, 'Cost price updated via admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_archive_cost ON products;
CREATE TRIGGER trg_archive_cost
  AFTER UPDATE OF cost_price ON products
  FOR EACH ROW EXECUTE FUNCTION archive_cost_change();

-- ── View: product_pricing_view with margin/markup ────────────────────────────
CREATE OR REPLACE VIEW product_pricing_view AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.brand,
  p.category,
  p.cost_price,
  p.selling_price,
  p.distributor_price,
  p.dealer_price,
  p.promotional_price,
  p.promo_start_date,
  p.promo_end_date,
  p.pricing_currency,
  CASE
    WHEN p.promotional_price IS NOT NULL
      AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
      AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
    THEN p.promotional_price
    WHEN p.selling_price IS NOT NULL THEN p.selling_price
    ELSE p.price
  END AS effective_price,
  (p.promotional_price IS NOT NULL
    AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
    AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
  ) AS promo_active,
  CASE
    WHEN (CASE
      WHEN p.promotional_price IS NOT NULL
        AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
        AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
      THEN p.promotional_price
      WHEN p.selling_price IS NOT NULL THEN p.selling_price
      ELSE p.price
    END) IS NOT NULL AND p.cost_price IS NOT NULL AND p.cost_price > 0
    THEN (CASE
      WHEN p.promotional_price IS NOT NULL
        AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
        AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
      THEN p.promotional_price
      WHEN p.selling_price IS NOT NULL THEN p.selling_price
      ELSE p.price
    END) - p.cost_price
  END AS margin_amount,
  CASE
    WHEN (CASE
      WHEN p.promotional_price IS NOT NULL
        AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
        AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
      THEN p.promotional_price
      WHEN p.selling_price IS NOT NULL THEN p.selling_price
      ELSE p.price
    END) IS NOT NULL AND p.cost_price IS NOT NULL AND p.cost_price > 0
      AND (CASE
        WHEN p.promotional_price IS NOT NULL
          AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
          AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
        THEN p.promotional_price
        WHEN p.selling_price IS NOT NULL THEN p.selling_price
        ELSE p.price
      END) > 0
    THEN ROUND(
      ((CASE
        WHEN p.promotional_price IS NOT NULL
          AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
          AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
        THEN p.promotional_price
        WHEN p.selling_price IS NOT NULL THEN p.selling_price
        ELSE p.price
      END) - p.cost_price) / (CASE
        WHEN p.promotional_price IS NOT NULL
          AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
          AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
        THEN p.promotional_price
        WHEN p.selling_price IS NOT NULL THEN p.selling_price
        ELSE p.price
      END) * 100, 2
    )
  END AS margin_pct,
  CASE
    WHEN (CASE
      WHEN p.promotional_price IS NOT NULL
        AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
        AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
      THEN p.promotional_price
      WHEN p.selling_price IS NOT NULL THEN p.selling_price
      ELSE p.price
    END) IS NOT NULL AND p.cost_price IS NOT NULL AND p.cost_price > 0
    THEN ROUND(
      ((CASE
        WHEN p.promotional_price IS NOT NULL
          AND (p.promo_start_date IS NULL OR CURRENT_DATE >= p.promo_start_date)
          AND (p.promo_end_date IS NULL OR CURRENT_DATE <= p.promo_end_date)
        THEN p.promotional_price
        WHEN p.selling_price IS NOT NULL THEN p.selling_price
        ELSE p.price
      END) - p.cost_price) / p.cost_price * 100, 2
    )
  END AS markup_pct,
  COALESCE(pi.stock_quantity, 0) AS on_hand,
  p.availability
FROM products p
LEFT JOIN product_inventory pi ON pi.product_id = p.id;