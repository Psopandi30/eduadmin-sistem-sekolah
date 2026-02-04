-- =========================================
-- Setup Admin Account di Supabase
-- =========================================
-- 
-- INSTRUKSI:
-- 1. Buat user di Supabase Auth terlebih dahulu (Authentication > Users > Add user)
-- 2. Copy User ID (UUID) dari user yang baru dibuat
-- 3. Ganti USER_ID_DI_BAWAH dengan UUID tersebut
-- 4. Ganti EMAIL dengan email yang Anda gunakan
-- 5. Jalankan script ini di Supabase SQL Editor
--
-- =========================================

-- GANTI USER_ID_INI dengan UUID dari Supabase Auth
-- Contoh: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
DO $$
DECLARE
    admin_user_id UUID := 'USER_ID_DARI_SUPABASE_AUTH'; -- ⚠️ GANTI INI!
    admin_email TEXT := 'admin@sekolah.id'; -- ⚠️ GANTI INI dengan email Anda!
BEGIN
    -- Insert admin profile
    INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
    VALUES (
        admin_user_id,
        admin_email,
        'Administrator',
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
    
    RAISE NOTICE '✅ Admin profile created/updated successfully!';
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '🔑 Login dengan email dan password yang Anda buat di Supabase Auth';
END $$;

-- =========================================
-- Verifikasi Admin Account
-- =========================================
-- Jalankan query ini untuk cek apakah admin sudah dibuat:

-- SELECT * FROM public.profiles WHERE role = 'admin';

-- =========================================
-- Update Admin Password (jika perlu)
-- =========================================
-- Password diupdate via Supabase Auth Dashboard:
-- 1. Authentication > Users
-- 2. Klik user admin
-- 3. Klik "Reset Password" atau "Update User"
-- 4. Set password baru
