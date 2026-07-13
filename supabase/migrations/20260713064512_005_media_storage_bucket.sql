/*
# Media Storage Bucket

Creates the `media` Supabase Storage bucket for the OSIL admin Media Library.

## What This Does

1. **Storage Bucket**
   - Creates a `media` bucket (public = true) so files are accessible via public URL
   - Used for all catalog images: product photos, category images, brand logos
   - Maximum file size: 50 MB per file
   - Accepted MIME types: common image formats (JPEG, PNG, WebP, GIF, SVG, AVIF)
     plus document formats (PDF, Word, Excel, PowerPoint, plain text, CSV)

2. **Storage Policies** (on `storage.objects`)
   - `media_public_select` — anyone (anon + authenticated) can read/view files.
     Required so storefront visitors can load catalog images referenced in products.
   - `media_auth_insert` — only authenticated admin users can upload new files.
   - `media_auth_update` — only authenticated admin users can update file metadata.
   - `media_auth_delete` — only authenticated admin users can delete files.

## Security Notes

- Public SELECT is intentional: these are catalog/marketing images meant to be displayed
  on the public storefront. Restricting to authenticated would break product image display.
- Write operations (INSERT/UPDATE/DELETE) are restricted to authenticated users only,
  preventing anonymous uploads or deletions.

## Safe to Re-run

- Bucket creation uses `ON CONFLICT (id) DO NOTHING` — safe if bucket already exists.
- All policies use `DROP POLICY IF EXISTS` before creation — idempotent.
*/

-- Create media bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/svg+xml', 'image/avif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Public read: storefront visitors must be able to load catalog images
DROP POLICY IF EXISTS "media_public_select" ON storage.objects;
CREATE POLICY "media_public_select" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'media');

-- Authenticated write: only admin users can upload, update, or delete
DROP POLICY IF EXISTS "media_auth_insert" ON storage.objects;
CREATE POLICY "media_auth_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media');
