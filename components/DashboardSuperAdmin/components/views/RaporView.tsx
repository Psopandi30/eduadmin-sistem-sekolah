import React, { useState, useRef } from 'react';
import { Printer, User, ArrowLeft } from 'lucide-react';
import { logger } from '../../../../src/utils/logger';

// Types for the Report Card Data
interface RaporData {
    studentId: number;
    semester: string;
    year: string;
    sick: number;
    permission: number;
    alpha: number;
    notes: string;
    decision?: string;
}

interface RaporViewProps {
    setActiveView: (view: string) => void;
    students: any[];
    classes: any[];
    subjects: any[];
    schoolSettings: any;
    teachers: any[];
}

const ERapor: React.FC<RaporViewProps> = ({ setActiveView, students, classes, subjects, schoolSettings, teachers }) => {
    // State
    const [selectedClass, setSelectedClass] = useState(classes.length > 0 ? classes[0].nama : '');
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');
    const [selectedStudentId, setSelectedStudentId] = useState<number | string>('');
    const [raporType, setRaporType] = useState<'resmi' | 'yayasan'>('resmi');

    // Helper to get dynamic description from Settings (localStorage)
    const getDynamicDesc = (type: 'k' | 's', defaultVal: string) => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mock_descriptions');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    // Use the latest description added in Settings as a demo
                    if (data.length > 0) {
                        const latest = data[data.length - 1];
                        return type === 'k' ? latest.knowledge : latest.skill;
                    }
                } catch (e) { logger.error('Error parsing mock_descriptions', e); }
            }
        }
        return defaultVal;
    };

    // --- REAL DATA INTEGRATION ---
    const getRealReportData = () => {
        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return null;

        // Use subjects prop to iterate
        const subjectsWithGrades = subjects.map((sub: any) => {
            const storageKey = `grades_v2_${selectedClass}_${sub.name}_${selectedSemester}`;
            const savedGrades = localStorage.getItem(storageKey);
            let k_nilai = 0;
            let predikat = 'D';
            let desc = '-';

            if (savedGrades) {
                try {
                    const parsed = JSON.parse(savedGrades);
                    const record = parsed.find((g: any) => g.studentId === selectedStudentId);
                    if (record) {
                        k_nilai = record.finalScore || 0;
                        predikat = record.predicate || 'D';
                        desc = record.description || '-';
                    }
                } catch (e) {
                    logger.error("Error building report for " + sub.name, e);
                }
            }

            return {
                id: sub.id,
                name: sub.name,
                k_nilai: k_nilai,
                k_predikat: predikat,
                k_desc: desc,
                s_nilai: k_nilai, // Simplified: mirrors knowledge for now
                s_predikat: predikat,
                s_desc: desc
            };
        });

        // Pull Supplementary Data (from Wali Kelas)
        const suppKey = `rapor_supp_${selectedClass}_${selectedStudentId}_${selectedSemester}`;
        const savedSupp = localStorage.getItem(suppKey);
        const supp = savedSupp ? JSON.parse(savedSupp) : {
            attitudes: [
                { id: 1, type: "Spiritual", desc: "Ananda sangat taat beribadah dan berperilaku jujur." },
                { id: 2, type: "Sosial", desc: "Ananda memiliki sikap sosial yang baik dan disiplin." }
            ],
            extracurriculars: [{ id: 1, name: "-", desc: "-" }],
            attendance: { sakit: 0, izin: 0, alpha: 0 },
            personalities: [
                { aspect: "Kerapihan", desc: "Baik" },
                { aspect: "Kedisiplinan", desc: "Baik" },
                { aspect: "Kesehatan", desc: "Baik" },
                { aspect: "Tanggung Jawab", desc: "Baik" }
            ],
            notes: "Tingkatkan terus prestasimu.",
            decision: "NAIK KE KELAS BERIKUTNYA"
        };

        // Calculate Summary
        const totalScore = subjectsWithGrades.reduce((acc, curr) => acc + curr.k_nilai, 0);
        const avgScore = subjectsWithGrades.length > 0 ? (totalScore / subjectsWithGrades.length).toFixed(1) : 0;

        return {
            studentName: student.nama,
            nis: student.nis,
            nisn: student.nisn || '',
            class: selectedClass,
            semester: selectedSemester,
            academicYear: schoolSettings.academicYear || "2025/2026",
            subjects: subjectsWithGrades,
            attitudes: supp.attitudes,
            extracurriculars: supp.extracurriculars,
            attendance: supp.attendance,
            personalities: supp.personalities,
            notes: supp.notes,
            decision: supp.decision,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            summary: {
                total: totalScore,
                average: avgScore,
                final: predikatGlobal(Number(avgScore))
            }
        };
    };

    const predikatGlobal = (val: number) => {
        if (val >= 90) return 'A';
        if (val >= 80) return 'B';
        if (val >= 70) return 'C';
        return 'D';
    };

    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        window.print();
    };

    const reportData = getRealReportData();

    // Derived Data for Rendering
    const currentClassObj = classes.find(c => c.nama === selectedClass);
    const waliKelasName = currentClassObj?.wali || '-';
    // Find teacher object to get NIP
    const waliKelasObj = teachers.find(t => t.name === waliKelasName || t.nama === waliKelasName);
    const waliKelasNIP = waliKelasObj?.nip || '-';

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header / Controls */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end mb-6 print:hidden">
                <div className="flex items-center gap-4 mr-auto">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Printer size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Cetak E-Rapor</h2>
                        <p className="text-slate-500 text-sm">Pilih siswa dan jenis rapor untuk dicetak.</p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-4">
                    <div className="w-[150px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Semester</label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="1 (Ganjil)">1 (Ganjil)</option>
                            <option value="2 (Genap)">2 (Genap)</option>
                        </select>
                    </div>
                    <div className="w-[120px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Kelas</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedStudentId('');
                            }}
                            className="w-full p-2.5 bg-slate-50 border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.nama}>{c.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-[200px]">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Siswa</label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                            className="w-full p-2.5 bg-slate-50 border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Pilih Siswa --</option>
                            {students
                                .filter(s => s.kelas === selectedClass)
                                .map(s => (
                                    <option key={s.id} value={s.id}>{s.nama}</option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 items-end">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setRaporType('resmi')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${raporType === 'resmi' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Rapor Resmi
                        </button>
                        <button
                            onClick={() => setRaporType('yayasan')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${raporType === 'yayasan' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Rapor Yayasan
                        </button>
                    </div>

                    <button
                        onClick={handlePrint}
                        disabled={!selectedStudentId}
                        className="bg-[#009b4d] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#007a3d] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                    >
                        <Printer size={18} /> Cetak / PDF
                    </button>
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 bg-slate-200/50 rounded-3xl p-8 overflow-y-auto custom-scrollbar flex justify-center">
                {!reportData ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 mt-20">
                        <User size={64} className="mb-4" />
                        <p className="text-xl font-bold">Mohon pilih siswa untuk menampilkan rapor.</p>
                    </div>
                ) : (
                    <div ref={componentRef} className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-xl text-black print-area">
                        {/* KOP SURAT (DUMMY) */}
                        <div className="border-b-4 border-black pb-4 mb-6 text-center flex items-center justify-center gap-6 relative">
                            {schoolSettings.logo && <img src={schoolSettings.logo} className="w-24 h-24 object-contain absolute left-0 top-0" alt="Logo" />}
                            <div>
                                <h1 className="text-2xl font-bold uppercase">{raporType === 'resmi' ? 'Laporan Hasil Belajar' : 'Rapor Yayasan'}</h1>
                                <h2 className="text-3xl font-black uppercase tracking-wider mt-1">{schoolSettings.name}</h2>
                                <p className="text-sm mt-1">{schoolSettings.address}</p>
                            </div>
                        </div>

                        {/* STUDENT INFO TABLE */}
                        <div className="grid grid-cols-2 gap-8 mb-6 text-[11pt]">
                            <table className="w-full">
                                <tbody>
                                    <tr><td className="w-[150px] py-1">Nama Peserta Didik</td><td className="py-1">: <b>{reportData.studentName}</b></td></tr>
                                    <tr><td className="py-1">NIS / NISN</td><td className="py-1">: {reportData.nis} / {reportData.nisn}</td></tr>
                                    <tr><td className="py-1">Nama Sekolah</td><td className="py-1">: {schoolSettings.name}</td></tr>
                                    <tr><td className="py-1">Alamat Sekolah</td><td className="py-1">: {schoolSettings.address}</td></tr>
                                </tbody>
                            </table>
                            <table className="w-full">
                                <tbody>
                                    <tr><td className="w-[120px] py-1 align-top">Kelas</td><td className="py-1 align-top">: {reportData.class}</td></tr>
                                    <tr><td className="py-1 align-top">Semester</td><td className="py-1 align-top">: {reportData.semester}</td></tr>
                                    <tr><td className="py-1 align-top">Tahun Pelajaran</td><td className="py-1 align-top">: {reportData.academicYear}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        {/* A. SIKAP */}
                        <div className="mb-4">
                            <h3 className="font-bold text-[11pt] mb-1">A. Sikap</h3>
                            <table className="w-full border border-black text-[10pt]">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-black p-1 text-center font-bold" colSpan={2}>Deskripsi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.attitudes.map((att, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-2 align-top w-[150px] font-bold indent-2">{idx + 1}. {att.type}</td>
                                            <td className="border border-black p-2 align-top text-justify min-h-[50px]">
                                                {att.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* B. Pengetahuan dan keterampilan */}
                        <div className="mb-4">
                            <h3 className="font-bold text-[11pt] mb-1">B. Pengetahuan dan keterampilan</h3>
                            <table className="w-full border border-black text-[10pt]">
                                <thead className="bg-gray-100 text-center font-bold">
                                    <tr>
                                        <th rowSpan={2} className="w-[30px]">No</th>
                                        <th rowSpan={2} className="w-[200px]">Muatan Pelajaran</th>
                                        <th colSpan={3}>Pengetahuan</th>
                                        <th colSpan={3}>Keterampilan</th>
                                    </tr>
                                    <tr>
                                        <th className="w-[40px]">Nilai</th>
                                        <th className="w-[40px]">Predikat</th>
                                        <th>Deskripsi</th>
                                        <th className="w-[40px]">Nilai</th>
                                        <th className="w-[40px]">Predikat</th>
                                        <th>Deskripsi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.subjects.map((sub, idx) => (
                                        <tr key={idx}>
                                            <td className="text-center align-middle">{idx + 1}</td>
                                            <td className="p-1 align-middle">{sub.name}</td>

                                            {/* Pengetahuan */}
                                            <td className="text-center align-middle">{sub.k_nilai}</td>
                                            <td className="text-center align-middle">{sub.k_predikat}</td>
                                            <td className="text-xs p-1 align-middle text-justify">{sub.k_desc}</td>

                                            {/* Keterampilan */}
                                            <td className="text-center align-middle">{sub.s_nilai}</td>
                                            <td className="text-center align-middle">{sub.s_predikat}</td>
                                            <td className="text-xs p-1 align-middle text-justify">{sub.s_desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* C. Ekstrakurikuler */}
                        <div className="mb-4 print-break-inside-avoid">
                            <h3 className="font-bold text-[11pt] mb-1">C. Ekstrakurikuler</h3>
                            <table className="w-full border border-black text-[10pt]">
                                <thead className="bg-gray-100 text-center font-bold">
                                    <tr>
                                        <th className="w-[30px]">No</th>
                                        <th>Kegiatan Ekstrakurikuler</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.extracurriculars.map((ekskul, idx) => (
                                        <tr key={idx}>
                                            <td className="text-center p-1">{idx + 1}</td>
                                            <td className="p-1 font-medium">{ekskul.name}</td>
                                            <td className="p-1">{ekskul.desc}</td>
                                        </tr>
                                    ))}
                                    {/* Empty row if needed */}
                                    <tr>
                                        <td className="text-center p-1">&nbsp;</td>
                                        <td className="p-1"></td>
                                        <td className="p-1"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* D. Ketidakhadiran */}
                        <div className="mb-4 print-break-inside-avoid">
                            <h3 className="font-bold text-[11pt] mb-1">D. Ketidakhadiran</h3>
                            <table className="w-full border border-black text-[10pt]">
                                <thead className="bg-gray-100 text-center font-bold">
                                    <tr>
                                        <th className="w-[30px]">No</th>
                                        <th>Aspek yang dinilai</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-center p-1">1</td>
                                        <td className="p-1">Sakit</td>
                                        <td className="text-center p-1">{reportData.attendance.sakit} Hari</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center p-1">2</td>
                                        <td className="p-1">Izin</td>
                                        <td className="text-center p-1">{reportData.attendance.izin} Hari</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center p-1">3</td>
                                        <td className="p-1">Tanpa Keterangan</td>
                                        <td className="text-center p-1">{reportData.attendance.alpha} Hari</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* SUMMARY */}
                        <div className="mb-6 print-break-inside-avoid">
                            <h3 className="font-bold text-[11pt] mb-1">E. Rekapitulasi Nilai</h3>
                            <table className="w-full border border-black text-[10pt]">
                                <thead className="bg-gray-100 text-center font-bold">
                                    <tr>
                                        <th className="w-[30px]">No</th>
                                        <th>Jumlah Nilai</th>
                                        <th>Rata-rata</th>
                                        <th>Nilai akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-center p-2">1</td>
                                        <td className="text-center p-2 font-bold">{reportData.summary.total}</td>
                                        <td className="text-center p-2 font-bold">{reportData.summary.average}</td>
                                        <td className="text-center p-2 font-bold">{reportData.summary.final}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* KEPUTUSAN */}
                        {/* KEPUTUSAN - Only show in Even Semester */}
                        {selectedSemester.includes('Genap') && (
                            <div className="flex gap-0 mb-8 border border-black print-break-inside-avoid">
                                <div className="w-[150px] border-r border-black p-3 font-bold flex items-center justify-center">
                                    Keputusan
                                </div>
                                <div className="flex-1 p-3">
                                    <p className="text-sm">Berdasarkan hasil yang dicapai pada semester ini, peserta didik ditetapkan :</p>
                                    <p className="font-bold uppercase text-lg mt-1">{reportData.decision}</p>
                                </div>
                            </div>
                        )}

                        {/* FOOTER & SIGNATURES */}
                        <div className="text-[11pt] print-break-inside-avoid">
                            <div className="flex justify-end mb-8">
                                <div className="text-left w-[250px]">
                                    <p>Di berikan di : Jakarta</p>
                                    <p>Tanggal : {reportData.date}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-start text-center">
                                <div className="w-[200px]">
                                    <p className="mb-20">Orang Tua / Wali Siswa</p>
                                    <p className="font-bold border-b border-black border-dotted inline-block min-w-[150px]"></p>
                                </div>

                                <div className="w-[200px]">
                                    <p className="mb-20">Kepala Sekolah</p>
                                    <p className="font-bold underline uppercase">{schoolSettings.principal || "H. AHMAD FULAN, M.Pd"}</p>
                                    <p>NIP. {schoolSettings.nipPrincipal || "-"}</p>
                                </div>

                                <div className="w-[200px]">
                                    <p className="mb-20">Wali Kelas</p>
                                    <p className="font-bold underline uppercase">
                                        {waliKelasName}
                                    </p>
                                    <p>NIP/NKTAM. {waliKelasNIP}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ERapor;
