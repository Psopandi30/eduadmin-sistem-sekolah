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

    const fetchTeachers = useCallback(async (force = false) => {
        if (isInitialFetched && !force) return;
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

            if (data) {
                // 1. Fetch Cloud Backup to PRESERVE PASSWORDS
                const { data: cloudBackup } = await supabase.from('app_settings').select('value').eq('key', 'teachers_data_v10_sync').single();
                const preservedTeachers: Teacher[] = cloudBackup?.value as Teacher[] || [];
                const passwordMap: Record<string, string> = {};
                preservedTeachers.forEach(t => {
                    if (t.password && t.password !== '***') {
                        passwordMap[t.nip] = t.password;
                    }
                });

                const mappedData: Teacher[] = data.map(s => {
                    const profile = (s.profiles as any);
                    const homeroomClass = (s.classes as any)?.[0]?.name || '-';
                    const nip = s.employee_number;
                    return {
                        id: s.id,
                        nip: nip,
                        nama: profile?.full_name || '-',
                        jabatan: s.position,
                        mapel: '-',
                        wali: homeroomClass,
                        username: profile?.email?.split('@')[0] || nip,
                        password: passwordMap[nip] || '***'
                    };
                });

                setTeachers(mappedData);
                localStorage.setItem('teachers_data_v10', JSON.stringify(mappedData));

                // Cloud backup for Initial Login support
                await supabase.from('app_settings').upsert({
                    key: 'teachers_data_v10_sync',
                    value: mappedData,
                    updated_at: new Date().toISOString()
                });
            }
            setIsInitialFetched(true);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, [isInitialFetched]);

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
                    const email = `${newTeacher.username.trim()}@sekolah.id`.toLowerCase();
                    const password = newTeacher.password || '12345678';

                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { full_name: newTeacher.nama.trim(), role: 'gb' }
                        }
                    });

                    if (authError) throw new Error(`Auth Error: ${authError.message}`);
                    if (!authData.user) throw new Error("Gagal membuat user auth");

                    const userId = authData.user.id;

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            email,
                            full_name: newTeacher.nama.trim(),
                            role: 'gb',
                            is_active: true
                        });

                    if (profileError && !profileError.message.includes('duplicate')) throw profileError;

                    const { data: staffData, error: staffError } = await supabase
                        .from('staff')
                        .insert({
                            profile_id: userId,
                            employee_number: newTeacher.nip.trim(),
                            position: newTeacher.jabatan,
                        })
                        .select()
                        .single();

                    if (staffError) throw new Error(`Staff Insert Error: ${staffError.message}`);

                    const createdTeacher = { ...newTeacher, id: staffData.id, nama: newTeacher.nama.trim(), nip: newTeacher.nip.trim() };
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
            try {
                const { error } = await supabase.from('staff').delete().eq('id', id);
                if (error) throw error;
                setTeachers(prev => prev.filter(t => t.id !== id));
                toast.success("Data guru dihapus dari database");
            } catch (err: any) {
                toast.error(`Gagal menghapus: ${err.message}`);
            }
        } else {
            setTeachers(prev => prev.filter(t => t.id !== id));
            toast.success("Data guru dihapus (Lokal)");
        }
    };

    const updateTeacher = async (id: string | number, updates: Partial<Teacher>) => {
        if (isSupabaseConfigured() && typeof id === 'string') {
            try {
                const staffPayload: any = {};
                if (updates.nip) staffPayload.employee_number = updates.nip.trim();
                if (updates.jabatan) staffPayload.position = updates.jabatan;

                const { error } = await supabase
                    .from('staff')
                    .update(staffPayload)
                    .eq('id', id);

                if (error) throw error;

                if (updates.nama) {
                    const { data: sData } = await supabase.from('staff').select('profile_id').eq('id', id).single();
                    if (sData?.profile_id) {
                        await supabase.from('profiles').update({ full_name: updates.nama.trim() }).eq('id', sData.profile_id);
                    }
                }

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

                    const importedTeachers: Teacher[] = data.slice(1).map((row, idx) => ({
                        id: `temp-guru-${Date.now()}-${idx}`,
                        nama: String(row[1] || '').trim(),
                        nip: String(row[2] || '').trim(),
                        jabatan: String(row[3] || 'Guru Mata Pelajaran'),
                        wali: String(row[4] || '-'),
                        username: String(row[5] || '').trim(),
                        password: String(row[6] || 'guru123'),
                        mapel: '-'
                    })).filter(t => t.nama);

                    setTeachers(prev => {
                        const newTeachers = [...prev];
                        importedTeachers.forEach(imp => {
                            const index = newTeachers.findIndex(t => t.nip === imp.nip);
                            if (index >= 0) {
                                newTeachers[index] = { ...newTeachers[index], ...imp, id: newTeachers[index].id };
                            } else {
                                newTeachers.push(imp);
                            }
                        });
                        return newTeachers;
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

        const allTeachersToSync = teachers;
        if (allTeachersToSync.length === 0) {
            toast("Tidak ada data guru untuk disinkron", { icon: 'ℹ️' });
            return;
        }

        toast.promise(
            (async () => {
                const { data: dbStaff } = await supabase.from('staff').select('id, employee_number');
                const staffMap: Record<string, string> = {};
                dbStaff?.forEach(s => staffMap[s.employee_number] = s.id);

                const latestStaffMap: Record<string, string> = { ...staffMap };
                const updates: any[] = [];
                const inserts: any[] = [];

                allTeachersToSync.forEach(g => {
                    if (staffMap[g.nip]) {
                        updates.push({
                            id: staffMap[g.nip],
                            position: g.jabatan,
                            nama: g.nama.trim()
                        });
                    } else {
                        inserts.push({
                            employee_number: g.nip.trim(),
                            position: g.jabatan,
                            nama_temp: g.nama.trim() // Temp storage for sync
                        });
                    }
                });

                if (updates.length > 0) {
                    for (const up of updates) {
                        const { id, position, nama } = up;
                        await supabase.from('staff').update({ position }).eq('id', id);

                        if (nama) {
                            const { data: sData } = await supabase.from('staff').select('profile_id').eq('id', id).single();
                            if (sData?.profile_id) {
                                await supabase.from('profiles').update({ full_name: nama }).eq('id', sData.profile_id);
                            }
                        }
                    }
                }

                if (inserts.length > 0) {
                    // Stripping nama_temp before insert to staff table
                    const staffInserts = inserts.map(({ employee_number, position }) => ({ employee_number, position }));
                    const { error: insertError } = await supabase.from('staff').insert(staffInserts);
                    if (insertError) throw insertError;

                    for (const ins of inserts) {
                        if (ins.nama_temp) {
                            const { data: pData } = await supabase.from('profiles').select('id').eq('email', ins.employee_number + '@sekolah.id').single();
                            if (pData) {
                                await supabase.from('profiles').update({ full_name: ins.nama_temp }).eq('id', pData.id);
                            }
                        }
                    }
                }

                const { data: refreshedStaff } = await supabase.from('staff').select('id, employee_number');
                refreshedStaff?.forEach(s => latestStaffMap[s.employee_number] = s.id);

                const { data: dbClasses } = await supabase.from('classes').select('id, name');
                const classMap: Record<string, string> = {};
                dbClasses?.forEach(c => classMap[c.name] = c.id);

                for (const g of teachers) {
                    if (g.wali && g.wali !== '-') {
                        const classId = classMap[g.wali];
                        const teacherId = latestStaffMap[g.nip] || (typeof g.id === 'string' ? g.id : null);
                        if (classId && teacherId) {
                            await supabase.from('classes').update({ homeroom_teacher_id: null }).eq('homeroom_teacher_id', teacherId);
                            await supabase.from('classes').update({ homeroom_teacher_id: teacherId }).eq('id', classId);
                        }
                    } else if (g.wali === '-') {
                        const teacherId = latestStaffMap[g.nip] || (typeof g.id === 'string' ? g.id : null);
                        if (teacherId) {
                            await supabase.from('classes').update({ homeroom_teacher_id: null }).eq('homeroom_teacher_id', teacherId);
                        }
                    }
                }

                // 5. Cloud backup for Initial Login support (Legacy)
                await supabase.from('app_settings').upsert({
                    key: 'teachers_data_v10_sync',
                    value: teachers,
                    updated_at: new Date().toISOString()
                });

                await fetchTeachers(true); // Forced refresh
                return true;
            })(),
            {
                loading: 'Menyelaraskan data guru...',
                success: 'Sinkronisasi guru selesai!',
                error: (err) => `Gagal Sinkron: ${err.message}`
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
