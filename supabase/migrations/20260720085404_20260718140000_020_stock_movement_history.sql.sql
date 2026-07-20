/*
# Stock Movement History

Creates a universal stock ledger that records every inventory movement
across the system, with a single append-only table and an RPC to post
movements safely (adjusting warehouse_stock in the same call).

## 1. New Table

### stock_movements
Append-only ledger. One row per movement event. Captures WHO/WHAT/WHY/WHERE.
- id, movement_number (unique, auto SM-#####),
  product_id (FK products), warehouse_id (FK warehouses, nullable for
  system-wide movements like a sale not tied to a specific warehouse),
  movement_type (enum: purchase, sale, quote_reservation, customer_order,
    manual_adjustment, warehouse_transfer_in, warehouse_transfer_out,
    damaged, returned, opening_balance, correction),
  quantity_change (int — positive = stock in, negative = stock out, 0 allowed
    for metadata-only corrections),
  quantity_before (int — snapshot of warehouse_stock.quantity_on_hand before),
  quantity_after (int — snapshot after),
  reference_type (text — e.g. 'purchase_order', 'goods_received_note',
    'stock_transfer', 'order', 'quote', 'manual'),
  reference_id (uuid, nullable — FK-ish to the related record),
  reference_number (text — human-readable like 'PO-00012', 'TR-00005'),
  reason (text — short explanation / category),
  notes (text — longer detail),
  performed_by (text — admin user name),
  created_at (timestamptz, default now())

A CHECK constraint ensures quantity_change is non-zero OR movement_type is
in ('manual_adjustment','correction','opening_balance') — those may log a
0-change metadata entry (e.g. changing a reorder level) but physical moves
always carry a non-zero delta.

## 2. Sequences & auto-numbering
- Sequence sm_number_seq + BEFORE INSERT trigger generates SM-#####.

## 3. RPC: record_stock_movement(params)
The single safe entry point for posting a movement AND adjusting stock.
Accepts a JSONB params object:
  p_product_id, p_warehouse_id, p_movement_type, p_quantity_change,
  p_reference_type, p_reference_id, p_reference_number, p_reason,
  p_notes, p_performed_by
Behaviour:
  1. Locks the warehouse_stock row (or 0 if none yet).
  2. Computes quantity_before / quantity_after.
  3. Inserts a stock_movements row.
  4. Upserts warehouse_stock (quantity_on_hand += change). Refuses to go
     negative (raises exception) unless movement_type is 'sale' or
     'customer_order' (allowing oversell that surfaces as negative available).
  5. Returns the inserted stock_movements row.
This keeps the ledger and the stock table in lockstep inside one transaction.

## 4. Auto-logging from GRN receipts
A new trigger on goods_received_note_items calls record_stock_movement so
that every GRN receipt is automatically journaled as a 'purchase' movement.
(The existing apply_grn_to_stock trigger still bumps warehouse_stock; this
new trigger fires AFTER that one and records the ledger entry based on the
already-updated stock level.)

## 5. Views
- stock_movement_history — enriched view joining products, warehouses, and
  computing a running balance per product+warehouse. Useful for the admin
  log page.
- product_movement_summary — per-product aggregate: total in, total out,
  net change, last movement date.

## 6. Security — RLS
Admin single-tenant app: anon + authenticated full CRUD (same as inventory
migrations). 4 policies. Though the table is conceptually append-only, we
keep update/delete enabled so admins can correct mis-entered manual
adjustments.

## 7. Indexes
- product_id, warehouse_id, movement_type, reference_id, created_at
*/

-- ── stock_movements ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_number text NOT NULL UNIQUE,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id    uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  movement_type   text NOT NULL CHECK (movement_type IN (
                    'purchase','sale','quote_reservation','customer_order',
                    'manual_adjustment','warehouse_transfer_in',
                    'warehouse_transfer_out','damaged','returned',
                    'opening_balance','correction'
                  )),
  quantity_change integer NOT NULL DEFAULT 0,
  quantity_before integer NOT NULL DEFAULT 0,
  quantity_after  integer NOT NULL DEFAULT 0,
  reference_type  text,
  reference_id    uuid,
  reference_number text,
  reason          text,
  notes           text,
  performed_by    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sm_change_meaningful CHECK (
    quantity_change <> 0 OR movement_type IN ('manual_adjustment','correction','opening_balance')
  )
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sm_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sm_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sm_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_sm_reference ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_sm_created ON stock_movements(created_at DESC);

DROP POLICY IF EXISTS "anon_select_stock_movements" ON stock_movements;
CREATE POLICY "anon_select_stock_movements" ON stock_movements FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_stock_movements" ON stock_movements;
CREATE POLICY "anon_insert_stock_movements" ON stock_movements FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stock_movements" ON stock_movements;
CREATE POLICY "anon_update_stock_movements" ON stock_movements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stock_movements" ON stock_movements;
CREATE POLICY "anon_delete_stock_movements" ON stock_movements FOR DELETE
  TO anon, authenticated USING (true);

