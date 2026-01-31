import React, { useState, useEffect } from 'react';
import { ChevronRight, Download, UploadCloud, Save, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface UploadPerKelasViewProps {
    setActiveView: (view: string) => void;
    handleDownloadTemplate: () => void;
    handleUploadClick: () => void;
    handleSaveData: () => void;
    students: any[];
    handleAddStudent: () => void;
    handleViewStudent: (student: any) => void;
    handleEditStudent: (student: any) => void;
    handleDelete: (name: string) => void;
    classes: any[];
}

const UploadPerKelasView: React.FC<UploadPerKelasViewProps> = ({
    setActiveView,
    handleDownloadTemplate,
    handleUploadClick,
    handleSaveData,
    students,
    handleAddStudent,
    handleViewStudent,
    handleEditStudent,
    handleDelete,
    classes
}) => {
    const [selectedClass, setSelectedClass] = useState(classes[0]?.nama || '1A');
    const [pageSize, setPageSize] = useState(24);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredStudents = students.filter(s => s.kelas === selectedClass);
    const totalStudents = filteredStudents.length;
    const totalPages = Math.ceil(totalStudents / pageSize);
    const currentStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedClass, pageSize]);

    return (
        <div className="bg-white rounded-[2.5rem] p-6 h-full shadow-sm animate-in slide-in-from-right flex flex-col">
            {/* Header & Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveView('data_siswa')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="rotate-180 text-slate-500" /></button>
                    <div>
                        <h2 className="text-xl font-bold text-[#1E1B4B]">Upload Data Per Kelas</h2>
                        <p className="text-slate-400 text-sm">Kelola data siswa per rombongan belajar</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    {/* DROPDOWN PILIH KELAS */}
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">Pilih Kelas:</span>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-transparent font-bold text-slate-800 outline-none w-32 cursor-pointer"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.nama}>{c.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>
                    <button onClick={() => handleDownloadTemplate('Data_Per_Kelas')} className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition-colors border border-green-200 shadow-sm">
                        <Download size={18} /> <span className="hidden md:inline">Template</span>
                    </button>
                    <button onClick={handleUploadClick} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">
                        <UploadCloud size={18} /> <span className="hidden md:inline">Upload</span>
                    </button>
                    <button onClick={handleAddStudent} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">
                        <Plus size={18} /> <span className="hidden md:inline">Tambah Siswa</span>
                    </button>
                    <button onClick={handleSaveData} className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                        <Save size={18} /> Simpan
                    </button>
                </div>
            </div>

            {/* Complex Table Container (SAME AS BEFORE) */}
            <div className="flex-1 overflow-auto rounded-[1.5rem] border border-slate-200 shadow-inner bg-slate-50/50">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#F1F5F9] text-slate-700 font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th rowSpan={2} className="p-4 border-r border-slate-200 text-center w-12">No</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200">Nomor Induk Siswa</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200">Nama Lengkap Siswa</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200">Tempat & Tanggal Lahir</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200">Nama Kelas</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200">Tingkat</th>
                            <th rowSpan={2} className="p-4 border-r border-slate-200 text-center">Paralel</th>
                            <th colSpan={2} className="p-2 border-b border-r border-slate-200 text-center bg-slate-100">Nama Orangtua / Wali</th>
                            <th colSpan={2} className="p-2 border-b border-r border-slate-200 text-center bg-slate-100">Pekerjaan</th>
                            <th rowSpan={2} className="p-4">Username</th>
                        </tr>
                        <tr>
                            <th className="p-3 border-r border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">Ayah</th>
                            <th className="p-3 border-r border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">Ibu</th>
                            <th className="p-3 border-r border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">Ayah</th>
                            <th className="p-3 border-r border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">Ibu</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {currentStudents.map((siswa, i) => (
                            <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 text-center text-slate-500 font-medium">{(currentPage - 1) * pageSize + i + 1}</td>
                                <td className="p-4 font-mono text-slate-600">{siswa.nis}</td>
                                <td className="p-4 font-bold text-slate-800">{siswa.nama}</td>
                                <td className="p-4 text-slate-600">{siswa.ttl}</td>
                                <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">{siswa.kelas}</span></td>
                                <td className="p-4 text-slate-600">Kelas {siswa.tingkat}</td>
                                <td className="p-4 text-center font-bold text-[#1E1B4B]">{siswa.paralel}</td>
                                <td className="p-4 text-slate-600">{siswa.ayah}</td>
                                <td className="p-4 text-slate-600">{siswa.ibu}</td>
                                <td className="p-4 text-slate-600">{siswa.jobAyah}</td>
                                <td className="p-4 text-slate-600">{siswa.jobIbu}</td>
                                <td className="p-4 flex items-center gap-2">
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{siswa.username}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleViewStudent(siswa)}><Eye size={14} className="text-blue-400 cursor-pointer hover:text-blue-600" /></button>
                                        <button onClick={() => handleEditStudent(siswa)}><Edit size={14} className="text-green-400 cursor-pointer hover:text-green-600" /></button>
                                        <button onClick={() => handleDelete(siswa.nama)}><Trash2 size={14} className="text-red-400 cursor-pointer hover:text-red-600" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer controls */}
            <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                <div>
                    Menampilkan <span className="font-bold text-slate-700">{Math.min((currentPage - 1) * pageSize + 1, totalStudents)}</span> - <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, totalStudents)}</span> dari <span className="font-bold text-slate-700">{totalStudents}</span> siswa
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span>Pilih Jumlah:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={24}>24</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Prev
                        </button>
                        <span className="font-bold text-slate-700">Hal {currentPage} / {totalPages || 1}</span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPerKelasView;
