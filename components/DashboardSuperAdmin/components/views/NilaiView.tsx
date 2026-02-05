import React, { useState, useEffect } from 'react';
import {
    Save, ArrowLeft, Download, Upload, Search, Filter,
    Calculator, CheckCircle, AlertCircle, FileSpreadsheet,
    Trophy, BookOpen, User, ChevronDown, Plus, Minus
} from 'lucide-react';
import { studentsDataGlobal, classesDataGlobal } from '../../../../data/sharedData';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../../../../src/lib/supabase';
import { useRef } from 'react';
import { logger } from '../../../../src/utils/logger';


import { GradeRow } from '../../types'; // Move interface if shared, or keep here for now but generic is okay

interface NilaiViewProps {
    setActiveView: (view: string) => void;
    students: any[];
    classes: any[];
    subjects: any[];
    readOnly?: boolean;
}



const NilaiView: React.FC<NilaiViewProps> = ({ setActiveView, students, classes, subjects, readOnly = false }) => {
    // --- STATE FILTER ---
    // Use optional chaining and default to empty string or first item if available
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');

    // Initialize defaults when props are loaded
    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0].nama);
        }
    }, [classes]);

    useEffect(() => {
        if (subjects.length > 0 && !selectedSubject) {
            // Handle object or string structure for subjects
            const subjectName = typeof subjects[0] === 'string' ? subjects[0] : subjects[0]?.name;
            setSelectedSubject(subjectName || 'Matematika');
        }
    }, [subjects]);

    const [activeTab, setActiveTab] = useState<'sumatif' | 'pts' | 'pas_pat' | 'rapor'>('sumatif');
    const [searchQuery, setSearchQuery] = useState('');
    const [grades, setGrades] = useState<GradeRow[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [tpCount, setTpCount] = useState(4);
    const [masterDescriptions, setMasterDescriptions] = useState<any[]>([]);

    const getStorageKey = () => {
        return `grades_${selectedClass}_${selectedSubject}_${selectedSemester}`;
    };


    // --- INITIALIZE DATA ---
    useEffect(() => {
        if (!selectedClass) {
            setGrades([]);
            return;
        }

        const classStudents = students.filter(s => s.kelas === selectedClass || s.class === selectedClass);

        // Try to load saved grades if subject is selected
        if (selectedSubject) {
            const key = getStorageKey();
            const savedData = localStorage.getItem(key);

            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    // Ensure the number of students matches (optional sync)
                    if (parsed.length > 0) {
                        setGrades(parsed);
                        setIsDirty(false);
                        return;
                    }
                } catch (e) {
                    logger.error("Failed to parse saved grades:", e);
                    localStorage.removeItem(key);
                }
            }
        }

        // Fallback: Initial state with students of the class
        const initialGrades: GradeRow[] = classStudents.map(s => ({
            studentId: s.id,
            studentName: s.nama,
            studentNis: s.nis || s.username || '',
            tp1: 0, tp2: 0, tp3: 0, tp4: 0,
            avgSumatif: 0,
            pts: 0, pas: 0, pat: 0,
            ujisn: 0, sas: 0,
            finalScore: 0,
            predicate: '-',
            description: ''
        }));

        setGrades(initialGrades);
        setIsDirty(false);
    }, [selectedClass, selectedSubject, selectedSemester, students]);


    // --- AUTO SAVE TO LOCAL STORAGE ---
    useEffect(() => {
        if (grades.length > 0) {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(grades));
        }
    }, [grades, selectedClass, selectedSubject, selectedSemester]);

    // --- SYNC TP COUNT ---
    useEffect(() => {
        const countKey = `tp_count_${selectedClass}_${selectedSubject}_${selectedSemester}`;
        const savedCount = localStorage.getItem(countKey);
        if (savedCount) {
            setTpCount(parseInt(savedCount));
        } else {
            setTpCount(4); // Default
        }
    }, [selectedClass, selectedSubject, selectedSemester]);

    const updateTpCount = (newCount: number) => {
        setTpCount(newCount);
        const countKey = `tp_count_${selectedClass}_${selectedSubject}_${selectedSemester}`;
        localStorage.setItem(countKey, newCount.toString());
    };

    const removeTpCount = () => {
        if (tpCount <= 1) return;
        updateTpCount(tpCount - 1);
    };

    // --- LOAD MASTER DESCRIPTIONS ---
    useEffect(() => {
        const savedDesc = localStorage.getItem('mock_descriptions');
        if (savedDesc) {
            try {
                setMasterDescriptions(JSON.parse(savedDesc));
            } catch (e) {
                logger.error("Failed to load master descriptions", e);
            }
        }
    }, []);

    // --- CALCULATION LOGIC ---
    const calculateRow = (row: GradeRow): GradeRow => {
        // 1. Hitung Rata-rata Sumatif (TP yang diisi saja)
        // Dynamically gather all 'tpX' values based on current tpCount
        const tps: number[] = [];
        for (let i = 1; i <= tpCount; i++) {
            const val = row[`tp${i}`];
            if (val && val > 0) tps.push(Number(val));
        }

        const avgSum = tps.length > 0 ? Math.round(tps.reduce((a, b) => a + b, 0) / tps.length) : 0;

        // 2. Hitung Nilai Akhir
        // Formula: 40% Rata-rata Harian + 20% PTS + 40% (PAS/PAT/UJISN)
        // Kita ambil nilai akhir semester dari PAS atau PAT tergantung mana yang diisi (prioritas PAT jika semester genap/ada nilai)
        const examScore = Math.max(row.pas, row.pat, row.ujisn, row.sas);

        // Bobot: Harian 40%, PTS 20%, PAS/PAT 40%
        let final = 0;

        if (row.pts > 0 || examScore > 0) {
            final = Math.round((avgSum * 0.4) + (row.pts * 0.2) + (examScore * 0.4));
        } else {
            final = avgSum;
        }

        // 3. Tentukan Predikat
        let pred = 'D';
        if (final >= 90) pred = 'A';
        else if (final >= 80) pred = 'B';
        else if (final >= 75) pred = 'C'; // KKM 75
        else if (final > 0) pred = 'D'; // Belum tuntas
        else pred = '-';

        // 4. Generate Deskripsi Otomatis dari Master Data
        let desc = row.description;
        if (!desc && final > 0) { // Hanya auto-gen jika kosong
            // Cek Master Description (Sync) based on Subject & Predicate
            const masterDesc = masterDescriptions.find((d: any) =>
                (d.subject === selectedSubject || !d.subject) && // Match Subject or Generic
                d.predicate === pred &&
                d.type === 'Rapor Resmi' // Default priority to Resmi
            );

            if (masterDesc) {
                desc = `${masterDesc.knowledge}\n${masterDesc.skill}`;
            } else {
                // Fallback Legacy
                if (pred === 'A') desc = "Ananda sangat baik dalam memahami materi dan penerapannya.";
                else if (pred === 'B') desc = "Ananda baik dalam memahami sebagian besar materi.";
                else if (pred === 'C') desc = "Ananda cukup baik, namun perlu peningkatan dalam latihan soal.";
                else desc = "Ananda perlu bimbingan lebih intensif.";
            }
        }

        return {
            ...row,
            avgSumatif: avgSum,
            finalScore: final,
            predicate: pred,
            description: desc
        };
    };

    // --- HANDLERS ---
    const handleInputChange = (id: number, field: keyof GradeRow, value: any) => {
        setGrades(prev => prev.map(row => {
            if (row.studentId === id) {
                const updatedRow = { ...row, [field]: Number(value) };
                // Recalculate logic
                return calculateRow(updatedRow);
            }
            return row;
        }));
        setIsDirty(true);
    };

    const handleDescriptionChange = (id: number, text: string) => {
        setGrades(prev => prev.map(row =>
            row.studentId === id ? { ...row, description: text } : row
        ));
        setIsDirty(true);
    };

    const handleSave = async () => {
        const key = getStorageKey();

        // 1. Save to Local Storage (Backup)
        localStorage.setItem(key, JSON.stringify(grades));

        // 2. Save to Supabase (Cloud)
        if (isSupabaseConfigured()) {
            const toastId = toast.loading('Menyimpan ke database...');
            try {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        key: key,
                        value: JSON.stringify(grades),
                        updated_at: new Date().toISOString() // Optional if column exists
                    }, { onConflict: 'key' });

                if (error) throw error;
                toast.success('Data berhasil disimpan ke Cloud!', { id: toastId });
            } catch (err) {
                logger.error("Supabase Save Error:", err);
                toast.error('Gagal simpan ke Cloud, tersimpan lokal.', { id: toastId });
            }
        } else {
            toast.success('Tersimpan di Lokal (Offline Mode)');
        }

        setIsDirty(false);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportExcel = () => {
        if (!selectedClass || !selectedSubject) {
            toast.error("Pilih Kelas dan Mata Pelajaran terlebih dahulu!");
            return;
        }

        const dataToExport = grades.map((g, index) => {
            const row: any = {
                'No': index + 1,
                'Nama Siswa': g.studentName,
                'NIS': g.studentNis,
            };

            // Ulangan
            for (let i = 1; i <= tpCount; i++) {
                row[`UH ${i}`] = g[`tp${i}` as keyof GradeRow] || 0;
            }

            // Ujian
            row['PTS'] = g.pts || 0;
            row['PAS'] = g.pas || 0;
            row['PAT'] = g.pat || 0;

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Set column widths for a tidy look
        const wscols = [
            { wch: 6 },   // No
            { wch: 40 },  // Nama Siswa
            { wch: 18 },  // NIS
        ];

        // Dynamic widths for UH columns
        for (let i = 1; i <= tpCount; i++) {
            wscols.push({ wch: 8 });
        }

        // Widths for Exam columns
        wscols.push({ wch: 10 }, { wch: 10 }, { wch: 10 });

        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Input Nilai Siswa");

        const fileName = `Template_Nilai_${selectedClass}_${selectedSubject.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success("Template Excel berhasil diunduh! Silakan isi nilai pada kolom yang tersedia.");
    };

    const handleImportExcel = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("File Excel kosong!");
                    return;
                }

                // Map Data back to Grades
                const updatedGrades = grades.map(curr => {
                    // Try to find matching row in excel by NIS or Name
                    const match = data.find(d =>
                        String(d['NIS']) === String(curr.studentNis) ||
                        d['Nama Siswa']?.toLowerCase() === curr.studentName.toLowerCase()
                    );

                    if (match) {
                        const newGrade = { ...curr };
                        // Update Fields if present in Excel
                        for (let i = 1; i <= 10; i++) { // Check up to 10 TPs
                            if (match[`UH ${i}`] !== undefined) newGrade[`tp${i}` as keyof GradeRow] = Number(match[`UH ${i}`]);
                        }
                        if (match['PTS'] !== undefined) newGrade.pts = Number(match['PTS']);
                        if (match['PAS'] !== undefined) newGrade.pas = Number(match['PAS']);
                        if (match['PAT'] !== undefined) newGrade.pat = Number(match['PAT']);

                        // Recalulate
                        return calculateRow(newGrade);
                    }
                    return curr;
                });

                setGrades(updatedGrades);
                setIsDirty(true);
                toast.success(`Berhasil mengimpor nilai untuk ${data.length} siswa!`);
            } catch (err) {
                logger.error("Import Error:", err);
                toast.error("Gagal membaca file Excel. Pastikan format benar.");
            }
        };
        reader.readAsBinaryString(file);

        // Reset input
        e.target.value = '';
    };

    // --- RENDER HELPERS ---
    const getScoreColor = (score: number) => {
        if (score === 0) return 'text-slate-300';
        if (score < 75) return 'text-rose-600 font-bold';
        return 'text-slate-700';
    };

    const filteredGrades = grades.filter(g =>
        g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.studentNis.includes(searchQuery)
    );

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            {/* HEADER & TABS */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                                <FileSpreadsheet size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Monitoring Nilai</h2>
                                <p className="text-slate-500 text-sm font-medium">Pantau nilai harian and ujian siswa per kelas.</p>
                            </div>
                        </div>

                        {/* Filters integrated into header */}
                        <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <div className="px-3 border-r border-slate-200">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas</label>
                                <div className="relative">
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="appearance-none bg-transparent font-bold text-slate-700 outline-none text-sm cursor-pointer pr-6 w-20"
                                    >
                                        {classes.map(c => <option key={c.id} value={c.nama} className="text-slate-800">{c.nama}</option>)}

                                    </select>
                                    <ChevronDown size={14} className="absolute right-0 top-1 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="px-3 border-r border-slate-200">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mata Pelajaran</label>
                                <div className="relative">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="appearance-none bg-transparent font-bold text-slate-700 outline-none text-sm cursor-pointer pr-6 w-40 truncate"
                                    >
                                        {!selectedSubject && <option value="">Pilih Mapel...</option>}
                                        {subjects.map(s => {
                                            const name = typeof s === 'string' ? s : s.name;
                                            return <option key={name} value={name} className="text-slate-800">{name}</option>;
                                        })}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-0 top-1 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="px-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semester</label>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="bg-transparent font-bold text-blue-600 outline-none text-sm cursor-pointer"
                                >
                                    <option className="text-slate-800">1 (Ganjil)</option>
                                    <option className="text-slate-800">2 (Genap)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* MONITORING STATS FOR WAKA / ADMIN */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        {(() => {
                            const countA = grades.filter(g => g.predicate === 'A').length;
                            const countB = grades.filter(g => g.predicate === 'B').length;
                            const countC = grades.filter(g => g.predicate === 'C').length;
                            const countD = grades.filter(g => g.predicate === 'D').length;
                            const avgVal = grades.length > 0 ? Math.round(grades.reduce((acc, curr) => acc + (curr.finalScore || 0), 0) / grades.length) : 0;

                            return (
                                <>
                                    <div className="flex-1 min-w-[150px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Rata-rata Kelas</p>
                                        <h4 className="text-2xl font-bold text-blue-600">{avgVal} <span className="text-xs font-medium text-slate-400">/ 100</span></h4>
                                    </div>
                                    <div className="flex-1 min-w-[120px] bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">Predikat A</p>
                                        <h4 className="text-2xl font-bold text-emerald-600">{countA} <span className="text-xs font-medium opacity-60 text-emerald-400">Siswa</span></h4>
                                    </div>
                                    <div className="flex-1 min-w-[120px] bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">Predikat B</p>
                                        <h4 className="text-2xl font-bold text-blue-600">{countB} <span className="text-xs font-medium opacity-60 text-blue-400">Siswa</span></h4>
                                    </div>
                                    <div className="flex-1 min-w-[120px] bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Predikat C</p>
                                        <h4 className="text-2xl font-bold text-amber-600">{countC} <span className="text-xs font-medium opacity-60 text-amber-400">Siswa</span></h4>
                                    </div>
                                    <div className="flex-1 min-w-[120px] bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                        <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mb-1">Perlu Remedial (D)</p>
                                        <h4 className="text-2xl font-bold text-rose-600">{countD} <span className="text-xs font-medium opacity-60 text-rose-400">Siswa</span></h4>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Space padding */}
                    <div className="pb-2"></div>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">

                {!selectedSubject ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/10">
                        <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 border border-blue-100 animate-pulse">
                            <BookOpen size={48} className="text-blue-400 opacity-60" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pilih Mata Pelajaran Terlebih Dahulu</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                            Area statistik dan detail nilai akan muncul secara otomatis setelah Anda memilih mata pelajaran pada menu di atas.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* TOOLBAR */}
                        <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            {/* TABS */}
                            <div className="flex bg-slate-200/50 p-1 rounded-xl overflow-x-auto custom-scrollbar gap-1">
                                <button
                                    onClick={() => setActiveTab('sumatif')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'sumatif' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <BookOpen size={16} /> Ulangan
                                </button>
                                <button
                                    onClick={() => setActiveTab('pts')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pts' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <FileSpreadsheet size={16} /> PTS
                                </button>
                                <button
                                    onClick={() => setActiveTab('pas_pat')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pas_pat' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Calculator size={16} /> PAS / PAT
                                </button>
                                <button
                                    onClick={() => setActiveTab('rapor')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'rapor' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Trophy size={16} /> Nilai Rapor
                                </button>
                            </div>

                            {/* SEARCH & ACTIONS */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari Siswa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-blue-500 w-48"
                                    />
                                </div>

                                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                                {!readOnly && (
                                    <>
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all font-bold text-xs"
                                            title="Unduh Template Excel">
                                            <Download size={16} />
                                            <span className="hidden sm:inline">Template</span>
                                        </button>
                                        <button
                                            onClick={handleImportExcel}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all font-bold text-xs"
                                            title="Import Nilai Excel">
                                            <Upload size={16} />
                                            <span className="hidden sm:inline">Impor Nilai</span>
                                        </button>
                                    </>
                                )}

                                {/* Hidden Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    hidden
                                    accept=".xlsx, .xls, .csv"
                                />

                                {!readOnly && (
                                    <button
                                        onClick={handleSave}
                                        className={`ml-2 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200`}
                                    >
                                        <Save size={18} /> Simpan Perubahan
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TABLE AREA */}
                        <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-white">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-[#F8FAFC] text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="py-4 px-6 w-16 text-center border-b font-extrabold bg-[#F8FAFC]">No</th>
                                        <th className="py-4 px-6 w-64 border-b bg-[#F8FAFC]">Nama Siswa</th>

                                        {activeTab === 'sumatif' && (
                                            <>
                                                {Array.from({ length: tpCount }).map((_, i) => (
                                                    <th key={i} className="py-4 px-2 w-24 text-center border-b bg-[#F8FAFC]">
                                                        U {i + 1}
                                                    </th>
                                                ))}
                                                {/* Add Button - ONLY FOR EDITORS */}
                                                {!readOnly && (
                                                    <th className="py-4 px-2 w-20 text-center border-b bg-[#F8FAFC]">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => updateTpCount(Math.min(tpCount + 1, 15))}
                                                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                                                                title="Tambah Kolom Ulangan"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                            <button
                                                                onClick={removeTpCount}
                                                                className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                                                                title="Hapus Kolom Ulangan Terakhir"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                        </div>
                                                    </th>
                                                )}
                                                <th className="py-4 px-4 w-32 text-center border-b bg-blue-50 text-blue-700 border-l border-r border-blue-100">Rerata Nilai</th>
                                                <th className="border-b bg-[#F8FAFC] min-w-[20px]"></th>
                                            </>
                                        )}

                                        {activeTab === 'pts' && (
                                            <>
                                                <th className="py-4 px-4 w-40 text-center border-b bg-amber-50 text-amber-700 border-l border-amber-100">Nilai PTS</th>
                                                <th className="border-b bg-[#F8FAFC] w-full"></th>
                                            </>
                                        )}

                                        {activeTab === 'pas_pat' && (
                                            <>
                                                <th className="py-4 px-4 w-32 text-center border-b bg-purple-50 text-purple-700 border-l border-purple-100">Nilai PAS (Ganjil)</th>
                                                <th className="py-4 px-4 w-32 text-center border-b bg-rose-50 text-rose-700 border-l border-rose-100">Nilai PAT (Genap)</th>
                                                <th className="border-b bg-[#F8FAFC] w-full"></th>
                                            </>
                                        )}

                                        {activeTab === 'rapor' && (
                                            <>
                                                <th className="py-4 px-4 w-32 text-center border-b bg-slate-50 text-slate-600">Rerata Ulangan</th>
                                                <th className="py-4 px-2 w-24 text-center border-b bg-amber-50 text-amber-700 border border-amber-100">PTS</th>
                                                <th className="py-4 px-2 w-24 text-center border-b bg-purple-50 text-purple-700 border border-purple-100">PAS/PAT</th>
                                                <th className="py-4 px-4 w-32 text-center border-b bg-emerald-50 text-emerald-700 border border-emerald-100">Nilai Akhir</th>
                                                <th className="py-4 px-4 w-20 text-center border-b bg-[#F8FAFC]">Predikat</th>
                                                <th className="py-4 px-6 min-w-[300px] border-b bg-[#F8FAFC]">Deskripsi Capaian Kompetensi</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredGrades.map((grade, idx) => (
                                        <tr key={grade.studentId} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-3 px-6 text-center text-slate-400 font-medium">{idx + 1}</td>
                                            <td className="py-3 px-6 font-medium text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-200">
                                                        {grade.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="group-hover:text-blue-600 transition-colors">{grade.studentName}</div>
                                                        <div className="text-xs text-slate-400 font-normal">{grade.studentNis}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {activeTab === 'sumatif' && (
                                                <>
                                                    {/* INPUTS SUMATIF DYNAMIC */}
                                                    {Array.from({ length: tpCount }).map((_, i) => {
                                                        const tpKey = `tp${i + 1}`;
                                                        return (
                                                            <td key={tpKey} className="p-2 text-center">
                                                                {readOnly ? (
                                                                    <span className={`font-bold ${getScoreColor(Number(grade[tpKey]))}`}>
                                                                        {grade[tpKey] || '0'}
                                                                    </span>
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        min="0" max="100"
                                                                        value={grade[tpKey] || ''}
                                                                        onChange={(e) => handleInputChange(grade.studentId, tpKey as keyof GradeRow, e.target.value)}
                                                                        placeholder="0"
                                                                        className={`w-16 h-10 text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all font-bold ${getScoreColor(Number(grade[tpKey]))}`}
                                                                    />
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    {/* Spacer - ONLY FOR EDITORS */}
                                                    {!readOnly && <td></td>}

                                                    <td className="p-2 text-center bg-blue-50/30 border-l border-r border-blue-50">
                                                        <span className={`font-bold text-lg ${getScoreColor(grade.avgSumatif)}`}>
                                                            {grade.avgSumatif || '-'}
                                                        </span>
                                                    </td>
                                                    <td></td>
                                                </>
                                            )}

                                            {activeTab === 'pts' && (
                                                <>
                                                    <td className="p-2 text-center bg-amber-50/20">
                                                        {readOnly ? (
                                                            <span className="font-extrabold text-amber-700 text-lg">
                                                                {grade.pts || '0'}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                value={grade.pts || ''}
                                                                onChange={(e) => handleInputChange(grade.studentId, 'pts', e.target.value)}
                                                                className={`w-28 h-10 text-center border-2 border-amber-100 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all font-bold text-amber-700 bg-white shadow-sm`}
                                                            />
                                                        )}
                                                    </td>
                                                    <td></td>
                                                </>
                                            )}

                                            {activeTab === 'pas_pat' && (
                                                <>
                                                    <td className="p-2 text-center bg-purple-50/20">
                                                        {readOnly ? (
                                                            <span className="font-extrabold text-purple-700 text-lg">
                                                                {grade.pas || '0'}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                value={grade.pas || ''}
                                                                onChange={(e) => handleInputChange(grade.studentId, 'pas', e.target.value)}
                                                                placeholder="PAS"
                                                                className={`w-24 h-10 text-center border-2 border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition-all font-bold text-purple-700 bg-white shadow-sm`}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-center bg-rose-50/20">
                                                        {readOnly ? (
                                                            <span className="font-extrabold text-rose-700 text-lg">
                                                                {grade.pat || '0'}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="0" max="100"
                                                                value={grade.pat || ''}
                                                                onChange={(e) => handleInputChange(grade.studentId, 'pat', e.target.value)}
                                                                placeholder="PAT"
                                                                className={`w-24 h-10 text-center border-2 border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none transition-all font-bold text-rose-700 bg-white shadow-sm`}
                                                            />
                                                        )}
                                                    </td>

                                                    <td></td>
                                                </>
                                            )}

                                            {activeTab === 'rapor' && (
                                                <>
                                                    {/* READ ONLY SUMMARY */}
                                                    <td className="p-2 text-center text-slate-500 font-bold bg-slate-50/50">
                                                        {grade.avgSumatif}
                                                    </td>
                                                    <td className="p-2 text-center text-amber-600 font-bold bg-amber-50/30">
                                                        {grade.pts}
                                                    </td>
                                                    <td className="p-2 text-center text-purple-600 font-bold bg-purple-50/30">
                                                        {Math.max(grade.pas, grade.pat, grade.ujisn, grade.sas)}
                                                    </td>

                                                    {/* FINAL SCORE */}
                                                    <td className="p-2 text-center bg-emerald-50/20 border-l border-emerald-50">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className={`font-extrabold text-lg ${grade.finalScore >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {grade.finalScore}
                                                            </span>
                                                            {grade.finalScore > 0 && (
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                                    {grade.finalScore >= 75 ? 'Tuntas' : 'Remedial'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="p-2 text-center">
                                                        <span className={`inline-block w-8 h-8 leading-8 rounded-lg font-bold ${grade.predicate === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                                            grade.predicate === 'B' ? 'bg-blue-100 text-blue-700' :
                                                                grade.predicate === 'C' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {grade.predicate}
                                                        </span>
                                                    </td>

                                                    <td className="p-2">
                                                        <textarea
                                                            value={grade.description}
                                                            onChange={(e) => handleDescriptionChange(grade.studentId, e.target.value)}
                                                            placeholder="Deskripsi otomatis..."
                                                            className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none resize-none h-16 bg-white"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredGrades.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                                                Tidak ada data siswa ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* FOOTER LEGEND - ONLY FOR EDITORS */}
                {!readOnly && selectedSubject && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white border border-slate-300 rounded"></div>
                            <span>Input Aktif</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-rose-50 border border-slate-300 rounded"></div>
                            <span>Nilai {'<'} 75 (Perlu Remedial)</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span>Semua perubahan tersimpan otomatis di perangkat lokal sementara.</span>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default NilaiView;
