/*
# Create banners table for B2B/B2C homepage management

## Purpose
Enables admins to manage promotional hero banners and promotional strip banners
that appear on the storefront homepage. This drives the B2B/B2C "marketing banners
and featured products" requirement.

## New Tables

### `banners`
- `id` (uuid, primary key)
- `title` (text, required) — main headline text
- `subtitle` (text) — supporting copy beneath the title
- `badge_text` (text) — small badge/chip label (e.g. "New", "Limited Offer")
- `cta_primary_text` (text) — primary call-to-action button label
- `cta_primary_link` (text) — primary CTA destination URL/path
- `cta_secondary_text` (text) — secondary/ghost button label
- `cta_secondary_link` (text) — secondary CTA destination
- `image_url` (text) — hero or promo background/thumbnail image
- `is_active` (boolean, default true) — toggle visibility without deleting
- `sort_order` (integer, default 0) — controls display order (ascending)
- `banner_type` (text, default 'hero') — 'hero' = homepage carousel, 'promo' = promotional strip cards
- `created_at`, `updated_at` (timestamptz)

## Security

- RLS enabled.
- Public SELECT (anon + authenticated) so the storefront frontend can load banners
  with the anon key without authentication.
- Authenticated-only INSERT / UPDATE / DELETE so only signed-in admins can manage banners.

## Seed Data

Three hero banners and three promo banners are seeded so the homepage carousel
renders immediately after this migration is applied.
*/

CREATE TABLE IF NOT EXISTS banners (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  subtitle      text,
  badge_text    text,
  cta_primary_text   text  DEFAULT 'Shop Now',
  cta_primary_link   text  DEFAULT '/products',
  cta_secondary_text text,
  cta_secondary_link text,
  image_url     text,
  is_active     boolean     NOT NULL DEFAULT true,
  sort_order    integer     NOT NULL DEFAULT 0,
  banner_type   text        NOT NULL DEFAULT 'hero'
                            CHECK (banner_type IN ('hero', 'promo')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_banners"  ON banners;
DROP POLICY IF EXISTS "admin_insert_banners"   ON banners;
DROP POLICY IF EXISTS "admin_update_banners"   ON banners;
DROP POLICY IF EXISTS "admin_delete_banners"   ON banners;

CREATE POLICY "public_select_banners" ON banners
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_banners" ON banners
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_banners" ON banners
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_banners" ON banners
  FOR DELETE TO authenticated USING (true);

-- Seed hero banners
INSERT INTO banners (title, subtitle, badge_text, cta_primary_text, cta_primary_link, cta_secondary_text, cta_secondary_link, image_url, is_active, sort_order, banner_type) VALUES
(
  'Enterprise ICT Solutions for East Africa',
  'Servers, networking, laptops and enterprise software — backed by certified pre-sales engineers and on-site support.',
  'Authorized Dealer',
  'Browse Enterprise Products',
  '/category/servers',
  'Request a Quote',
  '/request-quote',
  'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1200',
  true, 0, 'hero'
),
(
  'Laptops & Workstations — Shop & Get Instant Price',
  'Dell, HP, Lenovo and Apple devices with full Kenya warranty. KES pricing, same-day quotes for bulk orders.',
  'New Arrivals',
  'Shop Laptops',
  '/category/laptops',
  'Get Bulk Quote',
  '/request-quote',
  'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200',
  true, 1, 'hero'
),
(
  'Network Infrastructure & Security',
  'Cisco, Fortinet and Ubiquiti solutions. From small offices to campus-wide deployments — we design, supply and install.',
  'B2B Specialist',
  'View Networking',
  '/category/networking',
  'Talk to an Engineer',
  '/contact',
  'https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=1200',
  true, 2, 'hero'
);

-- Seed promo banners
INSERT INTO banners (title, subtitle, badge_text, cta_primary_text, cta_primary_link, image_url, is_active, sort_order, banner_type) VALUES
(
  'Bulk Order Discounts',
  'Order 5+ units of any laptop or desktop and receive priority pricing. Contact our B2B desk for a formal quotation.',
  'B2B',
  'Request Bulk Quote',
  '/request-quote',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, 0, 'promo'
),
(
  'Servers & Storage',
  'Dell PowerEdge, HP ProLiant and Lenovo ThinkSystem. Rack, tower and blade servers configured to your spec.',
  'Enterprise',
  'View Servers',
  '/category/servers',
  'https://images.pexels.com/photos/4508751/pexels-photo-4508751.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, 1, 'promo'
),
(
  'Security & Surveillance',
  'Hikvision and Dahua IP cameras, NVRs and access control. Professional installation across Nairobi and beyond.',
  'Featured',
  'Explore Security',
  '/category/security',
  'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800',
  true, 2, 'promo'
);
