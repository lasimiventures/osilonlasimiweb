-- Fix recursive RLS on profiles.
-- The previous admin_select_all_profiles policy used a self-referential
-- subquery on profiles, which causes infinite recursion and breaks the
-- select_own_profile policy, preventing even the admin from reading
-- their own row (is_admin check returns null → access denied).
--
-- Fix: replace the recursive EXISTS subquery with a SECURITY DEFINER
-- function that bypasses RLS, breaking the recursion.

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Recreate admin policies using the non-recursive helper

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin_user());

DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
CREATE POLICY "admin_update_all_profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());
