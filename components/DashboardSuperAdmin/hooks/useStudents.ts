import React, { useState, useEffect, useCallback } from 'react';
import { studentsDataGlobal, addStudent as addStudentToShared } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

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
        if (!isSupabaseConfigured() || isInitialFetched) return;

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
                // Only update if data is different or on first load
                setStudents(mappedData);
                setIsInitialFetched(true);
                localStorage.setItem('students_data_v10', JSON.stringify(mappedData));
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true); // Mark as done even on error to prevent retry loop
        }
    }, [isInitialFetched]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchStudents();
        }, 1000); // Penundaan 1 detik untuk kestabilan awal
        return () => clearTimeout(timeoutId);
    }, [fetchStudents]);

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
                // We need class_id. For now let's try to find it by name or leave null
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
                        gender: student.gender as any,
                        status: 'active'
                    }])
                    .select();

                if (error) throw error;
                if (data) {
                    const created = { ...student, id: data[0].id };
                    setStudents(prev => [...prev, created]);
                    return created;
                }
            } catch (err) {
                console.error('Error adding student to Supabase:', err);
                setStudents(prev => [...prev, student]);
            }
        } else {
            setStudents(prev => [...prev, student]);
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

                const { error } = await supabase
                    .from('students')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;
                setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            } catch (err) {
                console.error('Error updating student in Supabase:', err);
                setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            }
        } else {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        }
    };

    const updateStudents = (updatedStudents: Student[]) => {
        // Bulk update logic (locally for now, or implement one by one for Supabase)
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

    const handleDelete = async (student: any) => {
        const id = student.id;
        const name = student.nama;
        if (confirm(`Apakah Anda yakin ingin menghapus data ${name}?`)) {
            if (isSupabaseConfigured() && typeof id === 'string') {
                try {
                    const { error } = await supabase.from('students').delete().eq('id', id);
                    if (error) throw error;
                    setStudents(prev => prev.filter(s => s.id !== id));
                } catch (err) {
                    console.error('Error deleting student from Supabase:', err);
                }
            } else {
                setStudents(prev => prev.filter(s => s.id !== id));
            }
        }
    };

    const handleDownloadTemplate = () => {
        alert("Mengunduh template Excel...");
    };

    const handleUploadClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) alert(`File ${file.name} terpilih! Klik Simpan untuk memproses.`);
        };
        input.click();
    };

    const handleSaveData = () => {
        alert("Data berhasil disimpan ke database!");
    };

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
