import React, { useState, useEffect } from 'react';
import {
    Calendar,
    BookOpen,
    FileText,
    UserCheck,
    CreditCard,
    PiggyBank,
    GraduationCap,
    PenTool,
    Book,
    Tv,
    Bot,
    Gamepad2,
    Bell,
    Home,
    User,
    LogOut,
    ChevronRight,
    Search,
    Wallet
} from 'lucide-react';

import JadwalPelajaran from './JadwalPelajaran';
import JadwalUjian from './JadwalUjian';
import HasilBelajar from './HasilBelajar';
import KehadiranSiswa from './KehadiranSiswa';
import PembayaranSiswa from './PembayaranSiswa';
import TabunganSiswa from './TabunganSiswa';
import BimbinganBelajarSiswa from './BimbinganBelajarSiswa';
import LatihanSoalSiswa from './LatihanSoalSiswa';
import AlQuranSiswa from './AlQuranSiswa';
import ChannelSekolahSiswa from './ChannelSekolahSiswa';
import BelajarAISiswa from './BelajarAISiswa';
import GameEdukasiSiswa from './GameEdukasiSiswa';
import ProfilAkun from './ProfilAkun';
import NotifikasiSiswa from './NotifikasiSiswa';

interface DashboardOrangTuaProps {
    user: any;
    onLogout: () => void;
    schoolName?: string;
}

import { announcementDataGlobal, teachersDataGlobal } from '../data/sharedData';
import logger from '../src/utils/logger';

// ... (imports)

