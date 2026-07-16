/*
# Warehouse Management

## Summary
Adds multi-warehouse support to the inventory system from migration 015.
Stock is now tracked per-warehouse in `warehouse_stock`, with the existing
`product_inventory` table becoming a rollup that auto-syncs from the sum of
all warehouse rows. Adds warehouses, zones (locations within a warehouse),
bins (specific rack/shelf positions), warehouse contacts, and stock transfers
with line items and status tracking. A regional stock availability view
summarises stock by region.

## New Tables

### warehouses
Top-level physical storage facility.
- id, name (unique), code (unique short code, e.g. "NBI-1"),
  address_line1, address_line2, city, county, country, postal_code,
  phone, email, region (free text region grouping, e.g. "Nairobi", "Mombasa"),
  is_active (bool), created_at, updated_at

### warehouse_contacts
People associated with a warehouse (manager, receiving clerk, etc.).
- id, warehouse_id (FK CASCADE), name, role/title, phone, email,
  is_primary (bool), notes, created_at, updated_at

### warehouse_zones
Logical areas within a warehouse (e.g. "Receiving", "Bulk Storage", "Fragile").
- id, warehouse_id (FK CASCADE), name, code (unique per warehouse),
  description, sort_order, created_at, updated_at

### warehouse_bins
Specific storage positions (rack/shelf/bin) within a zone.
- id, zone_id (FK CASCADE), warehouse_id (FK CASCADE, denormalised for easier queries),
  name (e.g. "A-12-3"), code (unique per warehouse), description,
  max_capacity, is_active, created_at, updated_at

### warehouse_stock
Actual on-hand stock per product per warehouse. This is the granular layer;
`product_inventory.stock_quantity` becomes a rollup.
- id, product_id (FK products), warehouse_id (FK warehouses),
  zone_id (FK warehouse_zones, nullable), bin_id (FK warehouse_bins, nullable),
  quantity_on_hand (int, >= 0),
  quantity_reserved (int, >= 0, allocated to orders at this warehouse),
  created_at, updated_at
- UNIQUE (product_id, warehouse_id) — one stock row per product per warehouse

### stock_transfers
Header for a stock movement between warehouses.
- id, transfer_number (human-readable, e.g. "TR-00001"),
  from_warehouse_id (FK, nullable for inbound/adjustments),
  to_warehouse_id (FK, nullable for outbound/adjustments),
  status: draft | pending | in_transit | received | cancelled,
  notes, created_at, updated_at

### stock_transfer_items
Line items on a stock transfer.
- id, transfer_id (FK CASCADE), product_id (FK products),
  quantity (int, > 0), received_quantity (int, >= 0, default 0),
  notes, created_at

## Modified Tables / Triggers
- `product_inventory.stock_quantity` is now a ROLLUP: a trigger on
  `warehouse_stock` (AFTER INSERT/UPDATE/DELETE) recalculates
  `product_inventory.stock_quantity` as SUM(quantity_on_hand) across warehouses
  and `reserved_quantity` as SUM(quantity_reserved). The existing
  `sync_product_availability` trigger then derives the availability status.
- `product_inventory.incoming_quantity` remains manually managed (represents
  units on purchase orders not yet received into any warehouse).

## Views
- `regional_stock_view` — stock grouped by region: region, warehouse_id,
  warehouse_name, product_id, total_on_hand, total_reserved, total_available.
- `warehouse_stock_detail` — warehouse_stock joined to product + warehouse +
  zone + bin names for admin tables.

## Security
- RLS enabled on all new tables. Admin single-tenant app: anon + authenticated
  full CRUD on all tables (same pattern as migration 015).

## Important Notes
1. The rollup trigger keeps product_inventory in sync — never manually set
   product_inventory.stock_quantity when warehouse_stock rows exist for that
   product; the trigger will overwrite it.
2. Stock transfers update warehouse_stock via application logic (the admin UI
   calls the transfer RPC or directly adjusts warehouse_stock rows). The DB
   enforces data integrity but does not auto-move stock on transfer status
   change — that is handled by the frontend transfer workflow.
3. warehouse_bins.warehouse_id is denormalised from zone.warehouse_id for
   query convenience; a trigger keeps it in sync.
*/

-- ─── warehouses ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  code          text NOT NULL UNIQUE,
  address_line1 text,
  address_line2 text,
  city          text,
  county        text,
  country       text DEFAULT 'Kenya',
  postal_code   text,
  phone         text,
  email         text,
  region        text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warehouses_region_idx ON warehouses(region);
CREATE INDEX IF NOT EXISTS warehouses_active_idx ON warehouses(is_active);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_warehouses" ON warehouses;
CREATE POLICY "anon_select_warehouses" ON warehouses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_warehouses" ON warehouses;
CREATE POLICY "anon_insert_warehouses" ON warehouses FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_warehouses" ON warehouses;
CREATE POLICY "anon_update_warehouses" ON warehouses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_warehouses" ON warehouses;
CREATE POLICY "anon_delete_warehouses" ON warehouses FOR DELETE
  TO anon, authenticated USING (true);

