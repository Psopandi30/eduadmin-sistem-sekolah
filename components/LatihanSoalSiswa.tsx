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
    Clock
} from 'lucide-react';
import {
    materiDataGlobal,
    latihanDataGlobal,
    MateriItem,
    LatihanItem,
    QuestionPG,
    QuestionEssay
} from '../data/sharedData';

interface LatihanSoalSiswaProps {
    onBack: () => void;
    userClass?: string;
}

const LatihanSoalSiswa: React.FC<LatihanSoalSiswaProps> = ({ onBack, userClass = "5A" }) => {
    const [activeTab, setActiveTab] = useState<'materi' | 'latihan'>('materi');
    const [selectedLatihan, setSelectedLatihan] = useState<LatihanItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Semua');

    // Filter data based on student class
    const rawMateri = materiDataGlobal.filter(m => m.classId === userClass && m.status === 'Terbit');
    const rawLatihan = latihanDataGlobal.filter(l => l.classId === userClass && l.status === 'Terbit');

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
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header Area */}
            <div className="flex-none bg-gradient-to-r from-[#004AAD] to-blue-600 p-6 md:p-8 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={selectedLatihan ? () => setSelectedLatihan(null) : onBack}
                            className="w-11 h-11 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:rotate-12 active:scale-95 duration-300 group"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    {selectedLatihan ? 'Detail Soal' : 'Materi & Latihan'}
                                </h2>
                                <Sparkles size={18} className="text-yellow-300 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-black text-white border border-white/20 uppercase">
                                    Kelas {userClass}
                                </span>
                                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                <span className="text-blue-100 text-[10px] font-bold">Menu Akademik Siswa</span>
                            </div>
                        </div>
                    </div>

                    {!selectedLatihan && (
                        <div className="flex items-center gap-3">
                            <div className="bg-black/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 flex">
                                <button
                                    onClick={() => setActiveTab('materi')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === 'materi'
                                        ? 'bg-white text-blue-700 shadow-xl scale-105'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    <BookOpen size={16} /> Materi
                                </button>
                                <button
                                    onClick={() => setActiveTab('latihan')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === 'latihan'
                                        ? 'bg-white text-blue-700 shadow-xl scale-105'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    <Layout size={16} /> Latihan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Header: Search & Filter (Visible only on List) */}
            {!selectedLatihan && (
                <div className="flex-none bg-white border-b border-slate-100 p-4 md:px-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab === 'materi' ? 'materi' : 'latihan'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
                        <div className="flex items-center gap-2 px-1">
                            <Filter size={14} className="text-slate-400 shrink-0" />
                            {subjects.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${selectedSubject === sub
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                {selectedLatihan ? (
                    // VIEW: LATIHAN DETAIL (ESSAY/PG VIEWER FOR PARENTS)
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-emerald-100 pointer-events-none">
                                <HelpCircle size={80} strokeWidth={1} />
                            </div>
                            <h4 className="font-black text-slate-800 text-2xl mb-4 relative z-10">{selectedLatihan.title}</h4>
                            <div className="flex flex-wrap gap-2 relative z-10">
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-100">
                                    <Layout size={14} />
                                    TIPE: {selectedLatihan.type === 'Essay' ? 'URAIAN/ESAI' : 'PILIHAN GANDA'}
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-black border border-blue-100">
                                    <FileText size={14} />
                                    {selectedLatihan.questions.length} PERTANYAAN
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-black border border-slate-200 ml-auto">
                                    <Clock size={14} />
                                    PUBLIKASI: {selectedLatihan.publishDate}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {selectedLatihan.questions.map((q, idx) => (
                                <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group hover:border-blue-200 transition-all duration-300">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-slate-300 rotate-3 group-hover:rotate-0 transition-transform">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-extrabold text-slate-700 text-lg leading-relaxed mb-6">{q.question}</p>

                                            {selectedLatihan.type === 'PG' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(q as QuestionPG).options.map((opt, optIdx) => (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-4 rounded-[1.5rem] border-2 flex items-center gap-4 transition-all ${(q as QuestionPG).correctAnswer === optIdx
                                                                    ? 'bg-emerald-50 border-emerald-400 shadow-md shadow-emerald-50'
                                                                    : 'bg-slate-50 border-slate-100 border-dashed hover:border-slate-200'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${(q as QuestionPG).correctAnswer === optIdx
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                                                }`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <span className={`text-sm font-bold ${(q as QuestionPG).correctAnswer === optIdx
                                                                    ? 'text-emerald-800'
                                                                    : 'text-slate-500'
                                                                }`}>{opt}</span>
                                                            {(q as QuestionPG).correctAnswer === optIdx && (
                                                                <Star size={16} className="text-yellow-400 fill-yellow-400 ml-auto" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 relative overflow-hidden">
                                                    <div className="absolute -top-4 -right-4 text-blue-100/50">
                                                        <Sparkles size={60} />
                                                    </div>
                                                    <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                        <BookOpen size={12} /> Kunci Jawaban Referensi
                                                    </h5>
                                                    <p className="text-sm text-blue-900 font-bold leading-relaxed italic">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-150">
                        {filteredMateri.length === 0 ? (
                            <div className="col-span-full h-80 flex flex-col items-center justify-center text-slate-300 bg-white/50 border border-dashed border-slate-200 rounded-[3rem] p-12">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative group">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                                    <Inbox size={48} className="text-blue-200 relative z-10" />
                                </div>
                                <h3 className="text-slate-800 font-black text-xl mb-2">Materi Masih Kosong</h3>
                                <p className="text-sm text-slate-500 font-bold max-w-sm text-center leading-relaxed">
                                    Guru belum mempublikasikan materi {selectedSubject !== 'Semua' ? `untuk mata pelajaran ${selectedSubject}` : ''} untuk kelas {userClass}. Silakan cek secara berkala.
                                </p>
                            </div>
                        ) : (
                            filteredMateri.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 hover:border-blue-400 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden">
                                    {/* Subject badge floating */}
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full -rotate-12 group-hover:rotate-0 transition-transform"></div>

                                    <div className="relative z-10 flex items-start gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-all duration-500 rotate-2 group-hover:rotate-0">
                                            <FileText size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                                                    {item.subjectName}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-4 mt-auto">
                                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest px-1">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={14} className="text-blue-500" />
                                                TANGGAL: {item.publishDate}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <GraduationCap size={14} />
                                                SUMBER: GURU
                                            </div>
                                        </div>

                                        <a
                                            href={item.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 text-xs font-black text-white bg-[#004AAD] px-6 py-4 rounded-[1.2rem] hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-900/20 active:scale-95 transition-all group/btn"
                                        >
                                            DOWNLOAD MATERI <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // VIEW: LIST LATIHAN
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-150">
                        {filteredLatihan.length === 0 ? (
                            <div className="col-span-full h-80 flex flex-col items-center justify-center text-slate-300 bg-white/50 border border-dashed border-slate-200 rounded-[3rem] p-12">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative group">
                                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                                    <Inbox size={48} className="text-emerald-200 relative z-10" />
                                </div>
                                <h3 className="text-slate-800 font-black text-xl mb-2">Latihan Masih Kosong</h3>
                                <p className="text-sm text-slate-500 font-bold max-w-sm text-center leading-relaxed">
                                    Guru belum mengunggah soal latihan {selectedSubject !== 'Semua' ? `untuk mata pelajaran ${selectedSubject}` : ''} untuk kelas {userClass}. Silakan cek secara berkala.
                                </p>
                            </div>
                        ) : (
                            filteredLatihan.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-200/40 hover:border-emerald-400 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full rotate-12 group-hover:rotate-0 transition-transform"></div>

                                    <div className="relative z-10 flex items-start gap-4 mb-6">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.type === 'PG' ? 'from-indigo-500 to-blue-600' : 'from-amber-500 to-orange-600'} flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-all duration-500 -rotate-2 group-hover:rotate-0`}>
                                            <HelpCircle size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm ${item.type === 'PG' ? 'bg-indigo-600' : 'bg-orange-600'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                                                    {item.questions.length} SOAL
                                                </span>
                                            </div>
                                            <h4 className="font-black text-slate-800 text-lg leading-[1.15] group-hover:text-emerald-600 transition-colors">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-4 mt-auto">
                                        <div className="px-4 py-3 bg-slate-50 rounded-xl flex items-center justify-between text-[10px] font-black text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen size={14} className="text-emerald-500" />
                                                MAPEL: {item.subjectName}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-orange-500" />
                                                POST: {item.publishDate}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedLatihan(item)}
                                            className="w-full flex items-center justify-center gap-3 text-xs font-black text-white bg-emerald-600 px-6 py-4 rounded-[1.2rem] hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-900/20 active:scale-95 transition-all group/btn"
                                        >
                                            LIHAT DETAIL SOAL <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
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
