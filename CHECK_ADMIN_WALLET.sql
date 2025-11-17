-- =====================================================================
-- CHECK ADMIN WALLET
-- =====================================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- =====================================================================

-- 1. Admin wallets tablosunda veri var mı?
SELECT
  wallet_address,
  added_at,
  notes
FROM public.admin_wallets;

-- 2. Şu anki user'ın wallet'i ne?
SELECT
  id,
  username,
  wallet_address,
  email
FROM public.users
WHERE id = auth.uid();

-- 3. is_admin_user() fonksiyonu ne döndürüyor?
SELECT public.is_admin_user() as am_i_admin;

-- 4. Auth user var mı?
SELECT auth.uid() as current_user_id;

-- =====================================================================
-- EXPECTED RESULTS:
-- =====================================================================
-- 1. admin_wallets tablosunda: 0xe0df49b36e44cda5679b3f65916467639c434d0d
-- 2. Şu anki user: monas kullanıcısı, wallet: 0xe0df49b36e44cda5679b3f65916467639c434d0d
-- 3. is_admin_user(): TRUE
-- 4. auth.uid(): b006f9fc-85a8-4999-906d-a8be6df6fb21 veya başka bir UUID
-- =====================================================================
