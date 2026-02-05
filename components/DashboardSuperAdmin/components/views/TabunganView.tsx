
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    LayoutDashboard, Users, ArrowUpCircle, TrendingDown,
    History, FileText, Wallet, Plus, Printer, List, Search, X, Download, Save, CheckCircle, Upload as UploadIcon, ChevronRight
} from 'lucide-react';
import { useSavings } from '../../hooks/useSavings';
import { studentsDataGlobal } from '../../../../data/sharedData';
import { toast } from 'react-hot-toast';

const TabunganView: React.FC = () => {
    const [savingsActiveTab, setSavingsActiveTab] = useState('dashboard');
    const {
        savingsData,
        savingsTransactions,
        saveSavings,
        loading
    } = useSavings();

    // Modal & Excel States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState('Semua Kelas');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [importPreviewData, setImportPreviewData] = useState<any[]>([]);

    // Transaction States
    const [searchSavingsStudent, setSearchSavingsStudent] = useState('');
    const [selectedSavingsStudent, setSelectedSavingsStudent] = useState<any>(null);
    const [savingsAmount, setSavingsAmount] = useState(0);
    const [savingsNote, setSavingsNote] = useState('');

    // Search Term for Data Tab
    const [searchTerm, setSearchTerm] = useState('');

    // --- LOGIC ---

    const handleSaveNasabah = async () => {
        const studentToAdd = studentsDataGlobal.find(s => s.id === Number(selectedStudentId));
        if (studentToAdd) {
            if (savingsData.find(s => s.id === studentToAdd.id)) {
                toast.error('Siswa sudah terdaftar sebagai nasabah!');
                return;
            }
            const newSaver = {
                id: studentToAdd.id,
                nis: studentToAdd.nis,
                nama: studentToAdd.nama,
                kelas: studentToAdd.kelas,
                saldo: 0,
                status: 'Aktif' as const,
                joinDate: new Date().toISOString().split('T')[0]
            };

            const updatedData = [...savingsData, newSaver];
            await saveSavings(updatedData, savingsTransactions);
            toast.success('Nasabah berhasil ditambahkan');
            setSelectedStudentId('');
        }
    };

    const handleDownloadTemplate = () => {
        const nonMembers = studentsDataGlobal.filter(s => !savingsData.find(saver => saver.id === s.id));
        if (nonMembers.length === 0) {
            toast.error("Semua siswa sudah terdaftar!");
            return;
        }

        const data = nonMembers.map((s, i) => ({
            'NO': i + 1,
            'NIS': s.nis,
            'NAMA SISWA': s.nama,
            'KELAS': s.kelas,
            'SALDO AWAL': 0,
            'STATUS': 'Aktif'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Calon Nasabah");
        XLSX.writeFile(wb, `TEMPLATE_TABUNGAN_${new Date().getFullYear()}.xlsx`);
        toast.success("Template berhasil diunduh.");
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const json: any[] = XLSX.utils.sheet_to_json(ws);

                const preview = json.map((row, i) => ({
                    id: row['NIS'] || Date.now() + i,
                    nis: row['NIS'],
                    nama: row['NAMA SISWA'],
                    kelas: row['KELAS'],
                    saldo: parseInt(row['SALDO AWAL']) || 0,
                    status: row['STATUS'] || 'Aktif',
                    joinDate: new Date().toISOString().split('T')[0]
                }));
                setImportPreviewData(preview);
                toast.success(`${preview.length} data siap diimpor.`);
            } catch (err) {
                toast.error("Gagal membaca file Excel.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSaveImport = async () => {
        const updatedData = [...savingsData, ...importPreviewData];
        await saveSavings(updatedData, savingsTransactions);
        toast.success(`Berhasil mengimpor ${importPreviewData.length} nasabah.`);
        setImportPreviewData([]);
        setShowAddModal(false);
    };

    const handleTransaction = async (type: 'Setor' | 'Tarik') => {
        if (!selectedSavingsStudent || savingsAmount <= 0) {
            toast.error('Pilih siswa dan masukkan nominal valid!');
            return;
        }

        if (type === 'Tarik' && savingsAmount > selectedSavingsStudent.saldo) {
            toast.error('Saldo tidak mencukupi!');
            return;
        }

        const newTrx = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            studentId: selectedSavingsStudent.id,
            studentName: selectedSavingsStudent.nama,
            type,
            amount: savingsAmount,
            note: savingsNote || (type === 'Setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
            officer: 'Admin'
        };

        const updatedData = savingsData.map(s => {
            if (s.id === selectedSavingsStudent.id) {
                return {
                    ...s,
                    saldo: type === 'Setor' ? s.saldo + savingsAmount : s.saldo - savingsAmount
                };
            }
            return s;
        });

        const updatedTrx = [newTrx, ...savingsTransactions];
        await saveSavings(updatedData, updatedTrx);
        toast.success(`Transaksi ${type} berhasil!`);

        // Reset
        setSavingsAmount(0);
        setSavingsNote('');
        setSelectedSavingsStudent(null);
        setSearchSavingsStudent('');
    };

    // --- DATA ---

    const classesList = useMemo(() => {
        const unique = Array.from(new Set(studentsDataGlobal.map(s => s.kelas)));
        return ['Semua Kelas', ...unique.sort()];
    }, []);

    const filteredStudentsForSelect = useMemo(() => {
        return studentsDataGlobal
            .filter(s => selectedClass === 'Semua Kelas' || s.kelas === selectedClass)
            .filter(s => !savingsData.find(nasabah => nasabah.id === s.id));
    }, [selectedClass, savingsData]);

    const stats = useMemo(() => {
        const totalSaldo = savingsData.reduce((acc, curr) => acc + curr.saldo, 0);
        const today = new Date().toISOString().split('T')[0];
        const todaySetor = savingsTransactions
            .filter(t => t.type === 'Setor' && t.date === today)
            .reduce((acc, curr) => acc + curr.amount, 0);
        const todayTarik = savingsTransactions
            .filter(t => t.type === 'Tarik' && t.date === today)
            .reduce((acc, curr) => acc + curr.amount, 0);

        return { totalSaldo, todaySetor, todayTarik, totalNasabah: savingsData.length };
    }, [savingsData, savingsTransactions]);

    if (loading) return <div className="p-10 text-center font-bold text-slate-500">Memuat data...</div>;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in space-y-6 pr-2 pb-6">
            {/* 1. HEADER (Matches Screenshot) */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <Wallet size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Tabungan Sekolah</h2>
                            <p className="text-slate-500 text-sm font-medium">Kelola simpanan dan tabungan siswa.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, color: 'emerald' },
                            { id: 'tambah', label: 'Tambah Nasabah', icon: <Plus size={16} />, color: 'emerald', isModalTrigger: true },
                            { id: 'data', label: 'Data Tabungan', icon: <Users size={16} /> },
                            { id: 'setor', label: 'Setoran', icon: <ArrowUpCircle size={16} /> },
                            { id: 'tarik', label: 'Penarikan', icon: <TrendingDown size={16} /> },
                            { id: 'riwayat', label: 'Riwayat', icon: <History size={16} /> },
                            { id: 'rekap', label: 'Rekapitulasi', icon: <FileText size={16} /> },
                        ].map(tab => {
                            const isActive = savingsActiveTab === tab.id;
                            if (tab.id === 'tambah') {
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setShowAddModal(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            }
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSavingsActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. STAT CARDS (Matched to Screenshot Colors) */}
            {savingsActiveTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-emerald-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-emerald-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] mb-2 opacity-80">TOTAL SALDO SISWA</p>
                            <h3 className="text-3xl sm:text-5xl font-black mb-4 tracking-tighter">Rp {stats.totalSaldo.toLocaleString('id-ID')}</h3>
                            <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md">
                                <Users size={14} /> <span className="font-bold">{stats.totalNasabah} Siswa Menabung</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-blue-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] mb-2 opacity-80">SETORAN HARI INI</p>
                            <h3 className="text-3xl sm:text-5xl font-black mb-1 tracking-tighter">Rp {stats.todaySetor.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-orange-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-orange-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] mb-2 opacity-80">PENARIKAN HARI INI</p>
                            <h3 className="text-3xl sm:text-5xl font-black mb-1 tracking-tighter">Rp {stats.todayTarik.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. SETOR & TARIK (Functionality) */}
            {(savingsActiveTab === 'setor' || savingsActiveTab === 'tarik') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${savingsActiveTab === 'setor' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {savingsActiveTab === 'setor' ? <ArrowUpCircle size={28} /> : <TrendingDown size={28} />}
                                </div>
                                <h3 className="font-black text-2xl text-slate-800 tracking-tight">Input {savingsActiveTab === 'setor' ? 'Setoran Baru' : 'Penarikan Dana'}</h3>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cari Siswa</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-slate-700"
                                            placeholder="Ketik Nama atau Nomor Induk..."
                                            value={searchSavingsStudent}
                                            onChange={(e) => {
                                                setSearchSavingsStudent(e.target.value);
                                                if (!e.target.value) setSelectedSavingsStudent(null);
                                            }}
                                        />
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchSavingsStudent && !selectedSavingsStudent && (
                                        <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-20 absolute lg:w-[48%] w-full">
                                            {savingsData.filter(s => s.nama.toLowerCase().includes(searchSavingsStudent.toLowerCase()) || s.nis.includes(searchSavingsStudent)).slice(0, 5).map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => {
                                                        setSelectedSavingsStudent(s);
                                                        setSearchSavingsStudent(s.nama);
                                                    }}
                                                    className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-black text-slate-800">{s.nama}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">NIS: {s.nis} • {s.kelas}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-emerald-600">Rp {s.saldo.toLocaleString('id-ID')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedSavingsStudent && (
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{selectedSavingsStudent.nama}</p>
                                            <p className="text-xs text-slate-600 font-bold">Saldo: Rp {selectedSavingsStudent.saldo.toLocaleString('id-ID')}</p>
                                        </div>
                                        <button onClick={() => { setSelectedSavingsStudent(null); setSearchSavingsStudent(''); }} className="p-2 text-slate-400 hover:text-red-500"><X size={20} /></button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tanggal</label>
                                        <input type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nominal (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-black text-slate-700 text-2xl"
                                            placeholder="0"
                                            value={savingsAmount || ''}
                                            onChange={(e) => setSavingsAmount(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Keterangan (Opsional)</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-slate-700 h-24"
                                        placeholder="Catatan tambahan..."
                                        value={savingsNote}
                                        onChange={(e) => setSavingsNote(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={() => handleTransaction(savingsActiveTab === 'setor' ? 'Setor' : 'Tarik')}
                                    disabled={!selectedSavingsStudent || savingsAmount <= 0}
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all ${savingsActiveTab === 'setor' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                                        } disabled:opacity-50 flex items-center justify-center gap-3`}
                                >
                                    {savingsActiveTab === 'setor' ? <ArrowUpCircle size={22} /> : <TrendingDown size={22} />}
                                    Simpan Transaksi
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Important Info */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 self-start">
                        <h4 className="font-black text-lg text-slate-800 uppercase tracking-tighter">Informasi Penting</h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">Saldo akan langsung bertambah/berkurang setelah disimpan.</p>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">Transaksi tidak dapat dihapus, hanya bisa dikoreksi oleh Admin.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. OTHER TABS (Simplified for brevity) */}
            {(['data', 'riwayat', 'rekap'].includes(savingsActiveTab)) && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center sm:flex-row flex-col gap-4">
                        <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">
                            {savingsActiveTab === 'data' ? 'Data Tabungan Siswa' :
                                savingsActiveTab === 'riwayat' ? 'Riwayat Transaksi' : 'Laporan Rekapitulasi'}
                        </h3>
                        {savingsActiveTab === 'data' && (
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari Siswa..."
                                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-64 outline-none focus:border-emerald-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="p-6 border-b">Nama Siswa</th>
                                    <th className="p-6 border-b text-center">Kelas</th>
                                    <th className="p-6 border-b text-right">Saldo Saat Ini</th>
                                    <th className="p-6 border-b text-center">Status</th>
                                    <th className="p-6 border-b text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {savingsData.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            <div className="font-black text-slate-800">{s.nama}</div>
                                            <div className="text-[10px] text-slate-400 font-bold tracking-widest">NIS: {s.nis}</div>
                                        </td>
                                        <td className="p-6 text-center font-bold text-slate-600">{s.kelas}</td>
                                        <td className="p-6 text-right font-black text-emerald-600">Rp {s.saldo.toLocaleString('id-ID')}</td>
                                        <td className="p-6 text-center">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">AKTIF</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all"><Printer size={18} /></button>
                                                <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"><List size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. SIDE-BY-SIDE MODAL (EXACT MATCH TO SCREENSHOT) */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl flex flex-col md:flex-row h-auto md:h-[600px] overflow-hidden transform animate-in zoom-in-95 duration-300 relative">

                        {/* Modal Header for Mobile/Title */}
                        <div className="md:hidden flex justify-between items-center p-6 border-b">
                            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tighter">Tambah Nasabah</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        {/* LEFT PANEL: Form & Excel (Matched to Screenshot) */}
                        <div className="flex-1 p-8 border-r border-slate-100 overflow-y-auto custom-scrollbar">
                            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tighter mb-8 leading-none">Tambah Nasabah</h3>

                            <div className="space-y-6">
                                {/* Excel Section */}
                                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-[1.8rem] space-y-4">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1 italic">Alternatif: Upload Excel</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            <Download size={16} /> Template
                                        </button>
                                        <label className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 cursor-pointer">
                                            <UploadIcon size={16} /> Upload
                                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                                        </label>
                                    </div>
                                </div>

                                {/* Import Preview Button */}
                                {importPreviewData.length > 0 && (
                                    <button
                                        onClick={handleSaveImport}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 animate-bounce"
                                    >
                                        <Save size={16} /> Konfirmasi Impor {importPreviewData.length} Nasabah
                                    </button>
                                )}

                                {/* Manual Form */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Pilih Kelas</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.2rem] outline-none focus:border-indigo-500 font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                    >
                                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Pilih Siswa</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.2rem] outline-none focus:border-indigo-500 font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat"
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                    >
                                        <option value="">-- Pilih Siswa --</option>
                                        {filteredStudentsForSelect.map(s => (
                                            <option key={s.id} value={s.id}>{s.nama}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 ml-1 italic leading-none whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">*Hanya siswa yang belum terdaftar.</p>
                                </div>

                                <button
                                    onClick={handleSaveNasabah}
                                    disabled={!selectedStudentId}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-40"
                                >
                                    Simpan Nasabah
                                </button>
                            </div>
                        </div>

                        {/* RIGHT PANEL: Registered List (Matched to Screenshot) */}
                        <div className="flex-[1.2] bg-slate-50/50 p-8 flex flex-col relative overflow-hidden">
                            {/* Close Button Inside Right Panel (Top Right) */}
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-8 p-3 bg-white shadow-md rounded-full text-slate-400 hover:text-red-500 hover:scale-110 transition-all z-20"><X size={24} /></button>

                            <div className="mb-8 leading-none">
                                <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tighter leading-none mb-1">Daftar Nasabah Terdaftar</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{savingsData.length} Siswa Aktif</p>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex-1 overflow-hidden flex flex-col">
                                <div className="overflow-x-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                                            <tr>
                                                <th className="p-5">Nama Siswa</th>
                                                <th className="p-5 text-center">Kelas</th>
                                                <th className="p-5">NIS</th>
                                                <th className="p-5 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-[12px]">
                                            {savingsData.length > 0 ? (
                                                savingsData.slice(0, 10).map(s => (
                                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-5 font-black text-slate-800 uppercase tracking-tight">{s.nama}</td>
                                                        <td className="p-5 text-center font-bold text-slate-500">{s.kelas}</td>
                                                        <td className="p-5 font-bold text-slate-400">{s.nis}</td>
                                                        <td className="p-5 text-center">
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">AKTIF</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-20 text-center text-slate-400 italic font-bold">
                                                        Belum ada nasabah terdaftar.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default TabunganView;
