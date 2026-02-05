import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Wallet, Coins, LogOut, User,
    Camera, Lock, Eye, EyeOff, Save, Settings,
    TrendingUp, TrendingDown, Users, CreditCard, DollarSign, ArrowUpCircle, ArrowDownCircle,
    Menu
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import views dari DashboardSuperAdmin
import KeuanganView from './DashboardSuperAdmin/components/views/KeuanganView';
import TabunganView from './DashboardSuperAdmin/components/views/TabunganView';
import { useDataContext } from './DashboardSuperAdmin/contexts/DataContext';
import { useFinance } from './DashboardSuperAdmin/hooks/useFinance';
import { useSavings } from './DashboardSuperAdmin/hooks/useSavings';

interface DashboardStaffTUProps {
    user: any;
    onLogout: () => void;
    schoolName?: string;
}

const DashboardStaffTU: React.FC<DashboardStaffTUProps> = ({ user, onLogout, schoolName }) => {
    const { students, classes } = useDataContext();
    const [activeView, setActiveView] = useState('dashboard');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Profile Settings State
    const [profileData, setProfileData] = useState({
        nama: user?.nama || 'Staff Tata Usaha',
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

    // Menu Items untuk Staff Tata Usaha
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} />, color: 'bg-blue-600' },
        { id: 'keuangan', label: 'Keuangan Sekolah', icon: <Wallet size={24} />, color: 'bg-green-600' },
        { id: 'tabungan', label: 'Tabungan Siswa', icon: <Coins size={24} />, color: 'bg-purple-600' },
    ];

    // --- REAL DATA HOOKS ---
    const { cashAccounts, paymentHistory, studentBills } = useFinance();
    const { savingsData, savingsTransactions } = useSavings();

    // Derived Stats
    const totalIncome = paymentHistory.filter(p => p.status === 'Lunas').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalExpense = 0; // Replace with expenses total if available from hook
    const balance = cashAccounts.reduce((acc, curr) => acc + curr.balance, 0);
    const pendingBills = studentBills.filter(b => b.status === 'Belum Lunas').reduce((acc, curr) => acc + curr.amount, 0);

    const totalSavers = savingsData.length;
    const totalSavingsBalance = savingsData.reduce((acc, curr) => acc + curr.saldo, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDeposits = savingsTransactions.filter(t => t.type === 'Setor' && t.date === todayStr).reduce((acc, curr) => acc + curr.amount, 0);
    const todayWithdrawals = savingsTransactions.filter(t => t.type === 'Tarik' && t.date === todayStr).reduce((acc, curr) => acc + curr.amount, 0);

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

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`bg-[#1E1B4B] flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex rounded-r-[2rem] my-4 ml-4 shadow-2xl z-20 overflow-hidden`}>
                <div className={`h-20 flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">TU</div>
                        <span className="text-white font-bold text-xl tracking-tight">Staff TU</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                    >
                        <Menu size={24} strokeWidth={3} />
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
                                    ? `text-blue-800 bg-slate-50 rounded-l-full ${isSidebarCollapsed ? 'ml-2' : 'ml-4'}`
                                    : `text-blue-100 hover:text-white hover:bg-white/10 ${isSidebarCollapsed ? 'mx-2' : 'mx-4'} rounded-xl`
                                }
                                ${isSidebarCollapsed ? 'justify-center' : ''}
                            `}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <span className={activeView === item.id ? 'text-[#1E1B4B]' : ''}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                            {activeView === item.id && !isSidebarCollapsed && (
                                <>
                                    <div className="absolute right-0 -top-8 w-8 h-8 bg-transparent rounded-br-full shadow-[5px_5px_0_5px_#F8FAFC]"></div>
                                    <div className="absolute right-0 -bottom-8 w-8 h-8 bg-transparent rounded-tr-full shadow-[5px_-5px_0_5px_#F8FAFC]"></div>
                                </>
                            )}
                        </div>
                    ))}
                </nav>

                <div className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'flex justify-center p-4' : ''}`}>
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-300 hover:text-red-100 transition-colors text-sm">
                        <LogOut size={18} />
                        {!isSidebarCollapsed && <span>Logout</span>}
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
                        <p className="text-xs text-slate-500">{schoolName} • Staff Tata Usaha</p>
                    </div>

                    {/* Profile Section - Clickable */}
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-slate-800">{profileData.nama}</p>
                            <p className="text-xs text-slate-500">Staff Tata Usaha</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 overflow-hidden border border-green-200">
                            {profileData.avatar ? (
                                <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {activeView === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Finance Stats */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Wallet className="text-green-600" size={20} />
                                    Ringkasan Keuangan Sekolah
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Total Pendapatan</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(totalIncome)}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                                <TrendingDown size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Total Pengeluaran</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(totalExpense)}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Saldo Kas</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(balance)}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Piutang Siswa</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(pendingBills)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Savings Stats */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Coins className="text-purple-600" size={20} />
                                    Ringkasan Tabungan Siswa
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Total Penabung</p>
                                                <h3 className="text-2xl font-bold text-slate-800">{totalSavers}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <DollarSign size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Total Saldo</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(totalSavingsBalance)}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                                <ArrowUpCircle size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Setoran Hari Ini</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(todayDeposits)}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                                <ArrowDownCircle size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase">Penarikan Hari Ini</p>
                                                <h3 className="text-xl font-bold text-slate-800">{formatIDR(todayWithdrawals)}</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Access */}
                            <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-6 shadow-xl">
                                <h3 className="font-bold text-lg mb-6 border-b border-white/20 pb-4">Akses Cepat</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setActiveView('keuangan')}
                                        className="p-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-all"
                                    >
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Wallet size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Keuangan Sekolah</div>
                                            <div className="text-[10px] text-green-200">Kelola Keuangan</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setActiveView('tabungan')}
                                        className="p-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-all"
                                    >
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Coins size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">Tabungan Siswa</div>
                                            <div className="text-[10px] text-green-200">Kelola Tabungan</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Keuangan View */}
                    {activeView === 'keuangan' && (
                        <div className="animate-in fade-in duration-500">
                            <KeuanganView students={students} classes={classes} />
                        </div>
                    )}

                    {/* Tabungan View */}
                    {activeView === 'tabungan' && (
                        <div className="animate-in fade-in duration-500 h-full">
                            <TabunganView />
                        </div>
                    )}

                    {/* Settings Modal */}
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
                                            <label className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 shadow-sm transition-colors">
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
                                                className="w-full text-center font-bold text-slate-800 text-lg border-b-2 border-slate-200 focus:border-green-500 focus:outline-none py-1 bg-transparent transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Security Section */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                            <Lock size={16} className="text-green-600" /> Ubah Kata Sandi
                                        </h4>

                                        <div className="space-y-3">
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kata Sandi Lama</label>
                                                <input
                                                    type={passwordForm.showOld ? "text" : "password"}
                                                    value={passwordForm.oldPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                                    placeholder="Masukkan kata sandi lama"
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => setPasswordForm(prev => ({ ...prev, showOld: !prev.showOld }))}
                                                    className="absolute right-3 top-[28px] text-slate-400 hover:text-slate-600"
                                                >
                                                    {passwordForm.showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Kata Sandi Baru</label>
                                                <input
                                                    type={passwordForm.showNew ? "text" : "password"}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                                    placeholder="Buat kata sandi baru"
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                                                    className="absolute right-3 top-[28px] text-slate-400 hover:text-slate-600"
                                                >
                                                    {passwordForm.showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Konfirmasi Kata Sandi Baru</label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                    placeholder="Ulangi kata sandi baru"
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-6 py-2 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 shadow-md shadow-green-200 transition-all flex items-center gap-2"
                                    >
                                        <Save size={16} /> Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardStaffTU;
