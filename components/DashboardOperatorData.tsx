import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, School, FileText,
    BookOpen, Megaphone, Video, Cpu, LogOut, User,
    Camera, Lock, Eye, EyeOff, Save, Settings,
    UserCheck, Calendar, TrendingUp, Database, X, Info,
    Menu, Book, Wallet, LayoutDashboard as DashboardIcon, Plus, SquarePen, UserPlus, Trash2, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Context
import { useDataContext } from './DashboardSuperAdmin/contexts/DataContext';

// Views
import DataSiswaView from './DashboardSuperAdmin/components/views/DataSiswaView';
import UploadSiswaView from './DashboardSuperAdmin/components/views/UploadSiswaView';
import UploadPerKelasView from './DashboardSuperAdmin/components/views/UploadPerKelasView';
import UploadKelasSatuView from './DashboardSuperAdmin/components/views/UploadKelasSatuView';
import TambahKelasView from './DashboardSuperAdmin/components/views/TambahKelasView';
import CetakKartuLoginView from './DashboardSuperAdmin/components/views/CetakKartuLoginView';
import GuruStaffView from './DashboardSuperAdmin/components/views/GuruStaffView';
import TeacherDataView from './DashboardSuperAdmin/components/views/TeacherDataView';
import PengumumanView from './DashboardSuperAdmin/components/views/PengumumanView';
import MultimediaView from './DashboardSuperAdmin/components/views/MultimediaView';
import AIManagementView from './DashboardSuperAdmin/components/views/AIManagementView';
import JadwalUjianView from './DashboardSuperAdmin/components/views/JadwalUjianView';
import { DAYS } from './DashboardSuperAdmin/types';

// Shared Data for fallback stats
import { studentsDataGlobal, teachersDataGlobal, classesDataGlobal, announcementDataGlobal } from '../data/sharedData';

interface DashboardOperatorDataProps {
    user: any;
    onLogout: () => void;
    schoolName?: string;
}

