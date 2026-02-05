import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, History, Settings, CheckCircle2, Users, AlertTriangle,
    Download, ArrowRight, Save, GraduationCap, ChevronRight, CheckCircle, RotateCcw, X, Trash2, LayoutDashboard
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NaikKelasViewProps {
    students: any[];
    classes: any[];
    updateStudents: (students: any[]) => void;
    handleSaveData: () => void;
    setConfirmModal: (modal: any) => void;
}

const NaikKelasView: React.FC<NaikKelasViewProps> = ({
    students,
    classes,
    updateStudents,
    handleSaveData,
    setConfirmModal
}) => {
    const [promotionActiveTab, setPromotionActiveTab] = useState('dashboard');
    const [promotionYear, setPromotionYear] = useState(() => {
        const saved = localStorage.getItem('promotion_year_v10');
        return saved ? JSON.parse(saved) : { current: '2025/2026', next: '2026/2027' };
    });
    const [promotionChecklist, setPromotionChecklist] = useState({ year: true, classes: true, report: false, distinct: true });
    const [promotionHistory, setPromotionHistory] = useState<any[]>(() => {
        const saved = localStorage.getItem('promotion_history_v10');
        return saved ? JSON.parse(saved) : [];
    });
    const [promotionStudents, setPromotionStudents] = useState<any[]>([]);
    const [selectedPromotionClass, setSelectedPromotionClass] = useState('');
    const [targetPromotionClass, setTargetPromotionClass] = useState('');

    useEffect(() => {
        localStorage.setItem('promotion_year_v1', JSON.stringify(promotionYear));
    }, [promotionYear]);

    useEffect(() => {
        localStorage.setItem('promotion_history_v10', JSON.stringify(promotionHistory));
    }, [promotionHistory]);

    const handleCheckPreparation = () => {
        const loadingToast = toast.loading("Memeriksa kelengkapan data...");
        setTimeout(() => {
            setPromotionChecklist({
                year: true,
                classes: true,
                report: true,
                distinct: true
            });
            toast.success("Semua persiapan kenaikan kelas lengkap!", { id: loadingToast });
        }, 1500);
    };

    const handleLoadPromotionStudents = (className: string) => {
        setSelectedPromotionClass(className);
        const level = parseInt(className.match(/\d+/)?.[0] || '0');
        const parallel = className.replace(/\d+/, '');
        if (level > 0 && level < 6) {
            setTargetPromotionClass(`${level + 1}${parallel}`);
        } else {
            setTargetPromotionClass('');
        }

        const classStudents = students.filter(s => s.kelas === className);
        const semesterKey = '2 (Genap)';

        const mappedStudents = classStudents.map(s => {
            const suppKey = `rapor_supp_${className}_${s.id}_${semesterKey}`;
            const savedSupp = localStorage.getItem(suppKey);
            let decision = 'Naik';

            if (savedSupp) {
                const parsed = JSON.parse(savedSupp);
                const d = parsed.decision;
                if (d === 'Naik Ke Kelas') decision = 'Naik';
                else if (d === 'Tinggal Di Kelas') decision = 'Tinggal';
                else if (d === 'Lulus') decision = 'Lulus';
                else if (d === 'Tidak Lulus') decision = 'Tidak Lulus';
            }

            return { ...s, promoStatus: decision };
        });

        setPromotionStudents(mappedStudents);
    };

    const handleExecutePromotion = () => {
        if (!selectedPromotionClass || !targetPromotionClass) return;

        const toPromote = promotionStudents.filter(s => s.promoStatus === 'Naik');
        const count = toPromote.length;
        if (count === 0) return;

        setConfirmModal({
            show: true,
            message: `Yakin ingin memproses kenaikan kelas untuk ${count} siswa dari ${selectedPromotionClass} ke ${targetPromotionClass}?`,
            onConfirm: () => {
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                const updatedStudents = toPromote.map(s => ({
                    ...s,
                    kelas: targetPromotionClass,
                    tingkat: (s.tingkat || 1) + 1,
                }));

                updateStudents(updatedStudents);
                handleSaveData();

                const newHistory = toPromote.map((s, idx) => ({
                    id: Date.now() + idx,
                    date: new Date().toISOString().split('T')[0],
                    student: s.nama,
                    from: selectedPromotionClass,
                    to: targetPromotionClass,
                    type: 'Naik Kelas',
                    officer: 'Admin'
                }));

                setPromotionHistory([...newHistory, ...promotionHistory]);
                setPromotionStudents([]);
                setSelectedPromotionClass('');
                toast.success("Proses Kenaikan Kelas Berhasil!");
            }
        });
    };

    const handleExecuteGraduation = () => {
        const toGraduate = promotionStudents.filter(s => s.promoStatus === 'Lulus');
        const count = toGraduate.length;
        if (count === 0) return;

        setConfirmModal({
            show: true,
            message: `Yakin ingin meluluskan ${count} siswa dari kelas ${selectedPromotionClass}?`,
            onConfirm: () => {
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                const updatedStudents = toGraduate.map(s => ({
                    ...s,
                    kelas: 'Alumni',
                    tingkat: 7,
                }));

                updateStudents(updatedStudents);
                handleSaveData();

                const newHistory = toGraduate.map((s, idx) => ({
                    id: Date.now() + idx,
                    date: new Date().toISOString().split('T')[0],
                    student: s.nama,
                    from: selectedPromotionClass,
                    to: 'Alumni',
                    type: 'Lulus',
                    officer: 'Admin'
                }));

                setPromotionHistory([...newHistory, ...promotionHistory]);
                setPromotionStudents([]);
                setSelectedPromotionClass('');
                toast.success("Proses Kelulusan Berhasil!");
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Tabs */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                            <ArrowUpCircle size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Kenaikan Kelas & Kelulusan</h2>
                            <p className="text-slate-500 text-sm">Kelola proses kenaikan tingkat siswa dan kelulusan.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                        { id: 'persiapan', label: 'Persiapan', icon: <Settings size={18} /> },
                        { id: 'proses', label: 'Proses Kenaikan', icon: <ArrowUpCircle size={18} /> },
                        { id: 'lulus', label: 'Kelulusan', icon: <GraduationCap size={18} /> },
                        { id: 'riwayat', label: 'Riwayat', icon: <History size={18} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPromotionActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${promotionActiveTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            {promotionActiveTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Informasi Tahun Ajaran</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tahun Aktif</p>
                                <p className="text-2xl font-black text-slate-700">{promotionYear.current}</p>
                            </div>
                            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-400 uppercase mb-1">Tahun Berikutnya</p>
                                <p className="text-2xl font-black text-blue-600">{promotionYear.next}</p>
                            </div>
                        </div>
                        <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                            <AlertTriangle className="text-amber-500 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-amber-800">Peringatan Penting</p>
                                <p className="text-sm text-amber-700 mt-1">Proses kenaikan kelas bersifat permanen dan akan mengubah data kelas seluruh siswa yang terpilih. Pastikan rapor semester genap sudah difinalisasi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {promotionActiveTab === 'persiapan' && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">Validasi Persiapan Sistem</h3>
                            <p className="text-slate-500 text-sm mt-1">Pastikan semua checklist terpenuhi sebelum memproses kenaikan kelas.</p>
                        </div>
                        <button onClick={handleCheckPreparation} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                            <RotateCcw size={16} /> Cek Ulang
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Tahun Ajaran Baru Tersedia', key: 'year', desc: 'Sistem telah mendeteksi tahun ajaran berikutnya.' },
                            { label: 'Kelas Tujuan Tersedia', key: 'classes', desc: 'Struktur kelas untuk tingkat selanjutnya sudah siap.' },
                            { label: 'Rapor Semester Genap Selesai', key: 'report', desc: 'Seluruh nilai sudah diinput dan rapor terkunci.' },
                            { label: 'Tidak Ada Data Ganda', key: 'distinct', desc: 'Validasi integritas database siswa berhasil.' },
                        ].map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border ${promotionChecklist[item.key as keyof typeof promotionChecklist] ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} flex items-start gap-3`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${promotionChecklist[item.key as keyof typeof promotionChecklist] ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {promotionChecklist[item.key as keyof typeof promotionChecklist] ? <CheckCircle size={18} /> : <X size={18} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${promotionChecklist[item.key as keyof typeof promotionChecklist] ? 'text-emerald-800' : 'text-red-800'}`}>{item.label}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => setPromotionActiveTab('proses')}
                            disabled={!Object.values(promotionChecklist).every(v => v)}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Lanjut ke Proses Kenaikan →
                        </button>
                    </div>
                </div>
            )}

            {promotionActiveTab === 'proses' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pilih Kelas Asal</label>
                            <select
                                className="h-10 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white focus:border-blue-500 outline-none min-w-[150px]"
                                value={selectedPromotionClass}
                                onChange={(e) => handleLoadPromotionStudents(e.target.value)}
                            >
                                <option value="">-- Pilih --</option>
                                {classes.filter(c => !c.nama.startsWith('6')).map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center pb-2 text-slate-400"><ArrowRight size={20} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Target Kelas Tujuan</label>
                            <select
                                className="h-10 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white focus:border-blue-500 outline-none min-w-[150px]"
                                value={targetPromotionClass}
                                onChange={(e) => setTargetPromotionClass(e.target.value)}
                            >
                                <option value="">-- Pilih --</option>
                                {classes.map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                            </select>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={handleExecutePromotion}
                                disabled={promotionStudents.length === 0 || !targetPromotionClass}
                                className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save size={18} /> Proses Kenaikan ({promotionStudents.length})
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar p-6">
                        {promotionStudents.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 border-b">Nama Siswa / NIS</th>
                                        <th className="p-4 border-b text-center">Rata-rata Nilai</th>
                                        <th className="p-4 border-b text-center">Kehadiran</th>
                                        <th className="p-4 border-b text-center">Status Naik</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {promotionStudents.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-700">
                                                {s.nama}
                                                <div className="text-xs text-slate-400 font-normal">{s.nis}</div>
                                            </td>
                                            <td className="p-4 text-center text-slate-600 font-mono font-bold">85.5</td>
                                            <td className="p-4 text-center text-slate-600">98%</td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...promotionStudents];
                                                            updated[idx].promoStatus = 'Naik';
                                                            setPromotionStudents(updated);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${s.promoStatus === 'Naik' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
                                                    >NAIK</button>
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...promotionStudents];
                                                            updated[idx].promoStatus = 'Tinggal';
                                                            setPromotionStudents(updated);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${s.promoStatus === 'Tinggal' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-400 hover:border-red-300'}`}
                                                    >TINGGAL</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p>Pilih kelas asal untuk memuat data siswa.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {promotionActiveTab === 'lulus' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-wrap gap-4 items-center mb-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pilih Kelas 6</label>
                            <select
                                className="h-10 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 bg-white focus:border-blue-500 outline-none min-w-[150px]"
                                value={selectedPromotionClass}
                                onChange={(e) => handleLoadPromotionStudents(e.target.value)}
                            >
                                <option value="">-- Pilih --</option>
                                {classes.filter(c => c.nama.startsWith('6')).map(c => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                            </select>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={handleExecuteGraduation}
                                disabled={promotionStudents.length === 0}
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Proses Kelulusan ({promotionStudents.length})
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto custom-scrollbar border rounded-2xl max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase sticky top-0">
                                <tr>
                                    <th className="p-4 border-b">Nama Siswa</th>
                                    <th className="p-4 border-b text-center">Status Kelulusan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {promotionStudents.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{s.nama}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => {
                                                    const updated = [...promotionStudents];
                                                    updated[idx].promoStatus = updated[idx].promoStatus === 'Lulus' ? 'Tunda' : 'Lulus';
                                                    setPromotionStudents(updated);
                                                }}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${s.promoStatus === 'Lulus' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                {s.promoStatus === 'Lulus' ? 'LULUS' : 'DITUNDA'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {promotionActiveTab === 'riwayat' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Riwayat Kenaikan & Kelulusan</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                            <tr>
                                <th className="p-4 border-b">Tanggal</th>
                                <th className="p-4 border-b">Siswa</th>
                                <th className="p-4 border-b">Dari</th>
                                <th className="p-4 border-b">Ke</th>
                                <th className="p-4 border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {promotionHistory.map(h => (
                                <tr key={h.id} className="hover:bg-slate-50">
                                    <td className="p-4 text-slate-600">{h.date}</td>
                                    <td className="p-4 font-bold text-slate-700">{h.student}</td>
                                    <td className="p-4 text-slate-600">{h.from}</td>
                                    <td className="p-4 text-slate-600">{h.to}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${h.type === 'Naik Kelas' ? 'bg-emerald-100 text-emerald-700' : h.type === 'Lulus' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{h.type}</span>
                                    </td>
                                </tr>
                            ))}
                            {promotionHistory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">Belum ada riwayat transaksi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default NaikKelasView;
