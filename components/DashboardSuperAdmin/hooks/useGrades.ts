import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../../src/utils/logger';

export const useGrades = (classId?: string, mapel?: string, semester?: string) => {
    const [gradesData, setGradesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const getGradeKey = (c: string, m: string, s: string) => `grades_v2_${c}_${m}_${s}`;

    const fetchGrades = useCallback(async (c: string, m: string, s: string) => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            const key = getGradeKey(c, m, s);
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', key)
                .maybeSingle();

            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setGradesData(parsed);
                localStorage.setItem(key, JSON.stringify(parsed));
                return parsed;
            }
        } catch (err) {
            logger.warn('No cloud grades found for', c, m, s);
        } finally {
            setLoading(false);
        }
        return null;
    }, []);

    const saveGrades = async (c: string, m: string, s: string, data: any[]) => {
        const key = getGradeKey(c, m, s);
        setGradesData(data);
        localStorage.setItem(key, JSON.stringify(data));

        if (!isSupabaseConfigured()) return;

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key,
                    value: data,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('Nilai berhasil disinkronkan ke cloud!');
        } catch (err: any) {
            logger.error('Failed to sync grades:', err.message);
            toast.error('Gagal simpan ke cloud, data tetap tersimpan lokal.');
        }
    };

    return {
        gradesData,
        setGradesData,
        fetchGrades,
        saveGrades,
        loading
    };
};
