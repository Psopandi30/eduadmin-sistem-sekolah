
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataSiswa from './components/DataSiswa';
import TambahKelas from './components/TambahKelas';
import UploadSiswa from './components/UploadSiswa';
import UploadPerkelas from './components/UploadPerkelas';
import UploadSiswaBaru from './components/UploadSiswaBaru';
import DataGuruStaff from './components/DataGuruStaff';
import KelasWali from './components/KelasWali';
import MataPelajaran from './components/MataPelajaran';
import Jadwal from './components/Jadwal';
import Absen from './components/Absen';
import Nilai from './components/Nilai';
import Rapot from './components/Rapot';
import Keuangan from './components/Keuangan';
import Tabungan from './components/Tabungan';
import NaikKelas from './components/NaikKelas';
import BimbinganBelajar from './components/BimbinganBelajar';
import Pengumuman from './components/Pengumuman';
import Laporan from './components/Laporan';
import Pengaturan from './components/Pengaturan';
import Login from './components/Login';
import DashboardOrangTua from './components/DashboardOrangTua';
import DashboardGuruMapel from './components/DashboardGuruMapel';
import DashboardWaliKelas from './components/DashboardWaliKelas';
import DashboardGuruBimbel from './components/DashboardGuruBimbel';
import DashboardSuperAdmin from './components/DashboardSuperAdmin';
import DashboardKepalaSekolah from './components/DashboardKepalaSekolah';

import { schoolSettingsGlobal, updateAnnouncementsGlobal } from './data/sharedData';
import { useStudents } from './components/DashboardSuperAdmin/hooks/useStudents';
import { useTeachers } from './components/DashboardSuperAdmin/hooks/useTeachers';
import { useClasses } from './components/DashboardSuperAdmin/hooks/useClasses';
import { useSubjects } from './components/DashboardSuperAdmin/hooks/useSubjects';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('beranda');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- PERSISTENT SESSION CHECK ---
  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseConfigured()) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setUserRole(profile.role);
            setCurrentUser({
              id: session.user.id,
              nama: profile.full_name,
              email: profile.email,
              role: profile.role,
              avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop'
            });
            setIsLoggedIn(true);
          }
        } catch (e) {
          console.error("Session profile sync error", e);
        }
      }
    };
    checkSession();
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) handleLogout();
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // --- INTERACTION FIX ---
  useEffect(() => {
    const unlockUI = () => {
      document.oncontextmenu = null;
      document.body.style.pointerEvents = 'auto';
    };
    unlockUI();
    window.addEventListener('mousedown', unlockUI, { passive: true });
    return () => window.removeEventListener('mousedown', unlockUI);
  }, []);

  // --- SETTINGS & SHARED STATE ---
  const [schoolSettings, setSchoolSettings] = useState(() => {
    const saved = localStorage.getItem('school_settings_v10');
    if (saved) return JSON.parse(saved);
    return {
      name: schoolSettingsGlobal.name,
      address: schoolSettingsGlobal.address,
      accreditation: 'A',
      principal: schoolSettingsGlobal.principal,
      academicYear: schoolSettingsGlobal.academicYear,
      bannerImage: '',
      logo: schoolSettingsGlobal.logo || '',
      icon: schoolSettingsGlobal.icon || ''
    };
  });

  useEffect(() => {
    localStorage.setItem('school_settings_v10', JSON.stringify(schoolSettings));
    Object.assign(schoolSettingsGlobal, schoolSettings);
  }, [schoolSettings]);

  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, 'H' | 'S' | 'I' | 'A'>>>(() => {
    const saved = localStorage.getItem('attendance_data_v1_legacy');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('attendance_data_v1_legacy', JSON.stringify(attendanceData));
  }, [attendanceData]);

  const [gradesData, setGradesData] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [customColumnsData, setCustomColumnsData] = useState<Record<string, string[]>>({});

  const handleLogin = (role: string, user: any) => {
    setUserRole(role);
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole('');
    setCurrentUser(null);
    setActiveTab('beranda');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- RENDER LOGIC ---
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={handleLogin}
        schoolName={schoolSettings.name}
        bannerImage={schoolSettings.bannerImage}
        logo={schoolSettings.logo}
      />
    );
  }

  return (
    <AuthenticatedApp
      currentUser={currentUser}
      userRole={userRole}
      handleLogout={handleLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSidebarOpen={isSidebarOpen}
      toggleSidebar={toggleSidebar}
      schoolSettings={schoolSettings}
      setSchoolSettings={setSchoolSettings}
      attendanceData={attendanceData}
      setAttendanceData={setAttendanceData}
      gradesData={gradesData}
      setGradesData={setGradesData}
      customColumnsData={customColumnsData}
      setCustomColumnsData={setCustomColumnsData}
    />
  );
};

