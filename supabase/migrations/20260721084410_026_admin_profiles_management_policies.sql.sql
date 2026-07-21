/*
# Admin User Management — RLS Policies for Profiles

## Purpose
Allows administrators to list all registered user accounts and manage roles
(toggle is_admin) from the admin portal, while keeping customer self-access
intact. This unblocks the "User Management" admin page which currently cannot
see any accounts because profiles RLS only permits reading your own row.

## Changes
1. New RLS policies on `profiles`:
   - `admin_select_all_profiles` — admin users (is_admin = true) can SELECT all rows
   - `admin_update_all_profiles` — admin users can UPDATE any row's is_admin flag
   (existing `select_own_profile` and `update_own_profile` are preserved)

## Security
- Admin access is gated by a subquery check: the requesting user's own profile
  must have is_admin = true. This prevents any non-admin from listing or
  modifying other users.
- Customers can still only read/update their own profile (unchanged).
- No tables created, no columns changed, no data modified.
- Non-destructive: existing policies are dropped only to avoid duplicate-name
  errors, then recreated identically.
*/

-- Admin: read all profiles
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Admin: update any profile (e.g. toggle is_admin)
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
CREATE POLICY "admin_update_all_profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);
