-- =========================================
-- EduAdmin Tutoring Module Schema
-- Connects Bimbingan Belajar to Supabase
-- =========================================

-- 1. Tutoring Subjects (Mata Pelajaran Bimbel)
CREATE TABLE IF NOT EXISTS public.tutoring_subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    classes TEXT[] DEFAULT '{}',
    meetings_count INTEGER DEFAULT 10,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tutoring Teachers/Groups (Guru Bimbel / Kelas Bimbel)
CREATE TABLE IF NOT EXISTS public.tutoring_teachers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    source TEXT DEFAULT 'internal',
    subject_id INTEGER REFERENCES public.tutoring_subjects(id) ON DELETE SET NULL,
    subject_name TEXT, -- Denormalized for performance
    class_id TEXT, -- e.g., '6 Persiapan'
    schedule_day TEXT,
    schedule_start TEXT,
    schedule_end TEXT,
    username TEXT UNIQUE,
    password TEXT,
    students_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tutoring Materials (Materi Bimbel)
CREATE TABLE IF NOT EXISTS public.tutoring_materials (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES public.tutoring_teachers(id) ON DELETE CASCADE,
    subject_name TEXT,
    meeting_number INTEGER,
    title TEXT,
    video_url TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tutoring Enrollments (Siswa di Bimbel)
CREATE TABLE IF NOT EXISTS public.tutoring_enrollments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES public.tutoring_teachers(id) ON DELETE CASCADE,
    student_id INTEGER, -- NIS or Student ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, student_id)
);

-- Enable RLS
ALTER TABLE public.tutoring_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies (Public access for now as per project pattern, or refine later)
CREATE POLICY "Public Read Access" ON public.tutoring_subjects FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutoring_teachers FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutoring_materials FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.tutoring_enrollments FOR SELECT USING (true);

CREATE POLICY "Full Admin Access" ON public.tutoring_subjects FOR ALL USING (true);
CREATE POLICY "Full Admin Access" ON public.tutoring_teachers FOR ALL USING (true);
CREATE POLICY "Full Admin Access" ON public.tutoring_materials FOR ALL USING (true);
CREATE POLICY "Full Admin Access" ON public.tutoring_enrollments FOR ALL USING (true);
