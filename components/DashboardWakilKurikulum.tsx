import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LayoutDashboard, School, BookMarked, Calendar, UserCheck,
    BarChart3, ScrollText, ArrowUpCircle, LogOut, User, Settings,
    Camera, Lock, Eye, EyeOff, Save, FileText, X, Menu
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Context
import { schoolSettingsGlobal } from '../data/sharedData';
import { useDataContext } from './DashboardSuperAdmin/contexts/DataContext';
import { useAttendance } from './DashboardSuperAdmin/hooks/useAttendance';
import { useSchedules } from './DashboardSuperAdmin/hooks/useSchedules';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';


// Admin Views
import TambahKelasView from './DashboardSuperAdmin/components/views/TambahKelasView';
import UploadPerKelasView from './DashboardSuperAdmin/components/views/UploadPerKelasView';
import MataPelajaranView from './DashboardSuperAdmin/components/views/MataPelajaranView';
import JadwalPelajaranView from './DashboardSuperAdmin/components/views/JadwalPelajaranView';
import AbsensiView from './DashboardSuperAdmin/components/views/AbsensiView';
import NilaiView from './DashboardSuperAdmin/components/views/NilaiView';
import JadwalUjianView from './DashboardSuperAdmin/components/views/JadwalUjianView';
import NaikKelasView from './DashboardSuperAdmin/components/views/NaikKelasView';
import RaporDashboardView from './DashboardSuperAdmin/components/views/RaporDashboardView';
import RaporView from './DashboardSuperAdmin/components/views/RaporView';
import RaporSettingsView from './DashboardSuperAdmin/components/views/RaporSettingsView';

// Types
import { DAYS, Period, ScheduleItem } from './DashboardSuperAdmin/types';

interface DashboardWakilKurikulumProps {
    user: any;
    onLogout: () => void;
    schoolName?: string;
}

