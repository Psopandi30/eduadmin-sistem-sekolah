-- =====================================================
-- SUPABASE AUTHENTICATION & AUTHORIZATION SETUP
-- Sistem Login dan Hak Akses untuk Aplikasi Sekolah
-- =====================================================

-- 1. TABEL ROLES (Peran/Jabatan)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (name, display_name, description) VALUES
    ('super_admin', 'Super Admin', 'Akses penuh ke seluruh sistem'),
    ('kepala_sekolah', 'Kepala Sekolah', 'Akses laporan, statistik, dan monitoring'),
    ('wakil_kurikulum', 'Wakil Kurikulum', 'Akses kurikulum, jadwal, nilai, dan rapot'),
    ('staff_tu', 'Staff Tata Usaha', 'Akses keuangan dan tabungan'),
    ('operator_data', 'Operator Data', 'Akses manajemen data siswa, guru, dan sistem'),
    ('guru_mapel', 'Guru Mata Pelajaran', 'Akses mengajar dan nilai'),
    ('wali_kelas', 'Wali Kelas', 'Akses kelas dan siswa yang dibimbing'),
    ('guru_bimbel', 'Guru Bimbingan Belajar', 'Akses bimbel dan materi'),
    ('orang_tua', 'Orang Tua/Wali', 'Akses informasi anak'),
    ('siswa', 'Siswa', 'Akses pembelajaran dan informasi')
ON CONFLICT (name) DO NOTHING;

-- 2. TABEL PROFILES (Profil User)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE SET NULL,
    role VARCHAR(50) REFERENCES public.roles(name) ON DELETE SET NULL,
    avatar TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    nip VARCHAR(50), -- Untuk Guru/Staff
    nis VARCHAR(50), -- Untuk Siswa
    nisn VARCHAR(50), -- Untuk Siswa
    class_id VARCHAR(10), -- Untuk Siswa/Wali Kelas
    subjects TEXT[], -- Untuk Guru Mapel (array of subject IDs)
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON public.profiles(class_id);

-- 3. TABEL PERMISSIONS (Hak Akses Detail)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL, -- e.g., 'siswa', 'guru', 'keuangan', 'laporan'
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, module)
);

-- Insert permissions untuk setiap role
-- SUPER ADMIN - Full Access
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, TRUE, TRUE, TRUE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES 
        ('siswa'), ('guru'), ('kelas'), ('mata_pelajaran'), ('jadwal'), 
        ('absensi'), ('ujian'), ('nilai'), ('rapot'), ('naik_kelas'),
        ('keuangan'), ('tabungan'), ('bimbel'), ('pengumuman'), 
        ('multimedia'), ('ai'), ('laporan'), ('settings')
) AS m(module)
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, module) DO NOTHING;

-- KEPALA SEKOLAH - Read-only untuk laporan dan monitoring
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, FALSE, FALSE, FALSE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES ('laporan'), ('siswa'), ('guru'), ('kelas'), ('nilai'), ('rapot')
) AS m(module)
WHERE r.name = 'kepala_sekolah'
ON CONFLICT (role_id, module) DO NOTHING;

-- WAKIL KURIKULUM - Akses kurikulum
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, TRUE, TRUE, TRUE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES 
        ('kelas'), ('mata_pelajaran'), ('jadwal'), ('absensi'), 
        ('ujian'), ('nilai'), ('rapot'), ('naik_kelas')
) AS m(module)
WHERE r.name = 'wakil_kurikulum'
ON CONFLICT (role_id, module) DO NOTHING;

-- STAFF TATA USAHA - Akses keuangan
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, TRUE, TRUE, TRUE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES ('keuangan'), ('tabungan')
) AS m(module)
WHERE r.name = 'staff_tu'
ON CONFLICT (role_id, module) DO NOTHING;

-- OPERATOR DATA - Akses data management
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, TRUE, TRUE, TRUE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES 
        ('siswa'), ('guru'), ('kelas'), ('ujian'), ('bimbel'), 
        ('pengumuman'), ('multimedia'), ('ai')
) AS m(module)
WHERE r.name = 'operator_data'
ON CONFLICT (role_id, module) DO NOTHING;

-- GURU MAPEL - Akses mengajar
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, 
    CASE WHEN m.module IN ('nilai', 'absensi') THEN TRUE ELSE TRUE END,
    CASE WHEN m.module IN ('nilai', 'absensi') THEN TRUE ELSE FALSE END,
    CASE WHEN m.module IN ('nilai', 'absensi') THEN TRUE ELSE FALSE END,
    FALSE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES ('jadwal'), ('absensi'), ('nilai'), ('siswa')
) AS m(module)
WHERE r.name = 'guru_mapel'
ON CONFLICT (role_id, module) DO NOTHING;

-- WALI KELAS - Akses kelas
INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, TRUE, TRUE, TRUE, FALSE, TRUE
FROM public.roles r
CROSS JOIN (
    VALUES ('siswa'), ('absensi'), ('nilai'), ('rapot'), ('kelas')
) AS m(module)
WHERE r.name = 'wali_kelas'
ON CONFLICT (role_id, module) DO NOTHING;

