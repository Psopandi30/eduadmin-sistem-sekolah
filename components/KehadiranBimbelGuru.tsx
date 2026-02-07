import React, { useState } from 'react';
import { ChevronLeft, UserCheck, Search, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { useTutoring } from './DashboardSuperAdmin/hooks/useTutoring';
import { supabase } from '../src/lib/supabase';
import { toast } from 'react-hot-toast';

interface KehadiranBimbelGuruProps {
    onBack: () => void;
}

const KehadiranBimbelGuru: React.FC<KehadiranBimbelGuruProps> = ({ onBack }) => {
    const { tutoringClasses, isLoading } = useTutoring();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<any[]>([]);

    // 1. Filter Classes for Current Teacher
    // In a real app, 'user' prop should be passed to this component
    // For now, we'll show all classes or assume a mock user in parent
    const myClasses = tutoringClasses;

    // 2. Load Students when Class is selected
    // Note: In a real DB, we would fetch 'students' tailored to this class.
    // For now, we will simulate students based on the selected class title.
    React.useEffect(() => {
        if (myClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(myClasses[0].id.toString());
        }
    }, [myClasses, selectedClassId]);

    React.useEffect(() => {
        if (selectedClassId) {
            const cls = myClasses.find(c => c.id.toString() === selectedClassId);
            if (cls) {
                // Simulate fetching students for this class
                // In production, this would be: await supabase.from('class_students').select(...).eq('class_id', cls.id)
                const mockStudents = [
                    { id: 1, nama: 'Ahmad Dahlan', status: 'Hadir', catatan: '' },
                    { id: 2, nama: 'Siti Aisyah', status: 'Hadir', catatan: '' },
                    { id: 3, nama: 'Budi Santoso', status: 'Sakit', catatan: 'Demam' },
                ];
                setAttendanceData(mockStudents);
            }
        }
    }, [selectedClassId, myClasses]);

    const handleStatusChange = (id: number, status: string) => {
        setAttendanceData(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    const handleCatatanChange = (id: number, catatan: string) => {
        setAttendanceData(prev => prev.map(s => s.id === id ? { ...s, catatan } : s));
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <UserCheck className="text-teal-500" size={20} />
                        Kehadiran Les
                    </h2>
                </div>
                {selectedClassId && (
                    <div className="bg-teal-50 text-teal-600 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                        <Users size={14} /> {myClasses.find(c => c.id.toString() === selectedClassId)?.title || 'Kelas'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">

                {/* Sesi Selector (Now Dynamic) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Pilih Sesi Bimbel</label>
                    <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <option>Memuat data...</option>
                        ) : myClasses.length > 0 ? (
                            myClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.title} - {cls.schedule}
                                </option>
                            ))
                        ) : (
                            <option>Tidak ada kelas aktif</option>
                        )}
                    </select>
                </div>

                <div className="space-y-4">
                    {attendanceData.map((siswa) => (
                        <div key={siswa.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-lg">
                                        {siswa.nama.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{siswa.nama}</h3>
                                        <p className="text-xs text-slate-400">ID: SIS-2025-00{siswa.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <button
                                    onClick={() => handleStatusChange(siswa.id, 'Hadir')}
                                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${siswa.status === 'Hadir' ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-100 bg-white text-slate-400 hover:border-green-200'}`}
                                >
                                    <CheckCircle size={24} className={siswa.status === 'Hadir' ? 'fill-green-500 text-white' : ''} />
                                    <span className="text-xs font-bold">Hadir</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(siswa.id, 'Izin')}
                                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${siswa.status === 'Izin' || siswa.status === 'Sakit' ? 'border-yellow-500 bg-yellow-50 text-yellow-600' : 'border-slate-100 bg-white text-slate-400 hover:border-yellow-200'}`}
                                >
                                    <AlertCircle size={24} className={siswa.status === 'Izin' || siswa.status === 'Sakit' ? 'fill-yellow-500 text-white' : ''} />
                                    <span className="text-xs font-bold">Izin/Sakit</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(siswa.id, 'Alpa')}
                                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${siswa.status === 'Alpa' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 bg-white text-slate-400 hover:border-red-200'}`}
                                >
                                    <XCircle size={24} className={siswa.status === 'Alpa' ? 'fill-red-500 text-white' : ''} />
                                    <span className="text-xs font-bold">Tanpa Ket.</span>
                                </button>
                            </div>

                            {/* Catatan Sesi */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Catatan Perkembangan (Opsional)</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                    rows={2}
                                    placeholder="Catatan khusus untuk sesi ini..."
                                    value={siswa.catatan}
                                    onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <button
                        onClick={async () => {
                            try {
                                const { error } = await supabase
                                    .from('app_settings')
                                    .upsert({
                                        key: 'bimbel_attendance_v1',
                                        value: attendanceData,
                                        updated_at: new Date().toISOString()
                                    }, { onConflict: 'key' });

                                if (error) throw error;
                                toast.success('Absensi Bimbel berhasil disinkronkan!', {
                                    duration: 3000,
                                    position: 'top-center',
                                    style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                                });
                            } catch (e) {
                                toast.error('Gagal menyimpan absensi, coba lagi.', {
                                    duration: 3000,
                                    position: 'top-center'
                                });
                            }
                        }}
                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-700/20 hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <UserCheck size={20} />
                        Simpan Absensi Bimbel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KehadiranBimbelGuru;
```
