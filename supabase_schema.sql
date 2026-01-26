-- =========================================
-- EduAdmin School Management System
-- Supabase SQL Schema
-- Created: January 26, 2026
-- =========================================

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- =========================================
-- 1. USERS & AUTHENTICATION TABLES
-- =========================================

-- Custom user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'ks', 'gm', 'wk', 'gb', 'ot');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'ot',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Staff details table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_number TEXT UNIQUE NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    hire_date DATE,
    salary DECIMAL(15,2),
    phone TEXT,
    address TEXT,
    education_level TEXT,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================
-- 2. ACADEMIC STRUCTURE TABLES
-- =========================================

-- Academic years
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., "2024/2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subjects/Mata Pelajaran
CREATE TABLE public.subject_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    group_id UUID REFERENCES public.subject_groups(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Classes/Kelas
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., "1A", "2B"
    grade_level INTEGER NOT NULL, -- 1-12
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    homeroom_teacher_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    capacity INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Students/Siswa
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis TEXT UNIQUE NOT NULL,
    nisn TEXT UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('L', 'P')),
    birth_date DATE,
    birth_place TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- 3. ACADEMIC MANAGEMENT TABLES
-- =========================================

-- Schedule types
CREATE TYPE schedule_type AS ENUM ('regular', 'exam', 'extracurricular');

-- Schedules/Jadwal
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    schedule_type schedule_type DEFAULT 'regular',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Attendance types
CREATE TYPE attendance_status AS ENUM ('H', 'S', 'I', 'A', 'B', 'C'); -- Hadir, Sakit, Izin, Alpha, Bolos, Cut

-- Attendance/Absensi
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,

    UNIQUE(student_id, date, schedule_id)
);

-- Grades/Nilai
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester TEXT CHECK (semester IN ('1', '2')),
    assessment_type TEXT NOT NULL, -- e.g., 'UH1', 'UTS', 'UAS', 'Tugas'
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    weight DECIMAL(3,2) DEFAULT 1.0, -- Bobot penilaian
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Report Cards/Rapot
CREATE TABLE public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester TEXT CHECK (semester IN ('1', '2')),
    final_score DECIMAL(5,2),
    grade_letter TEXT,
    notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- 4. FINANCE MANAGEMENT TABLES
-- =========================================

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'qris', 'other');

-- Cash accounts/Kas
CREATE TABLE public.cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Payment types/Jenis Pembayaran
CREATE TABLE public.payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'SPP', 'Uang Buku', 'Uang Seragam'
    amount DECIMAL(15,2) NOT NULL,
    frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly', 'once')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Student bills/Tagihan Siswa
CREATE TABLE public.student_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    payment_type_id UUID REFERENCES public.payment_types(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Payment transactions/Transaksi Pembayaran
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_bill_id UUID REFERENCES public.student_bills(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method payment_method DEFAULT 'cash',
    reference_number TEXT, -- Bukti transfer, dll
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Expenses/Pengeluaran
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    proof_url TEXT, -- URL bukti pengeluaran
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- 5. SAVINGS/TABUNGAN TABLES
-- =========================================

-- Savings accounts/Tabungan
CREATE TABLE public.savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(5,4) DEFAULT 0.025, -- 2.5%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Savings transactions/Transaksi Tabungan
CREATE TABLE public.savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    savings_account_id UUID REFERENCES public.savings_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdrawal', 'interest')),
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    notes TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- 6. COMMUNICATION & ANNOUNCEMENTS
-- =========================================

-- Announcements/Pengumuman
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience user_role[],
    attachment_url TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Notifications/Notifikasi
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    related_id UUID, -- Could reference any table
    related_table TEXT, -- e.g., 'announcements', 'grades', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- 7. LIBRARY & MULTIMEDIA
-- =========================================

-- Library books/Perpustakaan
CREATE TABLE public.library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    publication_year INTEGER,
    category TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    location TEXT,
    description TEXT,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Book borrowings/Peminjaman Buku
CREATE TABLE public.book_borrowings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    borrow_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Multimedia content/Konten Multimedia
CREATE TABLE public.multimedia_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT CHECK (content_type IN ('video', 'audio', 'document', 'image')),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    grade_level INTEGER,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Performance indexes
CREATE INDEX idx_students_nis ON public.students(nis);
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_grades_student_subject ON public.grades(student_id, subject_id);
CREATE INDEX idx_schedules_class_day ON public.schedules(class_id, day_of_week);
CREATE INDEX idx_payment_transactions_student ON public.payment_transactions(student_id);
CREATE INDEX idx_savings_transactions_account ON public.savings_transactions(savings_account_id);
CREATE INDEX idx_announcements_published ON public.announcements(is_published, published_at);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust according to your security requirements)

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Students: Students can view their own data, teachers/admins can view all
CREATE POLICY "Students can view own data" ON public.students
    FOR SELECT USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'ks', 'gm', 'wk'))
    );

-- Similar policies for other tables...

