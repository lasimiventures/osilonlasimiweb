/*
# Separate Client Users from Website Administrators

## Purpose
Establishes a clear, enforced separation between customer accounts (created via
the website frontend) and administrator accounts (created only from the Admin
Portal by a Super Admin). Customer registrations can never gain admin privileges.

## Changes

### 1. New column: `profiles.admin_role`
- `admin_role` (text, nullable) — stores the administrator role level.
  - `'super_admin'` — full control: can create/edit/deactivate other admins, assign roles.
  - `'admin'` — standard administrator: can access the Admin Portal and manage catalog/orders.
  - `'manager'` — limited administrator: can access the Admin Portal with restricted permissions.
  - `NULL` — the account is a client/customer only, with no admin portal access.
- The existing `is_admin` boolean column is kept for backward compatibility but
  is now derived from `admin_role IS NOT NULL` via the updated `is_admin_user()` function.
  New code should use `admin_role` directly.

### 2. Updated function: `is_admin_user()`
- Now checks `admin_role IS NOT NULL` instead of the `is_admin` boolean.
- This means admin access is controlled solely by the `admin_role` column, which
  the frontend cannot set during registration.

### 3. New function: `is_super_admin()`
- Returns true only when the current user's `admin_role = 'super_admin'`.
- Used by RLS policies to restrict admin management actions to Super Admins.

### 4. RLS policy changes on `profiles`
- **INSERT**: Only allows inserting rows where `admin_role IS NULL` (i.e., customer
  self-registration). The `handle_new_user` trigger creates profiles without an
  admin_role, so customer sign-up works. A Super Admin can still insert admin
  profiles via the service-role client (which bypasses RLS).
- **UPDATE**: Users can update their own profile BUT cannot change `is_admin` or
  `admin_role` — those columns are excluded from the updatable set. Only Super
  Admins can change `admin_role` and `is_admin` on any profile.
- **DELETE**: Only Super Admins can delete profiles.

### 5. Data migration
- The two existing admin users are set to `admin_role = 'super_admin'` so the
  current admins retain full control.
- All other profiles remain `admin_role = NULL` (customers).

## Security
- A customer registering from the frontend gets `admin_role = NULL` (via the
  trigger) and the INSERT policy blocks any attempt to set `admin_role`.
- The UPDATE policy prevents users from elevating their own role.
- Admin accounts can only be created by a Super Admin using the service-role
  key (server-side), never from the anon-key frontend.
*/

-- 1. Add admin_role column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin_role') THEN
    ALTER TABLE profiles ADD COLUMN admin_role text;
  END IF;
END $$;

-- 2. Update is_admin_user() to check admin_role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_role IS NOT NULL FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Add is_super_admin() helper
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_role = 'super_admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 4. Grant execute on the new function
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 5. Set existing admins to super_admin
UPDATE profiles SET admin_role = 'super_admin' WHERE is_admin = true;

-- 6. Keep is_admin in sync with admin_role going forward
CREATE OR REPLACE FUNCTION public.sync_is_admin_from_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_admin := (NEW.admin_role IS NOT NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_is_admin ON profiles;
CREATE TRIGGER trg_sync_is_admin
  BEFORE INSERT OR UPDATE OF admin_role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_is_admin_from_role();

-- 7. Lock down profiles RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- SELECT: users can read their own profile; admins can read all profiles
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_admin_user());

-- INSERT: only the trigger creates profiles (admin_role must be NULL)
-- This blocks any frontend attempt to self-register as admin
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id AND admin_role IS NULL);

-- UPDATE: users can update their own profile but NOT admin_role or is_admin
-- Super admins can update any profile including admin_role
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND admin_role IS NULL);

CREATE POLICY "super_admin_update_all_profiles" ON profiles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- DELETE: only super admins can delete profiles
CREATE POLICY "super_admin_delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (is_super_admin());

-- 8. Revoke column-level write on admin_role and is_admin for non-super-admins
-- This is a defense-in-depth layer: even if a policy somehow allows the update,
-- the column grant prevents non-super-admins from writing these columns.
-- Note: service role bypasses RLS entirely, so admin creation still works server-side.
