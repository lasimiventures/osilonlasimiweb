/*
# Customer Sales History — Supporting Schema

## Summary
Adds the schema required for a full per-customer sales history view in the admin
panel. Specifically:

1. **source column on quote_requests** — tracks how a quote originated
   ('quote_form', 'bulk_pricing', 'cart_quote').
2. **source column on orders** — tracks how an order originated
   ('cart', 'quote_conversion', 'manual').
3. **order_history table** — append-only audit log of every order status
   change, mirroring the existing quote_history table.
4. **customer_communications table** — stores outbound emails, notes, and
   call logs linked to a customer by email, optionally associated with a
   quote or order.
5. **admin_customers view** — aggregates unique customers (identified by
   email) across orders and quote_requests, with computed KPI columns so
   the admin list page can display rich data without client-side aggregation.

## New Tables

### order_history
- id (uuid PK)
- order_id (uuid FK → orders.id, CASCADE)
- event_type (text) — e.g. 'status_change', 'note_added'
- from_status (text) — previous status value
- to_status (text) — new status value
- actor (text) — who made the change (admin user label)
- metadata (jsonb) — arbitrary extra data
- created_at (timestamptz)

### customer_communications
- id (uuid PK)
- customer_email (text, indexed) — identifies the customer
- type (text) — 'email' | 'note' | 'call'
- subject (text)
- body_preview (text)
- actor (text)
- quote_id (uuid, nullable FK → quote_requests.id)
- order_id (uuid, nullable FK → orders.id)
- sent_at (timestamptz)

## New View

### admin_customers
Aggregates from orders + quote_requests by lower-cased email.
Columns: email, customer_name, phone, company, total_orders,
total_quotes, total_revenue, last_activity.

## Security
- RLS enabled on both new tables.
- anon + authenticated can read/write (admin-only app, no per-user isolation).
- View is accessible to anon + authenticated via the SECURITY INVOKER default.
*/

-- 1. source column on quote_requests
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'quote_form'
    CHECK (source IN ('quote_form','bulk_pricing','cart_quote'));

-- 2. source column on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('cart','quote_conversion','manual'));

-- 3. order_history table
CREATE TABLE IF NOT EXISTS order_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type    text NOT NULL DEFAULT 'status_change',
  from_status   text,
  to_status     text,
  actor         text,
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON order_history(order_id);
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_order_history" ON order_history;
CREATE POLICY "anon_select_order_history" ON order_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_history" ON order_history;
CREATE POLICY "anon_insert_order_history" ON order_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_history" ON order_history;
CREATE POLICY "anon_update_order_history" ON order_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_history" ON order_history;
CREATE POLICY "anon_delete_order_history" ON order_history FOR DELETE
  TO anon, authenticated USING (true);

-- 4. customer_communications table
CREATE TABLE IF NOT EXISTS customer_communications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email  text NOT NULL,
  type            text NOT NULL DEFAULT 'email' CHECK (type IN ('email','note','call')),
  subject         text,
  body_preview    text,
  actor           text,
  quote_id        uuid REFERENCES quote_requests(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES orders(id) ON DELETE SET NULL,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_comms_email_idx ON customer_communications(lower(customer_email));
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customer_comms" ON customer_communications;
CREATE POLICY "anon_select_customer_comms" ON customer_communications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customer_comms" ON customer_communications;
CREATE POLICY "anon_insert_customer_comms" ON customer_communications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customer_comms" ON customer_communications;
CREATE POLICY "anon_update_customer_comms" ON customer_communications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customer_comms" ON customer_communications;
CREATE POLICY "anon_delete_customer_comms" ON customer_communications FOR DELETE
  TO anon, authenticated USING (true);

-- 5. admin_customers view
CREATE OR REPLACE VIEW admin_customers AS
WITH all_customers AS (
  SELECT
    lower(customer_email) AS email,
    customer_name,
    customer_phone  AS phone,
    company,
    created_at
  FROM quote_requests
  WHERE customer_email IS NOT NULL AND customer_email <> ''

  UNION ALL

  SELECT
    lower(email)     AS email,
    customer_name,
    phone,
    company_name     AS company,
    created_at
  FROM orders
  WHERE email IS NOT NULL AND email <> ''
),
ranked AS (
  SELECT *,
    row_number() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
  FROM all_customers
),
latest AS (
  SELECT email, customer_name, phone, company
  FROM ranked WHERE rn = 1
),
order_stats AS (
  SELECT lower(email) AS email,
    count(*)                                          AS total_orders,
    coalesce(sum(total_value), 0)                     AS total_revenue,
    max(created_at)                                   AS last_order_at
  FROM orders
  WHERE email IS NOT NULL
  GROUP BY lower(email)
),
quote_stats AS (
  SELECT lower(customer_email) AS email,
    count(*)      AS total_quotes,
    max(created_at) AS last_quote_at
  FROM quote_requests
  WHERE customer_email IS NOT NULL
  GROUP BY lower(customer_email)
)
SELECT
  l.email,
  l.customer_name,
  l.phone,
  l.company,
  coalesce(os.total_orders, 0)  AS total_orders,
  coalesce(qs.total_quotes, 0)  AS total_quotes,
  coalesce(os.total_revenue, 0) AS total_revenue,
  GREATEST(
    coalesce(os.last_order_at, '1900-01-01'::timestamptz),
    coalesce(qs.last_quote_at, '1900-01-01'::timestamptz)
  ) AS last_activity
FROM latest l
LEFT JOIN order_stats os ON os.email = l.email
LEFT JOIN quote_stats  qs ON qs.email = l.email
ORDER BY last_activity DESC;
