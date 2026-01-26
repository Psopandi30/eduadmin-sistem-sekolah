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
        const saved = localStorage.getItem('teachers_data_v10');
        return saved ? JSON.parse(saved) : teachersDataGlobal;
    });
    const [loading, setLoading] = useState(false);

    const fetchTeachers = useCallback(async () => {
        if (!isSupabaseConfigured()) return;

        setLoading(true);
        try {
            // Join staff with profiles to get name and role
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
                    mapel: '-', // Logic to fetch mapel could be added later
                    wali: '-', // Wali class info could be added later
                    username: (s.profiles as any)?.email?.split('@')[0] || s.employee_number,
                    password: '-' // We don't fetch passwords
                }));
                setTeachers(mappedData);
                localStorage.setItem('teachers_data_v10', JSON.stringify(mappedData));
            }
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem('teachers_data_v10', JSON.stringify(teachers));
        }
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
