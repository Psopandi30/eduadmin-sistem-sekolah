import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { schedulesDataGlobal, subjectsDataGlobal, schedulePeriodsGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface JadwalPelajaranProps {
    onBack: () => void;
    user?: any;
}

const JadwalPelajaran: React.FC<JadwalPelajaranProps> = ({ onBack, user }) => {
    const [selectedDay, setSelectedDay] = useState('Senin');
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jumat", 'Sabtu'];

    const studentClass = user?.studentClass || user?.kelas || '1A';

    // 1. Get Master Schedule
    const [masterSchedule, setMasterSchedule] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('schedules_data_v2');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return parsed.find((s: any) => s.status === 'published') || parsed[0] || schedulesDataGlobal[0] || { items: [], dailyInfos: [], name: 'Jadwal' };
                } catch (e) { }
            }
        }
        return schedulesDataGlobal.find(s => s.status === 'published') || schedulesDataGlobal[0] || { items: [], dailyInfos: [], name: 'Jadwal' };
    });

    const [loading, setLoading] = useState(false);

    // 1.2 Fetch from Supabase for Sync
    useEffect(() => {
        const fetchSchedules = async () => {
            if (!isSupabaseConfigured()) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'master_schedules_v2')
                    .maybeSingle();

                if (data && data.value) {
                    const parsedSchedules = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    if (Array.isArray(parsedSchedules)) {
                        // Priority: Published -> First Entry -> Fallback
                        const active = parsedSchedules.find((s: any) => s.status === 'published') || parsedSchedules[0];
                        if (active) {
                            setMasterSchedule(active);
                            localStorage.setItem('schedules_data_v2', JSON.stringify(parsedSchedules));
                        }
                    }
                }
            } catch (err) {
                logger.warn("Could not fetch schedules from cloud, using local fallback");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    // 2. Filter Items for Class and Day
    const items = (masterSchedule?.items || [])
        .filter((item: any) => item.classId === studentClass && item.day === selectedDay)
        .sort((a: any, b: any) => a.period - b.period);

    // 3. Get Daily Info (Uniform & Notes)
    const dailyInfo = masterSchedule?.dailyInfos?.find((info: any) => info.classId === studentClass && info.day === selectedDay);

    // Helper: Get Subject Name
    const getSubjectName = (subjectId: number | string, customName?: string) => {
        if (customName) return customName;
        if (subjectId === 'custom' && customName) return customName;

        // Try to get from synced subjects first
        const savedSubjects = localStorage.getItem('subjects_data_v10');
        if (savedSubjects) {
            try {
                const subjects = JSON.parse(savedSubjects);
                const found = subjects.find((s: any) => s.id === Number(subjectId) || s.id === subjectId);
                if (found) return found.name;
            } catch (e) { }
        }

        const subject = subjectsDataGlobal.find(s => s.id === Number(subjectId));
        return subject ? subject.nama : 'Mata Pelajaran';
    };

    // Helper: Get Time Label
    const getTimeLabel = (periodId: number) => {
        // Try to get from synced periods first
        const savedPeriods = localStorage.getItem('schedule_periods_v2');
        if (savedPeriods) {
            try {
                const periods = JSON.parse(savedPeriods);
                const p = periods.find((period: any) => period.id === periodId);
                if (p) return `${p.start} - ${p.end}`;
            } catch (e) { }
        }

        const p = schedulePeriodsGlobal.find(period => period.id === periodId);
        return p ? `${p.start} - ${p.end}` : `Jam ke-${periodId}`;
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 h-full flex flex-col">
            {/* Header / Title inside the card */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight className="rotate-180" size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight">Jadwal Pelajaran</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#004AAD] bg-blue-100 px-1.5 py-0.5 rounded-lg">
                            Kelas {studentClass}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[8px] sm:text-xs font-bold text-slate-400">{masterSchedule?.name || 'Jadwal'}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-8 flex-1 overflow-y-auto scrollbar-hide pb-20 sm:pb-24">
                {/* Day Tabs */}
                <div className="flex gap-1.5 sm:gap-3 overflow-x-auto pb-3 scrollbar-hide mb-4 sm:mb-6 -mx-1 px-1">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-black whitespace-nowrap transition-all duration-300 border-2 ${selectedDay === day
                                ? 'bg-[#004AAD] text-white border-[#004AAD] shadow-lg shadow-blue-500/30 scale-105'
                                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>


                {/* Schedule Table View */}
                <div className="mb-8">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">JP</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* SERAGAM ROW - Consistent with Admin Structure */}
                                <tr className="bg-blue-50/50 border-b border-slate-100">
                                    <td className="px-4 py-3 text-center">
                                        <div className="text-[10px] font-black text-[#004AAD] uppercase">INFO</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SERAGAM</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-extrabold text-[#004AAD] text-[10px] sm:text-sm uppercase tracking-tight">
                                            {dailyInfo?.seragam || '-'}
                                        </div>
                                    </td>
                                </tr>

                                {items.length > 0 ? (
                                    items.map((item, index) => (
                                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-[#004AAD] font-black rounded-lg text-xs mx-auto">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-400 text-[10px] sm:text-xs">
                                                    {getTimeLabel(item.period)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-black text-slate-700 text-xs sm:text-base group-hover:text-[#004AAD] transition-colors uppercase tracking-tight">
                                                    {getSubjectName(item.subjectId, item.customName)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                                <Calendar size={32} />
                                            </div>
                                            <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest italic">Libur / Tidak ada jadwal</p>
                                        </td>
                                    </tr>
                                )}

                                {/* CATATAN ROW - Consistent with Admin Structure */}
                                <tr className="bg-orange-50/30 border-t border-slate-100">
                                    <td className="px-4 py-3 text-center">
                                        <div className="text-[10px] font-black text-orange-600 uppercase">INFO</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CATATAN</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-600 text-[10px] sm:text-xs italic leading-relaxed">
                                            {dailyInfo?.catatan || '-'}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JadwalPelajaran;
