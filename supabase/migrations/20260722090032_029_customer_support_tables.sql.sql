/*
# Customer Support Tables

## Purpose
Creates the database tables needed for the Customer Support Centre:
support tickets, ticket replies, warranty claims, and product returns (RMA).
The Knowledge Base reuses the existing `faqs` TypeScript data (no table needed).

## New Tables

### 1. `support_tickets`
Customer-initiated support requests.
- `id` (uuid, PK)
- `ticket_number` (text, unique) — human-readable ID like TKT-000001
- `user_id` (uuid, FK auth.users, default auth.uid()) — ticket owner
- `customer_email` (text) — email of the customer (for lookup)
- `customer_name` (text) — name of the customer
- `subject` (text) — short subject line
- `description` (text) — detailed description of the issue
- `category` (text) — general | billing | technical | delivery | product | other
- `priority` (text, default 'normal') — low | normal | high | urgent
- `status` (text, default 'open') — open | awaiting_response | resolved | closed
- `order_number` (text, nullable) — related order number if applicable
- `assigned_to` (text, nullable) — admin user assigned to the ticket
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. `ticket_replies`
Replies/conversation on a support ticket (from both customer and admin).
- `id` (uuid, PK)
- `ticket_id` (uuid, FK support_tickets)
- `author` (text) — 'customer' | 'admin'
- `author_name` (text) — display name of the author
- `message` (text) — reply body
- `created_at` (timestamptz)

### 3. `warranty_claims`
Customer claims for warranty service on purchased products.
- `id` (uuid, PK)
- `claim_number` (text, unique) — human-readable ID like WC-000001
- `user_id` (uuid, FK auth.users, default auth.uid())
- `customer_email` (text)
- `customer_name` (text)
- `order_number` (text, nullable) — order the product was purchased under
- `product_name` (text) — name of the product
- `product_sku` (text, nullable) — SKU of the product
- `serial_number` (text, nullable) — serial number of the product
- `purchase_date` (date, nullable) — when the product was purchased
- `issue_description` (text) — description of the defect/issue
- `warranty_type` (text, default 'manufacturer') — manufacturer | extended | in-house
- `status` (text, default 'submitted') — submitted | under_review | approved | rejected | processing | completed
- `resolution_notes` (text, nullable) — admin notes on resolution
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 4. `product_returns`
Return Merchandise Authorization (RMA) requests.
- `id` (uuid, PK)
- `rma_number` (text, unique) — human-readable ID like RMA-000001
- `user_id` (uuid, FK auth.users, default auth.uid())
- `customer_email` (text)
- `customer_name` (text)
- `order_number` (text, nullable) — original order number
- `product_name` (text) — name of the product being returned
- `product_sku` (text, nullable) — SKU of the product
- `quantity` (integer, default 1) — quantity being returned
- `return_reason` (text) — defective | wrong_item | not_as_described | damaged_in_transit | no_longer_needed | other
- `reason_details` (text) — detailed explanation
- `condition` (text, default 'unopened') — unopened | opened | used | damaged
- `status` (text, default 'submitted') — submitted | under_review | approved | rejected | return_shipped | received | refunded | exchanged | closed
- `admin_notes` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security (RLS)

All four tables have RLS enabled with owner-scoped policies:
- SELECT: users can only read their own rows (auth.uid() = user_id)
- INSERT: users can only insert rows where auth.uid() = user_id
- UPDATE: users can only update their own rows (for status tracking by customer)
- DELETE: users can only delete their own rows

For ticket_replies, ownership is checked via the parent ticket's user_id.

## Notes
1. All user_id columns default to auth.uid() so inserts from authenticated
   sessions work even when the client omits user_id.
2. Sequential numbers (ticket_number, claim_number, rma_number) are generated
   via a trigger that counts existing rows + 1, padded to 6 digits.
3. No data is lost — all tables are new.
*/

-- ─── Support Tickets ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  order_number text,
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- ─── Ticket Replies ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'customer',
  author_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ticket_replies" ON ticket_replies;
CREATE POLICY "select_own_ticket_replies" ON ticket_replies FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_replies.ticket_id AND support_tickets.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_ticket_replies" ON ticket_replies;
CREATE POLICY "insert_own_ticket_replies" ON ticket_replies FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_replies.ticket_id AND support_tickets.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);

-- ─── Warranty Claims ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  order_number text,
  product_name text NOT NULL,
  product_sku text,
  serial_number text,
  purchase_date date,
  issue_description text NOT NULL,
  warranty_type text NOT NULL DEFAULT 'manufacturer',
  status text NOT NULL DEFAULT 'submitted',
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_warranty_claims" ON warranty_claims;
CREATE POLICY "select_own_warranty_claims" ON warranty_claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_warranty_claims" ON warranty_claims;
CREATE POLICY "insert_own_warranty_claims" ON warranty_claims FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_warranty_claims" ON warranty_claims;
CREATE POLICY "update_own_warranty_claims" ON warranty_claims FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_warranty_claims" ON warranty_claims;
CREATE POLICY "delete_own_warranty_claims" ON warranty_claims FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_user ON warranty_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_email ON warranty_claims(customer_email);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);

-- ─── Product Returns (RMA) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  order_number text,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL DEFAULT 1,
  return_reason text NOT NULL,
  reason_details text NOT NULL,
  condition text NOT NULL DEFAULT 'unopened',
  status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_returns" ON product_returns;
CREATE POLICY "select_own_returns" ON product_returns FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_returns" ON product_returns;
CREATE POLICY "insert_own_returns" ON product_returns FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_returns" ON product_returns;
CREATE POLICY "update_own_returns" ON product_returns FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_returns" ON product_returns;
CREATE POLICY "delete_own_returns" ON product_returns FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_product_returns_user ON product_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_product_returns_email ON product_returns(customer_email);
CREATE INDEX IF NOT EXISTS idx_product_returns_status ON product_returns(status);

-- ─── Sequential number triggers ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS integer)), 0) + 1 INTO next_num FROM support_tickets;
  NEW.ticket_number := 'TKT-' || lpad(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_ticket_number ON support_tickets;
CREATE TRIGGER trg_ticket_number BEFORE INSERT ON support_tickets
  FOR EACH ROW WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 4) AS integer)), 0) + 1 INTO next_num FROM warranty_claims;
  NEW.claim_number := 'WC-' || lpad(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_claim_number ON warranty_claims;
CREATE TRIGGER trg_claim_number BEFORE INSERT ON warranty_claims
  FOR EACH ROW WHEN (NEW.claim_number IS NULL OR NEW.claim_number = '')
  EXECUTE FUNCTION generate_claim_number();

CREATE OR REPLACE FUNCTION generate_rma_number()
RETURNS trigger AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(rma_number FROM 5) AS integer)), 0) + 1 INTO next_num FROM product_returns;
  NEW.rma_number := 'RMA-' || lpad(next_num::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rma_number ON product_returns;
CREATE TRIGGER trg_rma_number BEFORE INSERT ON product_returns
  FOR EACH ROW WHEN (NEW.rma_number IS NULL OR NEW.rma_number = '')
  EXECUTE FUNCTION generate_rma_number();

-- ─── Updated_at triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated ON support_tickets;
CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_warranty_claims_updated ON warranty_claims;
CREATE TRIGGER trg_warranty_claims_updated BEFORE UPDATE ON warranty_claims
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_product_returns_updated ON product_returns;
CREATE TRIGGER trg_product_returns_updated BEFORE UPDATE ON product_returns
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
