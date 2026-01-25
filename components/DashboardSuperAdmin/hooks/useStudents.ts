import React, { useState, useEffect } from 'react';
import { studentsDataGlobal, addStudent as addStudentToShared } from '../../../data/sharedData'; // Adjust path if needed

export interface Student {
    id: number;
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
    // Initialize from LocalStorage or Fallback
    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('students_data_v10');
        return saved ? JSON.parse(saved) : studentsDataGlobal;
    });

    // Auto-save effect
    React.useEffect(() => {
        localStorage.setItem('students_data_v10', JSON.stringify(students));
    }, [students]);

    const addNewStudent = (student: Student) => {
        setStudents(prev => [...prev, student]);
    };

    const updateStudent = (id: number, updates: Partial<Student>) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    // Batch update for promotion
    const updateStudents = (updatedStudents: Student[]) => {
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

    // --- STATE management extracted from DashboardSuperAdmin ---
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

    // --- HANDLERS extracted from DashboardSuperAdmin ---
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

    const handleDelete = (name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data ${name}?`)) {
            setStudents(prev => prev.filter(s => s.nama !== name));
        }
    };

    const handleDownloadTemplate = () => {
        // Mock download logic
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
        // Mock save logic
        alert("Data berhasil disimpan ke database!");
    };

    return {
        students,
        setStudents,
        addNewStudent,
        updateStudent,
        updateStudents,
        // New exports
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
        handleSaveData
    };
};
