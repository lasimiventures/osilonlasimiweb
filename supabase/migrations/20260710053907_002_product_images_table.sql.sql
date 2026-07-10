/*
# Add product_images table

## Purpose

The original schema stored product images as a JSONB array of URL strings on the
`products.images` column. This migration adds a dedicated `product_images` table
so each image is a first-class row with its own metadata (alt text, sort order,
whether it is the primary hero image). The existing `products.images` JSONB column
is left in place to avoid any data loss; the new table is the canonical source going
forward.

## New Table

### product_images
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key → products.id, ON DELETE CASCADE)
- `url` (text, not null) — the image URL
- `alt_text` (text) — accessibility/SEO alt text
- `sort_order` (integer, default 0) — display ordering (0 = first/hero)
- `is_primary` (boolean, default false) — marks the hero image
- `created_at` (timestamptz, default now())

## Indexes
- `idx_product_images_product_id` — fast lookup of all images for a product
- `idx_product_images_is_primary` — quick hero-image resolution

## Security (RLS)
- RLS enabled on `product_images`.
- Public read access (`TO anon, authenticated`) so the anon-key storefront can
  fetch images without a login. This is a single-tenant public catalog, so
  `USING (true)` is intentional and documented.
- No public insert/update/delete — image management is an admin/edge-function
  concern, not exposed to the anon client.

## Notes
1. The existing `products.images` JSONB column is NOT dropped or altered — it
   remains for backward compatibility. New code should read from
   `product_images` ordered by `sort_order`.
2. One row per `is_primary = true` is the intended convention per product; this
   is enforced at the application layer, not via a partial unique index, to keep
   the migration idempotent and avoid lock contention.
*/

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_product_images" ON product_images;
CREATE POLICY "anon_read_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary) WHERE is_primary = true;
