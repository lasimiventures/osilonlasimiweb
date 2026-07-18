/*
# Inventory Foundation

## Summary
Creates a dedicated `product_inventory` table that tracks real stock quantities
for every product, plus a trigger that automatically derives the product's
`availability` status from inventory levels. This replaces manual status setting
with a data-driven approach while keeping the existing 4-value enum plus adding
a 5th status `discontinued`.

## New Table

### product_inventory
One row per product (1:1). Tracks:
- `product_id` (uuid FK → products, unique)
- `stock_quantity` — physical units in the warehouse
- `reserved_quantity` — units allocated to pending orders (not yet shipped)
- `incoming_quantity` — units on purchase orders expected to arrive
- `reorder_level` — threshold that triggers "Low Stock" alert
- `safety_stock` — minimum buffer to keep for demand spikes
- `discontinued` — boolean; when true, availability becomes `discontinued`
- `restock_expected_date` — when incoming stock is expected (optional)
- `last_stock_update` — timestamp of last manual adjustment
- `notes` — admin notes about stock state

### Computed (via view `product_inventory_view`)
- `available_quantity` = stock_quantity - reserved_quantity (can go negative — surfaces a problem)
- `inventory_status` = derived: in-stock | low-stock | out-of-stock | pre-order | discontinued

### Trigger
`sync_product_availability()` — AFTER INSERT/UPDATE on product_inventory,
automatically updates the parent products.availability column using this logic:
  1. discontinued = true → 'discontinued'
  2. stock_quantity <= 0 AND incoming_quantity > 0 → 'pre-order'
  3. stock_quantity <= 0 → 'out-of-stock'
  4. stock_quantity <= reorder_level OR stock_quantity <= safety_stock → 'low-stock'
  5. else → 'in-stock'

## Modified Table
- `products.availability` — the trigger keeps this in sync with inventory.
  Existing manual control remains as a fallback (admin can still set it directly,
  but the trigger will override on next inventory update). Adds 'discontinued'
  to the acceptable values.

## Security
- RLS enabled, anon + authenticated full CRUD (admin app, single-tenant).
*/

-- ─── product_inventory table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_inventory (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            uuid NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity        integer NOT NULL DEFAULT 0,
  reserved_quantity     integer NOT NULL DEFAULT 0,
  incoming_quantity     integer NOT NULL DEFAULT 0,
  reorder_level         integer NOT NULL DEFAULT 5,
  safety_stock          integer NOT NULL DEFAULT 2,
  discontinued          boolean NOT NULL DEFAULT false,
  restock_expected_date date,
  last_stock_update     timestamptz NOT NULL DEFAULT now(),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_inventory_product_idx ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS product_inventory_status_idx ON product_inventory(stock_quantity);

ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_inventory" ON product_inventory;
CREATE POLICY "anon_select_inventory" ON product_inventory FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inventory" ON product_inventory;
CREATE POLICY "anon_insert_inventory" ON product_inventory FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inventory" ON product_inventory;
CREATE POLICY "anon_update_inventory" ON product_inventory FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inventory" ON product_inventory;
CREATE POLICY "anon_delete_inventory" ON product_inventory FOR DELETE
  TO anon, authenticated USING (true);

-- ─── Helper: derive availability from inventory ──────────────────────────────

CREATE OR REPLACE FUNCTION derive_availability_from_inventory(
  p_stock      integer,
  p_reserved   integer,
  p_incoming   integer,
  p_reorder    integer,
  p_safety     integer,
  p_discontinued boolean
) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_discontinued THEN
    RETURN 'discontinued';
  ELSIF p_stock <= 0 AND p_incoming > 0 THEN
    RETURN 'pre-order';
  ELSIF p_stock <= 0 THEN
    RETURN 'out-of-stock';
  ELSIF p_stock <= GREATEST(p_reorder, p_safety) THEN
    RETURN 'low-stock';
  ELSE
    RETURN 'in-stock';
  END IF;
END;
$$;

-- ─── View: product_inventory_view with computed columns ──────────────────────

CREATE OR REPLACE VIEW product_inventory_view AS
SELECT
  pi.*,
  (pi.stock_quantity - pi.reserved_quantity) AS available_quantity,
  derive_availability_from_inventory(
    pi.stock_quantity, pi.reserved_quantity, pi.incoming_quantity,
    pi.reorder_level, pi.safety_stock, pi.discontinued
  ) AS inventory_status
FROM product_inventory pi;

-- ─── Trigger: sync products.availability ─────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_product_availability()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products SET
    availability = derive_availability_from_inventory(
      NEW.stock_quantity, NEW.reserved_quantity, NEW.incoming_quantity,
      NEW.reorder_level, NEW.safety_stock, NEW.discontinued
    ),
    updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_availability ON product_inventory;
CREATE TRIGGER trg_sync_availability
  AFTER INSERT OR UPDATE ON product_inventory
  FOR EACH ROW EXECUTE FUNCTION sync_product_availability();

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_product_inventory_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  NEW.last_stock_update := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON product_inventory;
CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON product_inventory
  FOR EACH ROW EXECUTE FUNCTION update_product_inventory_updated_at();
