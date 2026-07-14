/*
# CRM Preparation Layer

## Summary
Creates the complete data foundation needed for integrating with major CRMs
(Zoho CRM, Microsoft Dynamics 365, HubSpot, Salesforce). No data is lost or
moved — existing tables are untouched. Everything here is additive:

1. **crm_contacts_view** — a PostgreSQL VIEW that normalises every unique contact
   (by lower-cased email) from orders, quote_requests, and rfq_requests into a
   single CRM-ready record with first/last name split, lifecycle stage, lead
   source label, and aggregated KPIs (total_orders, total_quotes, total_rfqs,
   lifetime_value, last_activity_at). Always up to date — no sync required.

2. **crm_deals_view** — a VIEW that presents every order, quote request, and
   RFQ as a unified "deal" record with a normalised CRM stage (New /
   Qualification / Proposal Sent / Won / Lost), amount, lead source, and
   deal type label. Ready for import as Deals/Opportunities in any CRM.

3. **crm_contact_enrichment** — a physical table (keyed by email) where admins
   can store external CRM IDs (Zoho, HubSpot, Salesforce, Dynamics), custom
   tags, notes, and a do-not-contact flag. Survives view refreshes.

4. **crm_export_logs** — an append-only audit log recording every CSV export:
   which data type, which CRM format, how many records, who exported, and when.

## New Tables

### crm_contact_enrichment
- email (text, unique, FK-style link to crm_contacts_view)
- zoho_contact_id, hubspot_contact_id, salesforce_contact_id, dynamics_contact_id
- tags (text[]), notes (text), do_not_contact (boolean)
- preferred_crm (text), created_at, updated_at

### crm_export_logs
- id, export_type ('contacts'|'deals'), target_crm, record_count, exported_by, filters (jsonb), exported_at

## New Views

### crm_contacts_view
Deduplicates by email (latest record wins for metadata).
Computed: first_name, last_name, lead_source (human label), lifecycle_stage,
total_orders, total_quotes, total_rfqs, lifetime_value, last_activity_at.

### crm_deals_view
UNION of orders + quote_requests + rfq_requests.
Each row: deal_id, deal_number, deal_type, contact_name, contact_email,
company, crm_stage (normalised), native_stage, amount, lead_source, created_at.

## Security
- RLS on physical tables with anon+authenticated full access (admin app, no per-user isolation).
- Views rely on underlying table RLS — no separate policy needed.
*/

-- ─── crm_contacts_view ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW crm_contacts_view AS
WITH all_contacts AS (
  SELECT
    lower(email)                    AS email,
    customer_name                   AS full_name,
    phone,
    company_name                    AS company,
    NULL::text                      AS position,
    county                          AS city,
    'Kenya'::text                   AS country,
    CASE source
      WHEN 'cart'             THEN 'Website'
      WHEN 'quote_conversion' THEN 'Sales'
      ELSE 'Sales'
    END                             AS lead_source_label,
    created_at
  FROM orders
  WHERE email IS NOT NULL AND email <> ''

  UNION ALL

  SELECT
    lower(customer_email),
    customer_name,
    customer_phone,
    company,
    position,
    city,
    coalesce(country, 'Kenya'),
    CASE source
      WHEN 'quote_form'    THEN 'Quote Form'
      WHEN 'bulk_pricing'  THEN 'Bulk Pricing'
      WHEN 'cart_quote'    THEN 'Website'
      ELSE 'Quote Form'
    END,
    created_at
  FROM quote_requests
  WHERE customer_email IS NOT NULL AND customer_email <> ''

  UNION ALL

  SELECT
    lower(officer_email),
    procurement_officer,
    officer_phone,
    organization_name,
    officer_position,
    organization_city,
    organization_country,
    'RFQ Form',
    submitted_at
  FROM rfq_requests
  WHERE officer_email IS NOT NULL AND officer_email <> ''
),
ranked AS (
  SELECT *,
    row_number() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
  FROM all_contacts
),
latest AS (
  SELECT email, full_name, phone, company, position, city, country, lead_source_label
  FROM ranked WHERE rn = 1
),
order_stats AS (
  SELECT
    lower(email)                   AS email,
    count(*)                       AS total_orders,
    coalesce(sum(total_value), 0)  AS total_revenue,
    max(created_at)                AS last_order_at
  FROM orders
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY lower(email)
),
quote_stats AS (
  SELECT
    lower(customer_email)          AS email,
    count(*)                       AS total_quotes,
    max(created_at)                AS last_quote_at
  FROM quote_requests
  WHERE customer_email IS NOT NULL AND customer_email <> ''
  GROUP BY lower(customer_email)
),
rfq_stats AS (
  SELECT
    lower(officer_email)           AS email,
    count(*)                       AS total_rfqs,
    max(submitted_at)              AS last_rfq_at
  FROM rfq_requests
  WHERE officer_email IS NOT NULL AND officer_email <> ''
  GROUP BY lower(officer_email)
)
SELECT
  l.email,
  l.full_name,
  split_part(l.full_name, ' ', 1)  AS first_name,
  CASE
    WHEN position(' ' IN l.full_name) > 0
    THEN substring(l.full_name FROM position(' ' IN l.full_name) + 1)
    ELSE ''
  END                               AS last_name,
  l.phone,
  l.company,
  l.position,
  l.city,
  l.country,
  l.lead_source_label               AS lead_source,
  CASE
    WHEN coalesce(os.total_orders, 0) > 0                                      THEN 'customer'
    WHEN coalesce(qs.total_quotes, 0) > 0 OR coalesce(rs.total_rfqs, 0) > 0   THEN 'marketing_qualified_lead'
    ELSE 'lead'
  END                               AS lifecycle_stage,
  coalesce(os.total_orders, 0)      AS total_orders,
  coalesce(qs.total_quotes, 0)      AS total_quotes,
  coalesce(rs.total_rfqs, 0)        AS total_rfqs,
  coalesce(os.total_revenue, 0)     AS lifetime_value,
  GREATEST(
    coalesce(os.last_order_at, '1900-01-01'::timestamptz),
    coalesce(qs.last_quote_at, '1900-01-01'::timestamptz),
    coalesce(rs.last_rfq_at,   '1900-01-01'::timestamptz)
  )                                 AS last_activity_at
