/*
# Inventory Alerts (fix: date-diff casts)

Same as 022 but the day-difference expressions use direct integer→numeric
casts instead of EXTRACT(DAY FROM ...) since date - date returns integer.
*/

-- ── warranty_expiry_date on products ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='warranty_expiry_date') THEN
    ALTER TABLE products ADD COLUMN warranty_expiry_date date;
  END IF;
END $$;

-- ── inventory_alerts table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      text NOT NULL
    CHECK (alert_type IN ('low_stock','out_of_stock','expiring_warranty',
        'incoming_shipment','price_change','supplier_delay')),
  severity        text NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info','warning','critical')),
  title           text NOT NULL,
  message         text NOT NULL,
  entity_type     text NOT NULL DEFAULT 'system'
    CHECK (entity_type IN ('product','purchase_order','supplier','system')),
  entity_id       uuid,
  entity_ref      text,
  metric_value    numeric,
  threshold_value numeric,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','acknowledged','resolved')),
  acknowledged_by text,
  acknowledged_at timestamptz,
  resolved_by     text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_alerts_active
  ON inventory_alerts (alert_type, entity_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ia_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_ia_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ia_severity ON inventory_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ia_entity ON inventory_alerts(entity_id);
CREATE INDEX IF NOT EXISTS idx_ia_created ON inventory_alerts(created_at DESC);

DROP POLICY IF EXISTS "anon_select_inventory_alerts" ON inventory_alerts;
CREATE POLICY "anon_select_inventory_alerts" ON inventory_alerts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inventory_alerts" ON inventory_alerts;
CREATE POLICY "anon_insert_inventory_alerts" ON inventory_alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory_alerts" ON inventory_alerts;
CREATE POLICY "anon_update_inventory_alerts" ON inventory_alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inventory_alerts" ON inventory_alerts;
CREATE POLICY "anon_delete_inventory_alerts" ON inventory_alerts FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION update_ia_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_ia_updated ON inventory_alerts;
CREATE TRIGGER trg_ia_updated BEFORE UPDATE ON inventory_alerts
  FOR EACH ROW EXECUTE FUNCTION update_ia_updated_at();

-- ── refresh_inventory_alerts() ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_inventory_alerts() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE active_count integer;
BEGIN
  -- 1. LOW STOCK
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'low_stock', 'warning',
    'Low stock: ' || p.name,
    p.sku || ' has ' || pi.stock_quantity || ' units (reorder at ' || pi.reorder_level || ').',
    'product', p.id, p.sku, pi.stock_quantity, pi.reorder_level
  FROM product_inventory pi
  JOIN products p ON p.id = pi.product_id
  WHERE pi.stock_quantity > 0 AND pi.reorder_level > 0 AND pi.stock_quantity <= pi.reorder_level
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- 2. OUT OF STOCK
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'out_of_stock', 'critical',
    'Out of stock: ' || p.name,
    p.sku || ' is out of stock (0 units on hand).',
    'product', p.id, p.sku, 0, 0
  FROM product_inventory pi
  JOIN products p ON p.id = pi.product_id
  WHERE pi.stock_quantity <= 0
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- 3. EXPIRING WARRANTY (within next 60 days)
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'expiring_warranty', 'warning',
    'Warranty expiring: ' || p.name,
    p.sku || ' warranty expires on ' || p.warranty_expiry_date::text || '.',
    'product', p.id, p.sku,
    (p.warranty_expiry_date - CURRENT_DATE)::numeric, 60
  FROM products p
  WHERE p.warranty_expiry_date IS NOT NULL
    AND p.warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- 4. INCOMING SHIPMENT (PO expected within 7 days)
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'incoming_shipment', 'info',
    'Incoming shipment: ' || po.po_number,
    po.po_number || ' expected by ' || po.expected_delivery_date::text || '.',
    'purchase_order', po.id, po.po_number,
    (po.expected_delivery_date - CURRENT_DATE)::numeric, 7
  FROM purchase_orders po
  WHERE po.status IN ('sent','partially_received')
    AND po.expected_delivery_date IS NOT NULL
    AND po.expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- 5. PRICE CHANGE (cost history in last 24h)
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'price_change', 'info',
    'Price changed: ' || p.name,
    p.sku || ' cost updated from ' || COALESCE(ch.old_cost::text,'—') || ' to ' || COALESCE(ch.new_cost::text,'—') || '.',
    'product', p.id, p.sku, ch.new_cost, ch.old_cost
  FROM product_cost_history ch
  JOIN products p ON p.id = ch.product_id
  WHERE ch.created_at >= now() - INTERVAL '24 hours'
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- 6. SUPPLIER DELAY (PO past expected date, not received/cancelled)
  INSERT INTO inventory_alerts (alert_type, severity, title, message, entity_type, entity_id, entity_ref, metric_value, threshold_value)
  SELECT 'supplier_delay', 'critical',
    'Supplier delay: ' || po.po_number,
    po.po_number || ' was expected ' || po.expected_delivery_date::text || ' and is still ' || po.status || '.',
    'purchase_order', po.id, po.po_number,
    (CURRENT_DATE - po.expected_delivery_date)::numeric, 0
  FROM purchase_orders po
  WHERE po.expected_delivery_date IS NOT NULL
    AND po.expected_delivery_date < CURRENT_DATE
    AND po.status NOT IN ('received','cancelled')
  ON CONFLICT (alert_type, entity_id) WHERE status = 'active' DO NOTHING;

  -- AUTO-RESOLVE
  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='low_stock' AND a.status IN ('active','acknowledged')
    AND EXISTS (SELECT 1 FROM product_inventory pi JOIN products p ON p.id=pi.product_id
      WHERE pi.product_id=a.entity_id AND (pi.stock_quantity > pi.reorder_level OR pi.reorder_level=0));

  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='out_of_stock' AND a.status IN ('active','acknowledged')
    AND EXISTS (SELECT 1 FROM product_inventory pi WHERE pi.product_id=a.entity_id AND pi.stock_quantity > 0);

  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='expiring_warranty' AND a.status IN ('active','acknowledged')
    AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id=a.entity_id
      AND p.warranty_expiry_date IS NOT NULL
      AND p.warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days');

  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='incoming_shipment' AND a.status IN ('active','acknowledged')
    AND NOT EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id=a.entity_id
      AND po.status IN ('sent','partially_received')
      AND po.expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days');

  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='price_change' AND a.status IN ('active','acknowledged')
    AND NOT EXISTS (SELECT 1 FROM product_cost_history ch WHERE ch.product_id=a.entity_id
      AND ch.created_at >= now() - INTERVAL '24 hours');

  UPDATE inventory_alerts a SET status='resolved', resolved_by='system', resolved_at=now(), updated_at=now()
  WHERE a.alert_type='supplier_delay' AND a.status IN ('active','acknowledged')
    AND NOT EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id=a.entity_id
      AND po.expected_delivery_date < CURRENT_DATE
      AND po.status NOT IN ('received','cancelled'));

  SELECT count(*) INTO active_count FROM inventory_alerts WHERE status='active';
  RETURN active_count;
END;
$$;

SELECT refresh_inventory_alerts();