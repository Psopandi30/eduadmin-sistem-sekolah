import { useState, useEffect, useCallback } from 'react';
import { subjectsDataGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

export interface SubjectGroup {
    id: string | number;
    name: string;
}

export interface Subject {
    id: string | number;
    name: string;
    code: string;
    level: string;
    group: string;
    color?: string;
}

const initialSubjectGroups: SubjectGroup[] = [
    { id: 1, name: 'Wajib A' },
    { id: 2, name: 'Wajib B' },
    { id: 3, name: 'Muatan Lokal' }
];

export const useSubjects = () => {
    const [loading, setLoading] = useState(false);
    const [isInitialFetched, setIsInitialFetched] = useState(false);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>(() => {
        try {
            const saved = localStorage.getItem('subject_groups_v10');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return initialSubjectGroups;
    });

    const [subjects, setSubjects] = useState<Subject[]>(() => {
        try {
            const saved = localStorage.getItem('subjects_data_v10');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return subjectsDataGlobal;
    });

    const fetchSubjects = useCallback(async () => {
        if (!isSupabaseConfigured() || isInitialFetched) return;

        setLoading(true);
        try {
            const [groupsRes, subjectsRes] = await Promise.all([
                supabase.from('subject_groups').select('*'),
                supabase.from('subjects').select('*, subject_groups(name)')
            ]);

            if (groupsRes.data && groupsRes.data.length > 0) {
                const mappedGroups = groupsRes.data.map(g => ({
                    id: g.id,
                    name: g.name
                }));
                setSubjectGroups(mappedGroups);
                localStorage.setItem('subject_groups_v10', JSON.stringify(mappedGroups));
            }

            if (subjectsRes.data && subjectsRes.data.length > 0) {
                const mappedSubjects = subjectsRes.data.map(s => ({
                    id: s.id,
                    name: s.name,
                    code: s.code,
                    level: 'Kelas 1',
                    group: (s.subject_groups as any)?.name || 'Umum'
                }));
                setSubjects(mappedSubjects);
                localStorage.setItem('subjects_data_v10', JSON.stringify(mappedSubjects));
            }
            setIsInitialFetched(true);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, [isInitialFetched]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSubjects();
        }, 2500);
        return () => clearTimeout(timer);
    }, [fetchSubjects]);

    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('subject_groups_v10', JSON.stringify(subjectGroups));
        }, 4500);
        return () => clearTimeout(timer);
    }, [subjectGroups, loading]);

    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            localStorage.setItem('subjects_data_v10', JSON.stringify(subjects));
        }, 5000);
        return () => clearTimeout(timer);
    }, [subjects, loading]);

    return {
        subjectGroups,
        setSubjectGroups,
        subjects,
        setSubjects,
        loading,
        refreshSubjects: fetchSubjects
    };
};
