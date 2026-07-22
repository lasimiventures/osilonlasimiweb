/*
# Order Delivery Tracking Fields

## Purpose
Adds shipment and delivery tracking columns to the `orders` table so customers can track
their order's delivery progress, shipment details, and delivery notes.

## Changes to existing tables

### `orders` — new columns (all nullable, additive only)
- `tracking_number` (text) — courier tracking number, e.g. DHL/Fedex/G4S waybill
- `courier` (text) — shipping carrier name (e.g. "G4S", "DHL", "FedEx")
- `shipped_at` (timestamptz) — when the order was dispatched from the warehouse
- `estimated_delivery` (date) — estimated delivery date shown to the customer
- `delivered_at` (timestamptz) — when the order was confirmed delivered
- `delivery_notes` (text) — free-text delivery instructions / notes from the admin
- `delivery_status` (text, default 'pending') — granular delivery stage:
    pending → processing → shipped → in_transit → out_for_delivery → delivered → failed_delivery

## Security
- No new tables. Existing RLS policies on `orders` remain unchanged.
- No policy changes needed — customers already have SELECT access to their own orders.

## Notes
1. All columns are nullable and have safe defaults so existing rows are unaffected.
2. `delivery_status` is separate from `order_status` so the order lifecycle
   (processing → confirmed → completed) is independent from the delivery lifecycle.
3. No data is lost — this is purely additive.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_number') THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'courier') THEN
    ALTER TABLE orders ADD COLUMN courier text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipped_at') THEN
    ALTER TABLE orders ADD COLUMN shipped_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery') THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_notes') THEN
    ALTER TABLE orders ADD COLUMN delivery_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_status') THEN
    ALTER TABLE orders ADD COLUMN delivery_status text NOT NULL DEFAULT 'pending';
  END IF;
END $$;
