import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, ChevronLeft } from 'lucide-react';
import { schedulesDataGlobal, subjectsDataGlobal, schedulePeriodsGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface JadwalMengajarGuruProps {
    onBack: () => void;
    user?: any;
}

const JadwalMengajarGuru: React.FC<JadwalMengajarGuruProps> = ({ onBack, user }) => {
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');

    const [masterSchedule, setMasterSchedule] = useState<any>(null);
    const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }
            try {
                // 1. Fetch Master Schedule from app_settings
                const { data: scheduleData } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'master_schedules_v2')
                    .single();

                if (scheduleData?.value) {
                    const parsed = typeof scheduleData.value === 'string' ? JSON.parse(scheduleData.value) : scheduleData.value;
                    const published = parsed.find((s: any) => s.status === 'published') || parsed[0];
                    setMasterSchedule(published);
                }

                // 2. Fetch Teacher Assignments (Plotting)
                // Assuming we store plotting in app_settings too for simplicity of global sync, 
                // or we could use a dedicated table.
                const { data: plottingData } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'teacher_assignments_v2')
                    .single();

                if (plottingData?.value) {
                    setTeacherAssignments(typeof plottingData.value === 'string' ? JSON.parse(plottingData.value) : plottingData.value);
                }
            } catch (err) {
                logger.error("Error fetching teaching schedule:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Logic to Get Real Schedule from Fetched Data
    const getTeacherSchedule = () => {
        const teacherName = user?.nama || '';
        const teacherId = user?.id?.toString() || '';

        // Identify which classes and subjects are assigned to this teacher
        const myAssignments = teacherAssignments.filter((ta: any) => {
            return ta.teacherId?.toString() === teacherId || ta.teacherName === teacherName;
        });

        if (!masterSchedule) return [];

        const results: any[] = [];
        masterSchedule.items.forEach((item: any) => {
            const isMyMapel = myAssignments.some((ta: any) =>
                ta.classNama === item.classId && ta.subjectIds.some((sid: any) => sid.toString() === item.subjectId.toString())
            );

            if (isMyMapel) {
                const periodInfo = schedulePeriodsGlobal.find(p => p.id === item.period);
                const subjectInfo = subjectsDataGlobal.find(s => s.id.toString() === item.subjectId.toString());

                results.push({
                    id: item.id,
                    hari: item.day,
                    jam: periodInfo ? `${periodInfo.start} - ${periodInfo.end}` : `Jam ke-${item.period}`,
                    kelas: item.classId,
                    mapel: subjectInfo?.name || item.customName || 'Mata Pelajaran',
                    ruang: `R. ${item.classId}`
                });
            }
        });

        const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return results.sort((a, b) => {
            const dayDiff = dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari);
            if (dayDiff !== 0) return dayDiff;
            return a.jam.localeCompare(b.jam);
        });
    };

    const jadwal = getTeacherSchedule();

    const getHariColor = (hari: string) => {
        switch (hari) {
            case 'Senin': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Selasa': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Rabu': return 'bg-green-100 text-green-700 border-green-200';
            case 'Kamis': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Jumat': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center gap-3 md:gap-4 shrink-0 bg-white sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="p-2 md:p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl transition-all border border-slate-100 shrink-0"
                >
                    <ArrowLeft size={20} className="md:w-[22px]" />
                </button>
                <div className="min-w-0">
                    <h2 className="text-base md:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">
                        Jadwal Mengajar
                    </h2>
                    <p className="text-slate-400 text-[10px] md:text-sm font-medium">Informasi waktu dan ploting mengajar.</p>
                </div>
            </div>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card - Consistent Style */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-blue-100 flex items-center gap-4 border border-white/10 mb-6 font-sans">
                    <div className="p-3 bg-white/15 backdrop-blur-xl rounded-2xl shrink-0 hidden sm:block">
                        <Calendar size={24} className="text-blue-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm md:text-lg uppercase tracking-wide">Panel Jadwal Mengajar</h3>
                        <p className="text-[10px] md:text-xs text-blue-100/90 leading-relaxed mt-0.5 italic">
                            Berikut adalah rincian jadwal mengajar Anda. Pastikan hadir tepat waktu sesuai ploting yang telah ditentukan.
                        </p>
                    </div>
                </div>

                {/* Filter Semester */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Semester Aktif</h4>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold text-blue-700 flex items-center gap-2">
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer appearance-none pr-6 relative"
                            >
                                <option>1 (Ganjil)</option>
                                <option>2 (Genap)</option>
                            </select>
                            <Calendar size={14} className="text-blue-400 pointer-events-none -ml-5" />
                        </div>
                    </div>
                    {jadwal.length > 0 && (
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                            {jadwal.length} Sesi Terjadwal
                        </div>
                    )}
                </div>
                <div className="grid gap-4">
                    {jadwal.length > 0 ? (
                        jadwal.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 ${getHariColor(item.hari)} shrink-0`}>
                                        <span className="text-xs font-bold uppercase">{item.hari.substring(0, 3)}</span>
                                        <span className="text-lg font-bold">{item.hari === 'Senin' ? '1' : item.hari === 'Selasa' ? '2' : item.hari === 'Rabu' ? '3' : item.hari === 'Kamis' ? '4' : '5'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{item.mapel}</h3>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Kelas {item.kelas}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock size={14} /> {item.jam}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm md:text-right md:justify-end pl-20 md:pl-0">
                                    <MapPin size={16} />
                                    <span>{item.ruang}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Calendar size={40} className="text-slate-300" />
                            </div>
                            <h3 className="font-bold text-slate-800">Belum Ada Jadwal</h3>
                            <p className="text-sm text-slate-500 text-center max-w-xs px-6">
                                Anda belum memiliki jadwal mengajar yang diatur oleh Admin untuk semester ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default JadwalMengajarGuru;
