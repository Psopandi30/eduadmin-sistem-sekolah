import { useState, useEffect } from 'react';
import { subjectsDataGlobal } from '../../../data/sharedData';

export interface SubjectGroup {
    id: number;
    name: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    level: string;
    group: string;
    color?: string; // New: Color property
}

const initialSubjectGroups: SubjectGroup[] = [
    { id: 1, name: 'Wajib A' },
    { id: 2, name: 'Wajib B' },
    { id: 3, name: 'Muatan Lokal' }
];

export const useSubjects = () => {
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('subject_groups_v10');
            if (saved) return JSON.parse(saved);
        }
        return initialSubjectGroups;
    });

    const [subjects, setSubjects] = useState<Subject[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('subjects_data_v10');
            if (saved) return JSON.parse(saved);
        }
        return subjectsDataGlobal;
    });

    useEffect(() => {
        localStorage.setItem('subject_groups_v10', JSON.stringify(subjectGroups));
    }, [subjectGroups]);

    useEffect(() => {
        localStorage.setItem('subjects_data_v10', JSON.stringify(subjects));
    }, [subjects]);

    return {
        subjectGroups,
        setSubjectGroups,
        subjects,
        setSubjects,
    };
};
