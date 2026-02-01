import React, { useState, useEffect } from 'react';
import { tutoringSubjectsGlobal, tutoringTeachersGlobal, updateTutoringSubjectsGlobal, updateTutoringTeachersGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

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

    // 3. Actions for Guru Bimbel
    const addSession = (classId: number, session: TutoringSession) => {
        setTutoringClasses(prev => prev.map(cls =>
            cls.id === classId
                ? { ...cls, sessions: [session, ...cls.sessions] }
                : cls
        ));
    };

    const updateClassInfo = (classId: number, info: Partial<TutoringClass>) => {
        setTutoringClasses(prev => prev.map(cls =>
            cls.id === classId ? { ...cls, ...info } : cls
        ));
    };

    return {
        tutoringClasses,
        setTutoringClasses,
        addSession,
        updateClassInfo,
        isLoading,
        refresh: fetchTutoringData
    };
};