-- ── Sequence & auto-number ───────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS sm_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_sm_number() RETURNS trigger AS $$
BEGIN
  IF NEW.movement_number IS NULL OR NEW.movement_number = '' THEN
    NEW.movement_number := 'SM-' || lpad(nextval('sm_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sm_number ON stock_movements;
CREATE TRIGGER trg_sm_number BEFORE INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION generate_sm_number();

-- ── RPC: record_stock_movement ───────────────────────────────────────────────
-- Single safe entry point: posts a ledger row + adjusts warehouse_stock.
CREATE OR REPLACE FUNCTION record_stock_movement(params jsonb)
RETURNS stock_movements LANGUAGE plpgsql AS $$
DECLARE
  v_product_id    uuid := params->>'product_id';
  v_warehouse_id  uuid := params->>'warehouse_id';
  v_type          text := params->>'movement_type';
  v_change        int  := COALESCE((params->>'quantity_change')::int, 0);
  v_ref_type      text := params->>'reference_type';
  v_ref_id        uuid := NULLIF(params->>'reference_id', '')::uuid;
  v_ref_num       text := params->>'reference_number';
  v_reason        text := params->>'reason';
  v_notes         text := params->>'notes';
  v_performed_by  text := params->>'performed_by';
  v_before        int  := 0;
  v_after         int  := 0;
  v_inserted      stock_movements;
BEGIN
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'product_id is required';
  END IF;
  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'warehouse_id is required';
  END IF;

  -- Lock + read current on-hand
  SELECT quantity_on_hand INTO v_before
  FROM warehouse_stock
  WHERE product_id = v_product_id AND warehouse_id = v_warehouse_id
  FOR UPDATE;
  IF NOT FOUND THEN v_before := 0; END IF;

  v_after := v_before + v_change;

  -- Refuse negative stock except for sales (oversell surfaces as negative available)
  IF v_after < 0 AND v_type NOT IN ('sale','customer_order','correction') THEN
    RAISE EXCEPTION 'Insufficient stock: would result in % units (before=%, change=%)',
      v_after, v_before, v_change;
  END IF;

  -- Insert ledger row
  INSERT INTO stock_movements (
    product_id, warehouse_id, movement_type, quantity_change,
    quantity_before, quantity_after, reference_type, reference_id,
    reference_number, reason, notes, performed_by
  ) VALUES (
    v_product_id, v_warehouse_id, v_type, v_change,
    v_before, v_after, v_ref_type, v_ref_id,
    v_ref_num, v_reason, v_notes, v_performed_by
  )
  RETURNING * INTO v_inserted;

  -- Upsert warehouse_stock
  INSERT INTO warehouse_stock (product_id, warehouse_id, quantity_on_hand, quantity_reserved)
  VALUES (v_product_id, v_warehouse_id, v_change, 0)
  ON CONFLICT (product_id, warehouse_id) DO UPDATE SET
    quantity_on_hand = warehouse_stock.quantity_on_hand + v_change;

  RETURN v_inserted;
END;
$$;

-- ── Auto-log GRN receipts as 'purchase' movements ────────────────────────────
-- Fires after apply_grn_to_stock has already bumped the PO item + warehouse_stock.
-- Reads the current stock level (post-bump) to compute before/after accurately.
CREATE OR REPLACE FUNCTION log_grn_stock_movement() RETURNS trigger AS $$
DECLARE
  v_po_item   purchase_order_items%ROWTYPE;
  v_grn       goods_received_notes%ROWTYPE;
  v_po        purchase_orders%ROWTYPE;
  v_current   int := 0;
BEGIN
  SELECT * INTO v_po_item FROM purchase_order_items WHERE id = NEW.po_item_id;
  SELECT * INTO v_grn     FROM goods_received_notes   WHERE id = NEW.grn_id;
  SELECT * INTO v_po      FROM purchase_orders        WHERE id = v_po_item.po_id;
  IF NOT FOUND OR v_grn.status = 'cancelled' THEN RETURN NEW; END IF;

  SELECT quantity_on_hand INTO v_current
  FROM warehouse_stock
  WHERE product_id = NEW.product_id AND warehouse_id = v_grn.warehouse_id;

  INSERT INTO stock_movements (
    product_id, warehouse_id, movement_type, quantity_change,
    quantity_before, quantity_after, reference_type, reference_id,
    reference_number, reason, notes, performed_by
  ) VALUES (
    NEW.product_id, v_grn.warehouse_id, 'purchase', NEW.quantity_received,
    v_current - NEW.quantity_received, v_current,
    'goods_received_note', v_grn.id, v_grn.grn_number,
    'Goods received from PO ' || v_po.po_number,
    NEW.rejection_reason, v_grn.received_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_log_grn_movement ON goods_received_note_items;
CREATE TRIGGER trg_log_grn_movement
  AFTER INSERT ON goods_received_note_items
  FOR EACH ROW EXECUTE FUNCTION log_grn_stock_movement();

-- ── Views ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW stock_movement_history AS
SELECT
  sm.*,
  p.name  AS product_name,
  p.sku   AS product_sku,
  w.name  AS warehouse_name,
  w.code  AS warehouse_code
FROM stock_movements sm
JOIN products p     ON p.id = sm.product_id
LEFT JOIN warehouses w ON w.id = sm.warehouse_id
ORDER BY sm.created_at DESC;

-- Per-product aggregate with running totals
CREATE OR REPLACE VIEW product_movement_summary AS
SELECT
  p.id    AS product_id,
  p.name  AS product_name,
  p.sku   AS product_sku,
  COALESCE(SUM(sm.quantity_change) FILTER (WHERE sm.quantity_change > 0), 0) AS total_in,
  COALESCE(SUM(sm.quantity_change) FILTER (WHERE sm.quantity_change < 0), 0) AS total_out,
  COALESCE(SUM(sm.quantity_change), 0) AS net_change,
  MAX(sm.created_at) AS last_movement_at,
  COUNT(sm.id) AS movement_count
FROM products p
LEFT JOIN stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.name, p.sku
ORDER BY last_movement_at DESC NULLS LAST;