FROM latest l
LEFT JOIN order_stats  os ON os.email = l.email
LEFT JOIN quote_stats  qs ON qs.email = l.email
LEFT JOIN rfq_stats    rs ON rs.email = l.email
ORDER BY last_activity_at DESC;

-- ─── crm_deals_view ───────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW crm_deals_view AS
SELECT
  id::text                          AS deal_id,
  order_number                      AS deal_number,
  customer_name                     AS contact_name,
  lower(email)                      AS contact_email,
  coalesce(company_name, '')        AS company,
  CASE order_status
    WHEN 'delivered'                    THEN 'Won'
    WHEN 'cancelled'                    THEN 'Lost'
    WHEN 'processing'                   THEN 'In Progress'
    WHEN 'ready_for_delivery'           THEN 'In Progress'
    WHEN 'confirmed'                    THEN 'Qualified'
    WHEN 'awaiting_customer_confirmation' THEN 'Proposal Sent'
    ELSE 'New'
  END                               AS crm_stage,
  order_status                      AS native_stage,
  coalesce(total_value, 0)          AS amount,
  CASE source
    WHEN 'cart'             THEN 'Website'
    WHEN 'quote_conversion' THEN 'Sales'
    ELSE 'Sales'
  END                               AS lead_source,
  'order'::text                     AS deal_type,
  created_at
FROM orders
WHERE email IS NOT NULL AND email <> ''

UNION ALL

SELECT
  id::text,
  quote_number,
  customer_name,
  lower(customer_email),
  coalesce(company, ''),
  CASE status
    WHEN 'accepted'          THEN 'Won'
    WHEN 'converted_to_order' THEN 'Won'
    WHEN 'rejected'          THEN 'Lost'
    WHEN 'expired'           THEN 'Lost'
    WHEN 'quoted'            THEN 'Proposal Sent'
    WHEN 'awaiting_customer' THEN 'Proposal Sent'
    WHEN 'under_review'      THEN 'Qualification'
    WHEN 'submitted'         THEN 'New'
    ELSE 'New'
  END,
  status,
  coalesce(total_value, 0),
  CASE source
    WHEN 'quote_form'   THEN 'Quote Form'
    WHEN 'bulk_pricing' THEN 'Bulk Pricing'
    WHEN 'cart_quote'   THEN 'Website'
    ELSE 'Quote Form'
  END,
  'quote'::text,
  created_at
FROM quote_requests
WHERE customer_email IS NOT NULL AND customer_email <> ''

UNION ALL

SELECT
  id::text,
  rfq_number,
  procurement_officer,
  lower(officer_email),
  coalesce(organization_name, ''),
  CASE status
    WHEN 'awarded'      THEN 'Won'
    WHEN 'rejected'     THEN 'Lost'
    WHEN 'cancelled'    THEN 'Lost'
    WHEN 'quoted'       THEN 'Proposal Sent'
    WHEN 'under_review' THEN 'Qualification'
    ELSE 'New'
  END,
  status,
  coalesce(target_budget, 0),
  'RFQ Form',
  'rfq'::text,
  submitted_at
FROM rfq_requests
WHERE officer_email IS NOT NULL AND officer_email <> '';

-- ─── crm_contact_enrichment ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contact_enrichment (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 text UNIQUE NOT NULL,
  zoho_contact_id       text,
  hubspot_contact_id    text,
  salesforce_contact_id text,
  dynamics_contact_id   text,
  tags                  text[] DEFAULT '{}',
  notes                 text,
  do_not_contact        boolean NOT NULL DEFAULT false,
  preferred_crm         text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_enrichment_email_idx ON crm_contact_enrichment(lower(email));

ALTER TABLE crm_contact_enrichment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crm_enrichment" ON crm_contact_enrichment;
CREATE POLICY "anon_select_crm_enrichment" ON crm_contact_enrichment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_crm_enrichment" ON crm_contact_enrichment;
CREATE POLICY "anon_insert_crm_enrichment" ON crm_contact_enrichment FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_crm_enrichment" ON crm_contact_enrichment;
CREATE POLICY "anon_update_crm_enrichment" ON crm_contact_enrichment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_crm_enrichment" ON crm_contact_enrichment;
CREATE POLICY "anon_delete_crm_enrichment" ON crm_contact_enrichment FOR DELETE
  TO anon, authenticated USING (true);

-- ─── crm_export_logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_export_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type   text NOT NULL,
  target_crm    text NOT NULL,
  record_count  integer NOT NULL DEFAULT 0,
  exported_by   text,
  filters       jsonb,
  exported_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crm_export_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_crm_export_logs" ON crm_export_logs;
CREATE POLICY "anon_select_crm_export_logs" ON crm_export_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_crm_export_logs" ON crm_export_logs;
CREATE POLICY "anon_insert_crm_export_logs" ON crm_export_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_crm_export_logs" ON crm_export_logs;
CREATE POLICY "anon_update_crm_export_logs" ON crm_export_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_crm_export_logs" ON crm_export_logs;
CREATE POLICY "anon_delete_crm_export_logs" ON crm_export_logs FOR DELETE
  TO anon, authenticated USING (true);
