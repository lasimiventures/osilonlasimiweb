/*
# Customer Accounts — profiles table

Milestone 7.1: gives customers a self-service account (register, login,
reset password, manage profile). Uses Supabase Auth (email/password) for
authentication and a new `profiles` table for extended customer data
(full name, phone, company, address). A trigger auto-creates a profile row
whenever a new auth user signs up, so the frontend signUp() call doesn't
need to separately insert a profile.

## 1. New Table: `profiles`

Extended customer profile data, one row per auth user.
- id (uuid PK, REFERENCES auth.users(id) ON DELETE CASCADE) — same as the
  auth user id. This makes joins trivial and guarantees 1:1.
- email (text) — denormalised from auth.users for convenience/lookups.
- full_name (text, nullable)
- phone (text, nullable)
- company (text, nullable) — for B2B customers
- position (text, nullable) — job title
- address (text, nullable)
- city (text, nullable)
- country (text, default 'Kenya')
- avatar_url (text, nullable)
- customer_type (text): 'individual' | 'business' — default 'individual'.
  Business customers may get different pricing tiers later.
- is_admin (boolean, default false) — flag to identify admin users so the
  frontend can route them to the admin portal.
- created_at (timestamptz default now())
- updated_at (timestamptz default now())

## 2. Trigger: auto-create profile on signup

`handle_new_user()` — AFTER INSERT on auth.users. SECURITY DEFINER so the
profile is created server-side with elevated privileges (the anon role
can't insert into profiles during the auth callback otherwise). Reads the
new user's email and raw_user_meta_data full_name, creates a matching
profiles row.

## 3. Trigger: auto-update updated_at

`update_profile_timestamp()` — BEFORE UPDATE on profiles, sets updated_at
to now().

## 4. Security — RLS

profiles: owner-scoped CRUD. Each authenticated user can SELECT and UPDATE
only their own row (auth.uid() = id). No INSERT/DELETE policies — rows are
managed by the trigger + service role.

## 5. Indexes
- profiles: email (for admin lookups), customer_type

## 6. Notes
1. Email confirmation is OFF — users can log in immediately after signup.
2. is_admin defaults to false. To make a user an admin, set
   profiles.is_admin = true via the Supabase dashboard.
*/

-- ── profiles table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  phone         text,
  company       text,
  position      text,
  address       text,
  city          text,
  country       text NOT NULL DEFAULT 'Kenya',
  avatar_url    text,
  customer_type text NOT NULL DEFAULT 'individual'
    CHECK (customer_type IN ('individual','business')),
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(customer_type);

-- ── RLS: owner can read/update own profile ───────────────────────────────────
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── auto-create profile on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_updated ON profiles;
CREATE TRIGGER trg_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_timestamp();
