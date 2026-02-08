import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, FolderInput, Save, Plus, Minus, Info } from 'lucide-react';
import { useGrades } from './DashboardSuperAdmin/hooks/useGrades';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

interface InputNilaiGuruProps {
    onBack: () => void;
    user?: any;
}

const InputNilaiGuru: React.FC<InputNilaiGuruProps> = ({ onBack, user }) => {

    // --- CONTEXT ---
    const isWaliKelas = user?.role === 'Wali Kelas' || user?.jabatan === 'Guru Kelas' || !!user?.kelas;
    const [selectedClass, setSelectedClass] = useState(user?.kelas || '1A');
    const [selectedMapel, setSelectedMapel] = useState(user?.mapel || 'Matematika');
    const [tipeNilai, setTipeNilai] = useState('tp1');
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');
    const [tpCount, setTpCount] = useState(4);

    // --- DATA MANAGEMENT (Refactored to Hook) ---
    const {
        gradesData,
        setGradesData,
        fetchGrades,
        saveGrades,
        loading: gradesLoading
    } = useGrades();

    // Load data
    useEffect(() => {
        const loadInitial = async () => {
            // 1. Sync TP Count
            const countKey = `tp_count_${selectedClass}_${selectedMapel}_${selectedSemester}`;
            const savedCount = localStorage.getItem(countKey);
            if (savedCount) setTpCount(parseInt(savedCount));
            else setTpCount(4);

            // 2. Load Grades (Try Cloud and Fallback)
            const cloudGrades = await fetchGrades(selectedClass, selectedMapel, selectedSemester);

            if (!cloudGrades) {
                // Legacy Local Load
                const key = `grades_v2_${selectedClass}_${selectedMapel}_${selectedSemester}`;
                const saved = localStorage.getItem(key);

                if (saved) {
                    setGradesData(JSON.parse(saved));
                } else {
                    const studentsRaw = localStorage.getItem('students_data_v10'); // Unified to v10
                    const allStudents = studentsRaw ? JSON.parse(studentsRaw) : [];
                    const classStudents = allStudents.filter((s: any) => s.kelas === selectedClass);

                    if (classStudents.length > 0) {
                        const initialGrades = classStudents.map((s: any) => ({
                            studentId: s.id,
                            studentName: s.nama,
                            studentNis: s.nis,
                            tp1: 0, tp2: 0, tp3: 0, tp4: 0,
                            avgSumatif: 0, pts: 0, pas: 0, pat: 0,
                            finalScore: 0, predicate: '-', description: ''
                        }));
                        setGradesData(initialGrades);
                    } else {
                        setGradesData([]);
                    }
                }
            }
        };

        loadInitial();
    }, [selectedClass, selectedMapel, selectedSemester, fetchGrades]);

    const saveToStorage = async () => {
        await saveGrades(selectedClass, selectedMapel, selectedSemester, gradesData);
    };

    const updateTpCount = () => {
        const newCount = Math.min(tpCount + 1, 15);
        setTpCount(newCount);
        const countKey = `tp_count_${selectedClass}_${selectedMapel}_${selectedSemester}`;
        localStorage.setItem(countKey, newCount.toString());
        setTipeNilai(`tp${newCount}`);
    };

    const removeTpCount = () => {
        if (tpCount <= 1) return;
        const newCount = tpCount - 1;
        setTpCount(newCount);
        const countKey = `tp_count_${selectedClass}_${selectedMapel}_${selectedSemester}`;
        localStorage.setItem(countKey, newCount.toString());
        if (tipeNilai === `tp${tpCount}`) {
            setTipeNilai(`tp${newCount}`);
        }
    };

    const handleScoreChange = (studentId: number, val: string) => {
        setGradesData((prev: any[]) => prev.map(row => {
            if (row.studentId === studentId) {
                return { ...row, [tipeNilai]: Number(val) };
            }
            return row;
        }));
    };

    return (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 md:gap-4 shrink-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/30 sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all active:scale-95 border border-slate-100"
                >
                    <ChevronLeft className="text-slate-500" size={24} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-black text-slate-800 tracking-tight leading-tight truncate">
                        Input Nilai Siswa
                    </h2>
                    <p className="text-indigo-600/60 text-[8px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Manajemen penilaian akademik kelas {selectedClass}</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card - Consistent Style */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 flex items-center gap-4 border border-white/10 mb-6">
                    <div className="p-3 bg-white/15 backdrop-blur-xl rounded-2xl shrink-0 hidden sm:block">
                        <FolderInput size={24} className="text-indigo-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm md:text-lg uppercase tracking-wide">Panel Penginputan Nilai</h3>
                        <p className="text-[10px] md:text-xs text-indigo-100/90 leading-relaxed mt-0.5 italic">
                            Nilai akan menghitung rata-rata secara otomatis saat raport dicetak. Klik simpan untuk mempermanenkan data.
                        </p>
                    </div>
                </div>

                {/* Filter Controls - Modern Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Kelas</label>
                        {isWaliKelas ? (
                            <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700">
                                {selectedClass}
                            </div>
                        ) : (
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
                            >
                                {localStorage.getItem('classes_data_v10')
                                    ? JSON.parse(localStorage.getItem('classes_data_v10')!).map((c: any) => (
                                        <option key={c.id} value={c.nama}>{c.nama}</option>
                                    ))
                                    : <option>1A</option>}
                            </select>
                        )}
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Mata Pelajaran</label>
                        <select
                            value={selectedMapel}
                            onChange={(e) => setSelectedMapel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
                        >
                            {localStorage.getItem('subjects_data_v10')
                                ? JSON.parse(localStorage.getItem('subjects_data_v10')!).map((s: any) => (
                                    <option key={s.id} value={s.name}>{s.name || s.nama}</option>
                                ))
                                : ["Matematika", "B. Indonesia", "IPA", "IPS"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Semester</label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-700 outline-none cursor-pointer appearance-none shadow-sm"
                        >
                            <option>1 (Ganjil)</option>
                            <option>2 (Genap)</option>
                        </select>
                    </div>
                    <div className="flex-[1.5] min-w-[240px]">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Jenis Penilaian</label>
                            <div className="flex gap-1.5">
                                <button onClick={updateTpCount} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors border border-indigo-100" title="Tambah Ulangan"><Plus size={14} /></button>
                                <button onClick={removeTpCount} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400 transition-colors border border-rose-100" title="Hapus Terakhir"><Minus size={14} /></button>
                            </div>
                        </div>
                        <select
                            value={tipeNilai}
                            onChange={(e) => setTipeNilai(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white outline-none cursor-pointer appearance-none shadow-lg shadow-slate-200"
                        >
                            {Array.from({ length: tpCount }, (_, i) => (
                                <option key={`tp${i + 1}`} value={`tp${i + 1}`}>
                                    📝 Ulangan {i + 1} (U{i + 1})
                                </option>
                            ))}
                            <option value="pts">📊 PTS (Tengah Semester)</option>
                            <option value="pat">🎓 PAT (Akhir Tahun)</option>
                        </select>
                    </div>
                </div>

                {/* Grades Table - Mobile Friendly List */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-auto max-h-[calc(100vh-350px)] custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">No</th>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4 w-32 text-center">Input Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gradesData.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center text-slate-300 font-bold">Tidak ada data siswa untuk kelas ini</td>
                                    </tr>
                                ) : (
                                    gradesData.map((siswa, index) => (
                                        <tr key={siswa.studentId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-center text-slate-400 font-medium">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors uppercase">{siswa.studentName}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{siswa.studentNis}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={siswa[tipeNilai] || 0}
                                                    onChange={(e) => handleScoreChange(siswa.studentId, e.target.value)}
                                                    className="w-20 p-3 text-center bg-indigo-50/30 border border-slate-200 rounded-xl font-black text-indigo-700 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer Footer Action */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-center">
                <button
                    onClick={saveToStorage}
                    className="w-full max-w-md bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                    <Save size={20} />
                    Simpan Perubahan Nilai
                </button>
            </div>
        </div>
    );
};

export default InputNilaiGuru;
