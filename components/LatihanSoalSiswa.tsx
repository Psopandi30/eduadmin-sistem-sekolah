import React, { useState } from 'react';
import {
    ChevronRight,
    BookOpen,
    ExternalLink,
    FileText,
    HelpCircle,
    Calendar,
    ArrowRight,
    Star,
    AlertCircle,
    Layout,
    Search,
    Filter,
    ArrowLeft,
    Inbox,
    PlayCircle,
    Sparkles,
    GraduationCap,
    Clock,
    Loader2
} from 'lucide-react';
import {
    materiDataGlobal,
    latihanDataGlobal,
    updateMateriDataGlobal,
    updateLatihanDataGlobal,
    MateriItem,
    LatihanItem,
    QuestionPG,
    QuestionEssay
} from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface LatihanSoalSiswaProps {
    onBack: () => void;
    userClass?: string;
    user?: any;
}

const LatihanSoalSiswa: React.FC<LatihanSoalSiswaProps> = ({ onBack, userClass: propClass, user }) => {
    const userClass = user?.studentClass || user?.kelas || propClass || '1A';
    const [activeTab, setActiveTab] = useState<'materi' | 'latihan'>('materi');
    const [selectedLatihan, setSelectedLatihan] = useState<LatihanItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Semua');

    const [materiList, setMateriList] = useState<MateriItem[]>(materiDataGlobal);
    const [latihanList, setLatihanList] = useState<LatihanItem[]>(latihanDataGlobal);
    const [loading, setLoading] = useState(false);

    // --- FETCH DATA FROM CLOUD ---
    React.useEffect(() => {
        const fetchCloudData = async () => {
            if (!isSupabaseConfigured()) return;
            setLoading(true);
            try {
                // Fetch Materi
                const { data: mRes } = await supabase.from('app_settings').select('value').eq('key', 'materi_data_v10').maybeSingle();
                if (mRes?.value) {
                    const parsed = typeof mRes.value === 'string' ? JSON.parse(mRes.value) : mRes.value;
                    setMateriList(parsed);
                    updateMateriDataGlobal(parsed);
                }

                // Fetch Latihan
                const { data: lRes } = await supabase.from('app_settings').select('value').eq('key', 'latihan_data_v10').maybeSingle();
                if (lRes?.value) {
                    const parsed = typeof lRes.value === 'string' ? JSON.parse(lRes.value) : lRes.value;
                    setLatihanList(parsed);
                    updateLatihanDataGlobal(parsed);
                }
            } catch (err) {
                logger.warn("Could not fetch materi/latihan from cloud");
            } finally {
                setLoading(false);
            }
        };

        fetchCloudData();
    }, []);

    // Filter data based on student class
    const rawMateri = materiList.filter(m => m.classId === userClass && m.status === 'Terbit');
    const rawLatihan = latihanList.filter(l => l.classId === userClass && l.status === 'Terbit');

    // Unique subjects for filtering
    const subjects = ['Semua', ...Array.from(new Set([...rawMateri, ...rawLatihan].map(item => item.subjectName)))];

    const filteredMateri = rawMateri.filter(m =>
        (selectedSubject === 'Semua' || m.subjectName === selectedSubject) &&
        (m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredLatihan = rawLatihan.filter(l =>
        (selectedSubject === 'Semua' || l.subjectName === selectedSubject) &&
        (l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header Area */}
            <div className="flex-none bg-gradient-to-r from-[#004AAD] to-blue-600 p-5 sm:p-8 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={selectedLatihan ? () => setSelectedLatihan(null) : onBack}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 duration-300 group"
                        >
                            <ArrowLeft size={20} sm:size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
                                    {selectedLatihan ? 'Detail Soal' : 'Materi & Latihan'}
                                </h2>
                                <Sparkles size={16} sm:size={18} className="text-yellow-300 animate-pulse shrink-0" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-black text-white border border-white/20 uppercase tracking-wider">
                                    Kelas {userClass}
                                </span>
                                <span className="w-1 h-1 bg-white/30 rounded-full shrink-0"></span>
                                <span className="text-blue-100 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Akademik Siswa</span>
                            </div>
                        </div>
                    </div>

                    {!selectedLatihan && (
                        <div className="flex items-center gap-3">
                            <div className="bg-black/10 backdrop-blur-md p-1 rounded-xl sm:rounded-2xl border border-white/10 flex w-full md:w-auto">
                                <button
                                    onClick={() => setActiveTab('materi')}
                                    className={`flex-1 md:flex-none px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'materi'
                                        ? 'bg-white text-blue-700 shadow-xl scale-105'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    <BookOpen size={14} sm:size={16} /> MATERI
                                </button>
                                <button
                                    onClick={() => setActiveTab('latihan')}
                                    className={`flex-1 md:flex-none px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'latihan'
                                        ? 'bg-white text-blue-700 shadow-xl scale-105'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    <Layout size={14} sm:size={16} /> LATIHAN
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Header: Search & Filter (Visible only on List) */}
            {!selectedLatihan && (
                <div className="flex-none bg-white border-b border-slate-100 p-4 sm:p-6 md:px-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab === 'materi' ? 'materi' : 'latihan'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all uppercase tracking-tight"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar -mx-1 px-1">
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400 shrink-0" />
                            {subjects.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-wider ${selectedSubject === sub
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Data...</p>
                    </div>
                ) : selectedLatihan ? (
                    // VIEW: LATIHAN DETAIL (ESSAY/PG VIEWER FOR PARENTS)
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-slate-50 shadow-2xl shadow-blue-900/5 mb-8 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 text-emerald-50 opacity-50 pointer-events-none group-hover:scale-110 transition-transform">
                                <HelpCircle size={80} strokeWidth={3} />
                            </div>
                            <h4 className="font-black text-slate-800 text-xl sm:text-3xl mb-6 relative z-10">{selectedLatihan.title}</h4>
                            <div className="flex flex-wrap gap-2.5 relative z-10">
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-[9px] sm:text-[11px] font-black border border-indigo-100 uppercase tracking-tighter">
                                    <Layout size={14} strokeWidth={2.5} />
                                    TIPE: {selectedLatihan.type === 'Essay' ? 'URAIAN' : 'PILIHAN GANDA'}
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[9px] sm:text-[11px] font-black border border-blue-100 uppercase tracking-tighter">
                                    <FileText size={14} strokeWidth={2.5} />
                                    {selectedLatihan.questions.length} PERTANYAAN
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[11px] font-black border border-slate-100 ml-auto uppercase tracking-tighter">
                                    <Clock size={14} strokeWidth={2.5} />
                                    POST: {selectedLatihan.publishDate}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 sm:space-y-8">
                            {selectedLatihan.questions.map((q, idx) => (
                                <div key={q.id} className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-slate-50 shadow-xl shadow-blue-900/5 relative overflow-hidden group hover:border-blue-200 transition-all duration-500">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-blue-600 transition-colors"></div>
                                    <div className="flex flex-col gap-6 sm:gap-8">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg sm:text-2xl shrink-0 shadow-xl shadow-slate-900/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 text-base sm:text-xl leading-relaxed mb-8 uppercase tracking-tight">{q.question}</p>

                                            {selectedLatihan.type === 'PG' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                    {(q as QuestionPG).options.map((opt, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-4 transition-all ${(q as QuestionPG).correctAnswer === optIdx
                                                                ? 'bg-emerald-50 border-emerald-400 shadow-xl shadow-emerald-500/10'
                                                                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${(q as QuestionPG).correctAnswer === optIdx
                                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                                : 'bg-white border-2 border-slate-200 text-slate-400'
                                                                }`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <span className={`text-xs sm:text-sm font-black uppercase tracking-tight ${(q as QuestionPG).correctAnswer === optIdx
                                                                ? 'text-emerald-800'
                                                                : 'text-slate-500'
                                                                }`}>{opt}</span>
                                                            {(q as QuestionPG).correctAnswer === optIdx && (
                                                                <Star size={16} sm:size={18} className="text-yellow-400 fill-yellow-400 ml-auto shrink-0 animate-bounce-subtle" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50/50 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-blue-100/50 relative overflow-hidden group/ans">
                                                    <div className="absolute -top-4 -right-4 text-blue-100 group-hover/ans:rotate-12 transition-transform opacity-30">
                                                        <Sparkles size={60} />
                                                    </div>
                                                    <h5 className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <BookOpen size={14} strokeWidth={2.5} /> Kunci Jawaban Referensi
                                                    </h5>
                                                    <p className="text-sm sm:text-base text-blue-900 font-extrabold leading-relaxed italic uppercase tracking-tight">
                                                        {(q as QuestionEssay).sampleAnswer || 'Guru belum menyertakan kunci jawaban untuk soal ini.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'materi' ? (
                    // VIEW: LIST MATERI
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 animate-in fade-in duration-500">
                        {filteredMateri.length === 0 ? (
                            <div className="col-span-full py-20 sm:py-32 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2rem] sm:rounded-[4rem]">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-100 relative group">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                    <Inbox size={40} sm:size={48} className="text-blue-200" />
                                </div>
                                <h3 className="text-slate-800 font-black text-lg sm:text-xl mb-2 uppercase tracking-tight">Materi Kosong</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-black max-w-sm text-center uppercase tracking-widest px-10">
                                    Guru belum mempublikasikan materi {selectedSubject !== 'Semua' ? `untuk pelajaran ${selectedSubject}` : ''}
                                </p>
                            </div>
                        ) : (
                            filteredMateri.map((item) => (
                                <div key={item.id} className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-slate-50 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden active:scale-[0.98]">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-start gap-4 sm:gap-6 mb-8">
                                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2.2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                                            <FileText size={28} sm:size={40} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                                <span className="text-[8px] sm:text-[10px] font-black px-3 py-1 bg-blue-600/10 text-blue-600 rounded-lg border border-blue-100 uppercase tracking-widest">
                                                    {item.subjectName}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-base sm:text-2xl leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-5 mt-auto">
                                        <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-black px-1 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={14} className="text-blue-500" strokeWidth={2.5} />
                                                POSTED: {item.publishDate}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                <GraduationCap size={14} strokeWidth={2.5} />
                                                GURU MAPEL
                                            </div>
                                        </div>

                                        <a
                                            href={item.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 text-[10px] sm:text-xs font-black text-white bg-[#004AAD] px-6 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] hover:bg-blue-800 hover:shadow-2xl hover:shadow-blue-900/40 active:scale-95 transition-all group/btn uppercase tracking-widest border-b-4 border-blue-900 shadow-xl shadow-blue-500/10"
                                        >
                                            LIHAT MATERI <ArrowRight size={18} sm:size={20} className="group-hover/btn:translate-x-1 transition-transform" strokeWidth={3} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // VIEW: LIST LATIHAN
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 animate-in fade-in duration-500">
                        {filteredLatihan.length === 0 ? (
                            <div className="col-span-full py-20 sm:py-32 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2rem] sm:rounded-[4rem]">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-100 relative group">
                                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                                    <Inbox size={40} sm:size={48} className="text-emerald-200" />
                                </div>
                                <h3 className="text-slate-800 font-black text-lg sm:text-xl mb-2 uppercase tracking-tight">Latihan Kosong</h3>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-black max-w-sm text-center uppercase tracking-widest px-10">
                                    Guru belum memberikan latihan soal {selectedSubject !== 'Semua' ? `untuk pelajaran ${selectedSubject}` : ''}
                                </p>
                            </div>
                        ) : (
                            filteredLatihan.map((item) => (
                                <div key={item.id} className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-2 border-slate-50 shadow-xl shadow-emerald-900/5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-400 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden active:scale-[0.98]">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-start gap-4 sm:gap-6 mb-8">
                                        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2.2rem] bg-gradient-to-br ${item.type === 'PG' ? 'from-indigo-600 to-blue-700' : 'from-orange-500 to-amber-600'} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shrink-0`}>
                                            <HelpCircle size={28} sm:size={40} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                                <span className={`text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm uppercase tracking-wider ${item.type === 'PG' ? 'bg-indigo-600' : 'bg-orange-600'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[8px] sm:text-[10px] font-black px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                    {item.questions.length} SOAL
                                                </span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-base sm:text-2xl leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-5 mt-auto">
                                        <div className="px-4 py-3 bg-slate-50/80 backdrop-blur-sm rounded-[1.2rem] sm:rounded-[1.5rem] flex flex-wrap items-center justify-between gap-2 text-[8px] sm:text-[10px] font-black text-slate-400 border border-slate-100 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <BookOpen size={14} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                                <span className="truncate">{item.subjectName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Clock size={14} className="text-orange-500 shrink-0" strokeWidth={2.5} />
                                                {item.publishDate}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedLatihan(item)}
                                            className="w-full flex items-center justify-center gap-3 text-[10px] sm:text-xs font-black text-white bg-emerald-600 px-6 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-900/40 active:scale-95 transition-all group/btn uppercase tracking-widest border-b-4 border-emerald-900 shadow-xl shadow-emerald-500/10"
                                        >
                                            KERJAKAN LATIHAN <PlayCircle size={18} sm:size={20} className="group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LatihanSoalSiswa;