const DashboardOperatorData: React.FC<DashboardOperatorDataProps> = ({ user, onLogout, schoolName }) => {
    // --- CONTEXT ---
    const {
        students,
        addNewStudent,
        updateStudent, // if needed
        selectedStudent,
        setSelectedStudent,
        showAddStudentModal,
        setShowAddStudentModal,
        modalMode,
        setModalMode,
        handleViewStudent,
        handleEditStudent,
        handleDelete,
        handleDownloadTemplate,
        handleUploadClick,
        handleSaveData,

        teachers,
        setTeachers,
        addTeacher, // from context
        deleteTeacher,
        updateTeacher,
        handleDownloadTemplateTeacher,
        handleUploadClickTeacher,
        handleSaveDataTeacher,

        classes,
        setClasses,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
        handleDeleteClass,
        handleSaveClasses,

        // Subjects
        subjects,
        setSubjects,

        // Exams
        examSchedules,
        setExamSchedules,
        saveExams,

        // Tutoring
        tutoringSubjects,
        setTutoringSubjects,
        tutoringTeachers,
        setTutoringTeachers,
        tutoringMaterials,
        setTutoringMaterials,
        tutoringEnrollments,
        setTutoringEnrollments,
        handleSaveTutoringData,

        // Stats
        kelasData,
        stafList,
        studentsDataByClass
    } = useDataContext();

    // --- LOCAL STATE ---
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Tutoring Local State
    const [tutoringActiveTab, setTutoringActiveTab] = useState('dashboard');
    const [showAddTutoringSubject, setShowAddTutoringSubject] = useState(false);
    const [showAddTutoringTeacher, setShowAddTutoringTeacher] = useState(false);
    const [editingTutoringTeacherId, setEditingTutoringTeacherId] = useState<number | null>(null);
    const [newTutoringSubject, setNewTutoringSubject] = useState({ name: '', classes: ['6'], meetings: 12 });
    const [newTutoringTeacher, setNewTutoringTeacher] = useState({
        name: '', source: 'Internal', subjectId: '', subjectName: '',
        classId: '', scheduleDay: 'Senin', scheduleStart: '14:00', scheduleEnd: '15:30',
        username: '', password: '123', studentsCount: 0, status: 'Aktif'
    });
    const [showEnrollStudentModal, setShowEnrollStudentModal] = useState(false);
    const [selectedTutoringGroupId, setSelectedTutoringGroupId] = useState<number | null>(null);
    const [searchStudentQuery, setSearchStudentQuery] = useState('');
    const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<string>('');

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: '',
        onConfirm: () => { }
    });

    // Profile Settings
    const [profileData, setProfileData] = useState({
        nama: user?.nama || 'Operator Data',
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

    const isInitialLoadTutoring = React.useRef(true);
    const isSyncingFromServer = React.useRef(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [editType, setEditType] = useState<string>('');

    // Auto-sync for Tutoring Data (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (tutoringSubjects.length > 0 || tutoringTeachers.length > 0) {
                // Since this uses handleSaveTutoringData from context, 
                // we should ideally update it to accept a silent param.
                // For now, let's just trigger it.
                handleSaveTutoringData(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [tutoringSubjects, tutoringTeachers, tutoringMaterials, tutoringEnrollments]);

    // Positions State (Mirrors SuperAdmin)
    const [positions, setPositions] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('positions_data_v10');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: 1, nama: 'Kepala Sekolah', kategori: 'Struktural' },
            { id: 2, nama: 'Wakil Kurikulum', kategori: 'Struktural' },
            { id: 3, nama: 'Guru Kelas', kategori: 'Fungsional' },
            { id: 4, nama: 'Guru Mata Pelajaran', kategori: 'Fungsional' },
            { id: 5, nama: 'Staff Tata Usaha', kategori: 'Staff' },
            { id: 6, nama: 'Operator Data', kategori: 'Teknis' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('positions_data_v10', JSON.stringify(positions));
    }, [positions]);

    // Modal States that are NOT in Context
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showPositionModal, setShowPositionModal] = useState(false);


    // Form States
    const [newTeacher, setNewTeacher] = useState({ nama: '', nip: '', jabatan: 'Guru Mata Pelajaran', class: '' });


    // Load profile data
    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                nama: user.nama || prev.nama,
                avatar: user.avatar || prev.avatar,
                username: user.username || prev.username,
            }));
        }
    }, [user]);

    // Menu Items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} />, color: 'bg-blue-600' },
        { id: 'data_siswa', label: 'Data Siswa & Kelas', icon: <GraduationCap size={24} />, color: 'bg-indigo-600' },
        { id: 'data_guru', label: 'Data Guru & Staff', icon: <Users size={24} />, color: 'bg-purple-600' },
        { id: 'kelas_wali', label: 'Data Kelas & Wali kelas', icon: <School size={24} />, color: 'bg-blue-600' },
        { id: 'jadwal_ujian', label: 'Manajemen Jadwal Ujian', icon: <FileText size={24} />, color: 'bg-orange-600' },
        { id: 'bimbel', label: 'Bimbingan Belajar', icon: <Book size={24} />, color: 'bg-green-600' },
        { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone size={24} />, color: 'bg-red-600' },
        { id: 'multimedia', label: 'Manajemen Multimedia', icon: <Video size={24} />, color: 'bg-pink-600' },
        { id: 'ai', label: 'Manajemen AI', icon: <Cpu size={24} />, color: 'bg-cyan-600' },
    ];

    // Compute Stats
    const statsStudentsCount = students ? students.length : studentsDataGlobal.length;
    const statsTeachersCount = teachers ? teachers.length : teachersDataGlobal.length;
    const statsClassesCount = classes ? classes.length : classesDataGlobal.length;

    // --- HANDLERS ---

    const handleSaveProfile = () => {
        if (passwordForm.newPassword) {
            if (passwordForm.oldPassword !== profileData.password && profileData.password !== '') {
                toast.error("Kata sandi lama tidak sesuai!");
                return;
            }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                toast.error("Konfirmasi kata sandi baru tidak cocok!");
                return;
            }
            setProfileData(prev => ({ ...prev, password: passwordForm.newPassword }));
            setPasswordForm({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
                showOld: false,
                showNew: false
            });
            toast.success("Kata sandi berhasil diubah!");
        } else {
            toast.success("Profil berhasil diperbarui!");
        }
        setIsSettingsModalOpen(false);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Teacher Handlers
    const handleSaveTeacher = () => {
        const teacherData = {
            id: Date.now(),
            ...newTeacher,
            username: newTeacher.nip || `guru${Math.floor(Math.random() * 1000)}`,
            password: '123'
        };
        addTeacher(teacherData);
        setShowTeacherModal(false);
        setNewTeacher({ nama: '', nip: '', jabatan: 'Guru Mata Pelajaran', class: '' });
        toast.success("Guru berhasil ditambahkan!");
    };

    const handleEditItemLocal = (item: any, type: string) => {
        setEditItem(item);
        setEditType(type);
    };

    const confirmAddPosition = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('positionName') as HTMLInputElement).value;
        const category = (form.elements.namedItem('positionCategory') as HTMLSelectElement).value;

        if (editItem && editType === 'Jabatan') {
            setPositions(prev => prev.map(p => p.id === editItem.id ? { ...p, nama: name, kategori: category } : p));
            toast.success("Jabatan diperbarui");
        } else {
            setPositions(prev => [...prev, { id: Date.now(), nama: name, kategori: category }]);
            toast.success("Jabatan ditambahkan");
        }
        setShowPositionModal(false);
        setEditItem(null);
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`bg-[#1E3A8A] flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex rounded-r-[2rem] my-4 ml-4 shadow-2xl z-20 overflow-hidden`}>
                <div className="h-20 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm shrink-0">
                            <Database size={20} />
                        </div>
                        {!isSidebarCollapsed && <span className="text-white font-bold text-xl tracking-tight truncate">Operator</span>}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-2 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            title={isSidebarCollapsed ? item.label : ''}
                            className={`
                                flex items-center gap-3 px-4 py-2.5 transition-all duration-300 font-medium relative group cursor-pointer text-sm
                                ${activeView === item.id || activeView.startsWith(item.id.replace('data_', ''))
                                    ? 'text-blue-800 bg-slate-50 rounded-r-full mr-4'
                                    : 'text-blue-100 hover:text-white hover:bg-white/10 mx-4 rounded-xl'
                                }
                                ${isSidebarCollapsed ? 'justify-center mx-2' : ''}
                            `}
                        >
                            <span className={`${activeView === item.id || activeView.startsWith(item.id.replace('data_', '')) ? 'text-[#1E3A8A]' : ''} shrink-0`}>
                                {item.icon}
                            </span>
                            {!isSidebarCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                            {(activeView === item.id || activeView.startsWith(item.id.replace('data_', ''))) && !isSidebarCollapsed && (
                                <>
                                    <div className="absolute right-0 -top-8 w-8 h-8 bg-transparent rounded-br-full shadow-[5px_5px_0_5px_#F8FAFC]"></div>
                                    <div className="absolute right-0 -bottom-8 w-8 h-8 bg-transparent rounded-tr-full shadow-[5px_-5px_0_5px_#F8FAFC]"></div>
                                </>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-6">
                    <button onClick={onLogout} className={`flex items-center gap-3 text-red-300 hover:text-red-100 transition-colors text-sm ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                        <LogOut size={18} /> {!isSidebarCollapsed && "Logout"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 md:block hidden"
                        >
                            <Menu size={24} strokeWidth={2.5} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {menuItems.find(m => m.id === activeView)?.label || activeView.replace(/_/g, ' ').toUpperCase()}
                            </h2>
                            <p className="text-xs text-slate-500">{schoolName} • Administrator</p>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-slate-800">{profileData.nama}</p>
                            <p className="text-xs text-slate-500">Operator Data</p>
                        </div>
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 overflow-hidden border border-cyan-200">
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
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Students Stat */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <GraduationCap size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Siswa</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{statsStudentsCount}</h3>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-green-600 font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> Siswa aktif
                                    </div>
                                </div>
                                {/* Teachers Stat */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Guru & Staff</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{statsTeachersCount}</h3>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 font-bold flex items-center gap-1">
                                        <UserCheck size={12} /> Tenaga pendidik
                                    </div>
                                </div>
                                {/* Classes Stat */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <School size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Total Kelas</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{statsClassesCount}</h3>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 font-bold flex items-center gap-1">
                                        <Calendar size={12} /> Rombongan belajar
                                    </div>
                                </div>
                                {/* Announcements Stat */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                            <Megaphone size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Pengumuman</p>
                                            <h3 className="text-2xl font-bold text-slate-800">{announcementDataGlobal.filter(a => a.status === 'Terbit').length}</h3>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-500 font-bold flex items-center gap-1">
                                        <FileText size={12} /> Terbit
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: DATA SISWA --- */}
                    {activeView === 'data_siswa' && <DataSiswaView setActiveView={setActiveView} />}
                    {activeView === 'upload_siswa_view' &&
                        <UploadSiswaView
                            setActiveView={setActiveView}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                            handleDownloadTemplate={handleDownloadTemplate}
                            handleUploadClick={handleUploadClick}
                            handleSaveData={handleSaveData}
                        />
                    }
                    {activeView === 'upload_perkelas_view' && (
                        <UploadPerKelasView
                            setActiveView={setActiveView}
                            classes={classes}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                            handleSaveData={handleSaveData}
                        />
                    )}
                    {activeView === 'upload_kelas_satu_view' && (
                        <UploadKelasSatuView
                            setActiveView={setActiveView}
                            classes={classes}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                            handleSaveData={handleSaveData}
                        />
                    )}
                    {activeView === 'tambah_kelas_view' &&
                        <TambahKelasView
                            setActiveView={setActiveView}
                            classes={classes}
                            setClasses={setClasses}
                            teachers={teachers}
                            students={students}
                            setShowAddClassModal={setShowAddClassModal}
                            setConfirmModal={setConfirmModal}
                        />
                    }
                    {activeView === 'cetak_kartu_login' && <CetakKartuLoginView setActiveView={setActiveView} students={students} />}

                    {/* --- VIEW: DATA GURU --- */}
                    {activeView === 'data_guru' && <GuruStaffView setActiveView={setActiveView} />}
                    {activeView === 'tambah_guru_view' &&
                        <TeacherDataView
                            setActiveView={setActiveView}
                            teachers={teachers}
                            setTeachers={setTeachers}
                            positions={positions}
                            classes={classes}
                            handleDownloadTemplate={handleDownloadTemplateTeacher}
                            handleUploadClick={handleUploadClickTeacher}
                            handleSaveData={handleSaveDataTeacher}
                            handleAddTeacher={() => setShowTeacherModal(true)}
                            handleEditItem={handleEditItemLocal}
                            handleDeleteTeacher={deleteTeacher}
                        />
                    }
                    {activeView === 'tambah_jabatan_view' && (
                        <div className="bg-white rounded-[2.5rem] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl">Kelola Jabatan</h3>
                                <button onClick={() => { setEditItem(null); setEditType('Jabatan'); setShowPositionModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Tambah Jabatan</button>
                            </div>
                            <button onClick={() => setActiveView('data_guru')} className="mb-4 text-blue-500">Kembali</button>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3">Nama Jabatan</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map(p => (
                                        <tr key={p.id} className="border-b">
                                            <td className="p-3">{p.nama}</td>
                                            <td className="p-3">{p.kategori}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => { setEditItem(p); setEditType('Jabatan'); setShowPositionModal(true); }} className="text-blue-500 mr-2">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- VIEW: KELAS & WALI --- */}
                    {activeView === 'kelas_wali' && (
                        <TambahKelasView
                            setActiveView={setActiveView}
                            classes={classes}
                            setClasses={setClasses}
                            teachers={teachers}
                            students={students}
                            setShowAddClassModal={setShowAddClassModal}
                            setConfirmModal={setConfirmModal}
                            handleSaveClasses={handleSaveClasses}
                        />
                    )}

                    {/* --- VIEW: JADWAL UJIAN --- */}
                    {activeView === 'jadwal_ujian' && (
                        <JadwalUjianView
                            subjects={subjects}
                            classes={classes}
                            examSchedules={examSchedules}
                            saveExams={saveExams}
                            setExamSchedules={setExamSchedules}
                            setConfirmModal={setConfirmModal}
                        />
                    )}

                    {/* --- VIEW: BIMBEL --- */}
                    {activeView === 'bimbel' && (
                        <div className="animate-in fade-in space-y-6">
                            {/* Header & Tabs */}
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                                            <Book size={24} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">Bimbingan Belajar</h2>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-slate-500 text-sm font-medium">Manajemen kelas tambahan dan materi bimbel.</p>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                                    Auto-Sync Aktif
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                        {[
                                            { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon size={16} /> },
                                            { id: 'mapel', label: 'Mata Pelajaran', icon: <Book size={16} /> },
                                            { id: 'guru', label: 'Guru Bimbel', icon: <Users size={16} /> },
                                            { id: 'materi', label: 'Materi Kelas', icon: <FileText size={16} /> },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setTutoringActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tutoringActiveTab === tab.id
                                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                                                    }`}
                                            >
                                                {tab.icon}
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="space-y-6">
                                {tutoringActiveTab === 'dashboard' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Mata Pelajaran</p>
                                            <h3 className="text-3xl font-bold text-slate-800">{tutoringSubjects.length}</h3>
                                        </div>
                                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Guru Bimbel</p>
                                            <h3 className="text-3xl font-bold text-slate-800">{tutoringTeachers.length}</h3>
                                        </div>
                                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Siswa</p>
                                            <h3 className="text-3xl font-bold text-slate-800">{tutoringTeachers.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0)}</h3>
                                        </div>
                                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Materi Aktif</p>
                                            <h3 className="text-3xl font-bold text-slate-800">{tutoringMaterials.length}</h3>
                                        </div>
                                    </div>
                                )}

                                {tutoringActiveTab === 'mapel' && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h3 className="font-bold text-slate-800">Daftar Mata Pelajaran Bimbel</h3>
                                            <button onClick={() => setShowAddTutoringSubject(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                                <Plus size={18} /> Tambah Mapel
                                            </button>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="p-4 border-b">Nama Mapel</th>
                                                    <th className="p-4 border-b">Untuk Kelas</th>
                                                    <th className="p-4 border-b text-center">Jml Pertemuan</th>
                                                    <th className="p-4 border-b text-center">Status</th>
                                                    <th className="p-4 border-b text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {tutoringSubjects.map(s => (
                                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 font-bold text-slate-700">{s.name}</td>
                                                        <td className="p-4 text-slate-600">
                                                            <div className="flex gap-1 flex-wrap">
                                                                {s.classes.map(c => <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">{c}</span>)}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center font-bold text-slate-700">{s.meetings}x</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setNewTutoringSubject({
                                                                            name: s.name,
                                                                            classes: s.classes,
                                                                            meetings: s.meetings
                                                                        });
                                                                        setEditItem(s);
                                                                        setEditType('SubjectBimbel');
                                                                        setShowAddTutoringSubject(true);
                                                                    }}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                >
                                                                    <SquarePen size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        show: true,
                                                                        message: `Hapus mata pelajaran ${s.name}?`,
                                                                        onConfirm: () => {
                                                                            setTutoringSubjects(prev => prev.filter(item => item.id !== s.id));
                                                                            toast.success("Mapel berhasil dihapus");
                                                                            setConfirmModal(prev => ({ ...prev, show: false }));
                                                                        }
                                                                    })}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {tutoringActiveTab === 'guru' && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h3 className="font-bold text-slate-800">Data Guru Pengajar</h3>
                                            <button onClick={() => setShowAddTutoringTeacher(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                                <Plus size={18} /> Tambah Guru
                                            </button>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="p-4 border-b">Nama Lengkap</th>
                                                    <th className="p-4 border-b">Kelas Bimbingan</th>
                                                    <th className="p-4 border-b">Username</th>
                                                    <th className="p-4 border-b">Password</th>
                                                    <th className="p-4 border-b text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {tutoringTeachers.map(t => (
                                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 font-bold text-slate-700">{t.name}</td>
                                                        <td className="p-4 text-slate-600">
                                                            <div className="font-bold">{t.subjectName}</div>
                                                            <div className="text-xs text-slate-400">Kelas {t.classId}</div>
                                                        </td>
                                                        <td className="p-4 font-mono text-slate-600">{t.username || '-'}</td>
                                                        <td className="p-4 font-mono text-slate-600">{t.password || '123'}</td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTutoringGroupId(t.id);
                                                                        setShowEnrollStudentModal(true);
                                                                    }}
                                                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    title="Tambah Siswa"
                                                                >
                                                                    <UserPlus size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setNewTutoringTeacher({
                                                                            name: t.name,
                                                                            source: t.source || 'Internal',
                                                                            subjectId: t.subjectId,
                                                                            subjectName: t.subjectName,
                                                                            classId: t.classId,
                                                                            scheduleDay: t.scheduleDay,
                                                                            scheduleStart: t.scheduleStart,
                                                                            scheduleEnd: t.scheduleEnd,
                                                                            username: t.username,
                                                                            password: t.password,
                                                                            studentsCount: t.studentsCount,
                                                                            status: t.status
                                                                        });
                                                                        setEditItem(t);
                                                                        setEditType('TeacherBimbel');
                                                                        setShowAddTutoringTeacher(true);
                                                                    }}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                >
                                                                    <SquarePen size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        show: true,
                                                                        message: `Hapus guru ${t.name}?`,
                                                                        onConfirm: () => {
                                                                            setTutoringTeachers(prev => prev.filter(item => item.id !== t.id));
                                                                            toast.success("Guru berhasil dihapus");
                                                                            setConfirmModal(prev => ({ ...prev, show: false }));
                                                                        }
                                                                    })}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW: PENGUMUMAN --- */}
                    {activeView === 'pengumuman' && <PengumumanView />}

                    {/* --- VIEW: MULTIMEDIA --- */}
                    {activeView === 'multimedia' && <MultimediaView />}

                    {/* --- VIEW: AI MANAGEMENT --- */}
                    {activeView === 'ai' && <AIManagementView onBack={() => setActiveView('dashboard')} />}


                    {/* --- MODALS --- */}

                    {/* MODAL INPUT SISWA (Copied logic from DashboardSuperAdmin) */}
                    {
                        showAddStudentModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">
                                            {modalMode === 'add' ? 'Tambah Siswa Baru' : modalMode === 'edit' ? 'Edit Data Siswa' : 'Detail Data Siswa'}
                                        </h3>
                                        <button onClick={() => setShowAddStudentModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-2">
                                        {/* Simple Form Fields for Operator - Expanding to Full Form is recommended but keeping short for brevity */}
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Lengkap</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.nama || ''} onChange={e => setSelectedStudent({ ...selectedStudent, nama: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">NIS</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.nis || ''} onChange={e => setSelectedStudent({ ...selectedStudent, nis: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kelas</label>
                                            <select disabled={modalMode === 'view'} value={selectedStudent?.kelas || '1A'} onChange={e => setSelectedStudent({ ...selectedStudent, kelas: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Tutup</button>
                                        {modalMode !== 'view' && (
                                            <button onClick={() => {
                                                if (modalMode === 'add') {
                                                    addNewStudent({ ...selectedStudent, id: Date.now() });
                                                } else {
                                                    // Editor logic handled via context update if implemented, otherwise mock
                                                    toast.success("Perubahan disimpan");
                                                }
                                                setShowAddStudentModal(false);
                                            }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Simpan</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TEACHER */}
                    {
                        showTeacherModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Guru Baru</h3>
                                        <button onClick={() => setShowTeacherModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={(e) => { e.preventDefault(); handleSaveTeacher(); }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Lengkap</label>
                                            <input value={newTeacher.nama} onChange={(e) => setNewTeacher({ ...newTeacher, nama: e.target.value })} required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">NIP</label>
                                            <input value={newTeacher.nip} onChange={(e) => setNewTeacher({ ...newTeacher, nip: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jabatan</label>
                                            <select value={newTeacher.jabatan} onChange={(e) => setNewTeacher({ ...newTeacher, jabatan: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                                {positions.map(p => <option key={p.id} value={p.nama}>{p.nama}</option>)}
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan Guru</button>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL CLASS (Using Context Props) */}
                    {
                        showAddClassModal && (
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
                        )
                    }

                    {/* MODAL POSITION */}
                    {
                        showPositionModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">{editItem ? 'Edit' : 'Tambah'} Jabatan</h3>
                                        <button onClick={() => setShowPositionModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={confirmAddPosition} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Jabatan</label>
                                            <input name="positionName" required defaultValue={editItem?.nama || ''} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" placeholder="Contoh: Kepala Lab" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kategori</label>
                                            <select name="positionCategory" defaultValue={editItem?.kategori || 'Struktural'} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                                <option value="Struktural">Struktural</option>
                                                <option value="Fungsional">Fungsional</option>
                                                <option value="Staff">Staff</option>
                                                <option value="Teknis">Teknis</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan</button>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* CONFIRMATION MODAL */}
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi</h3>
                                <p className="text-slate-600 mb-6">{confirmModal.message}</p>
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                    <button onClick={confirmModal.onConfirm} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">Ya, Hapus</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TUTORING SUBJECT MODAL */}
                    {showAddTutoringSubject && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="font-bold text-xl text-slate-800">Tambah Mapel Bimbel</h3>
                                    <button onClick={() => setShowAddTutoringSubject(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Mata Pelajaran</label>
                                        <input
                                            value={newTutoringSubject.name}
                                            onChange={(e) => setNewTutoringSubject({ ...newTutoringSubject, name: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Contoh: Matematika Persiapan UN"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jumlah Pertemuan</label>
                                        <input
                                            type="number"
                                            value={newTutoringSubject.meetings}
                                            onChange={(e) => setNewTutoringSubject({ ...newTutoringSubject, meetings: parseInt(e.target.value) || 0 })}
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!newTutoringSubject.name) {
                                                toast.error("Nama mata pelajaran harus diisi!");
                                                return;
                                            }

                                            if (editItem && editType === 'SubjectBimbel') {
                                                setTutoringSubjects(prev => prev.map(s => s.id === editItem.id ? { ...newTutoringSubject, id: editItem.id, status: s.status } : s));
                                                toast.success("Mata pelajaran bimbel berhasil diperbarui!");
                                            } else {
                                                setTutoringSubjects([...tutoringSubjects, { ...newTutoringSubject, id: Date.now() + Math.random(), status: 'Aktif' }]);
                                                toast.success("Mata pelajaran bimbel berhasil ditambahkan!");
                                            }

                                            setShowAddTutoringSubject(false);
                                            setEditItem(null);
                                            setEditType(null);
                                            setNewTutoringSubject({ name: '', classes: ['6'], meetings: 12 });
                                        }}
                                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mt-4"
                                    >
                                        {editItem && editType === 'SubjectBimbel' ? 'Update Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TUTORING TEACHER MODAL */}
                    {showAddTutoringTeacher && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="font-bold text-xl text-slate-800">Tambah Guru Bimbel</h3>
                                    <button onClick={() => setShowAddTutoringTeacher(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Guru</label>
                                        <input
                                            value={newTutoringTeacher.name}
                                            onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, name: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Nama Lengkap"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Mata Pelajaran</label>
                                        <select
                                            value={newTutoringTeacher.subjectId}
                                            onChange={(e) => {
                                                const sub = tutoringSubjects.find(s => s.id.toString() === e.target.value);
                                                setNewTutoringTeacher({ ...newTutoringTeacher, subjectId: e.target.value, subjectName: sub ? sub.name : '' });
                                            }}
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                        >
                                            <option value="">Pilih Mapel</option>
                                            {tutoringSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kelas Bimbingan</label>
                                        <input
                                            value={newTutoringTeacher.classId}
                                            onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, classId: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Contoh: Kelas 6 Persiapan"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Hari</label>
                                            <select
                                                value={newTutoringTeacher.scheduleDay}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleDay: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer text-sm"
                                            >
                                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Mulai</label>
                                            <input
                                                type="time"
                                                value={newTutoringTeacher.scheduleStart}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleStart: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Selesai</label>
                                            <input
                                                type="time"
                                                value={newTutoringTeacher.scheduleEnd}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleEnd: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Username</label>
                                            <input
                                                value={newTutoringTeacher.username}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, username: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Username"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Password</label>
                                            <input
                                                value={newTutoringTeacher.password}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, password: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Password"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!newTutoringTeacher.name || !newTutoringTeacher.subjectId) {
                                                toast.error("Nama dan Mapel harus diisi!");
                                                return;
                                            }

                                            if (editItem && editType === 'TeacherBimbel') {
                                                setTutoringTeachers(prev => prev.map(t => t.id === editItem.id ? { ...newTutoringTeacher, id: editItem.id } : t));
                                                toast.success("Data guru bimbel berhasil diperbarui!");
                                            } else {
                                                setTutoringTeachers([...tutoringTeachers, { ...newTutoringTeacher, id: Date.now() + Math.random() }]);
                                                toast.success("Guru bimbel berhasil ditambahkan!");
                                            }

                                            setShowAddTutoringTeacher(false);
                                            setEditItem(null);
                                            setEditType(null);
                                            setNewTutoringTeacher({
                                                name: '', source: 'Internal', subjectId: '', subjectName: '',
                                                classId: '', scheduleDay: 'Senin', scheduleStart: '14:00', scheduleEnd: '15:30',
                                                username: '', password: '123', studentsCount: 0, status: 'Aktif'
                                            });
                                        }}
                                        className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all mt-4"
                                    >
                                        {editItem && editType === 'TeacherBimbel' ? 'Update Data Guru' : 'Simpan Data Guru'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ENROLL STUDENT MODAL */}
                    {showEnrollStudentModal && (
                        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800">Tambah Siswa ke Kelompok</h3>
                                        <p className="text-sm text-slate-500">
                                            Guru: {tutoringTeachers.find(t => t.id === selectedTutoringGroupId)?.name} |
                                            Mapel: {tutoringTeachers.find(t => t.id === selectedTutoringGroupId)?.subjectName}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowEnrollStudentModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                </div>

                                <div className="mb-6 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">
                                                Pilih Kelas
                                            </label>
                                            <select
                                                value={selectedClassForEnroll}
                                                onChange={(e) => setSelectedClassForEnroll(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">-- Pilih Kelas --</option>
                                                {classes.map((c: any) => (
                                                    <option key={c.id} value={c.name}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">
                                                Cari Siswa
                                            </label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Ketik nama siswa..."
                                                    value={searchStudentQuery}
                                                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                                                    disabled={!selectedClassForEnroll}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {!selectedClassForEnroll && (
                                        <p className="text-xs text-amber-600 font-medium">
                                            Silakan pilih kelas terlebih dahulu untuk menampilkan daftar siswa.
                                        </p>
                                    )}
                                </div>

                                <div className="p-1 space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {students
                                        .filter(s => !selectedClassForEnroll || s.kelas === selectedClassForEnroll)
                                        .filter(s =>
                                            s.nama.toLowerCase().includes(searchStudentQuery.toLowerCase())
                                        )
                                        .filter(s => !tutoringEnrollments.some(e => e.studentId === s.id && e.groupId === selectedTutoringGroupId))
                                        .map(s => (
                                            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 font-bold text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors">
                                                        {s.nama.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{s.nama}</h4>
                                                        <p className="text-[10px] text-slate-500 font-medium">Kelas {s.kelas} | NIS {s.nis}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (selectedTutoringGroupId) {
                                                            setTutoringEnrollments([...tutoringEnrollments, { groupId: selectedTutoringGroupId, studentId: s.id }]);
                                                            toast.success(`${s.nama} berhasil ditambahkan!`);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    Tambahkan
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <div className="mt-8 border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-slate-800 text-sm mb-4">Siswa Terdaftar di Kelompok Ini:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {tutoringEnrollments
                                            .filter(e => e.groupId === selectedTutoringGroupId)
                                            .map(e => {
                                                const s = students.find(stud => stud.id === e.studentId);
                                                return (
                                                    <div key={e.studentId} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-100">
                                                        {s?.nama || 'Unknown'}
                                                        <button
                                                            onClick={() => setTutoringEnrollments(tutoringEnrollments.filter(item => item !== e))}
                                                            className="hover:text-red-500"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        {tutoringEnrollments.filter(e => e.groupId === selectedTutoringGroupId).length === 0 && (
                                            <p className="text-xs text-slate-400 italic">Belum ada siswa yang ditambahkan.</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowEnrollStudentModal(false)}
                                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all mt-8"
                                >
                                    Selesai
                                </button>
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
                                    <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                        <Settings size={20} className="rotate-45" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Profile Section */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-md">
                                                {profileData.avatar ? (
                                                    <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={40} className="w-full h-full p-4 text-slate-400" />
                                                )}
                                            </div>
                                            <label className="absolute bottom-0 right-0 p-2 bg-cyan-600 text-white rounded-full cursor-pointer hover:bg-cyan-700 shadow-sm transition-colors">
                                                <Camera size={14} />
                                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                            </label>
                                        </div>
                                        <div className="text-center w-full">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={profileData.nama}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, nama: e.target.value }))}
                                                className="w-full text-center font-bold text-slate-800 text-lg border-b-2 border-slate-200 focus:border-cyan-500 focus:outline-none py-1 bg-transparent transition-colors"
                                            />
                                        </div>
                                    </div>
                                    {/* Security Section */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                            <Lock size={16} className="text-cyan-600" /> Ubah Kata Sandi
                                        </h4>
                                        <div className="space-y-3">
                                            {/* Password Fields */}
                                            <input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} placeholder="Kata sandi lama" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                                            <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Kata sandi baru" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                                            <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Ulangi kata sandi baru" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                    <button onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl">Batal</button>
                                    <button onClick={handleSaveProfile} className="px-6 py-2 bg-cyan-600 text-white font-bold text-sm rounded-xl hover:bg-cyan-700 shadow-md flex items-center gap-2"><Save size={16} /> Simpan Perubahan</button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
};

export default DashboardOperatorData;
