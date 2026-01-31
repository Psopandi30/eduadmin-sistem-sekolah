import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus, Trash2, Save } from 'lucide-react';

interface TambahKelasViewProps {
    setActiveView: (view: string) => void;
    classes: any[];
    setClasses: (classes: any[]) => void;
    teachers: any[];
    students: any[];
    setShowAddClassModal: (show: boolean) => void;
    setConfirmModal: (modal: any) => void;
    handleSaveClasses?: () => void;
}

const TambahKelasView: React.FC<TambahKelasViewProps> = ({
    setActiveView,
    classes,
    setClasses,
    teachers,
    students,
    setShowAddClassModal,
    setConfirmModal,
    handleSaveClasses
}) => {
    const [pageSize, setPageSize] = useState(6);

    const derivedClasses = useMemo(() => {
        return classes.map(cls => {
            // Find teacher who is assigned as wali for this class
            const waliGuru = teachers.find(t =>
                t.wali && cls.nama &&
                String(t.wali).trim().toLowerCase() === String(cls.nama).trim().toLowerCase()
            );
            // Count students in this class
            const studentCount = students.filter(s =>
                s.kelas && cls.nama &&
                String(s.kelas).trim().toLowerCase() === String(cls.nama).trim().toLowerCase()
            ).length;

            return {
                ...cls,
                wali: waliGuru ? waliGuru.nama : 'Belum Ada',
                siswa: studentCount
            };
        });
    }, [classes, teachers, students]);

    const handleDeleteClass = (id: number | string) => {
        const classToDelete = classes.find(c => c.id === id);
        setConfirmModal({
            show: true,
            message: `Apakah Anda yakin ingin menghapus kelas ${classToDelete?.nama}? Data yang terkait dengan kelas ini mungkin akan terdampak.`,
            onConfirm: () => {
                setClasses(classes.filter(c => c.id !== id));
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                import('react-hot-toast').then(m => m.toast.success("Kelas berhasil dihapus"));
            }
        });
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-4 h-full shadow-sm animate-in slide-in-from-right flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveView('data_siswa')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="rotate-180" /></button>
                    <div>
                        <h2 className="text-xl font-bold text-[#1E1B4B]">Data Kelas & Wali kelas</h2>
                        <p className="text-slate-400 text-sm">Kelola daftar kelas dan penugasan wali kelas</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddClassModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">
                        <Plus size={18} /> Buat Kelas
                    </button>
                    {handleSaveClasses && (
                        <button onClick={handleSaveClasses} className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                            <Save size={18} /> Simpan
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-[1.5rem] border border-slate-200 shadow-inner bg-slate-50/50 custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                    <thead className="bg-[#F1F5F9] text-slate-700 font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 border-r border-slate-200 text-center w-16">No</th>
                            <th className="p-4 border-r border-slate-200">Nama Kelas</th>
                            <th className="p-4 border-r border-slate-200 text-center">Tingkat</th>
                            <th className="p-4 border-r border-slate-200 text-center">Paralel</th>
                            <th className="p-4 border-r border-slate-200">Wali Kelas</th>
                            <th className="p-4 border-r border-slate-200 text-center">Jumlah Siswa</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {derivedClasses
                            .sort((a: any, b: any) => {
                                if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
                                return a.nama.localeCompare(b.nama);
                            })
                            .slice(0, pageSize)
                            .map((cls: any, index: number) => (
                                <tr key={cls.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 text-center text-slate-500 font-medium">{index + 1}</td>
                                    <td className="p-4 font-bold text-slate-800">{cls.nama}</td>
                                    <td className="p-4 text-center text-slate-600">{cls.tingkat}</td>
                                    <td className="p-4 text-center text-slate-600">{cls.paralel}</td>
                                    <td className="p-4">
                                        {cls.wali !== 'Belum Ada' ? (
                                            <span className="text-slate-700 font-medium">{cls.wali}</span>
                                        ) : (
                                            <span className="text-red-500 italic text-xs font-bold bg-red-50 px-2 py-1 rounded-md">Belum Ada</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{cls.siswa} Siswa</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDeleteClass(cls.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Hapus Kelas"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        {derivedClasses.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-20 text-center text-slate-400 font-medium italic">Belum ada data kelas yang ditambahkan.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer controls */}
            <div className="mt-4 flex justify-end items-center gap-4 text-sm text-slate-500">
                <span>Pilih Jumlah terlihat</span>
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                </select>
            </div>
        </div>
    );
};

export default TambahKelasView;
