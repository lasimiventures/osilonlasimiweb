/*
# Procurement & Restocking Workflows

Creates the full procurement lifecycle for Milestone 5.4:
Purchase Requisitions → Purchase Orders → Goods Received Notes → Back Orders,
plus Supplier Deliveries and a procurement status helper.

## 1. New Tables

### purchase_requisitions
Internal request to procure stock. Can be converted into a Purchase Order.
- id, requisition_number (unique, auto PR-#####), requested_by (text),
  warehouse_id (FK warehouses, destination), status: draft | pending_approval |
  approved | rejected | converted | cancelled, notes, required_by (date),
  created_at, updated_at

### purchase_requisition_items
Line items on a requisition.
- id, requisition_id (FK CASCADE), product_id (FK products),
  quantity (int > 0), notes, created_at

### purchase_orders
Header for an order placed on a supplier.
- id, po_number (unique, auto PO-#####), supplier_id (FK suppliers),
  requisition_id (FK purchase_requisitions, nullable, link if converted),
  warehouse_id (FK warehouses, receiving destination),
  status: draft | sent | acknowledged | partial | received | cancelled,
  order_date, expected_delivery_date, currency (default KES),
  subtotal, tax_total, shipping_total, total (numeric),
  payment_terms_id (FK supplier_payment_terms, nullable),
  notes, created_at, updated_at

### purchase_order_items
Line items on a PO.
- id, po_id (FK CASCADE), product_id (FK products),
  quantity_ordered (int > 0), quantity_received (int >= 0, default 0),
  unit_cost (numeric), line_total (numeric, quantity*unit_cost),
  supplier_sku (text, nullable), notes, created_at

### goods_received_notes
Receipt record for an inbound delivery against a PO. A PO may have multiple
GRNs (partial receipts). Receiving increments warehouse_stock.
- id, grn_number (unique, auto GRN-#####), po_id (FK purchase_orders),
  supplier_delivery_id (FK supplier_deliveries, nullable),
  warehouse_id (FK warehouses), received_by (text),
  received_date (timestamptz default now()), status: draft | received |
  cancelled, notes, created_at, updated_at

### goods_received_note_items
Line items on a GRN. Each references a PO item and captures qty accepted/rejected.
- id, grn_id (FK CASCADE), po_item_id (FK purchase_order_items),
  product_id (FK products), quantity_received (int > 0),
  quantity_rejected (int >= 0, default 0), rejection_reason (text),
  bin_id (FK warehouse_bins, nullable, putaway location), created_at

### supplier_deliveries
Inbound shipment from a supplier. May carry one or more POs; each GRN links
to a delivery. Tracks the physical shipment lifecycle.
- id, delivery_number (unique, auto SD-#####), supplier_id (FK suppliers),
  po_id (FK purchase_orders, nullable, primary PO if single),
  carrier (text), tracking_number (text), shipped_date (date),
  expected_delivery_date (date), actual_delivery_date (date),
  status: in_transit | delivered | partial | delayed | cancelled,
  warehouse_id (FK warehouses, destination), notes,
  created_at, updated_at

### back_orders
Tracks quantities ordered but not yet fulfilled (short shipment). Created
when a GRN receives less than the PO quantity, or explicitly.
- id, po_item_id (FK purchase_order_items), po_id (FK purchase_orders),
  supplier_id (FK suppliers), product_id (FK products),
  quantity_backordered (int > 0), reason (text),
  status: open | fulfilled | cancelled, expected_date (date),
  fulfilled_date (date), notes, created_at, updated_at

## 2. Sequences & auto-numbering
- Sequences pr_number_seq, po_number_seq, grn_number_seq, sd_number_seq.
- BEFORE INSERT triggers generate PR-#####, PO-#####, GRN-#####, SD-#####
  when the *_number column is null/empty.

## 3. Integration with inventory
- `sync_po_incoming()` trigger: AFTER INSERT/UPDATE/DELETE on
  purchase_order_items maintains product_inventory.incoming_quantity as
  SUM(quantity_ordered - quantity_received) across PO items (only for POs
  not cancelled). Keeps the inventory rollup accurate.
- `apply_grn_to_stock()` trigger: AFTER INSERT on goods_received_note_items,
  increments the related purchase_order_items.quantity_received, upserts
  warehouse_stock (quantity_on_hand += quantity_received) for the GRN's
  warehouse, and auto-creates back_order rows for short receipts.
- `recompute_po_totals()` trigger: AFTER INSERT/UPDATE/DELETE on
  purchase_order_items recomputes the parent purchase_orders subtotal and
  total from line items.
- `sync_po_status_from_grn()` trigger: AFTER INSERT/UPDATE on
  purchase_order_items sets purchase_orders.status to 'partial' or
  'received' based on whether all lines are fully received.

## 4. Security — RLS
Admin single-tenant app (anon + authenticated full CRUD), matching the
inventory/warehouse migration pattern. 4 policies per table.

## 5. Indexes
- requisitions: status, warehouse_id, requested_by
- requisition_items: requisition_id, product_id
- purchase_orders: supplier_id, status, warehouse_id, requisition_id, expected_delivery_date
- purchase_order_items: po_id, product_id
- goods_received_notes: po_id, warehouse_id, supplier_delivery_id, received_date
- goods_received_note_items: grn_id, po_item_id, product_id
- supplier_deliveries: supplier_id, po_id, status, warehouse_id
- back_orders: po_item_id, po_id, supplier_id, product_id, status

## 6. Notes
- The GRN trigger handles the full receive cycle: update PO item received qty,
  bump warehouse stock, create back orders for shortfalls, recompute PO totals
  and status, and resync incoming_quantity. All within the DB for consistency.
- Cancelling a PO does NOT delete received stock; it only stops future
  incoming-quantity accrual (the sync_po_incoming trigger excludes cancelled POs).
*/

