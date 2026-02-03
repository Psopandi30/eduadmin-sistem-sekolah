import React, { useState } from 'react';
import { ChevronLeft, Clock, MapPin, User, BookOpen, ChevronRight, PlayCircle, FileText, Video, Download, Link } from 'lucide-react';
import CBTSiswa from './CBTSiswa';
import { useTutoring } from './DashboardSuperAdmin/hooks/useTutoring';

interface BimbinganBelajarSiswaProps {
    onBack: () => void;
    user?: any;
}

const BimbinganBelajarSiswa: React.FC<BimbinganBelajarSiswaProps> = ({ onBack, user }) => {
    const { tutoringClasses } = useTutoring();
    const [view, setView] = useState<'list' | 'detail' | 'session'>('list');
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [showCBT, setShowCBT] = useState(false);

    // Filter classes basically: Show classes where target class matches student class
    const studentClass = user?.studentClass || '1A';
    const classes = tutoringClasses.filter(cls =>
        cls.title.toLowerCase().includes(studentClass.toLowerCase()) ||
        cls.description.toLowerCase().includes(studentClass.toLowerCase())
    );

    const handleClassClick = (cls: any) => {
        setSelectedClass(cls);
        setView('detail');
    };

    const handleSessionClick = (session: any) => {
        setSelectedSession(session);
        setView('session');
    };

    if (showCBT) {
        return <CBTSiswa onBack={() => setShowCBT(false)} title={selectedSession?.title || 'Latihan Soal'} />;
    }

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <button
                    onClick={() => {
                        if (view === 'session') setView('detail');
                        else if (view === 'detail') setView('list');
                        else onBack();
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h2 className="font-black text-slate-800 text-base sm:text-xl tracking-tight leading-tight">
                        {view === 'list' ? 'Bimbingan Belajar' : selectedClass?.title}
                    </h2>
                    {view === 'list' && (
                        <p className="text-[8px] sm:text-xs font-bold text-blue-600/60 uppercase tracking-widest mt-0.5 shadow-sm">
                            PROGRAM KHUSUS KELAS {studentClass}
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
                {view === 'list' && (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-1.5 h-5 sm:h-6 bg-blue-600 rounded-full"></div>
                            <h3 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight uppercase">Kelas Bimbel Saya</h3>
                        </div>

                        {classes.length === 0 ? (
                            <div className="text-center py-16 sm:py-20 bg-slate-50/50 rounded-[2rem] sm:rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-slate-200">
                                    <BookOpen size={28} sm:size={32} />
                                </div>
                                <p className="text-slate-400 font-extrabold text-[10px] sm:text-sm uppercase tracking-widest italic">Belum ada kelas aktif</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {classes.map((cls) => (
                                    <div
                                        key={cls.id}
                                        onClick={() => handleClassClick(cls)}
                                        className="bg-white p-4.5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-50 shadow-xl shadow-blue-900/5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <h4 className="font-black text-slate-800 text-sm sm:text-xl pr-10 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">
                                                {cls.title}
                                            </h4>
                                            <span className="shrink-0 px-2 py-0.5 bg-blue-600/10 text-blue-600 rounded-lg text-[7px] sm:text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                                {cls.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
                                                <User size={12} sm:size={16} className="text-blue-500" />
                                                <span className="text-[9px] sm:text-xs font-black truncate uppercase">{cls.teacher}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
                                                <Clock size={12} sm:size={16} className="text-blue-500" />
                                                <span className="text-[9px] sm:text-xs font-black truncate uppercase">{cls.schedule.split(',')[0]}</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[7px] sm:text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase relative z-10">
                                            <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                <PlayCircle size={12} sm:size={16} />
                                                {cls.sessions.length} MATERI
                                            </span>
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                <ChevronRight size={16} sm:size={20} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'detail' && selectedClass && (
                    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-300">
                        {/* Class Info Box */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] text-center shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/15 transition-all"></div>
                            <div className="relative z-10">
                                <h3 className="font-black text-white text-xl sm:text-3xl tracking-tight uppercase leading-tight mb-2">{selectedClass.title}</h3>
                                <p className="text-blue-100 font-extrabold text-xs sm:text-lg uppercase tracking-widest">{selectedClass.teacher}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-indigo-50/50 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-indigo-100 text-slate-600 text-xs sm:text-sm font-extrabold leading-relaxed uppercase tracking-tight">
                            {selectedClass.description}
                        </div>

                        {/* Sessions List */}
                        <div>
                            <div className="flex items-center gap-3 mb-5 sm:mb-6 px-1">
                                <div className="w-1.5 h-5 sm:h-6 bg-indigo-600 rounded-full"></div>
                                <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight uppercase">Daftar Materi & Pertemuan</h4>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                {selectedClass.sessions.map((session: any) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSessionClick(session)}
                                        className="bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-50 shadow-xl shadow-blue-900/5 flex items-center gap-3 sm:gap-5 hover:border-blue-200 cursor-pointer group transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors border border-emerald-100 shadow-inner">
                                            <PlayCircle size={20} sm:size={28} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-slate-800 text-xs sm:text-base group-hover:text-blue-600 transition-colors truncate leading-tight uppercase tracking-tight mb-1 sm:mb-1.5">{session.title}</h5>
                                            <div className="flex items-center flex-wrap gap-2">
                                                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                    <Clock size={10} sm:size={12} strokeWidth={2.5} /> {session.date}
                                                </span>
                                                {session.meetingLink && (
                                                    <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg animate-pulse shadow-sm border border-blue-500 uppercase tracking-tighter">
                                                        <Video size={10} sm:size={12} strokeWidth={2.5} /> LIVE MEET
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                            <ChevronRight size={18} sm:size={20} strokeWidth={3} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'session' && selectedSession && (
                    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-300">
                        {/* Video Player Container */}
                        <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/20 aspect-video relative border-4 sm:border-8 border-white p-0.5">
                            <iframe
                                className="w-full h-full absolute top-0 left-0"
                                src={`https://www.youtube.com/embed/${selectedSession.youtubeId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            <div className="px-1">
                                <h3 className="font-black text-slate-800 text-lg sm:text-2xl tracking-tight leading-tight uppercase mb-2">{selectedSession.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-3 py-1 rounded-lg border border-slate-100">
                                    <Clock size={14} sm:size={16} strokeWidth={2.5} /> <span>{selectedSession.date}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {/* Meeting Link Button */}
                                {selectedSession.meetingLink && (
                                    <a
                                        href={selectedSession.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-4 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 border-b-4 border-blue-900 overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                                            <Video size={20} sm:size={28} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-sm sm:text-base uppercase tracking-tight">Join Zoom / Google Meet</h4>
                                            <p className="text-[9px] sm:text-xs text-blue-100 font-extrabold uppercase tracking-widest">GABUNG PERTEMUAN DARING</p>
                                        </div>
                                        <ChevronRight size={20} sm:size={24} className="group-hover:translate-x-1 transition-transform opacity-50" strokeWidth={3} />
                                    </a>
                                )}

                                {/* Materi Button */}
                                <a
                                    href={selectedSession.driveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-4 sm:p-5 bg-white rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-4 text-slate-700 shadow-xl shadow-blue-900/5 border-2 border-slate-50 hover:border-blue-200 transition-all active:scale-95 overflow-hidden relative"
                                >
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-inner">
                                        <FileText size={20} sm:size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-sm sm:text-base uppercase tracking-tight">Materi Pembelajaran</h4>
                                        <p className="text-[9px] sm:text-xs text-slate-400 font-extrabold uppercase tracking-widest">UNDUH MODUL (PDF)</p>
                                    </div>
                                    <ChevronRight size={20} sm:size={24} className="group-hover:translate-x-1 transition-transform text-slate-300" strokeWidth={3} />
                                </a>

                                {/* Latihan Soal Button */}
                                <button
                                    onClick={() => setShowCBT(true)}
                                    className="group p-4 sm:p-5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-4 text-white shadow-xl shadow-orange-500/20 hover:scale-[1.02] transition-all active:scale-95 border-b-4 border-orange-900 overflow-hidden relative"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                                        <PlayCircle size={20} sm:size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-sm sm:text-base uppercase tracking-tight">Latihan Soal / Kuis</h4>
                                        <p className="text-[9px] sm:text-xs text-orange-100 font-extrabold uppercase tracking-widest">UJI KEMAMPUAN KAMU</p>
                                    </div>
                                    <div className="bg-white text-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
                                        MULAI
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BimbinganBelajarSiswa;
