-- ============================================================
-- Bucket de stockage pour les photos de vendeurs/cabines
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true)
ON CONFLICT (id) DO NOTHING;

-- lecture publique (les photos doivent s'afficher pour tous les visiteurs)
DROP POLICY IF EXISTS "public_read_vendor_images" ON storage.objects;
CREATE POLICY "public_read_vendor_images" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'vendor-images');

-- seuls les comptes connectés peuvent uploader dans ce bucket
DROP POLICY IF EXISTS "authenticated_upload_vendor_images" ON storage.objects;
CREATE POLICY "authenticated_upload_vendor_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'vendor-images');

-- chacun ne peut modifier/supprimer que ses propres fichiers uploadés
DROP POLICY IF EXISTS "owner_update_vendor_images" ON storage.objects;
CREATE POLICY "owner_update_vendor_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'vendor-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "owner_delete_vendor_images" ON storage.objects;
CREATE POLICY "owner_delete_vendor_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'vendor-images' AND owner = auth.uid());

-- ============================================================
-- Photo de la cabine — colonne manquante ("si applicable" = oui)
-- ============================================================
ALTER TABLE bureaus ADD COLUMN IF NOT EXISTS logo_url text;