-- ─── warehouse_contacts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  role         text,
  phone        text,
  email        text,
  is_primary   boolean NOT NULL DEFAULT false,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wh_contacts_warehouse_idx ON warehouse_contacts(warehouse_id);

ALTER TABLE warehouse_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wh_contacts" ON warehouse_contacts;
CREATE POLICY "anon_select_wh_contacts" ON warehouse_contacts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wh_contacts" ON warehouse_contacts;
CREATE POLICY "anon_insert_wh_contacts" ON warehouse_contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wh_contacts" ON warehouse_contacts;
CREATE POLICY "anon_update_wh_contacts" ON warehouse_contacts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wh_contacts" ON warehouse_contacts;
CREATE POLICY "anon_delete_wh_contacts" ON warehouse_contacts FOR DELETE
  TO anon, authenticated USING (true);

-- ─── warehouse_zones ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_zones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  code         text NOT NULL,
  description  text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS wh_zones_warehouse_idx ON warehouse_zones(warehouse_id);

ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wh_zones" ON warehouse_zones;
CREATE POLICY "anon_select_wh_zones" ON warehouse_zones FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wh_zones" ON warehouse_zones;
CREATE POLICY "anon_insert_wh_zones" ON warehouse_zones FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wh_zones" ON warehouse_zones;
CREATE POLICY "anon_update_wh_zones" ON warehouse_zones FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wh_zones" ON warehouse_zones;
CREATE POLICY "anon_delete_wh_zones" ON warehouse_zones FOR DELETE
  TO anon, authenticated USING (true);

