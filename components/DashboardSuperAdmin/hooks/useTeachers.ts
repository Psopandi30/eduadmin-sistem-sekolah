import { useState, useEffect, useCallback } from 'react';
import { teachersDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export interface Teacher {
    id: string | number;
    nama: string;
    nip: string;
    jabatan: string;
    mapel: string;
    wali: string;
    username: string;
    password: string;
    avatar?: string;
}

export const useTeachers = () => {
    const [teachers, setTeachers] = useState<Teacher[]>(() => {
        try {
            const saved = localStorage.getItem('teachers_data_v10');
            return saved ? JSON.parse(saved) : teachersDataGlobal;
        } catch (e) {
            return teachersDataGlobal;
        }
    });
    const [loading, setLoading] = useState(false);
    const [isInitialFetched, setIsInitialFetched] = useState(false);

    const fetchTeachers = useCallback(async () => {
        if (isInitialFetched) return;
        if (!isSupabaseConfigured()) {
            setIsInitialFetched(true);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    id,
                    employee_number,
                    position,
                    profiles (full_name, email),
                    classes!homeroom_teacher_id (name)
                `);

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedData: Teacher[] = data.map(s => {
                    const profile = (s.profiles as any);
                    const homeroomClass = (s.classes as any)?.[0]?.name || '-';
                    return {
                        id: s.id,
                        nip: s.employee_number,
                        nama: profile?.full_name || 'Tanpa Nama',
                        jabatan: s.position,
                        mapel: '-',
                        wali: homeroomClass,
                        username: profile?.email?.split('@')[0] || s.employee_number,
                        password: '***'
                    };
                });

                setTeachers(prev => {
                    const dbNips = new Set(mappedData.map(m => m.nip));
                    const localUnsaved = prev.filter(p =>
                        String(p.id).startsWith('temp-') && !dbNips.has(p.nip)
                    );
                    return [...mappedData, ...localUnsaved];
                });
                localStorage.setItem('teachers_data_v10', JSON.stringify(mappedData));
            }
            setIsInitialFetched(true);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, []); // Removed isInitialFetched dependency to allow manual refresh

    useEffect(() => {
        if (!isInitialFetched) {
            fetchTeachers();
        }
    }, [fetchTeachers, isInitialFetched]);

    // Debounced LocalStorage Sync (Backup)
    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('teachers_data_v10', JSON.stringify(teachers));
        }, 3500);
        return () => clearTimeout(timer);
    }, [teachers, loading]);

    const addTeacher = async (newTeacher: Teacher) => {
        if (isSupabaseConfigured()) {
            return toast.promise(
                (async () => {
                    // 1. Create Auth User
                    // Note: In a real app, you should use supabase.auth.admin.createUser (server-side)
                    // or have a separate registration flow. 
                    // To make this work client-side for "fixing data", we try signUp (might auto-login, which is risky)
                    // OR check if we can insert profile directly? No, FK exists.
                    // So we MUST signUp.

                    const email = `${newTeacher.username}@sekolah.id`.toLowerCase();
                    const password = newTeacher.password || '12345678';

                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { full_name: newTeacher.nama, role: 'gb' } // Role: Guru ('gb')
                        }
                    });

                    if (authError) throw new Error(`Auth Error: ${authError.message}`);
                    if (!authData.user) throw new Error("Gagal membuat user auth");

                    const userId = authData.user.id;

                    // 2. Insert Profile (might be unnecessary if trigger exists, but safe to try/upsert)
                    // Schema usually creates profile on auth trigger, check schema... 
                    // Schema doesn't show trigger for "on auth user created" -> insert profile.
                    // So we must insert manually.

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            email,
                            full_name: newTeacher.nama,
                            role: 'gb',
                            is_active: true
                        });

                    if (profileError) {
                        // If trigger already created it, we might get duplicate error, so let's try update/upsert?
                        // But standard simple insert.
                        if (!profileError.message.includes('duplicate')) throw profileError;
                    }

                    // 3. Insert Staff
                    const { data: staffData, error: staffError } = await supabase
                        .from('staff')
                        .insert({
                            profile_id: userId,
                            employee_number: newTeacher.nip,
                            position: newTeacher.jabatan,
                            // Add other fields if needed
                        })
                        .select()
                        .single();

                    if (staffError) throw new Error(`Staff Insert Error: ${staffError.message}`);

                    // 4. Update local state
                    const createdTeacher = { ...newTeacher, id: staffData.id };
                    setTeachers(prev => [createdTeacher, ...prev]);
                    return createdTeacher;
                })(),
                {
                    loading: 'Menambahkan guru ke database...',
                    success: 'Data guru berhasil disimpan!',
                    error: (err) => `Gagal: ${err.message}`
                }
            );
        } else {
            console.warn("Supabase not configured, saving locally only");
            setTeachers(prev => [newTeacher, ...prev]);
        }
    };

    const deleteTeacher = async (id: string | number) => {
        if (isSupabaseConfigured() && typeof id === 'string') {
            // If ID is string (UUID), it's likely from Supabase.
            // We need to delete from 'staff'. Profile delete? 
            // Staff has ON DELETE CASCADE from profile? No, Profile -> Staff. 
            // Deleting Staff row is enough, but user/profile remains. 
            // For cleanup, we ideally delete the User. Client can't delete User usually.
            // We will delete 'staff' record.

            try {
                const { error } = await supabase.from('staff').delete().eq('id', id);
                if (error) throw error;
                setTeachers(prev => prev.filter(t => t.id !== id));
                toast.success("Data guru dihapus dari database");
            } catch (err: any) {
                toast.error(`Gagal menghapus: ${err.message}`);
            }
        } else {
            // Local fallback
            setTeachers(prev => prev.filter(t => t.id !== id));
            toast.success("Data guru dihapus (Lokal)");
        }
    };

    const updateTeacher = async (id: string | number, updates: Partial<Teacher>) => {
        if (isSupabaseConfigured() && typeof id === 'string') {
            // Implementing basic update for position/NIP
            try {
                const { error } = await supabase
                    .from('staff')
                    .update({
                        employee_number: updates.nip,
                        position: updates.jabatan
                    })
                    .eq('id', id);

                if (error) throw error;

                // If name changed, update profile? 
                // Need profile_id from staff...
                // This is complex without proper join in fetch, but let's assume simple staff update for now.

                setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
                toast.success("Data guru diperbarui");
            } catch (err: any) {
                toast.error(`Gagal update: ${err.message}`);
            }
        } else {
            setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'No', 'Nama Lengkap', 'NIP', 'Jabatan', 'Wali Kelas', 'Username', 'password'
        ];
        const exampleData = [
            '1', 'H. Ahmad Syauqi, M.Pd.', '198501012010011001', 'Guru Mata Pelajaran', '1A', 'ahmadsyauqi', 'guru123'
        ];
        const csvContent = [headers.join(','), exampleData.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Template_Upload_Guru_Staff.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Template Guru & Staff berhasil diunduh!");
    };

    const handleUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const XLSX = await import('xlsx');
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                    if (data.length <= 1) {
                        toast.error("File kosong atau format salah");
                        return;
                    }

                    // Headers: No, Nama Lengkap, NIP, Jabatan, Wali Kelas, Username, password
                    const importedTeachers: Teacher[] = data.slice(1).map((row, idx) => ({
                        id: `temp-guru-${Date.now()}-${idx}`,
                        nama: String(row[1] || ''),
                        nip: String(row[2] || ''),
                        jabatan: String(row[3] || 'Guru Mata Pelajaran'),
                        wali: String(row[4] || '-'),
                        username: String(row[5] || ''),
                        password: String(row[6] || 'guru123'),
                        mapel: '-'
                    })).filter(t => t.nama);

                    setTeachers(prev => {
                        const existingNips = new Set(prev.map(t => t.nip));
                        const filteredNew = importedTeachers.filter(t => !existingNips.has(t.nip));
                        return [...prev, ...filteredNew];
                    });

                    toast.success(`${importedTeachers.length} data guru diimpor (Lokal)`);
                    toast("Klik 'Simpan' untuk menyelaraskan ke database.", { icon: 'ℹ️' });
                } catch (err) {
                    console.error("Error parsing file:", err);
                    toast.error("Gagal membaca file");
                }
            };
            reader.readAsBinaryString(file);
        };
        input.click();
    };

    const handleSaveData = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            toast.success("Data tersimpan secara lokal");
            return;
        }

        const unsyncedGuru = teachers.filter(t => String(t.id).startsWith('temp-'));
        if (unsyncedGuru.length === 0) {
            toast("Semua data guru sudah tersinkron", { icon: '✅' });
            return;
        }

        toast.promise(
            (async () => {
                // For teachers, we need to create profiles/auth or update existing staff
                // Since bulk user creation is complex via client API, 
                // we'll focus on updating STAFF info if NIP already exists.
                // If NIP doesn't exist, it currently requires manual 'Add Teacher' to handle auth.

                const { data: dbStaff } = await supabase.from('staff').select('id, employee_number');
                const staffMap: Record<string, string> = {};
                dbStaff?.forEach(s => staffMap[s.employee_number] = s.id);

                const updates: any[] = [];
                const toAddManually: string[] = [];

                unsyncedGuru.forEach(g => {
                    if (staffMap[g.nip]) {
                        updates.push({
                            id: staffMap[g.nip],
                            position: g.jabatan
                            // Add more updateable fields if needed
                        });
                    } else {
                        toAddManually.push(g.nama);
                    }
                });

                if (updates.length > 0) {
                    for (const up of updates) {
                        const { id, ...rest } = up;
                        await supabase.from('staff').update(rest).eq('id', id);
                    }
                }

                // Sync Homeroom Teacher Assignments to 'classes' table
                const { data: dbClasses } = await supabase.from('classes').select('id, name');
                const classMap: Record<string, string> = {};
                dbClasses?.forEach(c => classMap[c.name] = c.id);

                for (const g of teachers) {
                    if (g.wali && g.wali !== '-') {
                        const classId = classMap[g.wali];
                        const teacherId = staffMap[g.nip] || (typeof g.id === 'string' ? g.id : null);
                        if (classId && teacherId) {
                            // First, clear this teacher from any other classes they might be a homeroom for
                            await supabase.from('classes').update({ homeroom_teacher_id: null }).eq('homeroom_teacher_id', teacherId);
                            // Then assign to new class
                            await supabase.from('classes').update({ homeroom_teacher_id: teacherId }).eq('id', classId);
                        }
                    } else if (g.wali === '-') {
                        const teacherId = staffMap[g.nip] || (typeof g.id === 'string' ? g.id : null);
                        if (teacherId) {
                            await supabase.from('classes').update({ homeroom_teacher_id: null }).eq('homeroom_teacher_id', teacherId);
                        }
                    }
                }

                if (toAddManually.length > 0) {
                    toast(`${toAddManually.length} guru baru butuh ditambahkan manual (untuk Akun Login)`, { icon: '⚠️' });
                }

                // Cleanup & Refresh
                await fetchTeachers();
                return true;
            })(),
            {
                loading: 'Menyelaraskan data guru...',
                success: 'Sinkronisasi guru selesai!',
                error: (err) => `Gagal: ${err.message}`
            }
        );
    }, [teachers, fetchTeachers]);

    return {
        teachers,
        setTeachers,
        loading,
        addTeacher,
        deleteTeacher,
        updateTeacher,
        handleDownloadTemplate,
        handleUploadClick,
        handleSaveData,
        refreshTeachers: fetchTeachers
    };
};
