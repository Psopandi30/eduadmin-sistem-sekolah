import React, { useState, useEffect, useCallback } from 'react';
import { studentsDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

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

            if (data && data.length > 0) {
                const mappedData: Student[] = data.map(s => ({
                    id: s.id,
                    nis: s.nis,
                    nama: s.full_name,
                    ttl: `${s.birth_place || '-'}, ${s.birth_date || '-'}`,
                    kelas: s.classes?.name || '-',
                    tingkat: s.classes?.grade_level || 1,
                    paralel: (s.classes?.name || '').replace(/[0-9]/g, ''),
                    ayah: s.parent_name || '-',
                    ibu: '-',
                    jobAyah: '-',
                    jobIbu: '-',
                    username: s.nis,
                    gender: s.gender,
                    status: s.status
                }));
                // Data from DB is truth
                setStudents(mappedData);
                localStorage.setItem('students_data_v10', JSON.stringify(mappedData));
            }
        } catch (err) {
            console.error('Error fetching students:', err);
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

    // --- AUTO SYNC TO SUPABASE ---
    useEffect(() => {
        if (!isSupabaseConfigured() || loading) return;

        const unsynced = students.filter(s => String(s.id).startsWith('temp-') || typeof s.id === 'number');
        if (unsynced.length === 0) return;

        const timer = setTimeout(() => {
            handleSaveData();
        }, 15000); // Auto sync every 15 seconds for students
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
                console.error('Error adding student to Supabase:', err);
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
                console.error('Error updating student in Supabase:', err);
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
                    console.error('Error deleting student from Supabase:', err);
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
            'No', 'NIS', 'Nama Lengkap', 'Tempat_Tanggal_Lahir', 'Tingkat', 'KELAS',
            'Paralel', 'Nama_Ayah', 'Nama_Ibu', 'Pekerjaan_Ayah', 'Pekerjaan_Ibu',
            'Username', 'Password'
        ];
        let exampleData = [
            '1', '2024001', 'Budi Santoso', 'Garut, 12-05-2010', '1A', '1',
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

                    const importedStudents: Student[] = data.slice(1).map((row, idx) => ({
                        id: `temp-${Date.now()}-${idx}`,
                        nis: String(row[1] || ''),
                        nama: String(row[2] || ''),
                        ttl: String(row[3] || ''),
                        tingkat: parseInt(row[4]) || 1,
                        kelas: String(row[5] || ''),
                        paralel: String(row[6] || ''),
                        ayah: String(row[7] || ''),
                        ibu: String(row[8] || ''),
                        jobAyah: String(row[9] || ''),
                        jobIbu: String(row[10] || ''),
                        username: String(row[11] || row[1] || ''),
                    })).filter(s => s.nama);

                    setStudents(prev => [...prev, ...importedStudents]);
                    toast.success(`${importedStudents.length} data siswa berhasil diimpor (Lokal)`);
                    toast("Klik 'Simpan' untuk menyimpan permanen ke database.", { icon: 'ℹ️' });
                } catch (err) {
                    console.error("Error parsing file:", err);
                    toast.error("Gagal membaca file");
                }
            };
            reader.readAsBinaryString(file);
        };
        input.click();
    };

    const handleSaveData = useCallback(async (isSilent = false) => {
        if (!isSupabaseConfigured()) {
            if (!isSilent) toast.success("Data tersimpan secara lokal (Supabase belum dikonfigurasi)");
            return;
        }

        const studentsToSave = students.filter(s => String(s.id).startsWith('temp-') || typeof s.id === 'number');

        if (studentsToSave.length === 0) {
            if (!isSilent) toast("Semua data sudah tersinkron", { icon: '✅' });
            return;
        }

        if (isSilent) {
            try {
                const { data: dbClasses } = await supabase.from('classes').select('id, name');
                const classMap: Record<string, string> = {};
                dbClasses?.forEach(c => classMap[c.name] = c.id);

                const insertData = studentsToSave.map(s => ({
                    nis: s.nis,
                    full_name: s.nama,
                    parent_name: s.ayah,
                    class_id: classMap[s.kelas] || null,
                    gender: 'L',
                    status: 'active'
                }));

                const { error } = await supabase.from('students').insert(insertData);
                if (!error) await fetchStudents();
            } catch (e) {
                console.error("Silent sync students failed", e);
            }
            return;
        }

        toast.promise(
            (async () => {
                const { data: dbClasses } = await supabase.from('classes').select('id, name');
                const classMap: Record<string, string> = {};
                dbClasses?.forEach(c => classMap[c.name] = c.id);

                const insertData = studentsToSave.map(s => ({
                    nis: s.nis,
                    full_name: s.nama,
                    parent_name: s.ayah,
                    class_id: classMap[s.kelas] || null,
                    gender: 'L',
                    status: 'active'
                }));

                const { error } = await supabase.from('students').insert(insertData);
                if (error) throw error;

                await fetchStudents();
                return true;
            })(),
            {
                loading: `Menyimpan ${studentsToSave.length} data ke database...`,
                success: 'Sinkronisasi berhasil!',
                error: (err) => `Gagal simpan: ${err.message}`
            }
        );
    }, [students, fetchStudents]);

    // --- AUTO SYNC TO SUPABASE ---
    useEffect(() => {
        if (!isSupabaseConfigured() || loading) return;

        const unsynced = students.filter(s => String(s.id).startsWith('temp-') || typeof s.id === 'number');
        if (unsynced.length === 0) return;

        const timer = setTimeout(() => {
            handleSaveData(true);
        }, 15000); // Auto sync every 15 seconds for students
        return () => clearTimeout(timer);
    }, [students, loading, handleSaveData]);

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

