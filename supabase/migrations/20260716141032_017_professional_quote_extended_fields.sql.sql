/*
# Professional Quote Management — Extended Fields

## Summary
Completes the professional quotation schema by adding the remaining fields
needed for enterprise-grade quote management. Migration 006 already added
quote_number, status lifecycle, sales_person, expiry_date, and total_value.
Migration 008 added pricing fields (discount_pct, discount_amount, vat_pct,
delivery_charge, installation_charge, warranty_charge, customer_notes).

This migration adds the final set of professional quotation fields:
- Approval tracking (approved_by, approved_date)
- Order linkage (converted_order_id FK to orders)
- Computed totals (subtotal, grand_total)
- Currency support
- Payment and delivery terms
- Installation/warranty flags and descriptions
- Internal notes (separate from customer-facing notes)

## New Columns on `quote_requests`
- `quote_status` text — mirrors `status` but serves as the explicit professional
  status field. Kept in sync with `status` via application logic. (The existing
  `status` column remains the source of truth for lifecycle transitions.)
- `approved_by` text — name of admin who approved the quote
- `approved_date` timestamptz — when approval was granted
- `converted_order_id` uuid FK → orders(id) — links to the generated order
- `subtotal` numeric(12,2) — sum of line item subtotals before discount/VAT
- `discount` numeric(12,2) — total discount amount (quote-level, for display)
- `vat` numeric(12,2) — computed VAT amount
- `shipping` numeric(12,2) — shipping/delivery cost (alias for delivery_charge display)
- `grand_total` numeric(12,2) — final total including all charges
- `currency` text DEFAULT 'KES' — quote currency
- `payment_terms` text — e.g. "50% deposit, 50% on delivery"
- `delivery_terms` text — e.g. "FOB Nairobi, 7-14 days"
- `installation_required` boolean DEFAULT false — flag for installation services
- `warranty` text — warranty description (e.g. "12 months manufacturer warranty")
- `internal_notes` text — private admin notes (separate from customer_notes)

## Safety
- All columns use ADD COLUMN IF NOT EXISTS — idempotent, no data loss.
- No columns dropped or renamed.
- converted_order_id uses ON DELETE SET NULL to preserve quote history if order is deleted.
*/

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS quote_status          text,
  ADD COLUMN IF NOT EXISTS approved_by           text,
  ADD COLUMN IF NOT EXISTS approved_date         timestamptz,
  ADD COLUMN IF NOT EXISTS converted_order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal              numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount              numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat                   numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping              numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total           numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency              text NOT NULL DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS payment_terms         text,
  ADD COLUMN IF NOT EXISTS delivery_terms        text,
  ADD COLUMN IF NOT EXISTS installation_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warranty              text,
  ADD COLUMN IF NOT EXISTS internal_notes        text;

-- Backfill quote_status from existing status values (idempotent)
UPDATE quote_requests SET quote_status = status WHERE quote_status IS NULL;

-- Indexes for professional query patterns
CREATE INDEX IF NOT EXISTS idx_quote_requests_approved_by
  ON quote_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_quote_requests_converted_order
  ON quote_requests(converted_order_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_currency
  ON quote_requests(currency);
