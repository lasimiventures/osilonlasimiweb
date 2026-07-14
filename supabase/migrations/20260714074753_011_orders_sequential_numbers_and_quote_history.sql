/*
# Milestone 4.7 — Orders Integration & Quote History

## Changes

### 1. Sequential order numbers (ORD-YYYY-NNNNNN)
- Creates `order_number_seq` PostgreSQL sequence (starts at 1).
- Creates `generate_order_number()` function returning "ORD-YYYY-NNNNNN"
  (matches the QT-YYYY-NNNNNN pattern used by quotes).
- Replaces the existing UUID-based `order_number` default with the
  sequential generator so every new order gets a human-readable reference.

### 2. Linked order reference on quote_requests
- Adds `linked_order_number` (text) to `quote_requests` so the quote record
  permanently stores which order it converted into (e.g. "ORD-2026-000008").
  This survives without a JOIN and makes the quote detail page instant to render.

### 3. quote_history event log
- New table `quote_history` records every significant event on a quote:
  status transitions, sends, edits, conversions, etc.
- Columns: id, quote_request_id (FK), event_type, from_status, to_status,
  actor, metadata (jsonb), created_at.
- RLS: authenticated users can INSERT and SELECT all rows (admin-only app).

### 4. Back-fill existing orders
- Any existing orders that still have UUID-style order_numbers keep them
  (no data loss). Only new orders get sequential numbers.
*/

-- ─── 1. Order number sequence & generator ────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- Replace the random UUID default with the sequential one
ALTER TABLE orders
  ALTER COLUMN order_number SET DEFAULT generate_order_number();

-- ─── 2. Linked order reference on quote_requests ─────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'linked_order_number'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN linked_order_number text;
  END IF;
END $$;

-- ─── 3. Quote history / activity log ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_history (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid        NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  event_type       text        NOT NULL,   -- 'status_change' | 'sent_email' | 'sent_whatsapp' | 'pdf_downloaded' | 'edited' | 'converted' | 'note'
  from_status      text,
  to_status        text,
  actor            text,                   -- e.g. admin email or 'system'
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_history_quote_id
  ON quote_history(quote_request_id, created_at DESC);

ALTER TABLE quote_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_quote_history" ON quote_history;
CREATE POLICY "auth_select_quote_history" ON quote_history FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_quote_history" ON quote_history;
CREATE POLICY "auth_insert_quote_history" ON quote_history FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_quote_history" ON quote_history;
CREATE POLICY "anon_select_quote_history" ON quote_history FOR SELECT
  TO anon USING (false);
