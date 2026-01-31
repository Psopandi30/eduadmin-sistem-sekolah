// Types and Interfaces for DashboardSuperAdmin
import React from 'react';

export interface SuperAdminProps {
    user: any;
    onLogout: () => void;
}

// --- SCHEDULE TYPES ---
export interface ScheduleItem {
    id: string; // unique
    classId: string;
    day: string;
    period: number; // 0 for custom? Or 1-indexed. Let's use 1-indexed for periods.
    subjectId: number | string; // 'upacara', 'break', or subject ID
    customName?: string; // For custom items
    startTime?: string;
    endTime?: string;
}

export interface Period {
    id: number;
    start: string;
    end: string;
}

export interface MasterSchedule {
    id: number;
    name: string; // e.g. "Semester Ganjil 2025"
    status: 'draft' | 'published';
    items: ScheduleItem[];
    dailyInfos?: DailyScheduleInfo[];
}

export interface DailyScheduleInfo {
    classId: string;
    day: string;
    seragam?: string;
    catatan?: string;
}

export interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactElement;
}

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export interface GradeRow {
    studentId: number;
    studentName: string;
    studentNis: string;
    tp1: number;
    tp2: number;
    tp3: number;
    tp4: number;
    tp5: number;
    tp6: number;
    tp7: number;
    tp8: number;
    tp9: number;
    tp10: number;
    tp11: number;
    tp12: number;
    tp13: number;
    tp14: number;
    tp15: number;
    avgSumatif: number;
    pts: number;
    pas: number;
    pat: number;
    ujisn: number;
    sas: number;
    finalScore: number;
    predicate: string;
    description: string;
    [key: string]: any;
}

