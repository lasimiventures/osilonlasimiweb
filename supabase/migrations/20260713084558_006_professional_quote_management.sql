/*
# Professional Quote Management

Upgrades the quote_requests table to support a full B2B sales workflow with
sequential quote numbers, expanded status lifecycle, and new fields required
for professional quotations.

## What Changes

### 1. Sequential Quote Numbers (QT-YYYY-NNNNNN)
- Creates a `quote_number_seq` PostgreSQL sequence (starts at 1, never resets)
- Creates `generate_quote_number()` function: returns "QT-YYYY-NNNNNN" using
  the current year and zero-padded sequence value (e.g. QT-2026-000001)
- Adds `quote_number` column to `quote_requests` as the primary human identifier
- Backfills existing rows with sequential numbers, then sets the column as the
  default for future inserts; adds a UNIQUE constraint

### 2. New Columns on `quote_requests`
- `quote_number` (text, unique) — sequential reference e.g. QT-2026-000001
- `sales_person` (text) — name of the OSIL sales person handling this quote
- `expiry_date` (date) — when the issued quote expires (set when status = quoted)
- `quoted_at` (timestamptz) — timestamp when the formal quote was issued
- `accepted_at` (timestamptz) — timestamp when customer accepted
- `converted_at` (timestamptz) — timestamp when converted to an order
- `total_value` (numeric 12,2) — total KES value of the issued quote

### 3. New Column on `quote_items`
- `subtotal` (numeric 12,2) — quantity × unit_price, computed and stored on save

### 4. Status Lifecycle Normalization
Old statuses are migrated to the new extended set:
- `pending`   → `submitted`   (customer has submitted the request)
- `reviewing` → `under_review` (admin is reviewing)
- `declined`  → `rejected`    (admin or customer rejected)

New status values added:
- `draft`              — admin-created quote not yet sent to customer
- `submitted`          — customer submitted a quote request (replaces pending)
- `under_review`       — sales team is reviewing (replaces reviewing)
- `quoted`             — formal quotation has been issued to the customer
- `awaiting_customer`  — quote sent, waiting for customer acceptance/rejection
- `accepted`           — customer has accepted the quote
- `rejected`           — quote was declined (replaces declined)
- `expired`            — quote has passed its expiry date without a decision
- `converted_to_order` — quote accepted and converted to a purchase order

Default status for new quote_requests changes from `pending` to `submitted`.

### 5. Admin Write Policies
Adds UPDATE and DELETE policies on `quote_requests` and `quote_items` for
authenticated admin users. Also adds an admin-scoped INSERT on quote_items
(admins may add line items to draft quotes). These are separate from the
existing anon INSERT policy that covers storefront submissions.

## Safety Notes
1. All column additions use IF NOT EXISTS — safe to re-run
2. Sequence and function use CREATE IF NOT EXISTS / CREATE OR REPLACE — idempotent
3. Status UPDATE statements are idempotent (no rows match after first run)
4. UNIQUE constraint uses DO $$ block to avoid duplicate constraint errors
5. No columns are dropped or renamed — no data loss risk
*/

-- ─── Quote number sequence & function ────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text AS $$
BEGIN
  RETURN 'QT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('quote_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ─── Add quote_number column ──────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'quote_number'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN quote_number text;
  END IF;
END $$;

-- Backfill existing rows (idempotent: only fills NULLs)
UPDATE quote_requests
SET quote_number = generate_quote_number()
WHERE quote_number IS NULL;

-- Add UNIQUE constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quote_requests_quote_number_unique'
  ) THEN
    ALTER TABLE quote_requests
      ADD CONSTRAINT quote_requests_quote_number_unique UNIQUE (quote_number);
  END IF;
END $$;

-- Set default for future rows
ALTER TABLE quote_requests
  ALTER COLUMN quote_number SET DEFAULT generate_quote_number();

-- ─── New columns on quote_requests ───────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='sales_person') THEN
    ALTER TABLE quote_requests ADD COLUMN sales_person text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='expiry_date') THEN
    ALTER TABLE quote_requests ADD COLUMN expiry_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='quoted_at') THEN
    ALTER TABLE quote_requests ADD COLUMN quoted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='accepted_at') THEN
    ALTER TABLE quote_requests ADD COLUMN accepted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='converted_at') THEN
    ALTER TABLE quote_requests ADD COLUMN converted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_requests' AND column_name='total_value') THEN
    ALTER TABLE quote_requests ADD COLUMN total_value numeric(12,2);
  END IF;
END $$;

-- ─── New column on quote_items ────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quote_items' AND column_name='subtotal') THEN
    ALTER TABLE quote_items ADD COLUMN subtotal numeric(12,2);
  END IF;
END $$;

-- ─── Normalize status values ──────────────────────────────────────────────────

UPDATE quote_requests SET status = 'submitted'   WHERE status = 'pending';
UPDATE quote_requests SET status = 'under_review' WHERE status = 'reviewing';
UPDATE quote_requests SET status = 'rejected'     WHERE status = 'declined';

-- Change default for new storefront submissions
ALTER TABLE quote_requests
  ALTER COLUMN status SET DEFAULT 'submitted';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quote_requests_quote_number
  ON quote_requests(quote_number);

CREATE INDEX IF NOT EXISTS idx_quote_requests_sales_person
  ON quote_requests(sales_person);

CREATE INDEX IF NOT EXISTS idx_quote_requests_expiry_date
  ON quote_requests(expiry_date);

-- ─── Admin write policies for quote_requests ─────────────────────────────────

DROP POLICY IF EXISTS "auth_insert_quote_requests" ON quote_requests;
CREATE POLICY "auth_insert_quote_requests" ON quote_requests FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_quote_requests" ON quote_requests;
CREATE POLICY "auth_update_quote_requests" ON quote_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_quote_requests" ON quote_requests;
CREATE POLICY "auth_delete_quote_requests" ON quote_requests FOR DELETE
  TO authenticated USING (true);

-- ─── Admin write policies for quote_items ────────────────────────────────────

DROP POLICY IF EXISTS "auth_insert_quote_items" ON quote_items;
CREATE POLICY "auth_insert_quote_items" ON quote_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_quote_items" ON quote_items;
CREATE POLICY "auth_update_quote_items" ON quote_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_quote_items" ON quote_items;
CREATE POLICY "auth_delete_quote_items" ON quote_items FOR DELETE
  TO authenticated USING (true);