-- ── Sequences ────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS pr_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS grn_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS sd_number_seq START 1;

-- ── purchase_requisitions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_number text NOT NULL UNIQUE,
  requested_by text,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','rejected','converted','cancelled')),
  notes text,
  required_by date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_pr_warehouse ON purchase_requisitions(warehouse_id);

DROP POLICY IF EXISTS "anon_select_purchase_requisitions" ON purchase_requisitions;
CREATE POLICY "anon_select_purchase_requisitions" ON purchase_requisitions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_purchase_requisitions" ON purchase_requisitions;
CREATE POLICY "anon_insert_purchase_requisitions" ON purchase_requisitions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_purchase_requisitions" ON purchase_requisitions;
CREATE POLICY "anon_update_purchase_requisitions" ON purchase_requisitions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_purchase_requisitions" ON purchase_requisitions;
CREATE POLICY "anon_delete_purchase_requisitions" ON purchase_requisitions FOR DELETE
  TO anon, authenticated USING (true);

-- ── purchase_requisition_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pri_requisition ON purchase_requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_pri_product ON purchase_requisition_items(product_id);

DROP POLICY IF EXISTS "anon_select_pri" ON purchase_requisition_items;
CREATE POLICY "anon_select_pri" ON purchase_requisition_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_pri" ON purchase_requisition_items;
CREATE POLICY "anon_insert_pri" ON purchase_requisition_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_pri" ON purchase_requisition_items;
CREATE POLICY "anon_update_pri" ON purchase_requisition_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_pri" ON purchase_requisition_items;
CREATE POLICY "anon_delete_pri" ON purchase_requisition_items FOR DELETE
  TO anon, authenticated USING (true);

