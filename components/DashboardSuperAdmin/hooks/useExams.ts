import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { examsDataGlobal, updateExamsDataGlobal, MasterExamSchedule } from '../../../data/sharedData';
import { toast } from 'react-hot-toast';

export const useExams = () => {
    const [examSchedules, setExamSchedules] = useState<MasterExamSchedule[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('exam_schedules_v2');
            if (saved) return JSON.parse(saved);
        }
        return examsDataGlobal;
    });

    const [loading, setLoading] = useState(false);

    const fetchExams = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'exam_schedules_v2')
                .single();

            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setExamSchedules(parsed);
                updateExamsDataGlobal(parsed);
                localStorage.setItem('exam_schedules_v2', JSON.stringify(parsed));
            }
        } catch (err) {
            console.warn('No cloud exams found');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveExams = async (newSchedules: MasterExamSchedule[]) => {
        setExamSchedules(newSchedules);
        updateExamsDataGlobal(newSchedules);
        localStorage.setItem('exam_schedules_v2', JSON.stringify(newSchedules));

        if (!isSupabaseConfigured()) return;

        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'exam_schedules_v2',
                    value: newSchedules,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('Jadwal ujian berhasil disinkronkan ke cloud!');
        } catch (err: any) {
            console.error('Failed to sync exams:', err.message);
            toast.error('Gagal simpan ke cloud, data tetap tersimpan lokal.');
        }
    };

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    return {
        examSchedules,
        setExamSchedules,
        fetchExams,
        saveExams,
        loading
    };
};
