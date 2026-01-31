import { useState, useEffect, useCallback } from 'react';
import { classesDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export interface Class {
    id: string | number;
    nama: string;
    tingkat: number;
    paralel: string;
}

export const useClasses = () => {
    const [classes, setClasses] = useState<Class[]>(() => {
        try {
            const saved = localStorage.getItem('classes_data_v10');
            return saved ? JSON.parse(saved) : classesDataGlobal;
        } catch (e) {
            return classesDataGlobal;
        }
    });
    const [loading, setLoading] = useState(false);
    const [isInitialFetched, setIsInitialFetched] = useState(false);

    // Fetch from Supabase
    const fetchClasses = useCallback(async () => {
        if (isInitialFetched) return;
        if (!isSupabaseConfigured()) {
            setIsInitialFetched(true);
            return;
        }

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
                    paralel: c.name.replace(/[0-9]/g, '') || 'A'
                }));
                setClasses(mappedData);
                localStorage.setItem('classes_data_v10', JSON.stringify(mappedData));
            }
            setIsInitialFetched(true);
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, [isInitialFetched]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClasses();
        }, 2000); // Penundaan lebih lama untuk kelas
        return () => clearTimeout(timer);
    }, [fetchClasses]);

    // Save fallback to LocalStorage with Debounce
    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('classes_data_v10', JSON.stringify(classes));
        }, 4000);
        return () => clearTimeout(timer);
    }, [classes, loading]);

    // --- AUTO SYNC DISABLED ---
    // User requested only manual save via button.

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

    const handleSaveClasses = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            toast.success("Data tersimpan secara lokal");
            return;
        }

        const classesToSave = classes.filter(c => typeof c.id === 'number');
        if (classesToSave.length === 0) {
            toast("Semua kelas sudah tersinkron", { icon: '✅' });
            return;
        }

        toast.promise(
            (async () => {
                const insertData = classesToSave.map(c => ({
                    name: c.nama,
                    grade_level: c.tingkat,
                    is_active: true
                }));

                const { error } = await supabase.from('classes').insert(insertData);
                if (error) throw error;

                await fetchClasses();
                return true;
            })(),
            {
                loading: 'Menyimpan data kelas...',
                success: 'Sinkronisasi kelas berhasil!',
                error: (err) => `Gagal simpan: ${err.message}`
            }
        );
    }, [classes, fetchClasses]);

    return {
        classes,
        setClasses,
        loading,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
        handleDeleteClass,
        handleSaveClasses,
        refreshClasses: fetchClasses
    };
};
