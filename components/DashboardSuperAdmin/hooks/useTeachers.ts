import { useState, useEffect } from 'react';
import { teachersDataGlobal } from '../../../data/sharedData';

export interface Teacher {
    id: number;
    nama: string;
    nip: string;
    jabatan: string;
    mapel: string;
    wali: string;
    username: string;
    password: string;
}

export const useTeachers = () => {
    const [teachers, setTeachers] = useState<Teacher[]>(() => {
        const saved = localStorage.getItem('teachers_data_v10');
        return saved ? JSON.parse(saved) : teachersDataGlobal;
    });

    useEffect(() => {
        localStorage.setItem('teachers_data_v10', JSON.stringify(teachers));
    }, [teachers]);

    const addTeacher = (newTeacher: Teacher) => {
        setTeachers(prev => [newTeacher, ...prev]);
    };

    return {
        teachers,
        setTeachers,
        addTeacher
    };
};
