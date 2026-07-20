/*
# Digital Asset Management (DAM)

1. New Tables
- `media_assets` — Categorized digital asset registry that tracks uploaded files
  and external links (videos) with metadata for organized management.
  - `id` (uuid, primary key)
  - `title` (text, not null) — display name for the asset
  - `asset_type` (text, not null) — one of: 'product_image', 'brand_logo',
    'category_banner', 'datasheet', 'brochure', 'video', 'other'
  - `storage_path` (text, nullable) — path in the `media` storage bucket (for uploaded files)
  - `public_url` (text, nullable) — public URL (for uploaded files) or external URL (for videos)
  - `mime_type` (text, nullable) — file MIME type
  - `file_size` (bigint, nullable) — file size in bytes
  - `linked_entity_type` (text, nullable) — 'brand', 'category', 'product', or null
  - `linked_entity_id` (uuid, nullable) — FK to the linked entity
  - `linked_entity_name` (text, nullable) — denormalized name for display
  - `description` (text, nullable) — optional description
  - `tags` (text[], nullable) — searchable tags
  - `created_by` (uuid, nullable) — uploading admin user
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- `idx_media_assets_asset_type` — filter by asset type
- `idx_media_assets_linked_entity` — find assets linked to a brand/category/product
- `idx_media_assets_created_at` — sort by newest

3. Security
- Enable RLS on `media_assets`.
- Authenticated admin users can CRUD all rows (admin DAM is shared among staff).
- Anon + authenticated can SELECT (storefront may need to read asset metadata).
*/
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  asset_type text NOT NULL DEFAULT 'other',
  storage_path text,
  public_url text,
  mime_type text,
  file_size bigint,
  linked_entity_type text,
  linked_entity_id uuid,
  linked_entity_name text,
  description text,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_assets_select" ON media_assets;
CREATE POLICY "media_assets_select" ON media_assets
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "media_assets_insert" ON media_assets;
CREATE POLICY "media_assets_insert" ON media_assets
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "media_assets_update" ON media_assets;
CREATE POLICY "media_assets_update" ON media_assets
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "media_assets_delete" ON media_assets;
CREATE POLICY "media_assets_delete" ON media_assets
FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_media_assets_asset_type ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_linked_entity ON media_assets(linked_entity_type, linked_entity_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);
