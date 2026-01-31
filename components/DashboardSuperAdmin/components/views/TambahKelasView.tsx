import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';

interface TambahKelasViewProps {
    setActiveView: (view: string) => void;
    classes: any[];
    setClasses: (classes: any[]) => void;
    teachers: any[];
    students: any[];
    setShowAddClassModal: (show: boolean) => void;
    setConfirmModal: (modal: any) => void;
}

const TambahKelasView: React.FC<TambahKelasViewProps> = ({
    setActiveView,
    classes,
    setClasses,
    teachers,
    students,
    setShowAddClassModal,
    setConfirmModal
}) => {
    const [pageSize, setPageSize] = useState(6);

    const derivedClasses = useMemo(() => {
        return classes.map(cls => {
            // Find teacher who is assigned as wali for this class
            const waliGuru = teachers.find(t => t.wali === cls.nama);
            // Count students in this class
            const studentCount = students.filter(s => s.kelas === cls.nama).length;

            return {
                ...cls,
                wali: waliGuru ? waliGuru.nama : 'Belum Ditentukan',
                siswa: studentCount
            };
        });
    }, [classes, teachers, students]);

    const handleDeleteClass = (id: number) => {
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
        <div className="bg-white rounded-[2.5rem] p-8 h-full shadow-sm animate-in slide-in-from-right flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveView('data_siswa')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="rotate-180" /></button>
                    <h2 className="text-xl font-bold">Tambahkan Kelas</h2>
                </div>
                <button onClick={() => setShowAddClassModal(true)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2"><Plus size={18} /> Buat Kelas</button>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden border border-slate-100 rounded-3xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-20">
                        <tr>
                            <th className="p-3 text-center font-bold text-slate-700 border-r border-slate-100 text-sm w-16">No</th>
                            <th className="p-3 font-bold text-slate-700 border-r border-slate-100 text-sm">Nama Kelas</th>
                            <th className="p-3 font-bold text-slate-700 border-r border-slate-100 text-sm">Tingkat</th>
                            <th className="p-3 font-bold text-slate-700 border-r border-slate-100 text-sm">Paralel</th>
                            <th className="p-3 text-center font-bold text-slate-700 text-sm w-20">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {derivedClasses
                            .sort((a: any, b: any) => a.tingkat - b.tingkat)
                            .slice(0, pageSize)
                            .map((cls: any, index: number) => (
                                <tr key={cls.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="p-3 text-center text-slate-500 border-r border-slate-50">{index + 1}</td>
                                    <td className="p-3 font-bold text-slate-700 border-r border-slate-50">{cls.nama}</td>
                                    <td className="p-3 text-slate-600 border-r border-slate-50">{cls.tingkat}</td>
                                    <td className="p-3 text-slate-600 border-r border-slate-50">{cls.paralel}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => handleDeleteClass(cls.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Kelas"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
