import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { examsDataGlobal, classesDataGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

interface JadwalUjianProps {
    onBack: () => void;
    user?: any;
}

const JadwalUjian: React.FC<JadwalUjianProps> = ({ onBack, user }) => {
    const [selectedDay, setSelectedDay] = useState('Senin');
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jumat", 'Sabtu'];

    const studentClass = user?.studentClass || user?.kelas || '1A';

    const [masterExam, setMasterExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaster = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'exam_schedules_v2')
                    .single();

                if (data?.value) {
                    const allExams = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    const published = allExams.find((e: any) => e.status === 'published') || allExams[0];
                    setMasterExam(published);
                }
            } catch (err) {
                console.error("Failed to fetch exams from cloud", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMaster();
    }, []);

    // 2. Filter Items for Class and Day
    const items = masterExam ? (masterExam.items || [])
        .filter((item: any) => {
            // If user is a student/parent, filter by class
            if (user?.role === 'Orang Tua' || user?.role === 'Siswa' || user?.studentClass || user?.kelas) {
                return item.classId === studentClass && item.day === selectedDay;
            }
            // If user is a teacher, show their subjects across all classes (for the teacher view)
            if (user?.role === 'Guru' || user?.nip) {
                return item.teacherName === user.nama && item.day === selectedDay;
            }
            return item.classId === studentClass && item.day === selectedDay;
        })
        .sort((a: any, b: any) => a.timeSlotId - b.timeSlotId) : [];

    // 3. Get Daily Info (Uniform & Notes from standard or specific exam notes)
    // Exam schedule has 'dailyNotes'. Uniform might be standard or specific. 
    // For now, we use a placeholder or check if MasterExamSchedule has daily uniform info.
    // The current MasterExamSchedule interface only has dailyNotes.
    const dailyNote = masterExam?.dailyNotes?.[selectedDay];

    // Helper: Get Time Label
    const getTimeLabel = (slotId: number) => {
        if (!masterExam) return '-';
        const slot = masterExam.timeSlots.find(s => s.id === slotId);
        return slot ? `${slot.start} - ${slot.end}` : `Sesi ${slotId + 1}`;
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
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight">Jadwal Ujian</h3>
                    <p className="text-[8px] sm:text-xs font-bold text-indigo-600/60 uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-none">
                        Kelas {studentClass} • {masterExam ? `${masterExam.type} ${masterExam.semester} ${masterExam.year}` : 'Tidak ada jadwal aktif'}
                    </p>
                </div>
            </div>

            {/* Content Area - Flex Column for Vertical Balance */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 pb-6 sm:pb-8">
                {/* Day Tabs */}
                {/* Day Tabs */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide flex-none">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-black whitespace-nowrap transition-all duration-300 border-2 ${selectedDay === day
                                ? 'bg-[#004AAD] text-white border-[#004AAD] shadow-md shadow-blue-500/20 scale-105'
                                : 'bg-white text-slate-400 border-slate-50 hover:border-blue-200'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Daily Info Box */}
                <div className="flex-shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 bg-gradient-to-br from-[#004AAD] to-blue-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-blue-900/10 border border-white/20">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 border border-white/30">
                            <span className="text-base sm:text-lg font-black">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] sm:text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Ketentuan Ujian</p>
                            <p className="text-[10px] sm:text-xs md:text-sm text-white font-bold leading-tight uppercase tracking-wide">
                                {dailyNote || 'Sesuaikan dengan tata tertib ujian sekolah'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Schedule List / Empty State */}
                <div className="flex-shrink-0">
                    {items.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex items-center bg-white border border-slate-100 rounded-2xl p-4 hover:border-blue-200 shadow-sm transition-all duration-300 group">
                                    <div className="w-10 h-10 flex items-center justify-center bg-slate-50 text-[#004AAD] font-black rounded-xl text-sm mr-4 flex-shrink-0 group-hover:bg-blue-50 transition-colors border border-slate-100">
                                        {index + 1}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                {getTimeLabel(item.timeSlotId)}
                                            </span>
                                        </div>
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-[#004AAD] transition-colors truncate uppercase leading-tight">
                                            {item.subjectName}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-slate-200 p-6 sm:p-8 text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-3 sm:mb-4">
                                <span className="text-2xl sm:text-3xl font-black opacity-50">?</span>
                            </div>
                            <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest">Tidak ada ujian pada hari ini.</p>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="flex-shrink-0 mt-4 sm:mt-5">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#004AAD] rounded-full"></span>
                        Catatan Ujian
                    </h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {dailyNote || 'Harap membawa Kartu Ujian dan alat tulis lengkap. Dilarang membawa HP ke dalam ruang ujian.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JadwalUjian;
