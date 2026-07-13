/*
# Quote Builder — Pricing Fields

## Summary
Adds comprehensive pricing fields to `quote_items` and `quote_requests` to power a
professional quotation builder. These fields support per-line discounts, optional items,
quote-level discounts, VAT, and separate charge lines (delivery, installation, warranty).

## Changes

### Modified Tables — `quote_items`
- `discount_pct`    NUMERIC(5,2) NOT NULL DEFAULT 0  — line-item discount percentage
- `discount_amount` NUMERIC(12,2) NOT NULL DEFAULT 0 — line-item fixed discount
- `is_optional`     BOOLEAN NOT NULL DEFAULT false   — marks item as optional (not counted in total)
- `item_type`       TEXT NOT NULL DEFAULT 'product'  — 'product' or 'additional'

### Modified Tables — `quote_requests`
- `discount_pct`         NUMERIC(5,2) NOT NULL DEFAULT 0    — quote-level percentage discount
- `discount_amount`      NUMERIC(12,2) NOT NULL DEFAULT 0   — quote-level fixed discount
- `vat_pct`              NUMERIC(5,2) NOT NULL DEFAULT 16   — VAT rate (16% Kenya default)
- `delivery_charge`      NUMERIC(12,2) NOT NULL DEFAULT 0   — delivery / shipping charge
- `installation_charge`  NUMERIC(12,2) NOT NULL DEFAULT 0   — installation / commissioning charge
- `warranty_charge`      NUMERIC(12,2) NOT NULL DEFAULT 0   — warranty extension charge
- `customer_notes`       TEXT                               — customer-facing notes printed on quote

## Notes
1. All numeric fields default to 0, not NULL, so pricing calculations are always safe.
2. Existing rows are unaffected — defaults are applied going forward.
3. `is_optional = true` items appear on the quotation document but are excluded from all totals.
4. `item_type` distinguishes quoted products from ad-hoc additional items.
*/

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS discount_pct    NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_optional     BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS item_type       TEXT          NOT NULL DEFAULT 'product';

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS discount_pct        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_pct             NUMERIC(5,2)  NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS delivery_charge     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installation_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warranty_charge     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_notes      TEXT;
