import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { attendanceDataGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface KehadiranSiswaProps {
    onBack: () => void;
    user?: any;
}

const KehadiranSiswa: React.FC<KehadiranSiswaProps> = ({ onBack, user }) => {
    // Dynamic Month Selection
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(() => {
        return currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    });

    // 1. Identify Student
    const studentName = user?.studentName || user?.nama || 'Ahmad Zaki';

    // 2. Filter Attendance Records from LocalStorage
    const [myAttendance, setMyAttendance] = useState<any[]>([]);

    useEffect(() => {
        const loadAttendance = async () => {
            if (!isSupabaseConfigured()) return;
            try {
                const { data } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'attendance_data_v2')
                    .single();

                if (data?.value) {
                    const allRecords = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

                    // Filter for this student
                    const myId = user?.studentId || (user?.nis ? user.nis.toString() : '');
                    const myName = user?.studentName || user?.nama || '';

                    const myRecords = allRecords.filter((rec: any) => {
                        const isMe = rec.studentId?.toString() === myId ||
                            rec.studentName?.toLowerCase() === myName?.toLowerCase();
                        if (!isMe) return false;

                        // Filter by selected month/year
                        const recDate = new Date(rec.date);
                        return recDate.getMonth() === currentDate.getMonth() &&
                            recDate.getFullYear() === currentDate.getFullYear();
                    }).map((rec: any) => ({
                        ...rec,
                        // Map shorthand to full status for UI
                        statusDisplay: rec.status === 'H' ? 'Hadir' : (rec.status === 'S' ? 'Sakit' : (rec.status === 'I' ? 'Izin' : (rec.status === 'A' ? 'Alpha' : rec.status)))
                    }));

                    setMyAttendance(myRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                }
            } catch (err) {
                logger.error("Failed to fetch attendance from cloud", err);
            }
        };

        loadAttendance();
    }, [user, currentDate]);

    // 3. Count Stats
    const countStatus = (status: string) => myAttendance.filter(r => r.statusDisplay === status || r.status === status).length;

    // Summary Stats
    const stats = [
        { label: 'Hadir', value: countStatus('Hadir'), color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={20} /> },
        { label: 'Sakit', value: countStatus('Sakit'), color: 'bg-blue-100 text-blue-700', icon: <AlertCircle size={20} /> },
        { label: 'Izin', value: countStatus('Izin'), color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={20} /> },
        { label: 'Alpha', value: countStatus('Alpha'), color: 'bg-red-100 text-red-700', icon: <XCircle size={20} /> },
    ];

    const getStatusType = (status: string) => {
        if (status === 'Hadir') return 'present';
        if (status === 'Sakit') return 'sick';
        if (status === 'Izin') return 'permission';
        return 'alpha';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hadir': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Sakit': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Izin': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Alpha': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getBadgeColor = (status: string) => {
        switch (status) {
            case 'Hadir': return 'bg-emerald-100 text-emerald-700';
            case 'Sakit': return 'bg-blue-100 text-blue-700';
            case 'Izin': return 'bg-yellow-100 text-yellow-700';
            case 'Alpha': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-teal-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight className="rotate-180" size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight">Kehadiran Siswa</h3>
                    <p className="text-[8px] sm:text-xs font-bold text-teal-600/60 uppercase tracking-widest mt-0.5">{studentName}</p>
                </div>
            </div>

            <div className="p-4 sm:p-10 flex-1 overflow-y-auto scrollbar-hide">
                {/* Month Selector */}
                <div className="flex justify-between items-center mb-5 sm:mb-10 bg-white shadow-lg shadow-blue-900/5 p-2 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-slate-50">
                    <button
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCurrentDate(newDate);
                            setSelectedMonth(newDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all text-slate-400 active:scale-90"
                    >
                        <ChevronRight className="rotate-180" size={16} sm:size={20} strokeWidth={3} />
                    </button>
                    <div className="flex items-center gap-1.5 sm:gap-3 font-black text-slate-700 text-[10px] sm:text-base uppercase tracking-tight">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                            <Calendar size={14} sm:size={18} strokeWidth={2.5} />
                        </div>
                        {selectedMonth}
                    </div>
                    <button
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCurrentDate(newDate);
                            setSelectedMonth(newDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all text-slate-400 active:scale-90"
                    >
                        <ChevronRight size={16} sm:size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-6 mb-6 sm:mb-12">
                    {stats.map((item, index) => (
                        <div key={index} className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] bg-white border border-slate-100 shadow-md shadow-blue-900/5 hover:scale-105 transition-transform duration-300`}>
                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl ${item.color} flex items-center justify-center mb-2 sm:mb-4 shadow-inner`}>
                                {React.cloneElement(item.icon as any, { size: 14, strokeWidth: 2.5 })}
                            </div>
                            <p className="text-xl sm:text-3xl font-black text-slate-800 tracking-tighter leading-none">{item.value}</p>
                            <p className="text-[8px] sm:text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1.5">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Attendance List */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-5 sm:h-6 bg-[#004AAD] rounded-full"></div>
                        <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight">Riwayat Kehadiran</h4>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {myAttendance.length === 0 ? (
                            <div className="text-center py-16 sm:py-20 bg-slate-50/50 rounded-[2rem] sm:rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-slate-200">
                                    <Clock size={28} sm:size={32} />
                                </div>
                                <p className="text-slate-400 font-extrabold text-[10px] sm:text-sm uppercase tracking-widest italic">Belum ada data absensi</p>
                            </div>
                        ) : (
                            myAttendance.map((record, index) => (
                                <div key={record.id || index} className="flex items-center justify-between p-3.5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 border-slate-50 bg-white hover:border-blue-100 shadow-md shadow-blue-900/5 transition-all duration-300 group active:scale-[0.98] relative overflow-hidden">
                                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-slate-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="flex items-center gap-3 sm:gap-6 min-w-0 relative z-10">
                                        <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.8rem] flex items-center justify-center font-black text-base sm:text-2xl shadow-md border transition-all duration-500 shrink-0 ${getStatusColor(record.statusDisplay || record.status)}`}>
                                            {(record.statusDisplay || record.status || '?').substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 text-[10px] sm:text-xl tracking-tight truncate uppercase leading-none mb-1">{record.date}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="flex items-center gap-1 text-[8px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-widest leading-none">
                                                    <Clock size={10} sm:size={12} strokeWidth={3} />
                                                    {record.time || '07:00'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`ml-3 px-3 sm:px-6 py-1.5 sm:py-3 rounded-lg sm:rounded-2xl text-[8px] sm:text-[11px] font-black uppercase tracking-widest shadow-md border-b-4 relative z-10 transition-all ${record.statusDisplay === 'Hadir' || record.status === 'H' ? 'bg-emerald-600 text-white border-emerald-800' :
                                        record.statusDisplay === 'Sakit' || record.status === 'S' ? 'bg-blue-600 text-white border-blue-800' :
                                            record.statusDisplay === 'Izin' || record.status === 'I' ? 'bg-yellow-500 text-white border-yellow-700' :
                                                'bg-red-600 text-white border-red-800'
                                        }`}>
                                        {record.statusDisplay || record.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KehadiranSiswa;