const DashboardWakilKurikulum: React.FC<DashboardWakilKurikulumProps> = ({ user, onLogout, schoolName }) => {
    // --- CONTEXT ---
    // --- DATA CONTEXT ---
    const {
        students,
        setStudents,
        updateStudents,
        handleSaveData,
        teachers,
        classes,
        subjects,
        examSchedules = [],
        saveExams,

        setExamSchedules,
        setClasses,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
    } = useDataContext();


    // Derived Classes
    const derivedClasses = useMemo(() => {
        return classes.map((c: any) => ({
            id: c.id,
            nama: c.nama,
            tingkat: c.tingkat,
            siswa: students.filter((s: any) => s.kelas === c.nama).length,
            wali: teachers.find((t: any) => t.id.toString() === c.waliKelasId)?.nama || 'Belum Ditentukan',
        }));
    }, [classes, students, teachers]);

    // Local state for navigation and UI
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: () => { } });

    // --- MATA PELAJARAN STATE ---
    const [mapelViewMode, setMapelViewMode] = useState<'master' | 'plotting'>('plotting');
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showPlottingModal, setShowPlottingModal] = useState(false);
    const [teacherAssignments, setTeacherAssignments] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('teacher_assignments_v2');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('teacher_assignments_v2', JSON.stringify(teacherAssignments));
    }, [teacherAssignments]);

    // --- JADWAL STATE ---
    const { schedules, setSchedules, saveSchedulesToSupabase } = useSchedules();
    const [activeScheduleId, setActiveScheduleId] = useState<number>(0);
    const [selectedJadwalLevel, setSelectedJadwalLevel] = useState(1);
    const [selectedJadwalClass, setSelectedJadwalClass] = useState('1A');
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [draggedItem, setDraggedItem] = useState<{ type: string; id: number | string; name: string } | null>(null);
    const [activeSchedule, setActiveSchedule] = useState<any>(null);

    const [schedulePeriods, setSchedulePeriods] = useState<Period[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('schedule_periods_v2');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: 1, start: '07:00', end: '07:35' },
            { id: 2, start: '07:35', end: '08:10' },
            { id: 3, start: '08:10', end: '08:45' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('schedule_periods_v2', JSON.stringify(schedulePeriods));
    }, [schedulePeriods]);

    useEffect(() => {
        if (schedules.length > 0) {
            const found = schedules.find(s => s.id === activeScheduleId) || schedules[0];
            setActiveSchedule(found);
            if (!activeScheduleId) setActiveScheduleId(found.id);
        }
    }, [schedules, activeScheduleId]);

    // Jadwal Handlers
    const handleDragStart = (e: React.DragEvent, type: string, id: number | string, name: string) => {
        setDraggedItem({ type, id, name });
        e.dataTransfer.setData('application/json', JSON.stringify({ type, id, name }));
    };

    const handleScheduleDrop = (e: React.DragEvent, day: string, period: number) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const data = JSON.parse(dataStr); // Use data from event or fallback to state? State is safer for React.
        const itemToDrop = draggedItem || data;

        if (!itemToDrop || !activeSchedule) return;

        // Check conflicts
        const newItem: ScheduleItem = {
            id: `${selectedJadwalClass}-${day}-${period}-${Date.now()}`,
            classId: selectedJadwalClass,
            day,
            period,
            subjectId: itemToDrop.type === 'subject' ? itemToDrop.id : itemToDrop.name, // If custom, use name as ID
            customName: itemToDrop.type === 'custom' ? itemToDrop.name : undefined
        };

        const updatedItems = [...activeSchedule.items.filter((i: any) => !(i.classId === selectedJadwalClass && i.day === day && i.period === period)), newItem];

        const updatedSchedules = schedules.map(s =>
            s.id === activeSchedule.id ? { ...s, items: updatedItems } : s
        );

        setSchedules(updatedSchedules);
        setDraggedItem(null);
    };

    const handleDeleteScheduleItem = (itemId: string) => {
        if (!activeSchedule) return;
        const updatedItems = activeSchedule.items.filter((i: any) => i.id !== itemId);
        setSchedules(schedules.map(s => s.id === activeSchedule.id ? { ...s, items: updatedItems } : s));
    };

    const handleDailyInfoChange = (day: string, field: 'seragam' | 'catatan', value: string) => {
        if (!activeSchedule) return;
        const existingInfoIndex = activeSchedule.dailyInfos?.findIndex((i: any) => i.classId === selectedJadwalClass && i.day === day);
        let newDailyInfos = activeSchedule.dailyInfos ? [...activeSchedule.dailyInfos] : [];

        if (existingInfoIndex >= 0) {
            newDailyInfos[existingInfoIndex] = { ...newDailyInfos[existingInfoIndex], [field]: value };
        } else {
            newDailyInfos.push({ classId: selectedJadwalClass, day, [field]: value });
        }

        setSchedules(schedules.map(s => s.id === activeSchedule.id ? { ...s, dailyInfos: newDailyInfos } : s));
    };

    const getConflictingItem = (item: ScheduleItem) => {
        if (!item || typeof item.subjectId === 'string') return null; // No conflict for custom items

        // Find teacher for this subject & class
        const assignment = teacherAssignments.find(ta => ta.classNama === item.classId && ta.subjectIds.includes(item.subjectId));
        if (!assignment) return null;

        const teacherId = assignment.teacherId;

        // Check if teacher is teaching elsewhere at this time
        // return conflict item if found
        return null; // Simplified for now
    };

    // --- ABSENSI STATE ---
    const { attendanceData, setAttendanceData, saveAttendance } = useAttendance();
    const [absenClass, setAbsenClass] = useState(classes[0]?.nama || '1A');
    const [absenDate, setAbsenDate] = useState(new Date());
    const [absenMode, setAbsenMode] = useState<'today' | 'history'>('today');
    const [absenSearchQuery, setAbsenSearchQuery] = useState('');
    const [absenSemester, setAbsenSemester] = useState('Ganjil');

    // --- PROFILE STATE ---
    const [profileData, setProfileData] = useState({
        nama: user?.nama || 'Wakil Kurikulum',
        avatar: user?.avatar || '',
        username: user?.username || '',
        password: user?.password || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        showOld: false,
        showNew: false
    });

    // Menus
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
        { id: 'kelas-wali', label: 'Kelas dan Wali Kelas', icon: <School size={24} /> },
        { id: 'data-siswa', label: 'Data Siswa', icon: <User size={24} /> },
        { id: 'mata-pelajaran', label: 'Mata Pelajaran', icon: <BookMarked size={24} /> },
        { id: 'jadwal', label: 'Jadwal', icon: <Calendar size={24} /> },
        { id: 'absen', label: 'Lihat Hasil Absen', icon: <UserCheck size={24} /> },
        { id: 'jadwal-ujian', label: 'Jadwal Ujian', icon: <FileText size={24} /> },
        { id: 'nilai', label: 'Monitoring Nilai', icon: <BarChart3 size={24} /> },
        { id: 'rapot', label: 'Rapot', icon: <ScrollText size={24} /> },
        { id: 'naik_kelas', label: 'Naik Kelas', icon: <ArrowUpCircle size={24} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`bg-[#1E1B4B] flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-24' : 'w-64'} hidden md:flex rounded-r-[2rem] my-4 ml-4 shadow-2xl z-20`}>
                <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-6`}>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">WK</div>
                            <span className="text-white font-bold text-xl tracking-tight">Wakil Kurikulum</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all ${isSidebarCollapsed ? '' : 'ml-2'}`}
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-2 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`
                                flex items-center gap-3 px-4 py-2.5 transition-all duration-300 font-medium relative group cursor-pointer text-sm
                                ${activeView === item.id
                                    ? 'text-blue-800 bg-slate-50 rounded-l-full ml-4'
                                    : 'text-blue-100 hover:text-white hover:bg-white/10 mx-4 rounded-xl'
                                }
                                ${isSidebarCollapsed ? 'justify-center mx-2 px-0' : ''}
                            `}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <span className={activeView === item.id ? 'text-[#1E1B4B]' : ''}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className="truncate text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                            {activeView === item.id && !isSidebarCollapsed && (
                                <>
                                    <div className="absolute right-0 -top-8 w-8 h-8 bg-transparent rounded-br-full shadow-[5px_5px_0_5px_#F8FAFC]"></div>
                                    <div className="absolute right-0 -bottom-8 w-8 h-8 bg-transparent rounded-tr-full shadow-[5px_-5px_0_5px_#F8FAFC]"></div>
                                </>
                            )}
                        </div>
                    ))}
                </nav>

                <div className={`p-6 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-300 hover:text-red-100 transition-colors text-sm">
                        <LogOut size={18} /> {!isSidebarCollapsed && "Logout"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {menuItems.find(m => m.id === activeView)?.label}
                        </h2>
                        <p className="text-xs text-slate-500">{schoolName} • Wakil Kurikulum</p>
                    </div>

                    {/* Profile Section */}
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-slate-800">{profileData.nama}</p>
                            <p className="text-xs text-slate-500">Wakil Kurikulum</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 overflow-hidden border border-indigo-200">
                            {profileData.avatar ? (
                                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
                    {activeView === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>
                                <h1 className="text-3xl font-bold mb-2 relative z-10">Selamat Datang, {profileData.nama}!</h1>
                                <p className="text-blue-100 relative z-10 max-w-2xl">
                                    Panel kontrol Wakil Kurikulum untuk mengelola kegiatan akademik, jadwal, dan penilaian siswa.
                                </p>
                            </div>

                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <School size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Kelas</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{classes.length}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <BookMarked size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Mata Pelajaran</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{subjects.length}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Siswa</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{students.length}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Guru</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{teachers.length}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KELAS DAN WALI KELAS - ADMIN VIEW */}
                    {activeView === 'kelas-wali' && (
                        <div className="h-full">
                            <TambahKelasView
                                setActiveView={setActiveView}
                                classes={classes}
                                setClasses={setClasses}
                                teachers={teachers}
                                students={students}
                                setShowAddClassModal={setShowAddClassModal}
                                setConfirmModal={setConfirmModal}
                            />
                        </div>
                    )}

                    {/* DATA SISWA - MONITORING VIEW */}
                    {activeView === 'data-siswa' && (
                        <div className="h-full">
                            <UploadPerKelasView
                                setActiveView={setActiveView}
                                students={students}
                                classes={classes}
                                handleDownloadTemplate={() => toast.error("Akses Dibatasi")}
                                handleUploadClick={() => toast.error("Akses Dibatasi")}
                                handleSaveData={() => toast.error("Akses Dibatasi")}
                                handleAddStudent={() => toast.error("Akses Dibatasi")}
                                handleViewStudent={() => { }}
                                handleEditStudent={() => { }}
                                handleDelete={() => { }}
                            />
                        </div>
                    )}

                    {/* MATA PELAJARAN - ADMIN VIEW */}
                    {activeView === 'mata-pelajaran' && (
                        <div className="h-full">
                            <MataPelajaranView
                                mapelViewMode={mapelViewMode}
                                setMapelViewMode={setMapelViewMode}
                                teacherAssignments={teacherAssignments}
                                setTeacherAssignments={setTeacherAssignments}
                                teachers={teachers}
                                subjects={subjects}
                                handleAddGroup={() => toast.success("Fitur Tambah Kelompok (Demo)")}
                                setShowSubjectModal={setShowSubjectModal}
                                setShowPlottingModal={setShowPlottingModal}
                                handleEditItem={(item) => toast.success(`Edit ${item.name}`)}
                                setActiveView={setActiveView}
                            />
                        </div>
                    )}

                    {/* JADWAL - ADMIN VIEW */}
                    {activeView === 'jadwal' && (
                        <div className="h-full">
                            <JadwalPelajaranView
                                activeView={activeView}
                                selectedJadwalLevel={selectedJadwalLevel}
                                setSelectedJadwalLevel={setSelectedJadwalLevel}
                                selectedJadwalClass={selectedJadwalClass}
                                setSelectedJadwalClass={setSelectedJadwalClass}
                                activeScheduleId={activeScheduleId}
                                setActiveScheduleId={setActiveScheduleId}
                                schedules={schedules}
                                classes={classes}
                                subjects={subjects}
                                teacherAssignments={teacherAssignments}
                                teachers={teachers}
                                schedulePeriods={schedulePeriods}
                                setSchedulePeriods={setSchedulePeriods}
                                setShowSemesterModal={setShowSemesterModal}
                                setShowTimeModal={setShowTimeModal}
                                handleDeleteSemester={() => toast.success("Hapus Semester (Demo)")}
                                handleResetClassSchedule={() => toast.success("Reset Jadwal (Demo)")}
                                handlePublishSchedule={() => toast.success("Jadwal Dipublikasikan!")}
                                handleDragStart={handleDragStart}
                                handleScheduleDrop={handleScheduleDrop}
                                handleDeleteScheduleItem={handleDeleteScheduleItem}
                                handleDailyInfoChange={handleDailyInfoChange}
                                getConflictingItem={getConflictingItem}
                                handleSaveSchedules={() => saveSchedulesToSupabase(schedules)}
                            />
                        </div>
                    )}

                    {/* ABSEN - ADMIN VIEW */}
                    {activeView === 'absen' && (
                        <div className="h-full">
                            <AbsensiView
                                activeView={activeView}
                                absenClass={absenClass}
                                setAbsenClass={setAbsenClass}
                                absenSemester={absenSemester}
                                setAbsenSemester={setAbsenSemester}
                                absenDate={absenDate}
                                setAbsenDate={setAbsenDate}
                                absenMode={absenMode}
                                setAbsenMode={setAbsenMode}
                                absenSearchQuery={absenSearchQuery}
                                setAbsenSearchQuery={setAbsenSearchQuery}
                                attendanceData={attendanceData}
                                setAttendanceData={setAttendanceData}
                                saveAttendance={saveAttendance}
                                students={students}
                                classes={classes}
                                subjects={subjects}
                            />
                        </div>
                    )}

                    {/* JADWAL UJIAN - ADMIN ACCESS */}
                    {activeView === 'jadwal-ujian' && (
                        <div className="h-full">
                            <JadwalUjianView
                                subjects={subjects}
                                classes={classes}
                                examSchedules={examSchedules}
                                setExamSchedules={setExamSchedules}
                                saveExams={saveExams}
                                setConfirmModal={setConfirmModal}
                            />
                        </div>
                    )}


                    {/* MANAJEMEN NILAI - ADMIN VIEW */}
                    {activeView === 'nilai' && (
                        <div className="h-full overflow-hidden">
                            <NilaiView
                                setActiveView={setActiveView}
                                students={students}
                                classes={classes}
                                subjects={subjects}
                                readOnly={true}
                            />
                        </div>
                    )}

                    {/* RAPOT - ADMIN DASHBOARD VIEW */}
                    {activeView === 'rapot' && (
                        <div className="h-full">
                            <RaporDashboardView
                                students={students}
                                classes={classes}
                                derivedClasses={derivedClasses}
                                setActiveView={setActiveView}
                                setSelectedClass={(cls) => {
                                    // Handle selected class for print view if needed
                                    // In SuperAdmin, this sets a state for RaporView
                                }}
                                toast={toast}
                            />
                        </div>
                    )}

                    {/* RAPOT PRINT VIEW */}
                    {activeView === 'rapot_print' && (
                        <div className="h-full overflow-y-auto">
                            <RaporView
                                setActiveView={setActiveView}
                            />
                        </div>
                    )}

                    {/* RAPOT SETTINGS */}
                    {activeView === 'rapot_settings' && (
                        <div className="h-full">
                            <RaporSettingsView setActiveView={setActiveView} />
                        </div>
                    )}

                    {/* NAIK KELAS - ADMIN ACCESS */}
                    {activeView === 'naik_kelas' && (
                        <div className="h-full">
                            <NaikKelasView
                                students={students}
                                classes={classes}
                                updateStudents={updateStudents}
                                handleSaveData={handleSaveData}
                                setConfirmModal={setConfirmModal}
                            />
                        </div>
                    )}


                    {/* MODAL CLASS */}
                    {showAddClassModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="font-bold text-lg text-slate-800">Tambah Kelas Baru</h3>
                                    <button onClick={() => setShowAddClassModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const tingkat = (form.elements.namedItem('tingkat') as HTMLSelectElement).value;
                                    const paralel = (form.elements.namedItem('paralel') as HTMLInputElement).value;
                                    if (tingkat && paralel) {
                                        handleAddClass(tingkat, paralel);
                                        toast.success(`Kelas ${tingkat}${paralel} berhasil dibuat!`);
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tingkat</label>
                                        <select name="tingkat" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                            {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Paralel</label>
                                        <input name="paralel" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" placeholder="A" />
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Buat Kelas</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* CONFIRMATION MODAL */}
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi</h3>
                                <p className="text-slate-600 mb-6">{confirmModal.message}</p>
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                    <button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">Ya, Lanjutkan</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS MODAL */}
                    {isSettingsModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Pengaturan Profil</h3>
                                        <p className="text-xs text-slate-500">Kelola identitas dan keamanan akun anda</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                                    >
                                        <Settings size={20} className="rotate-45" />
                                    </button>
                                </div>
                                {/* ... Same profile settings content ... */}
                                <div className="p-6">
                                    <p className="text-center text-slate-500">Fitur pengaturan profil sama seperti role lainnya.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div >
            {/* TOASTER */}
            < Toaster position="top-right" />
        </div >
    );
};

export default DashboardWakilKurikulum;

