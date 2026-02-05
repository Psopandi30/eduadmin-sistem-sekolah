import { useState, useEffect, useCallback } from 'react';
import { schedulesDataGlobal, updateSchedulesDataGlobal, MasterSchedule } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../../../src/utils/logger';

export const useSchedules = () => {
    const [schedules, setSchedules] = useState<MasterSchedule[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('schedules_data_v2');
            if (saved) return JSON.parse(saved);
        }
        return schedulesDataGlobal;
    });

    const [loading, setLoading] = useState(false);
    const [isInitialFetched, setIsInitialFetched] = useState(false);

    const fetchSchedulesFromSupabase = useCallback(async () => {
        if (!isSupabaseConfigured() || isInitialFetched) return;

        setLoading(true);
        try {
            // We use a generic table 'school_configs' or 'app_settings' to store this complex JSON
            // If it doesn't exist, we fallback to local/global data
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'master_schedules_v2')
                .maybeSingle();

            if (data && data.value) {
                const parsedSchedules = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                if (Array.isArray(parsedSchedules)) {
                    setSchedules(parsedSchedules);
                    updateSchedulesDataGlobal(parsedSchedules);
                    localStorage.setItem('schedules_data_v2', JSON.stringify(parsedSchedules));
                }
            }
            setIsInitialFetched(true);
        } catch (err) {
            logger.warn('Note: app_settings table might not exist yet. Using local data for schedules.');
            setIsInitialFetched(true);
        } finally {
            setLoading(false);
        }
    }, [isInitialFetched]);

    const saveSchedulesToSupabase = async (newSchedules: MasterSchedule[]) => {
        setSchedules(newSchedules);
        localStorage.setItem('schedules_data_v2', JSON.stringify(newSchedules));
        updateSchedulesDataGlobal(newSchedules);

        if (!isSupabaseConfigured()) return;

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'master_schedules_v2',
                    value: newSchedules,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('Jadwal berhasil disimpan ke cloud!');
        } catch (err: any) {
            logger.error('Failed to save to Supabase:', err.message);
            toast.error('Gagal simpan ke cloud, data tetap tersimpan lokal.');
        }
    };

    useEffect(() => {
        if (!isInitialFetched) {
            fetchSchedulesFromSupabase();
        }
    }, [fetchSchedulesFromSupabase, isInitialFetched]);

    return {
        schedules,
        setSchedules,
        saveSchedulesToSupabase,
        loading,
        refreshSchedules: fetchSchedulesFromSupabase
    };
};
