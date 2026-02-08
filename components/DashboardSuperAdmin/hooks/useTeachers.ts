import { useState, useEffect, useCallback } from 'react';
import { teachersDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../../src/utils/logger';

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
                const { data: cloudBackup } = await supabase.from('app_settings').select('value').eq('key', 'teachers_data_v10_sync').maybeSingle();
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
            logger.error('Error fetching teachers:', err);
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
                    // Build target email and password
                    const email = `${newTeacher.username.trim()}@sekolah.id`.toLowerCase();
                    const password = newTeacher.password || '12345678';

                    // 1) Check if a profile with this email already exists. If so, reuse its id.
                    let userId: string | null = null;
                    let authData: any = undefined;
                    try {
                        const { data: existingProfile } = await supabase.from('profiles').select('id, email').eq('email', email).maybeSingle();
                        if (existingProfile && existingProfile.id) {
                            userId = existingProfile.id;
                            // Update full name if different
                            await supabase.from('profiles').update({ full_name: newTeacher.nama.trim(), is_active: true }).eq('id', userId);
                        }
                    } catch (e) {
                        logger.warn('Error checking existing profile', e);
                    }

                    // 2) If no existing profile found, attempt signUp to create auth user and profile
                    if (!userId) {
                        const signUpRes = await supabase.auth.signUp({
                            email,
                            password,
                            options: {
                                data: { full_name: newTeacher.nama.trim(), role: 'gb' }
                            }
                        });
                        const authDataLocal = signUpRes.data;
                        const authError = signUpRes.error;
                        authData = authDataLocal;

                        // If signup failed due to user already existing (race/previous import), try to recover by loading profile
                        if (authError) {
                            const msg = String(authError.message || '').toLowerCase();
                            if (msg.includes('already') || msg.includes('registered')) {
                                const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
                                if (existing && existing.id) {
                                    userId = existing.id;
                                } else {
                                    throw new Error(`Auth Error: ${authError.message}`);
                                }
                            } else {
                                throw new Error(`Auth Error: ${authError.message}`);
                            }
                        }

                        if (!userId) {
                            if (!authData?.user) throw new Error("Gagal membuat user auth");
                            userId = authData.user.id;
                        }

                        // Ensure profile record exists for the created user id
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: userId,
                                email,
                                full_name: newTeacher.nama.trim(),
                                role: 'gb',
                                is_active: true
                            }, { onConflict: 'id' });

                        if (profileError) throw profileError;
                    }

                    const { data: staffData, error: staffError } = await supabase
                        .from('staff')
                        .insert({
                            profile_id: userId,
                            employee_number: newTeacher.nip.trim(),
                            position: newTeacher.jabatan,
                        })
                        .select()
                        .maybeSingle();

                    if (staffError || !staffData) throw new Error(`Staff Insert Error: ${staffError?.message || 'Data not returned'}`);

                    // Ensure password is recorded locally (for fallback login) and normalized
                    const finalPassword = password;
                    const createdTeacher = { ...newTeacher, id: staffData.id, nama: newTeacher.nama.trim(), nip: newTeacher.nip.trim(), password: finalPassword };

                    // Update local state and persist to localStorage immediately
                    setTeachers(prev => {
                        const updated = [createdTeacher, ...prev];
                        try {
                            localStorage.setItem('teachers_data_v10', JSON.stringify(updated));
                        } catch (e) {
                            logger.warn('Failed to save teachers to localStorage', e);
                        }
                        return updated;
                    });

                    // Upsert cloud backup so other clients can sync immediately (fallback login relies on this)
                    try {
                        await supabase.from('app_settings').upsert({
                            key: 'teachers_data_v10_sync',
                            value: JSON.parse(localStorage.getItem('teachers_data_v10') || '[]'),
                            updated_at: new Date().toISOString()
                        });
                    } catch (e) {
                        logger.warn('Failed to upsert teachers backup to app_settings:', e);
                    }

                    // If signUp happened and did not create a session, Supabase may require email confirmation.
                    // Inform admin so they know the user cannot login until confirmation is completed.
                    if (authData && !authData.session) {
                        toast.success('Data guru berhasil disimpan! (Konfirmasi email diperlukan sebelum login)');
                    }

                    return createdTeacher;
                })(),
                {
                    loading: 'Menambahkan guru ke database...',
                    success: 'Data guru berhasil disimpan!',
                    error: (err) => `Gagal: ${err.message}`
                }
            );
        } else {
            logger.warn("Supabase not configured, saving locally only");
            setTeachers(prev => [newTeacher, ...prev]);
        }
    };

    // Helper: map jabatan string to role code used in profiles.role
    const mapJabatanToRole = (jabatan: string) => {
        const j = (jabatan || '').toLowerCase();
        if (j.includes('kepala')) return 'ks';
        if (j.includes('wali') || j.includes('kelas')) return 'wk';
        if (j.includes('mata pelajaran') || j.includes('mapel')) return 'gm';
        if (j.includes('bimbel') || j.includes('bimbingan')) return 'gb';
        if (j.includes('operator') || j.includes('data')) return 'operator_data';
        if (j.includes('tata usaha') || j.includes('staff')) return 'staff_tu';
        return 'ot';
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
                    const { data: sData } = await supabase.from('staff').select('profile_id').eq('id', id).maybeSingle();
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
        // Security: Use placeholder instead of hardcoded password
        const exampleData = [
            '1', 'H. Ahmad Syauqi, M.Pd.', '198501012010011001', 'Guru Mata Pelajaran', '1A', 'ahmadsyauqi', '[PASSWORD]'
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
                        // Security: Require password from import, no default fallback
                        password: String(row[6] || '').trim() || String(row[2] || '').trim(), // Use NIP as fallback if password not provided
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
                    logger.error("Error parsing file:", err);
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
                // Batch strategy:
                // 1) fetch existing staff and profiles for emails
                // 2) upsert profiles in batch (onConflict email) and get profile ids
                // 3) upsert staff in batch (onConflict employee_number) using profile ids
                // 4) update classes assignments in parallel (clear old assignments, set new ones)

                // 1) fetch existing staff and classes
                const { data: dbStaff } = await supabase.from('staff').select('id, employee_number');
                const staffMap: Record<string, string> = {};
                dbStaff?.forEach(s => staffMap[s.employee_number] = s.id);

                // Separate tutoring (bimbel) teachers to store in `tutoring_teachers` table
                const bimbelTeachers = allTeachersToSync.filter(t => mapJabatanToRole(t.jabatan) === 'gb');
                const normalTeachers = allTeachersToSync.filter(t => mapJabatanToRole(t.jabatan) !== 'gb');

                const emails = Array.from(new Set(normalTeachers.map(t => ((t.username || t.nip) + '@sekolah.id').toLowerCase())));
                const { data: existingProfiles } = await supabase.from('profiles').select('id, email, role').in('email', emails);
                const profileByEmail: Record<string, string> = {};
                const profileRoleByEmail: Record<string, string> = {};
                existingProfiles?.forEach(p => {
                    if (p.email) profileByEmail[p.email] = p.id;
                    if (p.email && p.role) profileRoleByEmail[p.email] = p.role;
                });

                // 2) Prepare profiles payload and upsert (onConflict by email)
                const profilesPayload = emails.map(email => {
                    // find teacher to get full_name
                    const t = normalTeachers.find(x => ((x.username || x.nip) + '@sekolah.id').toLowerCase() === email);
                    return {
                        email,
                        full_name: t?.nama?.trim() || ''
                    };
                });

                // Detect potential role changes: compare existing profile.role with the role implied by jabatan
                const conflicts: Array<{ email: string; existingRole?: string; expectedRole: string; nama?: string }> = [];
                emails.forEach(email => {
                    const t = normalTeachers.find(x => ((x.username || x.nip) + '@sekolah.id').toLowerCase() === email);
                    const expectedRole = t ? mapJabatanToRole(t.jabatan) : 'ot';
                    const existingRole = profileRoleByEmail[email];
                    if (existingRole && existingRole !== expectedRole) {
                        conflicts.push({ email, existingRole, expectedRole, nama: t?.nama });
                    }
                });

                // If conflicts detected, ask admin to confirm before overwriting roles
                if (conflicts.length > 0) {
                    const summary = conflicts.slice(0, 5).map(c => `${c.nama || c.email}: ${c.existingRole} → ${c.expectedRole}`).join('\n');
                    const proceed = window.confirm(`Terdeteksi perubahan role untuk ${conflicts.length} akun:\n${summary}${conflicts.length > 5 ? '\n...dan lainnya' : ''}\n\nLanjutkan dan perbarui role sesuai jabatan?`);

                    // Audit attempt
                    try {
                        const { data: sessData } = await supabase.auth.getSession();
                        const actorId = sessData?.session?.user?.id || null;
                        const { data: existingLog } = await supabase.from('app_settings').select('value').eq('key', 'audit_logs').maybeSingle();
                        const logs = existingLog?.value || [];
                        logs.push({
                            id: `log-${Date.now()}`,
                            actor: actorId,
                            time: new Date().toISOString(),
                            action: 'detect_role_conflict',
                            details: { count: conflicts.length, sample: conflicts.slice(0, 10) },
                            outcome: proceed ? 'confirmed' : 'cancelled'
                        });
                        await supabase.from('app_settings').upsert({ key: 'audit_logs', value: logs, updated_at: new Date().toISOString() });
                    } catch (e) {
                        logger.warn('Failed to write audit log for role conflict', e);
                    }

                    if (!proceed) {
                        throw new Error('Sinkronisasi dibatalkan oleh pengguna (konflik role terdeteksi)');
                    }
                }

                const { data: upsertedProfiles } = await supabase.from('profiles').upsert(profilesPayload, { onConflict: 'email' }).select('id,email');
                upsertedProfiles?.forEach(p => { if (p.email) profileByEmail[p.email] = p.id; });

                // 6) Handle tutoring (bimbel) teachers separately: upsert into `tutoring_teachers`
                if (bimbelTeachers.length > 0) {
                    try {
                        const tutoringPayload = bimbelTeachers.map(t => {
                            const username = ((t.username || t.nip) + '').trim();
                            return {
                                name: t.nama?.trim() || '',
                                source: 'internal',
                                subject_name: t.mapel || '',
                                class_id: t.wali && t.wali !== '-' ? t.wali : null,
                                username: username || null,
                                password: t.password || (t.nip ? String(t.nip).trim() : null),
                                status: 'Aktif'
                            };
                        });
                        await supabase.from('tutoring_teachers').upsert(tutoringPayload, { onConflict: 'username' });
                    } catch (e) {
                        logger.warn('Failed to upsert tutoring_teachers payload', e);
                    }
                }

                // 3) Prepare staff payloads for upsert
                const staffPayload: any[] = allTeachersToSync.map(t => {
                    const emp = String(t.nip || '').trim();
                    const email = ((t.username || emp) + '@sekolah.id').toLowerCase();
                    const profileId = profileByEmail[email] || null;
                    if (staffMap[emp]) {
                        return { id: staffMap[emp], employee_number: emp, position: t.jabatan };
                    }
                    return { employee_number: emp, position: t.jabatan, profile_id: profileId };
                });

                const { data: upsertedStaff, error: staffUpsertError } = await supabase.from('staff').upsert(staffPayload, { onConflict: 'employee_number' }).select('id,employee_number');
                if (staffUpsertError) throw staffUpsertError;

                const latestStaffMap: Record<string, string> = { ...staffMap };
                upsertedStaff?.forEach(s => { latestStaffMap[s.employee_number] = s.id; });

                // 4) Classes: fetch class ids then perform updates in parallel
                const { data: dbClasses } = await supabase.from('classes').select('id, name, homeroom_teacher_id');
                const classMap: Record<string, any> = {};
                dbClasses?.forEach(c => { classMap[c.name] = c; });

                // Build assignments: for each teacher determine desired classId (or null to clear)
                const assignments: Array<{ teacherId: string; classId: string | null }> = [];
                allTeachersToSync.forEach(g => {
                    const emp = String(g.nip || '').trim();
                    const teacherId = latestStaffMap[emp] || (typeof g.id === 'string' ? g.id : null);
                    if (!teacherId) return;
                    if (g.wali && g.wali !== '-') {
                        const c = classMap[g.wali];
                        if (c) assignments.push({ teacherId, classId: c.id });
                    } else {
                        assignments.push({ teacherId, classId: null });
                    }
                });

                // Clear homeroom_teacher_id for any teachers that will be reassigned
                const teacherIdsToClear = Array.from(new Set(assignments.map(a => a.teacherId)));
                if (teacherIdsToClear.length > 0) {
                    await supabase.from('classes').update({ homeroom_teacher_id: null }).in('homeroom_teacher_id', teacherIdsToClear);
                }

                // Now set new assignments (parallel)
                const classUpdatePromises = assignments.filter(a => a.classId).map(a => supabase.from('classes').update({ homeroom_teacher_id: a.teacherId }).eq('id', a.classId));
                await Promise.all(classUpdatePromises);

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