// --- AUTHENTICATED APP ---
const AuthenticatedApp: React.FC<any> = ({
  currentUser, userRole, handleLogout, activeTab, setActiveTab,
  isSidebarOpen, toggleSidebar, schoolSettings, setSchoolSettings,
  attendanceData, setAttendanceData, gradesData, setGradesData,
  customColumnsData, setCustomColumnsData
}) => {
  // HOOKS ONLY RUN HERE TO PREVENT LOGIN PAGE LAG
  const { students } = useStudents();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { subjects } = useSubjects();

  const kelasData = React.useMemo(() => classes.map((c: any) => ({
    id: c.id,
    kode: `KLS-${c.nama}`,
    nama: isNaN(parseInt(c.nama[0])) ? c.nama : `Kelas ${c.nama}`,
    tingkat: c.tingkat.toString(),
    paralel: c.paralel,
    wali: teachers.find((t: any) => t.wali === c.nama)?.nama || 'Belum Ditentukan',
    waliNip: teachers.find((t: any) => t.wali === c.nama)?.nip || '-'
  })), [classes, teachers]);

  const stafList = React.useMemo(() => teachers.map((t: any, idx: number) => ({
    no: idx + 1,
    noPegawai: t.nip,
    nama: t.nama,
    jabatan: t.jabatan,
    username: t.username,
    password: t.password
  })), [teachers]);

  const mapelData = React.useMemo(() => subjects.map((s: any, idx: number) => ({
    no: idx + 1,
    nama: s.name,
    kode: s.code,
    kelas: s.level ? s.level.replace('Kelas ', '') : '-',
    kelompok: s.group
  })), [subjects]);

  const studentsDataByClass = React.useMemo(() => {
    const data: Record<string, any[]> = {};
    students.forEach((s: any) => {
      const className = s.kelas || 'Tanpa Kelas';
      if (!data[className]) data[className] = [];
      data[className].push({ no: data[className].length + 1, nis: s.nis, nama: s.nama, gender: s.gender || 'L' });
    });
    return data;
  }, [students]);

  if (userRole === 'ot') return <DashboardOrangTua user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'wk') return <DashboardWaliKelas user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'gb') return <DashboardGuruBimbel user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'gm') return <DashboardGuruMapel user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'admin') return <DashboardSuperAdmin user={currentUser} onLogout={handleLogout} />;
  if (userRole === 'ks') return <DashboardKepalaSekolah user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} schoolSettings={schoolSettings} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header toggleSidebar={toggleSidebar} user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'beranda' && <Dashboard />}
            {activeTab === 'data-siswa' && <DataSiswa onTambahKelas={() => setActiveTab('tambah-kelas')} onUploadSiswa={() => setActiveTab('upload-siswa')} onUploadPerkelas={() => setActiveTab('upload-perkelas')} onUploadSiswaBaru={() => setActiveTab('upload-siswa-baru')} />}
            {activeTab === 'data-guru' && <DataGuruStaff mapelList={mapelData} setMapelList={() => { }} stafList={stafList} setStafList={() => { }} kelasData={kelasData} setKelasData={() => { }} />}
            {activeTab === 'kelas-wali' && <KelasWali kelasData={kelasData} studentsData={studentsDataByClass} />}
            {activeTab === 'mata-pelajaran' && <MataPelajaran kelasData={kelasData} mapelList={mapelData} stafList={stafList} />}
            {activeTab === 'tambah-kelas' && <TambahKelas onBack={() => setActiveTab('data-siswa')} kelasData={kelasData} setKelasData={() => { }} />}
            {activeTab === 'upload-siswa' && <UploadSiswa onBack={() => setActiveTab('data-siswa')} />}
            {activeTab === 'upload-perkelas' && <UploadPerkelas onBack={() => setActiveTab('data-siswa')} />}
            {activeTab === 'upload-siswa-baru' && <UploadSiswaBaru onBack={() => setActiveTab('data-siswa')} />}
            {activeTab === 'jadwal' && <Jadwal kelasData={kelasData} mapelData={mapelData} />}
            {activeTab === 'absen' && <Absen kelasData={kelasData} studentsData={studentsDataByClass} attendanceData={attendanceData} setAttendanceData={setAttendanceData} />}
            {activeTab === 'nilai' && <Nilai kelasData={kelasData} studentsData={studentsDataByClass} mapelData={mapelData} gradesData={gradesData} setGradesData={setGradesData} customColumnsData={customColumnsData} setCustomColumnsData={setCustomColumnsData} />}
            {activeTab === 'rapot' && <Rapot studentsData={studentsDataByClass} gradesData={gradesData} attendanceData={attendanceData} schoolSettings={schoolSettings} />}
            {activeTab === 'keuangan' && <Keuangan />}
            {activeTab === 'tabungan' && <Tabungan />}
            {activeTab === 'naik-kelas' && <NaikKelas />}
            {activeTab === 'bimbingan' && <BimbinganBelajar />}
            {activeTab === 'pengumuman' && <Pengumuman />}
            {activeTab === 'laporan' && <Laporan />}
            {activeTab === 'pengaturan' && <Pengaturan schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} />}
            {!['beranda', 'data-siswa', 'data-guru', 'kelas-wali', 'mata-pelajaran', 'tambah-kelas', 'upload-siswa', 'upload-perkelas', 'upload-siswa-baru', 'jadwal', 'absen', 'nilai', 'rapot', 'keuangan', 'tabungan', 'naik-kelas', 'bimbingan', 'pengumuman', 'laporan', 'pengaturan'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace(/-/g, ' ')}</h2>
                <p className="text-slate-500 mt-2">Halaman ini sedang dalam pengembangan.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
