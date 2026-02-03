import React, { useState, useEffect } from 'react';
import { User, Camera, LogOut, Save, MapPin, Calendar, Edit2, UserCheck, ArrowLeft } from 'lucide-react';
import { studentsDataGlobal } from '../data/sharedData';

interface ProfilAkunProps {
    user: any;
    onLogout: () => void;
    onBack: () => void;
}

const ProfilAkun: React.FC<ProfilAkunProps> = ({ user, onLogout, onBack }) => {
    // Helper: Find actual student data
    const getStudentData = () => {
        let foundStudent = null;
        // 1. Try Local Storage (most up-to-date)
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('students_data_v10');
            if (saved) {
                try {
                    const students = JSON.parse(saved);
                    foundStudent = students.find((s: any) => s.nama === user?.studentName || s.nis === user?.studentNis);
                } catch (e) { console.error("Error parsing students data", e); }
            }
        }
        // 2. Fallback to Global Data
        if (!foundStudent) {
            foundStudent = studentsDataGlobal.find(s => s.nama === user?.studentName);
        }
        return foundStudent;
    };

    const studentData = getStudentData();

    // Mock State for Profile Data
    // Fix: Sync with actual User Data
    const [namaAyah, setNamaAyah] = useState(user?.nama || user?.namaAyah || 'Budi Santoso');
    // Fix: Sync Mother's Name from Student Data
    const [namaIbu, setNamaIbu] = useState(studentData?.ibu || user?.namaIbu || 'Siti Aminah');
    const [namaAnak, setNamaAnak] = useState(user?.studentName || 'Ananda Tercinta');

    // Fix: Sync Birth Details from Student Data
    const [tempatLahir, setTempatLahir] = useState(() => {
        if (studentData?.ttl) return studentData.ttl.split(',')[0].trim();
        return 'Samarinda';
    });
    const [tanggalLahir, setTanggalLahir] = useState(() => {
        if (studentData?.ttl) {
            const parts = studentData.ttl.split(',');
            if (parts.length > 1) {
                const datePart = parts[1].trim();
                // Match DD-MM-YYYY or DD/MM/YYYY
                const dmy = datePart.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
                // Match YYYY-MM-DD
                const ymd = datePart.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);

                if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
                if (ymd) return datePart;
            }
        }
        return '2015-05-20';
    });

    // Photo State
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);

    // Force refresh trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Real-time Sync: Update state when studentData or user changes
    useEffect(() => {
        console.log('🔄 ProfilAkun useEffect triggered');
        console.log('User:', user);
        console.log('Student Name:', user?.studentName);

        const currentStudent = getStudentData();
        console.log('Current Student Data:', currentStudent);

        // Sync Mother's Name
        if (currentStudent?.ibu) {
            console.log('✅ Syncing Nama Ibu:', currentStudent.ibu);
            setNamaIbu(currentStudent.ibu);
        } else {
            console.warn('⚠️ No ibu data found in student data');
        }

        // Sync Birth Place
        if (currentStudent?.ttl) {
            console.log('✅ Syncing TTL:', currentStudent.ttl);
            const birthPlace = currentStudent.ttl.split(',')[0].trim();
            setTempatLahir(birthPlace);

            // Sync Birth Date
            const parts = currentStudent.ttl.split(',');
            if (parts.length > 1) {
                const datePart = parts[1].trim();
                console.log('Parsing date:', datePart);
                // Try to parse DD/MM/YYYY or DD-MM-YYYY format
                const dmy = datePart.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
                // Try to parse YYYY-MM-DD
                const ymd = datePart.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);

                if (dmy) {
                    // Convert to YYYY-MM-DD for input[type="date"]
                    const formattedDate = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
                    console.log('✅ Formatted date (DMY):', formattedDate);
                    setTanggalLahir(formattedDate);
                } else if (ymd) {
                    console.log('✅ Date (YMD):', datePart);
                    setTanggalLahir(datePart);
                } else {
                    console.warn('⚠️ Date format not matched:', datePart);
                }
            }
        } else {
            console.warn('⚠️ No ttl data found in student data');
        }

        // Sync Student Name
        if (user?.studentName) {
            console.log('✅ Syncing Student Name:', user.studentName);
            setNamaAnak(user.studentName);
        }

        // Sync Father's Name
        if (user?.nama || user?.namaAyah) {
            const fatherName = user.nama || user.namaAyah;
            console.log('✅ Syncing Father Name:', fatherName);
            setNamaAyah(fatherName);
        }

        console.log('✅ ProfilAkun sync completed');
    }, [user, user?.studentName, refreshTrigger]); // Added refreshTrigger

    // Listen for localStorage changes (when data is updated in other tabs or by admin)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'students_data_v10') {
                console.log('📦 localStorage students_data_v10 changed, refreshing...');
                setRefreshTrigger(prev => prev + 1);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-5 border border-white/20 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={22} />
                    </button>
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <User className="text-[#004AAD]" size={20} />
                        Profil Akun
                    </h2>
                </div>
                {/* Save Button (Mock) */}
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#004AAD] text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/20 hover:scale-105 transition-transform">
                    <Save size={14} />
                    Simpan
                </button>
            </div>

            <div className="space-y-5">
                {/* Bagian Atas: Data Orang Tua (Pemilik Akun) & Foto Profil */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-400 to-blue-600 opacity-10"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Foto Profil Orang Tua */}
                        <div className="relative group cursor-pointer mb-6">
                            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-[#004AAD] text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* Input Data Orang Tua */}
                        <div className="w-full space-y-4">
                            <h3 className="font-bold text-slate-800 text-lg text-center mb-2">Data Orang Tua</h3>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nama Ayah</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-blue-500 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">A</div>
                                    <input
                                        type="text"
                                        value={namaAyah}
                                        onChange={(e) => setNamaAyah(e.target.value)}
                                        className="bg-transparent w-full outline-none font-medium text-slate-700"
                                        placeholder="Nama Ayah"
                                    />
                                    <Edit2 size={14} className="text-slate-300" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nama Ibu</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-pink-500 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">I</div>
                                    <input
                                        type="text"
                                        value={namaIbu}
                                        onChange={(e) => setNamaIbu(e.target.value)}
                                        className="bg-transparent w-full outline-none font-medium text-slate-700"
                                        placeholder="Nama Ibu"
                                    />
                                    <Edit2 size={14} className="text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bagian Bawah: Data Siswa (Anak) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <UserCheck size={20} className="text-[#004AAD]" />
                        Data Siswa
                    </h3>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nama Siswa</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <User size={18} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={namaAnak}
                                        onChange={(e) => setNamaAnak(e.target.value)}
                                        className="bg-transparent w-full outline-none font-bold text-slate-700"
                                    />
                                    <Edit2 size={14} className="text-slate-300" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Tempat & Tanggal Lahir</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <MapPin size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={studentData?.ttl || `${tempatLahir}, ${tanggalLahir}`}
                                        readOnly
                                        className="bg-transparent w-full outline-none font-medium text-slate-700 text-sm"
                                        placeholder="Tempat, Tanggal Lahir"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 p-3.5 mt-6 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 hover:scale-[1.02] active:scale-95 transition-all border border-red-100 shadow-sm text-sm"
                >
                    <LogOut size={18} />
                    Keluar dari Aplikasi
                </button>

                <div className="text-center text-[10px] text-slate-400 font-medium pt-4 pb-2">
                    Versi Aplikasi 1.0.5 <br />
                    &copy; 2025 EduAdmin Sekolah
                </div>
            </div>
        </div>
    );
};

export default ProfilAkun;
