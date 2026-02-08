import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, ChevronDown, FileSpreadsheet, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { toast } from 'react-hot-toast';
import logger from '../src/utils/logger';

interface RapotSiswaProps {
    onBack: () => void;
    user?: any;
}

const RapotSiswa: React.FC<RapotSiswaProps> = ({ onBack, user }) => {
    const [selectedClass, setSelectedClass] = useState(user?.studentClass || '1A');
    const [selectedSemester, setSelectedSemester] = useState('Semester 1');
    const [rapotType, setRapotType] = useState<'diknas' | 'yayasan'>('diknas');

    // Standard subjects list (Synced from Admin)
    const [subjectList, setSubjectList] = useState<string[]>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('subjects_data_v10') : null;
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((s: any) => s.name);
            } catch (e) {
                logger.warn("Failed to parse subjects from localStorage", e);
            }
        }
        return [
            "Pendidikan Agama", "Pendidikan Pancasila", "Bahasa Indonesia",
            "Matematika", "IPAS", "Seni Budaya", "PJOK", "Bahasa Inggris"
        ];
    });

    const [subjects, setSubjects] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Supplementary Data State
    const [suppData, setSuppData] = useState({
        attitudes: [
            { id: 1, type: "Spiritual", desc: "" },
            { id: 2, type: "Sosial", desc: "" }
        ],
        extracurriculars: [{ id: 1, name: "", desc: "" }],
        attendance: { sakit: 0, izin: 0, alpha: 0 },
        personalities: [
            { aspect: "Kerapihan", desc: "Baik" },
            { aspect: "Kedisiplinan", desc: "Baik" },
            { aspect: "Kesehatan", desc: "Sehat" },
        ],
        note: "",
        decision: "Naik Ke Kelas" // Default decision
    });

    // Load Grades and Supplementary Data
    useEffect(() => {
        const studentId = user?.studentId?.toString() || user?.id?.toString() || user?.nis?.toString() || '';
        const currentSemesterFull = selectedSemester === 'Semester 1' ? '1 (Ganjil)' : '2 (Genap)';

        const loadContent = async () => {
            if (!isSupabaseConfigured()) return;

            // 1. Load Grades from Cloud
            const loadedSubjects: any[] = [];
            for (let i = 0; i < subjectList.length; i++) {
                const subj = subjectList[i];
                const key = `grades_v2_${selectedClass}_${subj}_${currentSemesterFull}`;

                try {
                    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
                    let daily = 0, exam = 0, report = 0;

                    if (data?.value) {
                        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                        const studentRow = parsed.find((s: any) => {
                            const rowId = (s.studentId || s.id || s.nis || '').toString();
                            return (rowId && rowId === studentId) ||
                                (s.studentName?.toLowerCase() === (user?.studentName || user?.nama || '').toLowerCase());
                        });

                        if (studentRow) {
                            daily = studentRow.avgSumatif || 0;
                            exam = Math.max(studentRow.pas || 0, studentRow.pat || 0, studentRow.pts || 0);
                            report = studentRow.finalScore || 0;
                        }
                    }
                    loadedSubjects.push({ id: i + 1, name: subj, daily, exam, report });
                } catch (e) {
                    logger.error(`Error loading grades for ${subj}:`, e);
                    loadedSubjects.push({ id: i + 1, name: subj, daily: 0, exam: 0, report: 0 });
                }
            }
            setSubjects(loadedSubjects);

            // 2. Load Supplementary Data from Cloud
            const suppKey = `rapor_supp_${selectedClass}_${studentId}_${currentSemesterFull}`;
            try {
                const { data } = await supabase.from('app_settings').select('value').eq('key', suppKey).maybeSingle();
                if (data?.value) {
                    setSuppData(typeof data.value === 'string' ? JSON.parse(data.value) : data.value);
                } else {
                    // Fallback to default
                    setSuppData({
                        attitudes: [
                            { id: 1, type: "Spiritual", desc: "Ananda sangat taat beribadah dan berperilaku jujur." },
                            { id: 2, type: "Sosial", desc: "Ananda memiliki sikap sosial yang baik dan disiplin." }
                        ],
                        extracurriculars: [{ id: 1, name: "-", desc: "-" }],
                        attendance: { sakit: 0, izin: 0, alpha: 0 },
                        personalities: [
                            { aspect: "Kerapihan", desc: "Baik" },
                            { aspect: "Kedisiplinan", desc: "Baik" },
                            { aspect: "Kesehatan", desc: "Sehat" },
                        ],
                        note: "Pertahankan prestasimu dan tingkatkan belajarmu.",
                        decision: "Naik Ke Kelas"
                    });
                }
            } catch (e) {
                logger.error("Error loading supplementary data:", e);
            }
        };

        loadContent();
    }, [selectedClass, selectedSemester, user]);

    const handleSaveSupp = async () => {
        const studentId = user?.studentId?.toString() || user?.id?.toString() || user?.nis?.toString() || '4';
        const currentSemesterFull = selectedSemester === 'Semester 1' ? '1 (Ganjil)' : '2 (Genap)';
        const suppKey = `rapor_supp_${selectedClass}_${studentId}_${currentSemesterFull}`;

        localStorage.setItem(suppKey, JSON.stringify(suppData));

        if (isSupabaseConfigured()) {
            try {
                await supabase.from('app_settings').upsert({
                    key: suppKey,
                    value: suppData,
                    updated_at: new Date().toISOString()
                });
                toast.success("Data pelengkap rapor berhasil disinkronkan!");
            } catch (e) {
                logger.error("Cloud sync failed:", e);
                toast.error("Gagal sinkron ke cloud.");
            }
        }

        setIsEditing(false);
    };

    // Calculate Averages
    const averageDaily = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.daily, 0) / subjects.length) : 0;
    const averageExam = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.exam, 0) / subjects.length) : 0;
    const averageReport = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.report, 0) / subjects.length) : 0;

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 md:gap-4 shrink-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-emerald-600 hover:scale-110 transition-all active:scale-95 border border-slate-100"
                >
                    <ChevronLeft className="text-slate-500" size={24} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight leading-tight truncate">
                        E-Rapor Siswa Digital
                    </h2>
                    <p className="text-emerald-600/60 text-[8px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">Nilai & Capaian Belajar</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card - Consistent Style */}
                <div className="bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800 p-5 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-emerald-900/10 flex items-center gap-4 border border-white/10 mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="p-2 sm:p-3 bg-white/15 backdrop-blur-xl rounded-xl sm:rounded-2xl shrink-0">
                        <FileSpreadsheet size={20} sm:size={24} className="text-emerald-100" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="font-black text-xs sm:text-lg uppercase tracking-widest leading-none mb-1">E-Rapor Digital</h3>
                        <p className="text-[10px] sm:text-xs text-emerald-100/90 leading-tight italic line-clamp-2">
                            Informasi perolehan nilai dan capaian kompetensi siswa per semester secara real-time.
                        </p>
                    </div>
                </div>
                {/* RAPOT TABS (Diknas / Yayasan) */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    {['Rapot Diknas', 'Rapot Yayasan'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setRapotType(tab === 'Rapot Diknas' ? 'diknas' : 'yayasan')}
                            className={`flex-1 py-2 text-[10px] sm:text-xs font-black rounded-lg transition-all ${(rapotType === 'diknas' && tab === 'Rapot Diknas') || (rapotType === 'yayasan' && tab === 'Rapot Yayasan')
                                ? 'bg-[#004AAD] text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-slate-600 font-bold whitespace-nowrap">Kelas</label>
                        <div className="relative w-full">
                            <div className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-xl font-bold">
                                {selectedClass}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-slate-600 font-bold whitespace-nowrap">Semester</label>
                        <div className="relative w-full">
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option>Semester 1</option>
                                <option>Semester 2</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                {/* Subject List - Only show in View Mode */}
                {!isEditing && (
                    <div className="space-y-3 pb-20">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="border-2 border-slate-50 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 bg-white shadow-md shadow-blue-900/5 hover:border-blue-100 transition-all group relative overflow-hidden mb-3">
                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-slate-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-center mb-1 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[#004AAD] font-black text-[10px] sm:text-base border border-slate-200 uppercase">
                                            {subject.id}
                                        </div>
                                        <div>
                                            <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Mata Pelajaran</p>
                                            <h4 className="font-black text-slate-800 text-[11px] sm:text-base leading-none uppercase tracking-tight">{subject.name}</h4>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 sm:gap-10 text-right">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Harian</p>
                                            <p className="text-xs sm:text-lg font-black text-slate-700 leading-none">{subject.daily}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Ujian</p>
                                            <p className="text-xs sm:text-lg font-black text-slate-700 leading-none">{subject.exam}</p>
                                        </div>
                                        <div className="flex flex-col items-center px-2 py-1 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-[7px] sm:text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1 leading-none">Rapor</p>
                                            <p className="text-xs sm:text-lg font-black text-[#004AAD] leading-none">{subject.report}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Mode: Supplementary Data Management */}
                {isEditing && (
                    <div className="space-y-6 pb-20 animate-in slide-in-from-bottom duration-300">
                        {/* 1. SIKAP */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs">A</span>
                                Pengisian Sikap
                            </h4>
                            <div className="space-y-4">
                                {suppData.attitudes.map((att, idx) => (
                                    <div key={idx}>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Deskripsi {att.type}</label>
                                        <textarea
                                            value={att.desc}
                                            onChange={(e) => {
                                                const newAtt = [...suppData.attitudes];
                                                newAtt[idx].desc = e.target.value;
                                                setSuppData({ ...suppData, attitudes: newAtt });
                                            }}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all h-20"
                                            placeholder={`Tulis deskripsi sikap ${att.type.toLowerCase()}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. EKSTRAKURIKULER */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs">B</span>
                                    Ekstrakurikuler
                                </h4>
                                <button
                                    onClick={() => setSuppData({ ...suppData, extracurriculars: [...suppData.extracurriculars, { id: Date.now(), name: '', desc: '' }] })}
                                    className="text-[10px] font-bold text-emerald-600 uppercase hover:underline"
                                >
                                    + Tambah
                                </button>
                            </div>
                            <div className="space-y-3">
                                {suppData.extracurriculars.map((eks, idx) => (
                                    <div key={eks.id} className="flex gap-2">
                                        <input
                                            value={eks.name}
                                            onChange={(e) => {
                                                const newEks = [...suppData.extracurriculars];
                                                newEks[idx].name = e.target.value;
                                                setSuppData({ ...suppData, extracurriculars: newEks });
                                            }}
                                            placeholder="Nama Ekskul"
                                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                                        />
                                        <input
                                            value={eks.desc}
                                            onChange={(e) => {
                                                const newEks = [...suppData.extracurriculars];
                                                newEks[idx].desc = e.target.value;
                                                setSuppData({ ...suppData, extracurriculars: newEks });
                                            }}
                                            placeholder="Keterangan/Predikat"
                                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. ABSENSI */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-orange-600 text-white rounded-lg flex items-center justify-center text-xs">C</span>
                                Rekap Ketidakhadiran
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                {(['sakit', 'izin', 'alpha'] as const).map(type => (
                                    <div key={type}>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase text-center block mb-1">{type}</label>
                                        <input
                                            type="number"
                                            value={suppData.attendance[type]}
                                            onChange={(e) => setSuppData({ ...suppData, attendance: { ...suppData.attendance, [type]: parseInt(e.target.value) || 0 } })}
                                            className="w-full p-2.5 text-center bg-white border border-slate-200 rounded-xl text-sm font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. CATATAN WALI KELAS */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-600 text-white rounded-lg flex items-center justify-center text-xs">D</span>
                                Catatan Wali Kelas
                            </h4>
                            <textarea
                                value={suppData.note}
                                onChange={(e) => setSuppData({ ...suppData, note: e.target.value })}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-purple-500 outline-none transition-all h-24"
                                placeholder="Write notes for parents..."
                            />
                        </div>

                        {/* 5. KEPUTUSAN KENAIKAN/KELULUSAN */}
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
                            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs">E</span>
                                Keputusan Kenaikan/Kelulusan
                            </h4>
                            <select
                                value={suppData.decision}
                                onChange={(e) => setSuppData({ ...suppData, decision: e.target.value })}
                                className="w-full p-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-700 focus:border-blue-500 outline-none appearance-none"
                            >
                                <option value="Naik Ke Kelas">Naik Ke Kelas</option>
                                <option value="Tinggal Di Kelas">Tinggal Di Kelas</option>
                                <option value="Lulus">Lulus (Untuk Kelas 6)</option>
                                <option value="Tidak Lulus">Tidak Lulus (Untuk Kelas 6)</option>
                            </select>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-2xl">Batal</button>
                            <button onClick={handleSaveSupp} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100">Simpan Perubahan</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Average */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white sticky bottom-0 z-30">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-center justify-between shadow-xl shadow-slate-900/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                            <Star size={16} sm:size={18} fill="currentColor" />
                        </div>
                        <span className="font-black text-white text-[10px] sm:text-base uppercase tracking-widest">Rata-Rata</span>
                    </div>
                    <div className="flex gap-4 sm:gap-10 text-right">
                        <div className="flex flex-col items-center">
                            <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Harian</p>
                            <p className="text-xs sm:text-lg font-black text-white leading-none">{averageDaily}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Ujian</p>
                            <p className="text-xs sm:text-lg font-black text-white leading-none">{averageExam}</p>
                        </div>
                        <div className="flex flex-col items-center px-2 py-1 bg-white/10 rounded-lg">
                            <p className="text-[7px] sm:text-[9px] text-yellow-400 font-black uppercase tracking-widest mb-1 leading-none">Rapor</p>
                            <p className="text-xs sm:text-lg font-black text-white leading-none">{averageReport}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RapotSiswa;
