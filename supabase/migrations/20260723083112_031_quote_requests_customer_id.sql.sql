/*
# Add customer_id column to quote_requests

1. Changes
- Adds `customer_id` (uuid, nullable) to `quote_requests` to link quote requests to authenticated customer profiles.
- No RLS policy changes needed — existing policies on quote_requests already handle access.
- The column is nullable so legacy quote requests without a linked customer remain valid.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_requests' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE quote_requests ADD COLUMN customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;