-- ─── warehouse_bins ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_bins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id      uuid NOT NULL REFERENCES warehouse_zones(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name         text NOT NULL,
  code         text NOT NULL,
  description  text,
  max_capacity integer,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS wh_bins_warehouse_idx ON warehouse_bins(warehouse_id);
CREATE INDEX IF NOT EXISTS wh_bins_zone_idx ON warehouse_bins(zone_id);

ALTER TABLE warehouse_bins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wh_bins" ON warehouse_bins;
CREATE POLICY "anon_select_wh_bins" ON warehouse_bins FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wh_bins" ON warehouse_bins;
CREATE POLICY "anon_insert_wh_bins" ON warehouse_bins FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wh_bins" ON warehouse_bins;
CREATE POLICY "anon_update_wh_bins" ON warehouse_bins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wh_bins" ON warehouse_bins;
CREATE POLICY "anon_delete_wh_bins" ON warehouse_bins FOR DELETE
  TO anon, authenticated USING (true);

-- Keep warehouse_bins.warehouse_id in sync with zone's warehouse
CREATE OR REPLACE FUNCTION sync_bin_warehouse()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT warehouse_id INTO NEW.warehouse_id FROM warehouse_zones WHERE id = NEW.zone_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_bin_warehouse ON warehouse_bins;
CREATE TRIGGER trg_sync_bin_warehouse
  BEFORE INSERT OR UPDATE OF zone_id ON warehouse_bins
  FOR EACH ROW EXECUTE FUNCTION sync_bin_warehouse();

-- ─── warehouse_stock ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id     uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  zone_id          uuid REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  bin_id           uuid REFERENCES warehouse_bins(id) ON DELETE SET NULL,
  quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS wh_stock_product_idx ON warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS wh_stock_warehouse_idx ON warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS wh_stock_warehouse_product_idx ON warehouse_stock(warehouse_id, product_id);

ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wh_stock" ON warehouse_stock;
CREATE POLICY "anon_select_wh_stock" ON warehouse_stock FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wh_stock" ON warehouse_stock;
CREATE POLICY "anon_insert_wh_stock" ON warehouse_stock FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wh_stock" ON warehouse_stock;
CREATE POLICY "anon_update_wh_stock" ON warehouse_stock FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wh_stock" ON warehouse_stock;
CREATE POLICY "anon_delete_wh_stock" ON warehouse_stock FOR DELETE
  TO anon, authenticated USING (true);

-- ─── Rollup trigger: warehouse_stock → product_inventory ─────────────────────

CREATE OR REPLACE FUNCTION rollup_product_inventory()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  IF pid IS NULL THEN RETURN NULL; END IF;

  -- Upsert product_inventory with summed values
  INSERT INTO product_inventory (product_id, stock_quantity, reserved_quantity)
  SELECT pid, COALESCE(SUM(quantity_on_hand), 0), COALESCE(SUM(quantity_reserved), 0)
  FROM warehouse_stock
  WHERE product_id = pid
  GROUP BY product_id
  ON CONFLICT (product_id) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    reserved_quantity = EXCLUDED.reserved_quantity,
    last_stock_update = now();

  -- If no warehouse_stock rows remain, ensure inventory row exists with 0
  IF NOT EXISTS (SELECT 1 FROM warehouse_stock WHERE product_id = pid) THEN
    INSERT INTO product_inventory (product_id, stock_quantity, reserved_quantity)
    VALUES (pid, 0, 0)
    ON CONFLICT (product_id) DO UPDATE SET
      stock_quantity = 0,
      reserved_quantity = 0,
      last_stock_update = now();
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_rollup_inventory ON warehouse_stock;
CREATE TRIGGER trg_rollup_inventory
  AFTER INSERT OR UPDATE OR DELETE ON warehouse_stock
  FOR EACH ROW EXECUTE FUNCTION rollup_product_inventory();

-- ─── stock_transfers ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_transfers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number   text NOT NULL UNIQUE,
  from_warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id   uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending','in_transit','received','cancelled')),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfers_status_idx ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS transfers_from_idx ON stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS transfers_to_idx ON stock_transfers(to_warehouse_id);

ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transfers" ON stock_transfers;
CREATE POLICY "anon_select_transfers" ON stock_transfers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transfers" ON stock_transfers;
CREATE POLICY "anon_insert_transfers" ON stock_transfers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transfers" ON stock_transfers;
CREATE POLICY "anon_update_transfers" ON stock_transfers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transfers" ON stock_transfers;
CREATE POLICY "anon_delete_transfers" ON stock_transfers FOR DELETE
  TO anon, authenticated USING (true);

-- Sequence for transfer numbers
CREATE SEQUENCE IF NOT EXISTS stock_transfer_number_seq START 1;

-- ─── stock_transfer_items ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id      uuid NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity         integer NOT NULL CHECK (quantity > 0),
  received_quantity integer NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfer_items_transfer_idx ON stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS transfer_items_product_idx ON stock_transfer_items(product_id);

ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transfer_items" ON stock_transfer_items;
CREATE POLICY "anon_select_transfer_items" ON stock_transfer_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transfer_items" ON stock_transfer_items;
CREATE POLICY "anon_insert_transfer_items" ON stock_transfer_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transfer_items" ON stock_transfer_items;
CREATE POLICY "anon_update_transfer_items" ON stock_transfer_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transfer_items" ON stock_transfer_items;
CREATE POLICY "anon_delete_transfer_items" ON stock_transfer_items FOR DELETE
  TO anon, authenticated USING (true);

-- ─── transfer_number auto-generation ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  next_val bigint;
BEGIN
  IF NEW.transfer_number IS NULL OR NEW.transfer_number = '' THEN
    next_val := nextval('stock_transfer_number_seq');
    NEW.transfer_number := 'TR-' || lpad(next_val::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transfer_number ON stock_transfers;
CREATE TRIGGER trg_transfer_number
  BEFORE INSERT ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION generate_transfer_number();

-- ─── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_wh_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_wh_updated ON warehouses;
CREATE TRIGGER trg_wh_updated BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

DROP TRIGGER IF EXISTS trg_wh_contact_updated ON warehouse_contacts;
CREATE TRIGGER trg_wh_contact_updated BEFORE UPDATE ON warehouse_contacts
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

DROP TRIGGER IF EXISTS trg_wh_zone_updated ON warehouse_zones;
CREATE TRIGGER trg_wh_zone_updated BEFORE UPDATE ON warehouse_zones
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

DROP TRIGGER IF EXISTS trg_wh_bin_updated ON warehouse_bins;
CREATE TRIGGER trg_wh_bin_updated BEFORE UPDATE ON warehouse_bins
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

DROP TRIGGER IF EXISTS trg_wh_stock_updated ON warehouse_stock;
CREATE TRIGGER trg_wh_stock_updated BEFORE UPDATE ON warehouse_stock
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

DROP TRIGGER IF EXISTS trg_transfer_updated ON stock_transfers;
CREATE TRIGGER trg_transfer_updated BEFORE UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION update_wh_timestamp();

-- ─── Views ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW regional_stock_view AS
SELECT
  w.region    AS region,
  w.id        AS warehouse_id,
  w.name      AS warehouse_name,
  w.code      AS warehouse_code,
  ws.product_id,
  COALESCE(SUM(ws.quantity_on_hand), 0)    AS total_on_hand,
  COALESCE(SUM(ws.quantity_reserved), 0)   AS total_reserved,
  COALESCE(SUM(ws.quantity_on_hand - ws.quantity_reserved), 0) AS total_available
FROM warehouses w
LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
GROUP BY w.region, w.id, w.name, w.code, ws.product_id;

CREATE OR REPLACE VIEW warehouse_stock_detail AS
SELECT
  ws.id,
  ws.product_id,
  ws.warehouse_id,
  ws.zone_id,
  ws.bin_id,
  ws.quantity_on_hand,
  ws.quantity_reserved,
  (ws.quantity_on_hand - ws.quantity_reserved) AS quantity_available,
  ws.created_at,
  ws.updated_at,
  p.name  AS product_name,
  p.sku   AS product_sku,
  w.name  AS warehouse_name,
  w.code  AS warehouse_code,
  w.region AS warehouse_region,
  z.name  AS zone_name,
  z.code  AS zone_code,
  b.name  AS bin_name,
  b.code  AS bin_code
FROM warehouse_stock ws
JOIN products p     ON p.id = ws.product_id
JOIN warehouses w   ON w.id = ws.warehouse_id
LEFT JOIN warehouse_zones z ON z.id = ws.zone_id
LEFT JOIN warehouse_bins b  ON b.id = ws.bin_id;
