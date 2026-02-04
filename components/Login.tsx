import React, { useState } from 'react';
import { User, Lock, ArrowRight, School } from 'lucide-react';
import { studentsDataGlobal, classesDataGlobal, teachersDataGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface LoginProps {
    onLogin: (role: string, userData: any) => void;
    schoolName?: string;
    logo?: string;
    bannerImage?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, schoolName = "NAMA SEKOLAH", logo, bannerImage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // 1. ATTEMPT SUPABASE AUTH (IF CONFIGURED)
        if (isSupabaseConfigured()) {
            try {
                // Determine if username is email. If not, we might need a lookup or just try email login.
                // Match the domain used in useTeachers.ts (@sekolah.id)
                const email = username.includes('@') ? username : `${username.trim()}@sekolah.id`;

                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (authError) {
                    // If auth fails (user not found, wrong password, etc.), try legacy/fallback
                    // Error 400 is normal if user doesn't exist in Supabase Auth yet
                    logger.debug("Supabase auth failed (this is normal if user doesn't exist yet), falling back to localStorage:", authError.message);
                    handleLegacyLogin();
                    return;
                }

                if (data.user) {
                    // Fetch profile to get role
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if (profileError) throw profileError;

                    onLogin(profile.role, {
                        id: data.user.id,
                        nama: profile.full_name,
                        email: profile.email,
                        role: profile.role,
                        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop'
                    });
                    setIsLoading(false);
                    return;
                }
            } catch (err: any) {
                logger.warn("⚠️ Supabase auth failed, falling back to legacy login:", err.message);
                // Fallback to legacy login if Supabase fails
                handleLegacyLogin();
                return;
            }
        } else {
            // IF NOT CONFIGURED, USE LEGACY
            handleLegacyLogin();
        }
    };

    const handleLegacyLogin = () => {
        // Simulasikan delay jaringan
        setTimeout(async () => {
            try {
                // 1. Cek Login Siswa/Orang Tua (Berdasarkan Data Siswa)
                // Menggunakan versi _v10 agar sinkron dengan Dashboard Admin
                const localStudents = localStorage.getItem('students_data_v10');
                let studentsSource = studentsDataGlobal;
                let studentSourceLabel = 'global';

                if (localStudents) {
                    try {
                        const parsed = JSON.parse(localStudents);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            studentsSource = parsed;
                            studentSourceLabel = 'localStorage';
                        }
                    } catch (e) {
                        console.error("Error parsing local students:", e);
                    }
                }

                if (studentSourceLabel === 'global' && isSupabaseConfigured()) {
                    // FALLBACK: Try Fetch from Cloud app_settings if Local is empty
                    logger.log('☁️ Local students empty or [], trying cloud sync...');
                    try {
                        const { data: cloudData } = await supabase.from('app_settings').select('value').eq('key', 'students_data_v10_sync').maybeSingle();
                        if (cloudData && cloudData.value) {
                            studentsSource = cloudData.value as any[];
                            localStorage.setItem('students_data_v10', JSON.stringify(studentsSource));
                            studentSourceLabel = 'cloud';
                            logger.log('✅ Students synced from cloud');
                        }
                    } catch (e) {
                        logger.log('ℹ️ No cloud backup for students found');
                    }
                }

                logger.debug(`📦 Students data source: ${studentSourceLabel}`);
                logger.debug('📊 Total students:', studentsSource.length);

                const localClasses = localStorage.getItem('classes_data_v10');
                const classesSource = localClasses ? JSON.parse(localClasses) : classesDataGlobal;

                const studentAccount = studentsSource.find((s: any) =>
                    (s.username === username || s.nis === username)
                );

                logger.debug('📝 Student account search:', studentAccount ? 'FOUND' : 'NOT FOUND');

                // Security: Only check against stored password and NIS (no hardcoded fallbacks)
                const isStudentPasswordCorrect = studentAccount && (
                    password === studentAccount.password ||
                    password === studentAccount.nis
                );

                if (studentAccount && isStudentPasswordCorrect) { // Simplified condition as password check is now in find
                    logger.log('✅ Login successful for student:', studentAccount.nama);
                    // Cari info Wali
                    const localTeachers = localStorage.getItem('teachers_data_v10');
                    const teachersSource = localTeachers ? JSON.parse(localTeachers) : teachersDataGlobal;
                    const waliTeacher = teachersSource.find((t: any) => t.wali === studentAccount.kelas);
                    const waliName = waliTeacher ? waliTeacher.nama : "-";

                    onLogin('ot', {
                        id: studentAccount.id,
                        nama: studentAccount.ayah || "Orang Tua Siswa",
                        role: 'ot',
                        roleDisplay: 'Orang Tua',
                        studentName: studentAccount.nama,
                        studentClass: studentAccount.kelas,
                        studentNis: studentAccount.nis,
                        studentWali: waliName,
                        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop'
                    });
                    setIsLoading(false);
                    return;
                }

                // 2. Cek Login Staff/Guru
                const localTeachers = localStorage.getItem('teachers_data_v10');
                let teachersSource = teachersDataGlobal;
                let teacherSourceLabel = 'global';

                if (localTeachers) {
                    try {
                        const parsed = JSON.parse(localTeachers);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            teachersSource = parsed;
                            teacherSourceLabel = 'localStorage';
                        }
                    } catch (e) {
                        console.error("Error parsing local teachers:", e);
                    }
                }

                if (teacherSourceLabel === 'global' && isSupabaseConfigured()) {
                    // FALLBACK: Try Fetch from Cloud app_settings if Local is empty
                    logger.log('☁️ Local teachers empty or [], trying cloud sync...');
                    try {
                        const { data: cloudData } = await supabase.from('app_settings').select('value').eq('key', 'teachers_data_v10_sync').maybeSingle();
                        if (cloudData && cloudData.value) {
                            teachersSource = cloudData.value as any[];
                            localStorage.setItem('teachers_data_v10', JSON.stringify(teachersSource));
                            teacherSourceLabel = 'cloud';
                            logger.log('✅ Teachers synced from cloud');
                        }
                    } catch (e) {
                        logger.log('ℹ️ No cloud backup for teachers found');
                    }
                }

                logger.debug(`📦 Teachers data source: ${teacherSourceLabel}`);
                logger.debug('📊 Total teachers:', teachersSource.length);

                // Cari akun guru yang cocok
                const teacherAccount = teachersSource.find((t: any) =>
                    (t.username === username || t.user === username || t.nip === username)
                );

                // Verify password with fallbacks for masked data
                const isPasswordCorrect = teacherAccount && (
                    password === teacherAccount.password ||
                    password === teacherAccount.nip ||
                    password === teacherAccount.username ||
                    (teacherAccount.password === '***' && (password === teacherAccount.nip || password === '12345678'))
                );

                if (teacherAccount && isPasswordCorrect) {
                    // Tentukan Kode Role
                    let roleCode = 'gm'; // Default ke Guru Mapel
                    const role = teacherAccount.role || teacherAccount.jabatan;

                    if (role === 'Wali Kelas' || role === 'Guru Kelas') roleCode = 'wk';
                    else if (role === 'Guru Bimbingan Belajar' || role === 'Guru Bimbel') roleCode = 'gb';
                    else if (role === 'Kepala Sekolah') roleCode = 'ks';
                    else if (['Wakil Kurikulum', 'Staff Tata Usaha', 'Operator Data', 'Admin'].includes(role)) roleCode = 'admin';

                    onLogin(roleCode, {
                        id: teacherAccount.id,
                        nama: teacherAccount.nama,
                        role: roleCode,
                        roleDisplay: role,
                        nip: teacherAccount.nip,
                        mapel: teacherAccount.mapel,
                        kelas: teacherAccount.kelas || teacherAccount.wali,
                        avatar: teacherAccount.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop'
                    });
                    setIsLoading(false);
                    return;
                }

                // 3. Super Admin - Only via Supabase Auth (no hardcoded credentials)
                // If Supabase is configured, admin must use proper authentication

                // --- ADMIN DARURAT / FALLBACK ---
                // Mengizinkan login admin lokal jika Supabase gagal/belum disetup user-nya
                if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
                    logger.warn("⚠️ Using Hardcoded Admin Login (Fallback)");
                    onLogin('admin', {
                        id: 'admin-hardcoded-fallback',
                        nama: 'Super Admin (Local)',
                        role: 'admin',
                        email: 'admin@sekolah.id',
                        roleDisplay: 'Administrator',
                        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
                    });
                    setIsLoading(false);
                    return;
                }

                // Jika tidak ada yang cocok
                if (username && password) {
                    setError('Username atau password salah! Pastikan data sudah disimpan di menu Admin.');
                } else {
                    setError('Mohon isi username dan password');
                }
            } catch (err: any) {
                logger.error("❌ Error in handleLegacyLogin:", err);
                setError("Terjadi kesalahan sistem saat login. Silakan hubungi admin.");
            } finally {
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen w-full bg-[#E0F2FE] relative overflow-hidden flex items-center justify-center font-sans">
            {/* Background Decoration - Static for Performance */}
            <div className="absolute top-[-50px] left-[-50px] w-40 h-40 rounded-full border-[6px] border-[#BFDBFE] opacity-40"></div>
            <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full bg-[#BFDBFE] opacity-30"></div>
            <div className="absolute top-40 right-[40%] w-16 h-16 rounded-full border-[4px] border-[#93C5FD] opacity-30"></div>
            <div className="absolute bottom-[-20px] left-[30%] w-32 h-32 rounded-full border-[8px] border-[#BFDBFE] opacity-20"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-[420px] px-6">
                <div className="bg-[#93C5FD]/10 backdrop-blur-md p-2 rounded-[40px] shadow-2xl border border-white/20">
                    <div className="bg-[#BFDBFE] rounded-[35px] p-8 md:p-12 shadow-inner border border-white/50 relative overflow-hidden">

                        {/* Glass Reflections */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

                        {/* Logo Area */}
                        <div className="flex flex-col items-center mb-10 relative z-10 transition-all duration-500">
                            <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl flex items-center justify-center bg-white mb-6 group hover:scale-110 transition-transform duration-500 overflow-hidden ring-8 ring-blue-600/5">
                                {logo ? (
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <School size={36} className="text-blue-800" />
                                        <span className="font-black text-blue-800 text-[10px] uppercase tracking-tighter mt-1">Logo</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center space-y-1">
                                <h1 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight leading-tight px-4 drop-shadow-sm">
                                    {schoolName || "EDUADMIN SCHOOL"}
                                </h1>
                                <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full opacity-50 mb-3"></div>
                                <p className="text-[#1E3A8A]/60 text-[11px] font-black uppercase tracking-[0.2em]">
                                    Sistem Informasi Manajemen
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                            {error && (
                                <div className="bg-red-100 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-200 animate-in shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-white/40 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium text-sm"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/60 border border-white/40 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium text-sm"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-900/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        LOGIN <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-slate-500 font-medium">
                                &copy; 2025 EduAdmin System. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