const DashboardOrangTua: React.FC<DashboardOrangTuaProps> = ({ user, onLogout, schoolName = "SD IT EduAdmin" }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeView, setActiveView] = useState<'home' | 'jadwal' | 'ujian' | 'hasil' | 'absen' | 'bayar' | 'tabungan' | 'bimbingan' | 'latihan' | 'quran' | 'channel' | 'ai' | 'profile' | 'notifikasi'>('home');
    const [waliKelasName, setWaliKelasName] = useState(user?.studentWali || '-');

    // Sync Announcements
    const [announcements, setAnnouncements] = useState(announcementDataGlobal);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Polling for announcement updates
        const dataTimer = setInterval(() => {
            setAnnouncements([...announcementDataGlobal]);
        }, 2000);

        return () => {
            clearInterval(timer);
            clearInterval(dataTimer);
        };
    }, []);

    // Lookup Wali Kelas if missing
    useEffect(() => {
        if (!user?.studentWali || user?.studentWali === '-') {
            try {
                const savedTeachers = localStorage.getItem('teachers_data_v10');
                const teachers = savedTeachers ? JSON.parse(savedTeachers) : teachersDataGlobal;
                const found = teachers.find((t: any) => t.wali === user?.studentClass);
                if (found) {
                    setWaliKelasName(found.nama);
                }
            } catch (e) {
                logger.error("Error finding wali kelas", e);
            }
        } else {
            setWaliKelasName(user.studentWali);
        }
    }, [user?.studentClass, user?.studentWali]);

    // Menu Items Data
    const menuItems = [
        { id: 'jadwal', label: 'Jadwal Pelajaran', icon: <Calendar size={28} />, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
        { id: 'ujian', label: 'Jadwal Ujian', icon: <FileText size={28} />, color: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
        { id: 'hasil', label: 'Hasil Belajar', icon: <GraduationCap size={28} />, color: 'bg-gradient-to-br from-emerald-500 to-green-700' },
        { id: 'absen', label: 'Kehadiran', icon: <UserCheck size={28} />, color: 'bg-gradient-to-br from-teal-400 to-emerald-600' },
        { id: 'bayar', label: 'Pembayaran', icon: <CreditCard size={28} />, color: 'bg-gradient-to-br from-orange-400 to-amber-600' },
        { id: 'tabungan', label: 'Tabungan', icon: <Wallet size={28} />, color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
        { id: 'bimbingan', label: 'Bimbingan Belajar', icon: <BookOpen size={28} />, color: 'bg-gradient-to-br from-violet-500 to-purple-700' },
        { id: 'latihan', label: 'Materi dan Latihan', icon: <PenTool size={28} />, color: 'bg-gradient-to-br from-rose-400 to-pink-600' },
        { id: 'quran', label: 'Al Quran', icon: <Book size={28} />, color: 'bg-gradient-to-br from-green-500 to-emerald-800' },
        { id: 'channel', label: 'Channel Sekolah', icon: <Tv size={28} />, color: 'bg-gradient-to-br from-red-500 to-rose-700' },
        { id: 'ai', label: 'Teman Belajar', icon: <Bot size={28} />, color: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
    ];

    return (
        <div className="min-h-screen bg-[#E0F2FE] font-sans flex flex-col relative">
            {/* Background Decoration - Bubbles (Consistent with Login) */}
            <div className="fixed top-[-50px] left-[-50px] w-40 h-40 rounded-full border-[6px] border-[#BFDBFE] opacity-60 pointer-events-none"></div>
            <div className="fixed top-20 right-[-20px] w-24 h-24 rounded-full bg-[#BFDBFE] opacity-40 pointer-events-none"></div>

            {/* Header Section */}
            {/* Header Section Compact */}
            <div className={`flex-none bg-gradient-to-r from-[#004AAD] to-[#003580] text-white rounded-b-[3rem] shadow-2xl relative z-20 overflow-hidden transition-all duration-500 ease-in-out transform ${activeView === 'home' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none h-0'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                <div className="px-6 pt-6 pb-4 md:px-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                                <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-white" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs font-semibold opacity-80 mb-0.5">Assalamualaikum,</p>
                                <h2 className="text-lg md:text-xl font-black leading-tight tracking-tight">
                                    {user?.nama || 'Orang Tua Siswa'}
                                </h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] md:text-xs text-blue-100 font-bold opacity-75 uppercase tracking-widest">{user?.studentName || 'Ananda Tercinta'}</p>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-2xl mt-1.5 inline-block shadow-sm">
                                <span className="text-xs md:text-sm font-black text-white">
                                    {user?.studentClass ? `Kelas ${user.studentClass}` : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Bar Compact */}
                <div className="bg-black/10 backdrop-blur-xl px-6 md:px-10 py-3 flex justify-between items-center text-xs font-bold border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-200/80 font-medium">Wali Kelas:</span>
                        <span className="text-white bg-blue-700/50 px-3 py-1 rounded-lg border border-white/10 transform hover:scale-105 transition-transform cursor-default">
                            {waliKelasName}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                            <Calendar size={14} className="text-blue-300" />
                            <span className="text-white tracking-tight">{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-1">
                            <span className="text-white font-mono tracking-tighter text-sm">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`flex-1 relative z-10 w-full max-w-7xl mx-auto scrollbar-hide transition-all duration-500 ${activeView === 'home' ? 'p-3 sm:p-4 md:p-8 overflow-y-auto pb-24 sm:pb-20' : 'p-0 overflow-y-auto pb-16'}`}>
                {activeView === 'home' ? (
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 animate-in fade-in duration-500">
                        {/* Left Column: Main Content Area */}
                        <div className="flex-1">
                            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-white shadow-xl shadow-blue-900/5 items-center">
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-[#004AAD]">
                                        <Home size={22} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">
                                        Menu Utama
                                    </h3>
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-10 md:gap-y-12 pb-4">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                const viewMap: any = {
                                                    'jadwal': 'jadwal',
                                                    'ujian': 'ujian',
                                                    'hasil': 'hasil',
                                                    'absen': 'absen',
                                                    'bayar': 'bayar',
                                                    'tabungan': 'tabungan',
                                                    'bimbingan': 'bimbingan',
                                                    'latihan': 'latihan',
                                                    'quran': 'quran',
                                                    'channel': 'channel',
                                                    'ai': 'ai'
                                                };
                                                setActiveView(viewMap[item.id]);
                                            }}
                                            className="flex flex-col items-center gap-4 group w-full"
                                        >
                                            <div className={`w-16 h-16 md:w-20 md:h-20 ${item.color} rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-blue-900/10 text-white flex items-center justify-center transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 relative overflow-hidden`}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full"></div>
                                                {React.cloneElement(item.icon as any, { size: 32, strokeWidth: 2 })}
                                            </div>
                                            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-slate-600 text-center leading-tight group-hover:text-[#004AAD] transition-colors line-clamp-2 w-full px-1">
                                                {item.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Announcements */}
                        <div className="w-full lg:w-[400px] shrink-0">
                            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl shadow-blue-900/5">
                                <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-3">
                                    <Bell size={20} className="text-[#004AAD]" strokeWidth={2.5} />
                                    Informasi Sekolah
                                </h3>
                                <div className="space-y-5">
                                    {announcements
                                        .filter(a => a.status === 'Terbit')
                                        .filter(a => a.target === 'Semua' || a.target === 'Orang Tua')
                                        .filter(a => a.targetClass === 'Semua Kelas' || a.targetClass === user.studentClass)
                                        .map((info) => (
                                            <div key={info.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white hover:shadow-blue-500/10 hover:border-blue-200 transition-all group cursor-pointer relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                                                <div className="flex gap-4 mb-3 relative z-10">
                                                    <div className="w-2 rounded-full bg-gradient-to-b from-[#004AAD] to-blue-400 h-8 mt-0.5 shadow-sm"></div>
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-slate-800 text-sm md:text-base leading-tight group-hover:text-[#004AAD] transition-colors">{info.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase tracking-tighter">
                                                                <Calendar size={10} />
                                                                {info.publishDate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed pl-6 mb-5 relative z-10 line-clamp-3">
                                                    {info.content}
                                                </p>

                                                <div className="flex items-center justify-end pl-6 relative z-10">
                                                    <button className="text-[#004AAD] text-xs font-black flex items-center gap-1 hover:gap-3 transition-all bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 group-hover:bg-[#004AAD] group-hover:text-white group-hover:border-[#004AAD]">
                                                        Selengkapnya <ChevronRight size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) :
                    activeView === 'jadwal' ? (
                        <JadwalPelajaran onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'ujian' ? (
                        <JadwalUjian onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'hasil' ? (
                        <HasilBelajar onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'absen' ? (
                        <KehadiranSiswa onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'bayar' ? (
                        <PembayaranSiswa onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'tabungan' ? (
                        <TabunganSiswa onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'bimbingan' ? (
                        <BimbinganBelajarSiswa onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'latihan' ? (
                        <LatihanSoalSiswa onBack={() => setActiveView('home')} userClass={user?.studentClass || '5A'} />
                    ) : activeView === 'quran' ? (
                        <AlQuranSiswa onBack={() => setActiveView('home')} />
                    ) : activeView === 'channel' ? (
                        <ChannelSekolahSiswa onBack={() => setActiveView('home')} />
                    ) : activeView === 'ai' ? (
                        <BelajarAISiswa onBack={() => setActiveView('home')} user={user} />
                    ) : activeView === 'profile' ? (
                        <ProfilAkun user={user} onLogout={onLogout} onBack={() => setActiveView('home')} />
                    ) : activeView === 'notifikasi' ? (
                        <NotifikasiSiswa onBack={() => setActiveView('home')} />
                    ) : null}
            </div>

            {/* Bottom Navigation Bar */}
            <div className={`flex-none bg-white/80 backdrop-blur-2xl border-t border-white px-6 py-4 pb-8 sm:pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 rounded-t-[2.5rem] transition-all duration-500 transform ${activeView === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none h-0 py-0 overflow-hidden'}`}>
                <div className="flex justify-around items-center max-w-lg mx-auto relative">
                    {/* Beranda */}
                    <button
                        onClick={() => setActiveView('home')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'home' ? 'text-[#004AAD] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'home' ? 'bg-blue-50 shadow-inner' : ''}`}>
                            <Home size={24} fill={activeView === 'home' ? "currentColor" : "none"} strokeWidth={activeView === 'home' ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] sm:text-xs tracking-tight ${activeView === 'home' ? 'font-black' : 'font-bold underline decoration-transparent'}`}>Beranda</span>
                    </button>

                    {/* Tabungan */}
                    <button
                        onClick={() => setActiveView('tabungan')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'tabungan' ? 'text-[#004AAD] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'tabungan' ? 'bg-blue-50 shadow-inner' : ''}`}>
                            <Wallet size={24} fill={activeView === 'tabungan' ? "currentColor" : "none"} strokeWidth={activeView === 'tabungan' ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] sm:text-xs tracking-tight ${activeView === 'tabungan' ? 'font-black' : 'font-bold'}`}>Tabungan</span>
                    </button>

                    {/* Notifikasi (Center Layout) */}
                    <button
                        onClick={() => setActiveView('notifikasi')}
                        className="relative -top-10 group"
                    >
                        <div className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${activeView === 'notifikasi' ? 'bg-white text-[#004AAD] ring-4 ring-[#004AAD] rotate-[360deg]' : 'bg-gradient-to-tr from-[#004AAD] to-[#0066FF] text-white hover:scale-110 hover:shadow-blue-500/50'}`}>
                            <Bell size={28} fill={activeView === 'notifikasi' ? "currentColor" : "none"} strokeWidth={2.5} />
                        </div>
                        {/* Fake notification dot */}
                        {activeView !== 'notifikasi' && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full border-4 border-white animate-bounce shadow-md"></span>
                        )}
                        <span className={`text-[10px] sm:text-xs font-black absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap tracking-tight ${activeView === 'notifikasi' ? 'text-[#004AAD]' : 'text-slate-500'}`}>Notifikasi</span>
                    </button>

                    {/* Agenda */}
                    <button
                        onClick={() => setActiveView('jadwal')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'jadwal' ? 'text-[#004AAD] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'jadwal' ? 'bg-blue-50 shadow-inner' : ''}`}>
                            <Calendar size={24} fill={activeView === 'jadwal' ? "currentColor" : "none"} strokeWidth={activeView === 'jadwal' ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] sm:text-xs tracking-tight ${activeView === 'jadwal' ? 'font-black' : 'font-bold'}`}>Agenda</span>
                    </button>

                    {/* Akun */}
                    <button
                        onClick={() => setActiveView('profile')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'profile' ? 'text-[#004AAD] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'profile' ? 'bg-blue-50 shadow-inner' : ''}`}>
                            <User size={24} fill={activeView === 'profile' ? "currentColor" : "none"} strokeWidth={activeView === 'profile' ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] sm:text-xs tracking-tight ${activeView === 'profile' ? 'font-black' : 'font-bold'}`}>Akun</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardOrangTua;
