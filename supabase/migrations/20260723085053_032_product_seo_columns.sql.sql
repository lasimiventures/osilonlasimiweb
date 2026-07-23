/*
# Add SEO columns to products table

1. Changes
- Adds `meta_title` (text, nullable) — custom SEO title for product pages, overrides auto-generated title.
- Adds `meta_description` (text, nullable) — custom meta description for search engines, overrides auto-generated description.
- Adds `seo_keywords` (text[], nullable) — targeted keywords for search ranking.
- All columns are nullable so existing products are unaffected.
2. Security
- No RLS policy changes — existing policies on products already handle access.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'meta_title') THEN
    ALTER TABLE products ADD COLUMN meta_title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'meta_description') THEN
    ALTER TABLE products ADD COLUMN meta_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'seo_keywords') THEN
    ALTER TABLE products ADD COLUMN seo_keywords text[];
  END IF;
END $$;