-- 4. FUNCTION: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, nama, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nama', 'User Baru'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'siswa')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. FUNCTION: Update timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update timestamp
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Everyone can view roles
CREATE POLICY "Anyone can view roles"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Everyone can view permissions
CREATE POLICY "Anyone can view permissions"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(
    user_id UUID,
    module_name VARCHAR,
    permission_type VARCHAR -- 'view', 'create', 'edit', 'delete', 'export'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT 
        CASE permission_type
            WHEN 'view' THEN p.can_view
            WHEN 'create' THEN p.can_create
            WHEN 'edit' THEN p.can_edit
            WHEN 'delete' THEN p.can_delete
            WHEN 'export' THEN p.can_export
            ELSE FALSE
        END INTO has_perm
    FROM public.profiles pr
    JOIN public.permissions p ON p.role_id = pr.role_id
    WHERE pr.id = user_id AND p.module = module_name;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE DEFAULT USERS (CONTOH)
-- =====================================================
-- CATATAN: Gunakan Supabase Dashboard atau Auth API untuk membuat user
-- Script ini hanya contoh struktur data yang akan diinsert ke profiles

-- Contoh Insert Manual ke profiles (setelah user dibuat via Supabase Auth):
/*
-- Super Admin
INSERT INTO public.profiles (id, username, nama, role, role_id, email, is_active)
VALUES (
    'uuid-dari-supabase-auth', -- Ganti dengan UUID dari auth.users
    'admin',
    'Administrator Sistem',
    'super_admin',
    (SELECT id FROM public.roles WHERE name = 'super_admin'),
    'admin@sekolah.com',
    TRUE
);

-- Kepala Sekolah
INSERT INTO public.profiles (id, username, nama, role, role_id, nip, email, is_active)
VALUES (
    'uuid-dari-supabase-auth',
    'kepsek',
    'Dr. Ahmad Kepala Sekolah',
    'kepala_sekolah',
    (SELECT id FROM public.roles WHERE name = 'kepala_sekolah'),
    '196501011990031001',
    'kepsek@sekolah.com',
    TRUE
);

-- Wakil Kurikulum
INSERT INTO public.profiles (id, username, nama, role, role_id, nip, email, is_active)
VALUES (
    'uuid-dari-supabase-auth',
    'wakakur',
    'Siti Wakil Kurikulum',
    'wakil_kurikulum',
    (SELECT id FROM public.roles WHERE name = 'wakil_kurikulum'),
    '197002021992032002',
    'wakakur@sekolah.com',
    TRUE
);

-- Staff TU
INSERT INTO public.profiles (id, username, nama, role, role_id, nip, email, is_active)
VALUES (
    'uuid-dari-supabase-auth',
    'stafftu',
    'Budi Staff TU',
    'staff_tu',
    (SELECT id FROM public.roles WHERE name = 'staff_tu'),
    '198003031995031003',
    'stafftu@sekolah.com',
    TRUE
);

-- Operator Data
INSERT INTO public.profiles (id, username, nama, role, role_id, email, is_active)
VALUES (
    'uuid-dari-supabase-auth',
    'operator',
    'Rina Operator Data',
    'operator_data',
    (SELECT id FROM public.roles WHERE name = 'operator_data'),
    'operator@sekolah.com',
    TRUE
);
*/

-- 9. VIEW: User dengan Role Info
-- =====================================================
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    p.id,
    p.username,
    p.nama,
    p.email,
    p.phone,
    p.avatar,
    p.role,
    r.display_name AS role_display_name,
    r.description AS role_description,
    p.nip,
    p.nis,
    p.nisn,
    p.class_id,
    p.subjects,
    p.is_active,
    p.last_login,
    p.created_at,
    p.updated_at
FROM public.profiles p
LEFT JOIN public.roles r ON p.role = r.name;

-- Grant access to view
GRANT SELECT ON public.users_with_roles TO authenticated;

-- =====================================================
-- SELESAI
-- =====================================================

-- CATATAN PENTING:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Untuk membuat user baru, gunakan Supabase Auth API atau Dashboard
-- 3. Setelah user dibuat via Auth, profile akan otomatis dibuat via trigger
-- 4. Untuk set role, update table profiles dengan role yang sesuai
-- 5. Password di-manage oleh Supabase Auth, tidak disimpan di profiles

-- CARA MEMBUAT USER BARU VIA SUPABASE DASHBOARD:
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Klik "Add User"
-- 3. Masukkan email dan password
-- 4. Di User Metadata, tambahkan:
--    {
--      "username": "nama_user",
--      "nama": "Nama Lengkap",
--      "role": "nama_role"
--    }
-- 5. User akan otomatis dibuat di auth.users dan profiles

-- CARA LOGIN DI APLIKASI:
-- Gunakan Supabase Client:
-- const { data, error } = await supabase.auth.signInWithPassword({
--   email: 'user@sekolah.com',
--   password: 'password123'
-- })
