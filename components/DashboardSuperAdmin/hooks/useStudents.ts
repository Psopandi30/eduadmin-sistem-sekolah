import React, { useState, useEffect, useCallback } from 'react';
import { studentsDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../../src/utils/logger';

export interface Student {
    id: string | number;
    nis: string;
    nama: string;
    ttl: string;
    kelas: string;
    tingkat: number;
    paralel: string;
    ayah: string;
    ibu: string;
    jobAyah: string;
    jobIbu: string;
    username: string;
    password?: string;
    // Optional fields for compatibility
    gender?: string;
    sppStatus?: string;
    tabungan?: number;
    status?: string;
}

export const useStudents = () => {
    const [students, setStudents] = useState<Student[]>(() => {
        try {
            const saved = localStorage.getItem('students_data_v10');
            return saved ? JSON.parse(saved) : studentsDataGlobal;
        } catch (e) {
            return studentsDataGlobal;
        }
    });
    const [loading, setLoading] = useState(false);
    const [isInitialFetched, setIsInitialFetched] = useState(false);

    const fetchStudents = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setIsInitialFetched(true);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*, classes(*)');

            if (error) throw error;

            // 1. Map data from Supabase
            const mappedData: Student[] = data.map(s => {
                const classObj = s.classes;
                return {
                    id: s.id,
                    nis: s.nis,
                    nama: s.full_name,
                    ttl: `${s.birth_place || ''}${s.birth_place && s.birth_date ? ', ' : ''}${s.birth_date || ''}`,
                    kelas: classObj?.name || '-',
                    tingkat: classObj?.grade_level || 1,
                    paralel: classObj?.name ? String(classObj.name).replace(/[0-9]/g, '') : '-',
                    ayah: s.parent_name || '',
                    ibu: s.mother_name || '',
                    jobAyah: s.father_job || '',
                    jobIbu: s.mother_job || '',
                    username: s.nis,
                    password: s.password || s.nis, // Use stored password or fallback to NIS
                    gender: s.gender,
                    status: s.status
                };
            });

            // 2. SMART MERGE: Keep local temp data ONLY if the NIS is not already in the DB data
            // This prevents double-counting students after save
            setStudents(prev => {
                const dbNisSet = new Set(mappedData.map(m => m.nis));
                const localUnsaved = prev.filter(p =>
                    String(p.id).startsWith('temp-') && !dbNisSet.has(p.nis)
                );
                return [...mappedData, ...localUnsaved];
            });
            localStorage.setItem('students_data_v10', JSON.stringify(mappedData));

            // Cloud backup for Initial Login support
            await supabase.from('app_settings').upsert({
                key: 'students_data_v10_sync',
                value: mappedData,
                updated_at: new Date().toISOString()
            });
        } catch (err) {
            logger.error('Error fetching students:', err);
            toast.error('Gagal memuat data siswa', { id: 'error-fetch-students' });
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, []);

    useEffect(() => {
        if (!isInitialFetched) {
            fetchStudents();
        }
    }, [fetchStudents, isInitialFetched]);

    // Debounced LocalStorage Sync
    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('students_data_v10', JSON.stringify(students));
        }, 3000);
        return () => clearTimeout(timer);
    }, [students, loading]);

    const addNewStudent = async (student: Student) => {
        if (isSupabaseConfigured()) {
            try {
                // Find class ID
                const { data: classData } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('name', student.kelas)
                    .single();

                const { data, error } = await supabase
                    .from('students')
                    .insert([{
                        nis: student.nis,
                        full_name: student.nama,
                        parent_name: student.ayah,
                        mother_name: student.ibu,
                        father_job: student.jobAyah,
                        mother_job: student.jobIbu,
                        birth_place: student.ttl?.split(',')[0]?.trim() || null,
                        class_id: classData?.id || null,
                        gender: student.gender || 'L',
                        status: 'active'
                    }])
                    .select();

                if (error) throw error;

                if (data) {
                    const createdId = data[0].id;
                    const createdStudent = { ...student, id: createdId };
                    setStudents(prev => [...prev, createdStudent]);
                    toast.success("Siswa berhasil ditambahkan!");
                    return createdStudent;
                }
            } catch (err: any) {
                logger.error('Error adding student to Supabase:', err);
                toast.error(`Gagal menyimpan: ${err.message}`);
                // Fallback local
                setStudents(prev => [...prev, student]);
            }
        } else {
            setStudents(prev => [...prev, student]);
            toast.success("Siswa ditambahkan (Lokal)");
        }
    };

    const updateStudent = async (id: string | number, updates: Partial<Student>) => {
        if (isSupabaseConfigured() && typeof id === 'string') {
            try {
                const dbUpdates: any = {};
                if (updates.nama) dbUpdates.full_name = updates.nama;
                if (updates.nis) dbUpdates.nis = updates.nis;
                if (updates.ayah) dbUpdates.parent_name = updates.ayah;
                if (updates.ibu) dbUpdates.mother_name = updates.ibu;
                if (updates.jobAyah) dbUpdates.father_job = updates.jobAyah;
                if (updates.jobIbu) dbUpdates.mother_job = updates.jobIbu;
                if (updates.gender) dbUpdates.gender = updates.gender;

                // If kelas changed, need to lookup class_id again
                if (updates.kelas) {
                    const { data: cData } = await supabase.from('classes').select('id').eq('name', updates.kelas).single();
                    if (cData) dbUpdates.class_id = cData.id;
                }

                const { error } = await supabase
                    .from('students')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;
                setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
                toast.success("Data siswa diperbarui");
            } catch (err: any) {
                logger.error('Error updating student in Supabase:', err);
                toast.error(`Gagal update: ${err.message}`);
            }
        } else {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        }
    };

    const updateStudents = (updatedStudents: Student[]) => {
        // Bulk update logic placeholder - ideally implements Promise.all for Supabase
        setStudents(prev => {
            const newStudents = [...prev];
            updatedStudents.forEach(updated => {
                const index = newStudents.findIndex(s => s.id === updated.id);
                if (index !== -1) {
                    newStudents[index] = updated;
                }
            });
            return newStudents;
        });
    };

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

    const handleViewStudent = (studentData: any) => {
        setSelectedStudent(studentData);
        setModalMode('view');
        setShowAddStudentModal(true);
    };

    const handleAddStudent = () => {
        setSelectedStudent({
            nis: '', nama: '', ttl: '', kelas: '1A', tingkat: 1, paralel: '',
            ayah: '', ibu: '', jobAyah: '', jobIbu: '', username: '', password: ''
        });
        setModalMode('add');
        setShowAddStudentModal(true);
    };

    const handleEditStudent = (studentData: any) => {
        setSelectedStudent(studentData);
        setModalMode('edit');
        setShowAddStudentModal(true);
    };

    const handleDelete = async (param: any) => {
        let id: string | number;
        let name: string = 'Siswa';

        if (typeof param === 'object' && param !== null) {
            id = param.id;
            name = param.nama || 'Siswa';
        } else {
            id = param;
            const s = students.find(s => s.id === id);
            if (s) name = s.nama;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus data ${name}?`)) {
            if (isSupabaseConfigured()) {
                // Ensure ID is string for Supabase, or handle generic
                const stringsId = String(id);
                try {
                    const { error } = await supabase.from('students').delete().eq('id', stringsId);
                    if (error) throw error;
                    setStudents(prev => prev.filter(s => s.id !== id));
                    toast.success("Data siswa dihapus");
                } catch (err: any) {
                    logger.error('Error deleting student from Supabase:', err);
                    toast.error(`Gagal menghapus: ${err.message}`);
                    // Fallback local delete if error (optional, but maybe better not to desync)
                }
            } else {
                setStudents(prev => prev.filter(s => s.id !== id));
                toast.success("Data siswa dihapus (Lokal)");
            }
        }
    };

    const handleDownloadTemplate = (type: string = 'Seluruh_Data_Siswa') => {
        // ... (Existing template logic is fine)
        const headers = [
            'No', 'NIS', 'Nama Lengkap', 'Tempat_Tanggal_Lahir', 'Jenis_Kelamin', 'Tingkat', 'KELAS',
            'Paralel', 'Nama_Ayah', 'Nama_Ibu', 'Pekerjaan_Ayah', 'Pekerjaan_Ibu',
            'Username', 'Password'
        ];
        let exampleData = [
            '1', '2024001', 'Budi Santoso', 'Garut, 12-05-2010', 'L', '1', '1A',
            'A', 'Sandi Santoso', 'Siti Aminah', 'Wiraswasta', 'Ibu Rumah Tangga',
            '2024001', '2024001'
        ];
        // ... simple CSV gen
        const csvContent = [headers.join(','), exampleData.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Template_Upload_${type}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Template berhasil diunduh!");
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

                    // Simple Mapping based on template
                    // Headers: No, NIS, Nama Lengkap, Tempat_Tanggal_Lahir, Tingkat, KELAS, Paralel, ...
                    if (data.length <= 1) {
                        toast.error("File kosong atau format salah");
                        return;
                    }

                    const importedStudents: Student[] = data.slice(1).map((row, idx) => {
                        const tingkatVal = String(row[5] || '');
                        const paralelVal = String(row[7] || '');
                        const nisVal = String(row[1] || row[12] || '').trim(); // Smart NIS detection
                        const usernameVal = String(row[12] || row[1] || '').trim();

                        const kelasName = (row[6] && String(row[6]).length === 1)
                            ? `${row[6]}${paralelVal}`
                            : String(row[6] || `${tingkatVal}${paralelVal}`);

                        return {
                            id: `temp-${Date.now()}-${idx}`,
                            nis: nisVal,
                            nama: String(row[2] || ''),
                            ttl: String(row[3] || ''),
                            gender: String(row[4] || 'L').toUpperCase().startsWith('L') ? 'L' : 'P',
                            tingkat: parseInt(row[5]) || 1,
                            kelas: kelasName,
                            paralel: paralelVal,
                            ayah: String(row[8] || ''),
                            ibu: String(row[9] || ''),
                            jobAyah: String(row[10] || ''),
                            jobIbu: String(row[11] || ''),
                            username: usernameVal,
                        };
                    }).filter(s => s.nama && s.nis);

                    setStudents(prev => {
                        const existingNisMap = new Map(prev.map((s, i) => [s.nis, i]));
                        const newStudents = [...prev];

                        importedStudents.forEach(imported => {
                            if (existingNisMap.has(imported.nis)) {
                                const idx = existingNisMap.get(imported.nis)!;
                                // Keep the original ID if it was a UUID, but update data
                                const originalId = newStudents[idx].id;
                                newStudents[idx] = { ...imported, id: originalId };
                            } else {
                                newStudents.push(imported);
                            }
                        });
                        return newStudents;
                    });

                    toast.success(`${importedStudents.length} data siswa berhasil diimpor (Lokal)`);
                    toast("Klik 'Simpan' untuk menyimpan permanen ke database.", { icon: 'ℹ️' });
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
            toast.success("Data tersimpan secara lokal (Supabase belum dikonfigurasi)");
            return;
        }

        // Ambil semua siswa untuk sinkronisasi, agar data yang diupdate (via upload) juga ikut tersimpan
        const studentsToSave = students;

        if (studentsToSave.length === 0) {
            toast("Semua data sudah tersinkron", { icon: '✅' });
            return;
        }

        toast.promise(
            (async () => {
                // 1. Get Class Map & Existing Students
                const [classRes, studentRes] = await Promise.all([
                    supabase.from('classes').select('id, name'),
                    supabase.from('students').select('id, nis')
                ]);

                const classMap: Record<string, string> = {};
                classRes.data?.forEach(c => classMap[c.name] = c.id);

                const existingMap: Record<string, string> = {}; // nis -> id
                studentRes.data?.forEach(s => existingMap[s.nis] = s.id);

                const inserts: any[] = [];
                const updates: any[] = [];

                studentsToSave.forEach(s => {
                    let bPlace = '';
                    let bDate = null;
                    if (s.ttl && s.ttl.includes(',')) {
                        const parts = s.ttl.split(',');
                        bPlace = parts[0].trim();
                        const datePart = parts[1].trim();
                        // Support both DD-MM-YYYY and YYYY-MM-DD
                        const dateMatch = datePart.match(/(\d{2})-(\d{2})-(\d{4})/);
                        const isoMatch = datePart.match(/(\d{4})-(\d{2})-(\d{2})/);

                        if (dateMatch) {
                            bDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
                        } else if (isoMatch) {
                            bDate = datePart;
                        }
                    }

                    const payload = {
                        nis: s.nis,
                        full_name: s.nama,
                        parent_name: s.ayah,
                        mother_name: s.ibu,
                        father_job: s.jobAyah,
                        mother_job: s.jobIbu,
                        class_id: classMap[s.kelas] || null,
                        birth_place: bPlace || null,
                        birth_date: bDate || null,
                        gender: s.gender || 'L',
                        status: 'active',
                        password: s.password || s.nis // Add password field to sync
                    };

                    if (existingMap[s.nis]) {
                        updates.push({ id: existingMap[s.nis], ...payload });
                    } else {
                        inserts.push(payload);
                    }
                });

                // 2. Perform Operations
                if (updates.length > 0) {
                    for (const up of updates) {
                        const { id, ...rest } = up;
                        await supabase.from('students').update(rest).eq('id', id);
                    }
                }

                if (inserts.length > 0) {
                    const { error } = await supabase.from('students').insert(inserts);
                    if (error) throw error;
                }

                // 3. CLEANUP: Remove temp items from state before refreshing
                const savedNisSet = new Set(studentsToSave.map(s => s.nis));
                setStudents(prev => prev.filter(s => !savedNisSet.has(s.nis) || !String(s.id).startsWith('temp-')));

                // 4. Cloud backup for Initial Login support
                await supabase.from('app_settings').upsert({
                    key: 'students_data_v10_sync',
                    value: students,
                    updated_at: new Date().toISOString()
                });

                // 5. Final Refresh
                await fetchStudents();
                return true;
            })(),
            {
                loading: `Sedang menyelaraskan ${studentsToSave.length} data...`,
                success: 'Data berhasil disinkronkan!',
                error: (err) => `Gagal simpan: ${err.message}`
            }
        );
    }, [students, fetchStudents]);

    // --- AUTO SYNC DISABLED ---
    // User requested only manual save via button.

    return {
        students,
        setStudents,
        loading,
        addNewStudent,
        updateStudent,
        updateStudents,
        selectedStudent,
        setSelectedStudent,
        showAddStudentModal,
        setShowAddStudentModal,
        modalMode,
        setModalMode,
        handleViewStudent,
        handleAddStudent,
        handleEditStudent,
        handleDelete,
        handleDownloadTemplate,
        handleUploadClick,
        handleSaveData,
        refreshStudents: fetchStudents
    };
};