-- =========================================
-- FUNCTIONS & TRIGGERS
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_staff
    BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_students
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_classes
    BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_attendance
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_report_cards
    BEFORE UPDATE ON public.report_cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_savings_accounts
    BEFORE UPDATE ON public.savings_accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update student bill status
CREATE OR REPLACE FUNCTION public.update_student_bill_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on paid_amount vs amount
    IF NEW.paid_amount >= NEW.amount THEN
        NEW.status = 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partial';
    ELSIF NEW.due_date < CURRENT_DATE THEN
        NEW.status = 'overdue';
    ELSE
        NEW.status = 'unpaid';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_bill_status_trigger
    BEFORE UPDATE ON public.student_bills
    FOR EACH ROW EXECUTE FUNCTION public.update_student_bill_status();

-- =========================================
-- INITIAL DATA/SEEDING
-- =========================================

-- Insert initial academic year
INSERT INTO public.academic_years (name, start_date, end_date, is_active) VALUES
('2024/2025', '2024-07-01', '2025-06-30', true);

-- Insert subject groups
INSERT INTO public.subject_groups (name, description) VALUES
('Agama', 'Mata pelajaran agama dan moral'),
('Bahasa', 'Bahasa Indonesia dan Asing'),
('Matematika', 'Matematika dan Logika'),
('IPA', 'Ilmu Pengetahuan Alam'),
('IPS', 'Ilmu Pengetahuan Sosial'),
('Seni Budaya', 'Seni dan Budaya'),
('Penjas', 'Pendidikan Jasmani dan Kesehatan'),
('Muatan Lokal', 'Muatan lokal daerah');

-- Insert sample subjects
INSERT INTO public.subjects (code, name, group_id, description) VALUES
('AGM-001', 'Pendidikan Agama Islam', (SELECT id FROM public.subject_groups WHERE name = 'Agama'), 'Mata pelajaran agama Islam'),
('BIND-001', 'Bahasa Indonesia', (SELECT id FROM public.subject_groups WHERE name = 'Bahasa'), 'Bahasa Indonesia'),
('MTK-001', 'Matematika', (SELECT id FROM public.subject_groups WHERE name = 'Matematika'), 'Matematika'),
('IPA-001', 'Ilmu Pengetahuan Alam', (SELECT id FROM public.subject_groups WHERE name = 'IPA'), 'IPA Terpadu'),
('IPS-001', 'Ilmu Pengetahuan Sosial', (SELECT id FROM public.subject_groups WHERE name = 'IPS'), 'IPS Terpadu'),
('SB-001', 'Seni Budaya', (SELECT id FROM public.subject_groups WHERE name = 'Seni Budaya'), 'Seni Budaya'),
('PJOK-001', 'Penjasorkes', (SELECT id FROM public.subject_groups WHERE name = 'Penjas'), 'Pendidikan Jasmani'),
('TIK-001', 'Teknologi Informasi', (SELECT id FROM public.subject_groups WHERE name = 'Muatan Lokal'), 'TIK');

-- Insert payment types
INSERT INTO public.payment_types (name, amount, frequency, description) VALUES
('SPP', 150000.00, 'monthly', 'Sumbangan Pembinaan Pendidikan'),
('Uang Buku', 50000.00, 'yearly', 'Uang pembelian buku pelajaran'),
('Uang Seragam', 200000.00, 'once', 'Uang seragam sekolah'),
('Uang Kegiatan', 25000.00, 'monthly', 'Uang kegiatan sekolah');

-- Insert cash accounts
INSERT INTO public.cash_accounts (name, account_number, bank_name, balance) VALUES
('Kas Sekolah Utama', '1234567890', 'BRI', 50000000.00),
('Kas Tabungan Siswa', '0987654321', 'BNI', 25000000.00);

-- =========================================
-- VIEWS FOR COMMON QUERIES
-- =========================================

-- Student overview view
CREATE VIEW public.student_overview AS
SELECT
    s.id,
    s.nis,
    s.full_name,
    s.gender,
    s.status,
    c.name as class_name,
    c.grade_level,
    ay.name as academic_year,
    st.full_name as homeroom_teacher,
    s.enrollment_date,
    s.phone,
    s.parent_name,
    s.parent_phone
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
LEFT JOIN public.academic_years ay ON c.academic_year_id = ay.id
LEFT JOIN public.staff st ON c.homeroom_teacher_id = st.id;

-- Financial summary view
CREATE VIEW public.financial_summary AS
SELECT
    'income' as type,
    SUM(pt.amount) as total_amount,
    COUNT(*) as transaction_count,
    pt.transaction_date::date as date
FROM public.payment_transactions pt
WHERE pt.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pt.transaction_date::date

UNION ALL

SELECT
    'expense' as type,
    SUM(e.amount) as total_amount,
    COUNT(*) as transaction_count,
    e.expense_date as date
FROM public.expenses e
WHERE e.expense_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.expense_date;

-- =========================================
-- END OF SCHEMA
-- =========================================

-- Note: Remember to set up your Supabase project and configure authentication
-- before running this SQL. Also, adjust RLS policies according to your security requirements.