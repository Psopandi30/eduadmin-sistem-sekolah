import { useState, useEffect, useCallback } from 'react';
import { teachersDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

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
        if (!isSupabaseConfigured() || isInitialFetched) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    id,
                    employee_number,
                    position,
                    profiles (full_name, email)
                `);

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedData: Teacher[] = data.map(s => ({
                    id: s.id,
                    nip: s.employee_number,
                    nama: (s.profiles as any)?.full_name || 'Tanpa Nama',
                    jabatan: s.position,
                    mapel: '-',
                    wali: '-',
                    username: (s.profiles as any)?.email?.split('@')[0] || s.employee_number,
                    password: '-'
                }));
                setTeachers(mappedData);
                setIsInitialFetched(true);
                localStorage.setItem('teachers_data_v10', JSON.stringify(mappedData));
            }
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, [isInitialFetched]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTeachers();
        }, 1500);
        return () => clearTimeout(timer);
    }, [fetchTeachers]);

    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('teachers_data_v10', JSON.stringify(teachers));
        }, 3500);
        return () => clearTimeout(timer);
    }, [teachers, loading]);

    const addTeacher = async (newTeacher: Teacher) => {
        setTeachers(prev => [newTeacher, ...prev]);
        // Supabase implementation would require creating a profile first, then staff record
    };

    return {
        teachers,
        setTeachers,
        loading,
        addTeacher,
        refreshTeachers: fetchTeachers
    };
};
