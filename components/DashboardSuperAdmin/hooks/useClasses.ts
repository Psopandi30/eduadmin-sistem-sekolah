import { useState, useEffect, useCallback } from 'react';
import { classesDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

export interface Class {
    id: string | number;
    nama: string;
    tingkat: number;
    paralel: string;
}

export const useClasses = () => {
    const [classes, setClasses] = useState<Class[]>(() => {
        const saved = localStorage.getItem('classes_data_v10');
        return saved ? JSON.parse(saved) : classesDataGlobal;
    });
    const [loading, setLoading] = useState(false);

    // Fetch from Supabase
    const fetchClasses = useCallback(async () => {
        if (!isSupabaseConfigured()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedData: Class[] = data.map(c => ({
                    id: c.id,
                    nama: c.name,
                    tingkat: c.grade_level,
                    paralel: c.name.replace(/[0-9]/g, '') || 'A' // Guessing paralel from name if not direct
                }));
                setClasses(mappedData);
                localStorage.setItem('classes_data_v10', JSON.stringify(mappedData));
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Save fallback to LocalStorage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('classes_data_v10', JSON.stringify(classes));
        }
    }, [classes, loading]);

    const [showAddClassModal, setShowAddClassModal] = useState(false);

    const handleAddClass = async (tingkat: string, paralel: string, customName?: string) => {
        const nama = customName || `${tingkat}${paralel}`;
        if (tingkat && paralel) {
            const newClass = {
                id: Date.now(), // Fallback ID
                nama,
                tingkat: parseInt(tingkat),
                paralel
            };

            if (isSupabaseConfigured()) {
                try {
                    const { data, error } = await supabase
                        .from('classes')
                        .insert([{
                            name: nama,
                            grade_level: parseInt(tingkat),
                            is_active: true
                        }])
                        .select();

                    if (error) throw error;
                    if (data) {
                        setClasses(prev => [...prev, {
                            id: data[0].id,
                            nama: data[0].name,
                            tingkat: data[0].grade_level,
                            paralel
                        }]);
                    }
                } catch (err) {
                    console.error('Error adding class to Supabase:', err);
                    setClasses(prev => [...prev, newClass]);
                }
            } else {
                setClasses(prev => [...prev, newClass]);
            }

            setShowAddClassModal(false);
            return true;
        }
        return false;
    };

    const handleDeleteClass = async (id: string | number) => {
        if (!confirm("Hapus kelas ini?")) return;

        if (isSupabaseConfigured() && typeof id === 'string') {
            try {
                const { error } = await supabase
                    .from('classes')
                    .update({ is_active: false })
                    .eq('id', id);

                if (error) throw error;
                setClasses(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                console.error('Error deleting class from Supabase:', err);
            }
        } else {
            setClasses(prev => prev.filter(c => c.id !== id));
        }
    };

    return {
        classes,
        setClasses,
        loading,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
        handleDeleteClass,
        refreshClasses: fetchClasses
    };
};
