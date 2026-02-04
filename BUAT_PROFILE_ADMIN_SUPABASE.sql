-- =========================================
-- BUAT PROFILE ADMIN DI SUPABASE
-- =========================================
-- 
-- INSTRUKSI:
-- 1. Pastikan user sudah dibuat di Supabase Auth (Authentication > Users)
-- 2. Copy User ID (UUID) dari user yang baru dibuat
-- 3. Ganti USER_ID_DI_BAWAH dengan UUID tersebut
-- 4. Ganti EMAIL_DI_BAWAH dengan email yang Anda gunakan
-- 5. Jalankan script ini di SQL Editor
--
-- =========================================

-- ⚠️ GANTI USER_ID_INI dengan UUID dari Supabase Auth
-- Cara mendapatkan UUID:
--   1. Buka Authentication > Users
--   2. Klik user admin yang baru dibuat
--   3. Copy "User UID" (UUID)
-- Contoh: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- ⚠️ GANTI EMAIL_INI dengan email yang Anda buat di Supabase Auth
-- Contoh: 'admin@sekolah.id'

INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
    'USER_ID_DARI_SUPABASE_AUTH',        -- ⚠️ GANTI dengan UUID dari Supabase Auth!
    'admin@sekolah.id',                   -- ⚠️ GANTI dengan email dari Supabase Auth!
    'Super Administrator',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =========================================
-- VERIFIKASI
-- =========================================
-- Setelah menjalankan script di atas, jalankan query ini untuk verifikasi:

-- SELECT * FROM public.profiles WHERE role = 'admin';

-- Hasil harus menampilkan 1 row dengan:
-- - id = UUID dari Supabase Auth
-- - email = email yang Anda buat
-- - role = 'admin'
-- - is_active = true

-- =========================================
-- CONTOH LENGKAP
-- =========================================
-- Jika User ID Anda: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Dan Email: admin@sekolah.id
--
-- Maka script menjadi:
--
-- INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
-- VALUES (
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--     'admin@sekolah.id',
--     'Super Administrator',
--     'admin',
--     true,
--     NOW(),
--     NOW()
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET 
--     email = EXCLUDED.email,
--     full_name = EXCLUDED.full_name,
--     role = EXCLUDED.role,
--     is_active = EXCLUDED.is_active,
--     updated_at = NOW();
