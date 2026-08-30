-- ============================================================
-- SCRIPT COMPLET ET AUTONOME — Cabine de Change
-- Sûr à exécuter en une seule fois, quel que soit l'état actuel
-- de la base (vide, partiellement migrée, ou déjà à jour).
-- Tout est protégé par IF NOT EXISTS / OR REPLACE / DROP IF EXISTS.
-- ============================================================

-- ============================================================
-- 1. TABLES DE BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS bureaus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality text NOT NULL,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bureaus ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE bureaus ADD COLUMN IF NOT EXISTS address_description text;

CREATE INDEX IF NOT EXISTS idx_bureaus_municipality ON bureaus(municipality);
CREATE INDEX IF NOT EXISTS idx_bureaus_user_id ON bureaus(user_id);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id uuid NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  usd_buy numeric,
  usd_sell numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_bureau_id ON exchange_rates(bureau_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_status ON exchange_rates(status);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS local_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id uuid NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  products_summary text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_vendors_bureau_id ON local_vendors(bureau_id);

-- ============================================================
-- 2. FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION is_bureau_owner(check_bureau_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM bureaus WHERE id = check_bureau_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_vendor_owner(check_vendor_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM local_vendors v
    JOIN bureaus b ON b.id = v.bureau_id
    WHERE v.id = check_vendor_id AND b.user_id = auth.uid()
  );
$$;

-- crée automatiquement un profil pour chaque inscription réelle (non anonyme)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS NOT TRUE THEN
    INSERT INTO profiles (id, full_name, avatar_url, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.phone
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- empêche toute auto-promotion au rôle admin
CREATE OR REPLACE FUNCTION protect_admin_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin' AND NOT is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_admin_role ON profiles;
CREATE TRIGGER trg_protect_admin_role
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_admin_role();

-- seul le gérant de SA cabine (ou un admin) peut la (re)vérifier
CREATE OR REPLACE FUNCTION protect_bureau_verification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified
     AND NOT is_admin()
     AND NOT (auth.uid() = OLD.user_id) THEN
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bureau_verification ON bureaus;
CREATE TRIGGER trg_protect_bureau_verification
BEFORE UPDATE ON bureaus
FOR EACH ROW EXECUTE FUNCTION protect_bureau_verification();

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER trg_exchange_rates_updated_at
BEFORE UPDATE ON exchange_rates
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_vendors ENABLE ROW LEVEL SECURITY;

-- --- bureaus : nettoyage de toutes les anciennes générations de policies ---
DROP POLICY IF EXISTS "public_insert_unverified_bureaus" ON bureaus;
DROP POLICY IF EXISTS "admin_update_bureaus" ON bureaus;
DROP POLICY IF EXISTS "admin_delete_bureaus" ON bureaus;
DROP POLICY IF EXISTS "insert_own_bureau" ON bureaus;
DROP POLICY IF EXISTS "update_own_or_admin_bureaus" ON bureaus;
DROP POLICY IF EXISTS "delete_own_or_admin_bureaus" ON bureaus;
DROP POLICY IF EXISTS "public_select_bureaus" ON bureaus;

CREATE POLICY "public_select_bureaus" ON bureaus FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_own_bureau" ON bureaus FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() AND verified = false);

CREATE POLICY "update_own_or_admin_bureaus" ON bureaus FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "delete_own_or_admin_bureaus" ON bureaus FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

-- --- exchange_rates ---
DROP POLICY IF EXISTS "public_insert_pending_rates" ON exchange_rates;
DROP POLICY IF EXISTS "admin_update_exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "admin_delete_exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "insert_rate_pending_or_own_bureau" ON exchange_rates;
DROP POLICY IF EXISTS "update_rate_owner_or_admin" ON exchange_rates;
DROP POLICY IF EXISTS "delete_rate_owner_or_admin" ON exchange_rates;
DROP POLICY IF EXISTS "public_select_exchange_rates" ON exchange_rates;

CREATE POLICY "public_select_exchange_rates" ON exchange_rates FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_rate_pending_or_own_bureau" ON exchange_rates FOR INSERT
  TO anon, authenticated WITH CHECK (
    status = 'pending' OR (status = 'verified' AND is_bureau_owner(bureau_id))
  );

CREATE POLICY "update_rate_owner_or_admin" ON exchange_rates FOR UPDATE
  TO authenticated USING (is_bureau_owner(bureau_id) OR is_admin())
  WITH CHECK (is_bureau_owner(bureau_id) OR is_admin());

CREATE POLICY "delete_rate_owner_or_admin" ON exchange_rates FOR DELETE
  TO authenticated USING (is_bureau_owner(bureau_id) OR is_admin());

-- --- profiles ---
DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_or_admin_profiles" ON profiles;

CREATE POLICY "select_own_or_admin_profiles" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR is_admin());

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid() AND role = 'client');

CREATE POLICY "update_own_or_admin_profiles" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- --- local_vendors ---
DROP POLICY IF EXISTS "public_select_local_vendors" ON local_vendors;
DROP POLICY IF EXISTS "insert_local_vendor_by_bureau_owner" ON local_vendors;
DROP POLICY IF EXISTS "update_local_vendor_owner_or_admin" ON local_vendors;
DROP POLICY IF EXISTS "delete_local_vendor_owner_or_admin" ON local_vendors;

CREATE POLICY "public_select_local_vendors" ON local_vendors FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_local_vendor_by_bureau_owner" ON local_vendors FOR INSERT
  TO authenticated WITH CHECK (is_bureau_owner(bureau_id));

CREATE POLICY "update_local_vendor_owner_or_admin" ON local_vendors FOR UPDATE
  TO authenticated USING (is_vendor_owner(id) OR is_admin())
  WITH CHECK (is_bureau_owner(bureau_id) OR is_admin());

CREATE POLICY "delete_local_vendor_owner_or_admin" ON local_vendors FOR DELETE
  TO authenticated USING (is_vendor_owner(id) OR is_admin());

-- ============================================================
-- 4. REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exchange_rates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exchange_rates;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bureaus'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bureaus;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'local_vendors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE local_vendors;
  END IF;
END $$;

-- ============================================================
-- 5. VÉRIFICATION — devrait renvoyer 4 lignes (bureaus, exchange_rates,
--    local_vendors, profiles)
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('bureaus', 'exchange_rates', 'profiles', 'local_vendors')
ORDER BY table_name;

-- ============================================================
-- ÉTAPE MANUELLE — après votre première inscription dans l'app :
--
--   UPDATE profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'votre-email@exemple.com');
--
-- Aucun autre chemin ne permet de devenir admin, volontairement.
-- ============================================================
