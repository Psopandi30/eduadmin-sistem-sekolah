import React, { useState } from 'react';
import { ArrowLeft, UserCheck, Search, CheckCircle, XCircle, AlertCircle, CheckCircle2, Save, Users, ChevronLeft } from 'lucide-react';

import { attendanceDataGlobal, updateAttendanceDataGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../src/utils/logger';

interface KehadiranSiswaGuruProps {
    onBack: () => void;
    user?: any;
}

const KehadiranSiswaGuru: React.FC<KehadiranSiswaGuruProps> = ({ onBack, user }) => {
    // --- CLASS SELECTION FOR GURU MAPEL ---
    const isWaliKelas = user?.role === 'Wali Kelas' || user?.jabatan === 'Guru Kelas' || !!user?.kelas;
    const [selectedClass, setSelectedClass] = useState(user?.kelas || '1A');
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');

    // Fetch Classes for Dropdown
    const [classesList] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('classes_data_v1');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: 1, nama: '1A' }, { id: 2, nama: '1B' },
            { id: 3, nama: '2A' }, { id: 4, nama: '2B' },
            { id: 5, nama: '3A' }, { id: 6, nama: '3B' },
            { id: 7, nama: '4A' }, { id: 8, nama: '4B' },
            { id: 9, nama: '5A' }, { id: 10, nama: '5B' },
            { id: 11, nama: '6A' }, { id: 12, nama: '6B' },
        ];
    });

    // --- REAL DATA FETCHING ---
    const [students] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('students_data_v2');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });

    const [attendanceData, setAttendanceData] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('attendance_data_v2');
            if (saved) return JSON.parse(saved);
        }
        return attendanceDataGlobal.length > 0 ? attendanceDataGlobal : [];
    });

    // Filter students by Selected Class
    const classStudents = students.filter((s: any) => s.kelas === selectedClass);
    const [searchQuery, setSearchQuery] = useState('');
    const todayStr = new Date().toISOString().split('T')[0];

    const handleUpdateStatus = (studentId: number, newStatus: string) => {
        // Map full names to codes for internal storage consistency
        const statusCode = newStatus === 'Hadir' ? 'H' : (newStatus === 'Sakit' ? 'S' : (newStatus === 'Izin' ? 'I' : 'A'));

        const newData = [...attendanceData];
        const index = newData.findIndex(d => d.studentId === studentId && d.date === todayStr);

        if (index >= 0) {
            newData[index] = { ...newData[index], status: statusCode };
        } else {
            const student = students.find(s => s.id === studentId);
            newData.push({
                id: `att-${Date.now()}-${studentId}`,
                studentId: studentId,
                studentName: student?.nama,
                classId: selectedClass,
                date: todayStr,
                status: statusCode,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                note: ''
            });
        }
        setAttendanceData(newData);
        localStorage.setItem('attendance_data_v2', JSON.stringify(newData));
        updateAttendanceDataGlobal(newData);
    };

    const handleMarkAllHadir = () => {
        const newData = [...attendanceData];
        const filteredStudents = classStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase()));

        filteredStudents.forEach(siswa => {
            const index = newData.findIndex(d => d.studentId === siswa.id && d.date === todayStr);
            if (index >= 0) {
                newData[index] = { ...newData[index], status: 'H' };
            } else {
                newData.push({
                    id: `att-${Date.now()}-${siswa.id}-${Math.floor(Math.random() * 1000)}`,
                    studentId: siswa.id,
                    studentName: siswa.nama,
                    classId: selectedClass,
                    date: todayStr,
                    status: 'H',
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    note: ''
                });
            }
        });
        setAttendanceData(newData);
        localStorage.setItem('attendance_data_v2', JSON.stringify(newData));
        updateAttendanceDataGlobal(newData);
    };

    const handleSave = async () => {
        setAttendanceData(attendanceData);
        localStorage.setItem('attendance_data_v2', JSON.stringify(attendanceData));
        updateAttendanceDataGlobal(attendanceData);

        if (isSupabaseConfigured()) {
            try {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        key: 'attendance_data_v2',
                        value: attendanceData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) throw error;
                toast.success('Absensi berhasil disimpan & disinkronkan ke Cloud!');
            } catch (err: any) {
                logger.error("Cloud sync failed:", err);
                toast.error('Gagal sinkron ke Cloud, data tersimpan secara lokal.');
            }
        } else {
            toast.success('Absensi berhasil disimpan secara lokal!');
        }

        onBack();
    };

    return (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
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
                        Absensi Siswa
                    </h2>
                    <p className="text-slate-400 text-[10px] md:text-sm font-medium">Rekapitulasi kehadiran harian siswa.</p>
                </div>
            </div>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card - Consistent Style */}
                <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-teal-100 flex items-center gap-4 border border-white/10 mb-6 font-sans">
                    <div className="p-3 bg-white/15 backdrop-blur-xl rounded-2xl shrink-0 hidden sm:block">
                        <UserCheck size={24} className="text-teal-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm md:text-lg uppercase tracking-wide">Panel Absensi Harian</h3>
                        <p className="text-[10px] md:text-xs text-teal-100/90 leading-relaxed mt-0.5 italic">
                            Silakan lakukan presensi kehadiran siswa hari ini. Data akan otomatis tercatat ke dalam sistem laporan.
                        </p>
                    </div>
                </div>

                {/* Filter Bar - Modern & Responsive */}
                <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Semester</label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 outline-none focus:border-blue-500 shadow-sm transition-all appearance-none cursor-pointer"
                        >
                            <option>1 (Ganjil)</option>
                            <option>2 (Genap)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pilih Kelas</label>
                        {isWaliKelas ? (
                            <div className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                                {selectedClass}
                            </div>
                        ) : (
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-teal-500 shadow-sm transition-all appearance-none cursor-pointer"
                            >
                                {classesList.map((c) => (
                                    <option key={c.id} value={c.nama}>{c.nama}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Statistics Box */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Siswa</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-800 leading-none">{classStudents.length}</span>
                            <Users size={14} className="text-slate-200" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hadir Today</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-teal-600 leading-none">{attendanceData.filter(d => d.classId === selectedClass && d.date === todayStr && d.status === 'Hadir').length}</span>
                            <CheckCircle size={14} className="text-teal-200" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Izin/Sakit</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-amber-500 leading-none">{attendanceData.filter(d => d.classId === selectedClass && d.date === todayStr && (d.status === 'Izin' || d.status === 'Sakit')).length}</span>
                            <AlertCircle size={14} className="text-amber-200" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanpa Ket</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-rose-500 leading-none">{classStudents.length - attendanceData.filter(d => d.classId === selectedClass && d.date === todayStr).length}</span>
                            <XCircle size={14} className="text-rose-200" />
                        </div>
                    </div>
                </div>

                {/* Controls - Minimalist Search */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-teal-500/5 transition-all text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={handleMarkAllHadir}
                        className="flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                    >
                        <CheckCircle2 size={18} /> Centang Hadir Semua
                    </button>
                </div>

                {/* Student List - Optimized Card */}
                <div className="space-y-3 pb-8">
                    {classStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Users size={48} className="opacity-20 mb-3" />
                            <p className="text-sm font-bold">Tidak ada data siswa</p>
                        </div>
                    ) : (
                        classStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase())).map((siswa) => {
                            const todayRecord = attendanceData.find(d => d.studentId === siswa.id && d.date === todayStr);
                            const currentStatus = todayRecord?.status;

                            return (
                                <div key={siswa.id} className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-teal-200 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                            {siswa.nama.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm md:text-base leading-tight">{siswa.nama}</p>
                                            <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 font-medium">{siswa.nis}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-1 bg-slate-50/50 p-1 rounded-xl shrink-0">
                                        <button
                                            onClick={() => handleUpdateStatus(siswa.id, 'Hadir')}
                                            className={`flex-1 sm:px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${currentStatus === 'H' || currentStatus === 'Hadir' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-400 hover:bg-white'}`}
                                        >
                                            <CheckCircle size={14} className={currentStatus === 'H' || currentStatus === 'Hadir' ? 'text-white' : 'text-emerald-400'} />
                                            Hadir
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(siswa.id, 'Sakit')}
                                            className={`flex-1 sm:px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${currentStatus === 'S' || currentStatus === 'Sakit' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'text-slate-400 hover:bg-white'}`}
                                        >
                                            <AlertCircle size={14} className={currentStatus === 'S' || currentStatus === 'Sakit' ? 'text-white' : 'text-amber-400'} />
                                            Sakit
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(siswa.id, 'Izin')}
                                            className={`flex-1 sm:px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${currentStatus === 'I' || currentStatus === 'Izin' ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:bg-white'}`}
                                        >
                                            <AlertCircle size={14} className={currentStatus === 'I' || currentStatus === 'Izin' ? 'text-white' : 'text-blue-400'} />
                                            Izin
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(siswa.id, 'Alpa')}
                                            className={`flex-1 sm:px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${currentStatus === 'A' || currentStatus === 'Alpa' ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'text-slate-400 hover:bg-white'}`}
                                        >
                                            <XCircle size={14} className={currentStatus === 'A' || currentStatus === 'Alpa' ? 'text-white' : 'text-rose-400'} />
                                            Alpa
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer Floating Action */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-center">
                <button
                    onClick={handleSave}
                    className="w-full max-w-md bg-teal-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 active:scale-95"
                >
                    <Save size={20} />
                    Simpan & Update Absensi
                </button>
            </div>
        </div >
    );
};

export default KehadiranSiswaGuru;
