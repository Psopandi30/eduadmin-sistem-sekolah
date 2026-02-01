import React, { useState, useEffect } from 'react';
import { tutoringSubjectsGlobal, tutoringTeachersGlobal, updateTutoringSubjectsGlobal, updateTutoringTeachersGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export interface TutoringSession {
    id: number;
    title: string;
    date: string;
    youtubeId: string;
    driveLink: string;
    meetingLink?: string;
    quizQuestions?: any[];
}

export interface TutoringClass {
    id: number;
    title: string;
    teacher: string;
    schedule: string;
    room: string;
    status: string;
    description: string;
    sessions: TutoringSession[];
}

export const useTutoring = () => {
    const [tutoringClasses, setTutoringClasses] = useState<TutoringClass[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tutoring_classes_v10');
            if (saved) return JSON.parse(saved);
        }
        return [
            {
                id: 1,
                title: 'Matematika - Persiapan Olimpiade',
                teacher: 'Bpk. Hendra Mathematics',
                schedule: 'Senin & Kamis, 16:00 - 17:30',
                room: 'Ruang 3B',
                status: 'Aktif',
                description: 'Berkokus pada pemecahan masalah logika dan analisis tingkat lanjut.',
                sessions: []
            }
        ];
    });

    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch Data from Supabase
    const fetchTutoringData = async () => {
        if (!isSupabaseConfigured()) return;

        setIsLoading(true);
        try {
            // Fetch Groups/Teachers
            const { data: teachersData, error: teachersError } = await supabase
                .from('tutoring_teachers')
                .select('*')
                .order('id', { ascending: true });

            if (teachersError) throw teachersError;

            // Fetch Materials/Sessions
            const { data: materialsData, error: materialsError } = await supabase
                .from('tutoring_materials')
                .select('*')
                .order('meeting_number', { ascending: true });

            if (materialsError) throw materialsError;

            // Transform to Student View (TutoringClass)
            const mappedClasses: TutoringClass[] = (teachersData || []).map(t => ({
                id: t.id,
                title: `${t.subject_name || ''} - ${t.class_id || ''}`,
                teacher: t.name,
                schedule: `${t.schedule_day || ''}, ${t.schedule_start || ''} - ${t.schedule_end || ''}`,
                room: 'Online/Ruang Bimbel',
                status: t.status || 'Aktif',
                description: `Bimbingan belajar for ${t.subject_name}`,
                sessions: (materialsData || [])
                    .filter(m => m.teacher_id === t.id)
                    .map(m => ({
                        id: m.id,
                        title: m.title || `Pertemuan ${m.meeting_number}`,
                        date: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        youtubeId: m.video_url || '',
                        driveLink: m.file_url || '',
                        meetingLink: '',
                        quizQuestions: []
                    }))
            }));

            if (mappedClasses.length > 0) {
                setTutoringClasses(mappedClasses);
            }
        } catch (error) {
            console.error('Error fetching tutoring data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTutoringData();
    }, []);

    // 2. Sync to LocalStorage (Fallback)
    useEffect(() => {
        if (tutoringClasses.length > 0) {
            localStorage.setItem('tutoring_classes_v10', JSON.stringify(tutoringClasses));
        }
    }, [tutoringClasses]);

    // 3. Actions for Guru Bimbel (Cloud Sync)
    const saveMaterial = async (teacherId: number, material: any) => {
        if (!isSupabaseConfigured()) return;

        try {
            const { error } = await supabase.from('tutoring_materials').insert([{
                teacher_id: teacherId,
                title: material.title,
                video_url: material.youtubeId,
                file_url: material.driveLink,
                meeting_number: material.meeting_number || 1
            }]);

            if (error) throw error;
            toast.success("Materi berhasil diunggah ke cloud!");
            await fetchTutoringData();
        } catch (err) {
            console.error("Error saving material", err);
            toast.error("Gagal mengunggah materi.");
        }
    };

    const deleteMaterial = async (id: number) => {
        if (!isSupabaseConfigured()) return;
        try {
            await supabase.from('tutoring_materials').delete().eq('id', id);
            toast.success("Materi berhasil dihapus!");
            await fetchTutoringData();
        } catch (err) {
            console.error("Error deleting material", err);
        }
    };

    return {
        tutoringClasses,
        setTutoringClasses,
        addSession,
        updateClassInfo,
        saveMaterial,
        deleteMaterial,
        isLoading,
        refresh: fetchTutoringData
    };
};