-- ── purchase_orders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  requisition_id uuid REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','acknowledged','partial','received','cancelled')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  currency text NOT NULL DEFAULT 'KES',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_total numeric(14,2) NOT NULL DEFAULT 0,
  shipping_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  payment_terms_id uuid REFERENCES supplier_payment_terms(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_po_expected ON purchase_orders(expected_delivery_date);

DROP POLICY IF EXISTS "anon_select_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_select_purchase_orders" ON purchase_orders FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_insert_purchase_orders" ON purchase_orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_update_purchase_orders" ON purchase_orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_purchase_orders" ON purchase_orders;
CREATE POLICY "anon_delete_purchase_orders" ON purchase_orders FOR DELETE
  TO anon, authenticated USING (true);

-- ── purchase_order_items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
  quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  supplier_sku text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_poi_product ON purchase_order_items(product_id);

DROP POLICY IF EXISTS "anon_select_poi" ON purchase_order_items;
CREATE POLICY "anon_select_poi" ON purchase_order_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_poi" ON purchase_order_items;
CREATE POLICY "anon_insert_poi" ON purchase_order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_poi" ON purchase_order_items;
CREATE POLICY "anon_update_poi" ON purchase_order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_poi" ON purchase_order_items;
CREATE POLICY "anon_delete_poi" ON purchase_order_items FOR DELETE
  TO anon, authenticated USING (true);

-- ── supplier_deliveries ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number text NOT NULL UNIQUE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  po_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  carrier text,
  tracking_number text,
  shipped_date date,
  expected_delivery_date date,
  actual_delivery_date date,
  status text NOT NULL DEFAULT 'in_transit'
    CHECK (status IN ('in_transit','delivered','partial','delayed','cancelled')),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE supplier_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sd_supplier ON supplier_deliveries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sd_po ON supplier_deliveries(po_id);
CREATE INDEX IF NOT EXISTS idx_sd_status ON supplier_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_sd_warehouse ON supplier_deliveries(warehouse_id);

DROP POLICY IF EXISTS "anon_select_supplier_deliveries" ON supplier_deliveries;
CREATE POLICY "anon_select_supplier_deliveries" ON supplier_deliveries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_supplier_deliveries" ON supplier_deliveries;
CREATE POLICY "anon_insert_supplier_deliveries" ON supplier_deliveries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_supplier_deliveries" ON supplier_deliveries;
CREATE POLICY "anon_update_supplier_deliveries" ON supplier_deliveries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_supplier_deliveries" ON supplier_deliveries;
CREATE POLICY "anon_delete_supplier_deliveries" ON supplier_deliveries FOR DELETE
  TO anon, authenticated USING (true);

-- ── goods_received_notes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number text NOT NULL UNIQUE,
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_delivery_id uuid REFERENCES supplier_deliveries(id) ON DELETE SET NULL,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  received_by text,
  received_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('draft','received','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_received_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_warehouse ON goods_received_notes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_grn_delivery ON goods_received_notes(supplier_delivery_id);

DROP POLICY IF EXISTS "anon_select_grn" ON goods_received_notes;
CREATE POLICY "anon_select_grn" ON goods_received_notes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_grn" ON goods_received_notes;
CREATE POLICY "anon_insert_grn" ON goods_received_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_grn" ON goods_received_notes;
CREATE POLICY "anon_update_grn" ON goods_received_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_grn" ON goods_received_notes;
CREATE POLICY "anon_delete_grn" ON goods_received_notes FOR DELETE
  TO anon, authenticated USING (true);

-- ── goods_received_note_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goods_received_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  po_item_id uuid NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_received integer NOT NULL CHECK (quantity_received > 0),
  quantity_rejected integer NOT NULL DEFAULT 0 CHECK (quantity_rejected >= 0),
  rejection_reason text,
  bin_id uuid REFERENCES warehouse_bins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE goods_received_note_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_grni_grn ON goods_received_note_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grni_po_item ON goods_received_note_items(po_item_id);
CREATE INDEX IF NOT EXISTS idx_grni_product ON goods_received_note_items(product_id);

DROP POLICY IF EXISTS "anon_select_grni" ON goods_received_note_items;
CREATE POLICY "anon_select_grni" ON goods_received_note_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_grni" ON goods_received_note_items;
CREATE POLICY "anon_insert_grni" ON goods_received_note_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_grni" ON goods_received_note_items;
CREATE POLICY "anon_update_grni" ON goods_received_note_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_grni" ON goods_received_note_items;
CREATE POLICY "anon_delete_grni" ON goods_received_note_items FOR DELETE
  TO anon, authenticated USING (true);

-- ── back_orders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS back_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_item_id uuid NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_backordered integer NOT NULL CHECK (quantity_backordered > 0),
  reason text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','fulfilled','cancelled')),
  expected_date date,
  fulfilled_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE back_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bo_po_item ON back_orders(po_item_id);
CREATE INDEX IF NOT EXISTS idx_bo_po ON back_orders(po_id);
CREATE INDEX IF NOT EXISTS idx_bo_supplier ON back_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bo_product ON back_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_bo_status ON back_orders(status);

DROP POLICY IF EXISTS "anon_select_back_orders" ON back_orders;
CREATE POLICY "anon_select_back_orders" ON back_orders FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_back_orders" ON back_orders;
CREATE POLICY "anon_insert_back_orders" ON back_orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_back_orders" ON back_orders;
CREATE POLICY "anon_update_back_orders" ON back_orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_back_orders" ON back_orders;
CREATE POLICY "anon_delete_back_orders" ON back_orders FOR DELETE
  TO anon, authenticated USING (true);

-- ── Auto-number triggers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_pr_number() RETURNS trigger AS $$
BEGIN
  IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
    NEW.requisition_number := 'PR-' || lpad(nextval('pr_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_pr_number ON purchase_requisitions;
CREATE TRIGGER trg_pr_number BEFORE INSERT ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION generate_pr_number();

CREATE OR REPLACE FUNCTION generate_po_number() RETURNS trigger AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || lpad(nextval('po_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_po_number ON purchase_orders;
CREATE TRIGGER trg_po_number BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION generate_po_number();

CREATE OR REPLACE FUNCTION generate_grn_number() RETURNS trigger AS $$
BEGIN
  IF NEW.grn_number IS NULL OR NEW.grn_number = '' THEN
    NEW.grn_number := 'GRN-' || lpad(nextval('grn_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_grn_number ON goods_received_notes;
CREATE TRIGGER trg_grn_number BEFORE INSERT ON goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION generate_grn_number();

CREATE OR REPLACE FUNCTION generate_sd_number() RETURNS trigger AS $$
BEGIN
  IF NEW.delivery_number IS NULL OR NEW.delivery_number = '' THEN
    NEW.delivery_number := 'SD-' || lpad(nextval('sd_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sd_number ON supplier_deliveries;
CREATE TRIGGER trg_sd_number BEFORE INSERT ON supplier_deliveries
  FOR EACH ROW EXECUTE FUNCTION generate_sd_number();

-- ── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_procurement_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pr_updated ON purchase_requisitions;
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION touch_procurement_updated_at();
DROP TRIGGER IF EXISTS trg_po_updated ON purchase_orders;
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION touch_procurement_updated_at();
DROP TRIGGER IF EXISTS trg_grn_updated ON goods_received_notes;
CREATE TRIGGER trg_grn_updated BEFORE UPDATE ON goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION touch_procurement_updated_at();
DROP TRIGGER IF EXISTS trg_sd_updated ON supplier_deliveries;
CREATE TRIGGER trg_sd_updated BEFORE UPDATE ON supplier_deliveries
  FOR EACH ROW EXECUTE FUNCTION touch_procurement_updated_at();
DROP TRIGGER IF EXISTS trg_bo_updated ON back_orders;
CREATE TRIGGER trg_bo_updated BEFORE UPDATE ON back_orders
  FOR EACH ROW EXECUTE FUNCTION touch_procurement_updated_at();

-- ── PO totals recompute ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recompute_po_totals() RETURNS trigger AS $$
DECLARE p_id uuid;
BEGIN
  p_id := COALESCE(NEW.po_id, OLD.po_id);
  IF p_id IS NULL THEN RETURN NULL; END IF;
  UPDATE purchase_orders SET
    subtotal = COALESCE((SELECT SUM(line_total) FROM purchase_order_items WHERE po_id = p_id), 0),
    total = COALESCE((SELECT SUM(line_total) FROM purchase_order_items WHERE po_id = p_id), 0)
      + COALESCE((SELECT tax_total FROM purchase_orders WHERE id = p_id), 0)
      + COALESCE((SELECT shipping_total FROM purchase_orders WHERE id = p_id), 0)
  WHERE id = p_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_po_totals ON purchase_order_items;
CREATE TRIGGER trg_po_totals
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION recompute_po_totals();

-- ── line_total auto-calc on PO items ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_po_item_line_total() RETURNS trigger AS $$
BEGIN
  NEW.line_total := NEW.quantity_ordered * NEW.unit_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_poi_line_total ON purchase_order_items;
CREATE TRIGGER trg_poi_line_total
  BEFORE INSERT OR UPDATE OF quantity_ordered, unit_cost ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION calc_po_item_line_total();

-- ── incoming_quantity sync from PO items ─────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_po_incoming() RETURNS trigger AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  IF pid IS NULL THEN RETURN NULL; END IF;
  UPDATE product_inventory SET incoming_quantity = COALESCE(
    (SELECT SUM(quantity_ordered - quantity_received)
     FROM purchase_order_items poi
     JOIN purchase_orders po ON po.id = poi.po_id
     WHERE poi.product_id = pid AND po.status NOT IN ('cancelled','received')),
    0
  )
  WHERE product_id = pid;
  IF NOT FOUND THEN
    INSERT INTO product_inventory (product_id, incoming_quantity)
    VALUES (pid, COALESCE(
      (SELECT SUM(quantity_ordered - quantity_received)
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.po_id
       WHERE poi.product_id = pid AND po.status NOT IN ('cancelled','received')),
      0
    ))
    ON CONFLICT (product_id) DO UPDATE SET incoming_quantity = EXCLUDED.incoming_quantity;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_po_incoming ON purchase_order_items;
CREATE TRIGGER trg_po_incoming
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION sync_po_incoming();

-- Also resync incoming when a PO status flips to cancelled/received
CREATE OR REPLACE FUNCTION sync_po_incoming_on_status() RETURNS trigger AS $$
DECLARE pid uuid;
BEGIN
  FOR pid IN
    SELECT product_id FROM purchase_order_items WHERE po_id = NEW.id
  LOOP
    UPDATE product_inventory SET incoming_quantity = COALESCE(
      (SELECT SUM(quantity_ordered - quantity_received)
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.po_id
       WHERE poi.product_id = pid AND po.status NOT IN ('cancelled','received')),
      0
    )
    WHERE product_id = pid;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_po_status_incoming ON purchase_orders;
CREATE TRIGGER trg_po_status_incoming
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION sync_po_incoming_on_status();

-- ── GRN receive: bump PO item received, warehouse stock, back orders ─────────
CREATE OR REPLACE FUNCTION apply_grn_to_stock() RETURNS trigger AS $$
DECLARE
  v_po_item purchase_order_items%ROWTYPE;
  v_po_id uuid;
  v_warehouse uuid;
  v_grn goods_received_notes%ROWTYPE;
  v_short integer;
BEGIN
  SELECT * INTO v_po_item FROM purchase_order_items WHERE id = NEW.po_item_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO v_grn FROM goods_received_notes WHERE id = NEW.grn_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_warehouse := v_grn.warehouse_id;
  v_po_id := v_po_item.po_id;

  -- Increment received quantity on the PO item
  UPDATE purchase_order_items
    SET quantity_received = quantity_received + NEW.quantity_received
    WHERE id = NEW.po_item_id;

  -- Upsert warehouse_stock (quantity_on_hand += received)
  INSERT INTO warehouse_stock (product_id, warehouse_id, quantity_on_hand, quantity_reserved)
    VALUES (v_po_item.product_id, v_warehouse, NEW.quantity_received, 0)
    ON CONFLICT (product_id, warehouse_id) DO UPDATE SET
      quantity_on_hand = warehouse_stock.quantity_on_hand + EXCLUDED.quantity_on_hand;

  -- If short, create a back_order for the remaining quantity
  v_short := (v_po_item.quantity_ordered - (v_po_item.quantity_received + NEW.quantity_received));
  IF v_short > 0 THEN
    INSERT INTO back_orders (po_item_id, po_id, supplier_id, product_id, quantity_backordered, reason, status)
    SELECT v_po_item.id, v_po_id, po.supplier_id, v_po_item.product_id, v_short,
           COALESCE(NEW.rejection_reason, 'Short receipt on GRN'), 'open'
    FROM purchase_orders po WHERE po.id = v_po_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_grn_apply_stock ON goods_received_note_items;
CREATE TRIGGER trg_grn_apply_stock
  AFTER INSERT ON goods_received_note_items
  FOR EACH ROW EXECUTE FUNCTION apply_grn_to_stock();

-- ── PO status auto-derive from received quantities ───────────────────────────
CREATE OR REPLACE FUNCTION sync_po_status_from_items() RETURNS trigger AS $$
DECLARE
  p_id uuid;
  all_received boolean;
  any_received boolean;
  cur_status text;
BEGIN
  p_id := COALESCE(NEW.po_id, OLD.po_id);
  IF p_id IS NULL THEN RETURN NULL; END IF;
  SELECT status INTO cur_status FROM purchase_orders WHERE id = p_id;
  IF cur_status IN ('draft','cancelled','sent','acknowledged') OR cur_status IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT
    COALESCE(BOOL_AND(quantity_received >= quantity_ordered), false),
    COALESCE(BOOL_OR(quantity_received > 0), false)
  INTO all_received, any_received
  FROM purchase_order_items WHERE po_id = p_id;
  IF all_received THEN
    UPDATE purchase_orders SET status = 'received' WHERE id = p_id;
  ELSIF any_received THEN
    UPDATE purchase_orders SET status = 'partial' WHERE id = p_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_po_status_items ON purchase_order_items;
CREATE TRIGGER trg_po_status_items
  AFTER UPDATE OF quantity_received ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION sync_po_status_from_items();

-- ── Procurement status helper RPC ────────────────────────────────────────────
-- Returns counts by status for the dashboard overview.
CREATE OR REPLACE FUNCTION procurement_status_summary()
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'requisitions', jsonb_object_agg(status, cnt) FILTER (WHERE status IS NOT NULL),
    'purchase_orders', jsonb_object_agg(status, cnt) FILTER (WHERE status IS NOT NULL),
    'deliveries', jsonb_object_agg(status, cnt) FILTER (WHERE status IS NOT NULL),
    'back_orders', jsonb_object_agg(status, cnt) FILTER (WHERE status IS NOT NULL),
    'totals', jsonb_build_object(
      'open_pos', (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('draft','sent','acknowledged','partial')),
      'open_back_orders', (SELECT COUNT(*) FROM back_orders WHERE status = 'open'),
      'in_transit', (SELECT COUNT(*) FROM supplier_deliveries WHERE status = 'in_transit'),
      'pending_requisitions', (SELECT COUNT(*) FROM purchase_requisitions WHERE status IN ('draft','pending_approval','approved'))
    )
  )
  FROM (
    SELECT 'requisitions' AS src, status, COUNT(*) AS cnt FROM purchase_requisitions GROUP BY status
    UNION ALL
    SELECT 'purchase_orders', status, COUNT(*) FROM purchase_orders GROUP BY status
    UNION ALL
    SELECT 'deliveries', status, COUNT(*) FROM supplier_deliveries GROUP BY status
    UNION ALL
    SELECT 'back_orders', status, COUNT(*) FROM back_orders GROUP BY status
  ) t;
$$;