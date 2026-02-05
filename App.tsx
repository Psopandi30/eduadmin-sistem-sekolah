
import React, { useState, useEffect } from 'react';
import DataGuruStaff from './components/DataGuruStaff';
import KelasWali from './components/KelasWali';
import Tabungan from './components/Tabungan';
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
import DashboardWakilKurikulum from './components/DashboardWakilKurikulum';
import DashboardStaffTU from './components/DashboardStaffTU';
import DashboardOperatorData from './components/DashboardOperatorData';
import { schoolSettingsGlobal } from './data/sharedData';
import { DataProvider, useDataContext } from './components/DashboardSuperAdmin/contexts/DataContext';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './src/utils/logger';
import { Bot } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // --- SCHOOL SETTINGS (Global Metadata) ---
  const [schoolSettings, setSchoolSettings] = useState(() => {
    const saved = localStorage.getItem('school_settings_v10');
    if (saved) return JSON.parse(saved);
    return {
      name: schoolSettingsGlobal.name || 'EDUADMIN MODERN SCHOOL',
      foundation: schoolSettingsGlobal.foundation || 'YAYASAN PENDIDIKAN INDONESIA',
      address: schoolSettingsGlobal.address,
      accreditation: 'A',
      principal: schoolSettingsGlobal.principal,
      academicYear: schoolSettingsGlobal.academicYear,
      bannerImage: '',
      logo: schoolSettingsGlobal.logo || '',
      icon: schoolSettingsGlobal.icon || ''
    };
  });

  // Persist Settings & Update Favicon
  useEffect(() => {
    try {
      localStorage.setItem('school_settings_v10', JSON.stringify(schoolSettings));
      Object.assign(schoolSettingsGlobal, schoolSettings);
      if (schoolSettings.icon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = schoolSettings.icon;
      }
    } catch (error) {
      logger.error("Failed to save settings to localStorage:", error);
    }
  }, [schoolSettings]);

  // --- PERSISTENT SESSION CHECK ---
  useEffect(() => {
    const checkSession = async () => {
      // 1. Try Supabase Session first
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
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
              setIsCheckingSession(false);
              return;
            }
          }
        } catch (e) {
          logger.error("Auth Session Check Error:", e);
        }
      }

      // 2. Fallback to Mock Session (LocalStorage)
      try {
        const savedMock = localStorage.getItem('mock_session_v1');
        if (savedMock) {
          const { role, user } = JSON.parse(savedMock);
          setUserRole(role);
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      } catch (e) {
        logger.error("Mock Session Check Error:", e);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  // --- LOGIN/LOGOUT LOGIC ---
  const handleLogin = (role: string, user: any) => {
    setUserRole(role);
    setCurrentUser(user);
    setIsLoggedIn(true);
    // Persist mock session
    localStorage.setItem('mock_session_v1', JSON.stringify({ role, user }));
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        logger.error("Sign out error:", e);
      }
    }
    setIsLoggedIn(false);
    setUserRole('');
    setCurrentUser(null);
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('mock_session_v1');
  };


  // --- RENDER ROUTER ---
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke sistem...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!isLoggedIn ? (
        <Login
          onLogin={handleLogin}
          schoolName={schoolSettings.name}
          bannerImage={schoolSettings.bannerImage}
          logo={schoolSettings.logo}
        />
      ) : (
        <DataProvider>
          <AuthenticatedApp
            currentUser={currentUser}
            userRole={userRole}
            handleLogout={handleLogout}
            schoolSettings={schoolSettings}
            setSchoolSettings={setSchoolSettings}
          />
        </DataProvider>
      )}
    </ErrorBoundary>
  );
};

// --- AUTHENTICATED APP (Separated for Performance & Logic Isolation) ---
const AuthenticatedApp: React.FC<any> = ({
  currentUser, userRole, handleLogout, schoolSettings, setSchoolSettings
}) => {
  // 1. Use DataContext for centralized data management
  const {
    kelasData,
    stafList,
    mapelData,
    studentsDataByClass,
    setClasses,
    setTeachers,
    setSubjects
  } = useDataContext();

  // 2. Local State for Attendance & Grades (Sync to LocalStorage)
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, 'H' | 'S' | 'I' | 'A'>>>(() => {
    const saved = localStorage.getItem('attendance_data_v1_legacy');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('attendance_data_v1_legacy', JSON.stringify(attendanceData));
  }, [attendanceData]);

  const [gradesData, setGradesData] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [customColumnsData, setCustomColumnsData] = useState<Record<string, string[]>>({});

  // 4. Role-Based Dashboard Redirection (Pre-Sidebar Views)
  if (userRole === 'ot') return <DashboardOrangTua user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'wk') return <DashboardWaliKelas user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'gb') return <DashboardGuruBimbel user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'gm') return <DashboardGuruMapel user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'admin') return <DashboardSuperAdmin user={currentUser} onLogout={handleLogout} schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} />;
  if (userRole === 'ks') return <DashboardKepalaSekolah user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'wakil_kurikulum') return <DashboardWakilKurikulum user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'staff_tu') return <DashboardStaffTU user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;
  if (userRole === 'operator_data') return <DashboardOperatorData user={currentUser} onLogout={handleLogout} schoolName={schoolSettings.name} />;

  // 5. Default Fallback if role is not found
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <Bot size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Terbatas</h1>
      <p className="text-slate-600 max-w-md mb-8">
        Maaf, akun Anda tidak memiliki role yang valid untuk mengakses sistem ini atau role Anda belum dikonfigurasi.
      </p>
      <button
        onClick={handleLogout}
        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
      >
        Keluar & Masuk Kembali
      </button>
    </div>
  );
};

export default App;
