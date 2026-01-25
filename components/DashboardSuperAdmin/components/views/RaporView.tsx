import React, { useState, useRef } from 'react';
import { Printer, User, ArrowLeft } from 'lucide-react';
import { studentsDataGlobal, classesDataGlobal, schoolSettingsGlobal, teachersDataGlobal } from '../../../../data/sharedData';

// Types for the Report Card Data
interface RaporData {
    studentId: number;
    semester: string; // '1 (Ganjil)' or '2 (Genap)'
    year: string;
    sick: number;
    permission: number;
    alpha: number;
    notes: string;
    decision?: string; // e.g., "Naik ke Kelas 2"
}

interface RaporViewProps {
    setActiveView: (view: string) => void;
}

const ERapor: React.FC<RaporViewProps> = ({ setActiveView }) => {
    // State
    const [selectedClass, setSelectedClass] = useState(classesDataGlobal.length > 0 ? classesDataGlobal[0].nama : '');
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
                } catch (e) { console.error('Error parsing mock_descriptions', e); }
            }
        }
        return defaultVal;
    };

    // Mock Data for the selected student's report
    // In a real app, this would be fetched based on selectedStudentId
    const reportData = {
        schoolName: schoolSettingsGlobal.name,
        schoolAddress: schoolSettingsGlobal.address,
        studentName: selectedStudentId ? studentsDataGlobal.find(s => s.id === selectedStudentId)?.nama || "Nama Siswa" : "Nama Siswa",
        nis: selectedStudentId ? studentsDataGlobal.find(s => s.id === selectedStudentId)?.nis || "123456" : "123456",
        nisn: "0012345678",
        class: selectedClass,
        semester: selectedSemester,
        year: schoolSettingsGlobal.academicYear || "2025/2026",
        subjects: [
            { id: 1, name: "Pendidikan Agama dan Budi Pekerti", k_nilai: 85, k_predikat: "B", k_desc: getDynamicDesc('k', "Baik dalam pemahaman"), s_nilai: 86, s_predikat: "B", s_desc: getDynamicDesc('s', "Terampil mempraktikkan") },
            { id: 2, name: "Pendidikan Pancasila", k_nilai: 90, k_predikat: "A", k_desc: "Sangat baik", s_nilai: 90, s_predikat: "A", s_desc: "Sangat terampil" },
            { id: 3, name: "Bahasa Indonesia", k_nilai: 78, k_predikat: "A", k_desc: "Baik", s_nilai: 80, s_predikat: "B", s_desc: "Cukup terampil" },
            { id: 4, name: "Matematika", k_nilai: 82, k_predikat: "B", k_desc: "Perlu bimbingan di perkalian", s_nilai: 85, s_predikat: "B", s_desc: "Terampil berhitung" },
            { id: 5, name: "Ilmu Pengetahuan Alam dan Sosial", k_nilai: 88, k_predikat: "A", k_desc: "Sangat memahami materi", s_nilai: 88, s_predikat: "A", s_desc: "Sangat terampil" },
            { id: 6, name: "Seni Budaya", k_nilai: 92, k_predikat: "A", k_desc: "Sangat kreatif", s_nilai: 95, s_predikat: "A", s_desc: "Hasil karya memuaskan" },
            { id: 7, name: "Pendidikan Jasmani", k_nilai: 85, k_predikat: "B", k_desc: "Bugar dan aktif", s_nilai: 87, s_predikat: "A", s_desc: "Terampil olahraga" },
            { id: 8, name: "Bahasa Inggris", k_nilai: 94, k_predikat: "A", k_desc: "Excellent", s_nilai: 92, s_predikat: "A", s_desc: "Fluent speaking" },
        ],
        attitudes: [
            { id: 1, type: "Spiritual", desc: "Ananda sangat taat beribadah, selalu berdoa sebelum dan sesudah belajar, serta berperilaku jujur dan santun." },
            { id: 2, type: "Sosial", desc: "Ananda memiliki sikap sosial yang baik, peduli terhadap teman, disiplin, dan bertanggung jawab dalam tugas piket." }
        ],
        extracurriculars: [
            { id: 1, name: "Pramuka", desc: "Aktif dan disiplin dalam kegiatan kepramukaan." },
            { id: 2, name: "Futsal", desc: "Memiliki bakat yang baik dalam olahraga futsal." }
        ],
        attendance: {
            sakit: 1,
            izin: 0,
            alpha: 0
        },
        personalities: [
            { aspect: "Kerapihan", desc: "Baik" },
            { aspect: "Kedisiplinan", desc: "Sangat Baik" },
            { aspect: "Kesehatan", desc: "Sehat" },
        ],
        summary: {
            total: 1250,
            average: 87.5,
            final: "A"
        },
        decision: "NAIK KE KELAS: 2 (DUA)",
        date: "20 Desember 2025"
    };

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = componentRef.current;
        if (printContent) {
            const originalContents = document.body.innerHTML;
            const printArea = printContent.outerHTML;

            // Create a temporary iframe for printing to avoid messing up the main DOM
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(`
                    <html>
                        <head>
                            <title>Cetak Rapor</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                                @media print {
                                    @page { size: A4; margin: 10mm; }
                                    body { -webkit-print-color-adjust: exact; font-family: 'Times New Roman', serif; }
                                    .print-break-inside-avoid { page-break-inside: avoid; }
                                }
                                body { font-family: 'Times New Roman', serif; }
                                table { border-collapse: collapse; width: 100%; }
                                th, td { border: 1px solid black; padding: 4px; font-size: 11pt; }
                                .no-border { border: none !important; }
                                .header-text { font-family: Arial, sans-serif; }
                            </style>
                        </head>
                        <body class="p-4">
                            ${printArea}
                        </body>
                    </html>
                `);
                doc.close();

                // Wait for styles/images to load then print
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    // document.body.removeChild(iframe); // Optional: remove after print
                }, 500);
            }
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            {/* HEADER & CONTROLS */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                                <Printer size={24} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Cetak E-Rapor</h2>
                                <p className="text-slate-500 text-sm font-medium">Pilih siswa dan jenis rapor untuk dicetak.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <div className="px-3 border-r border-slate-200">
                                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Semester</label>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="bg-transparent font-bold text-slate-700 outline-none text-sm cursor-pointer"
                                >
                                    <option value="1 (Ganjil)" className="text-slate-800">1 (Ganjil)</option>
                                    <option value="2 (Genap)" className="text-slate-800">2 (Genap)</option>
                                </select>
                            </div>
                            <div className="px-3 border-r border-slate-200">
                                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Kelas</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="bg-transparent font-bold text-slate-700 outline-none text-sm cursor-pointer"
                                >
                                    {classesDataGlobal.map(c => (
                                        <option key={c.id} value={c.nama} className="text-slate-800">{c.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="px-3">
                                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Siswa</label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                                    className="bg-transparent font-bold text-emerald-600 outline-none text-sm min-w-[150px] cursor-pointer"
                                >
                                    <option value="" className="text-slate-800">-- Pilih Siswa --</option>
                                    {studentsDataGlobal
                                        .filter(s => s.kelas === selectedClass)
                                        .map(s => (
                                            <option key={s.id} value={s.id} className="text-slate-800">{s.nama}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Type Tabs */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {[
                                { id: 'resmi', label: 'Rapor Resmi' },
                                { id: 'yayasan', label: 'Rapor Yayasan' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setRaporType(tab.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${raporType === tab.id
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                            <Printer size={18} />
                            Cetak / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW AREA --- */}
            <div className="flex-1 bg-slate-200/50 rounded-[2.5rem] p-8 overflow-y-auto flex justify-center custom-scrollbar">

                {/* --- A4 PAPER --- */}
                <div
                    ref={componentRef}
                    className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-xl text-black"
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="font-bold text-lg uppercase header-text" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {raporType === 'resmi' ? 'LAPORAN HASIL BELAJAR PESERTA DIDIK' : 'RAPOR HASIL BELAJAR (YAYASAN)'}
                        </h1>
                    </div>

                    {/* Student Info */}
                    <div className="flex justify-between mb-6 text-[11pt]">
                        <table className="w-full border-none">
                            <tbody>
                                <tr className="border-none">
                                    <td className="w-[150px] border-none py-1 align-top">Nama Peserta Didik</td>
                                    <td className="w-[10px] border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top font-bold">{reportData.studentName}</td>

                                    <td className="w-[50px] border-none"></td>

                                    <td className="w-[120px] border-none py-1 align-top">Kelas</td>
                                    <td className="w-[10px] border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top">{reportData.class}</td>
                                </tr>
                                <tr className="border-none">
                                    <td className="border-none py-1 align-top">NIS / NISN</td>
                                    <td className="border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top">{reportData.nis} / {reportData.nisn}</td>

                                    <td className="border-none"></td>

                                    <td className="border-none py-1 align-top">Semester</td>
                                    <td className="border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top">{reportData.semester}</td>
                                </tr>
                                <tr className="border-none">
                                    <td className="border-none py-1 align-top">Nama Sekolah</td>
                                    <td className="border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top">{reportData.schoolName}</td>

                                    <td className="border-none"></td>

                                    <td className="border-none py-1 align-top">Tahun Pelajaran</td>
                                    <td className="border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top">{reportData.year}</td>
                                </tr>
                                <tr className="border-none">
                                    <td className="border-none py-1 align-top">Alamat Sekolah</td>
                                    <td className="border-none py-1 align-top">:</td>
                                    <td className="border-none py-1 align-top" colSpan={5}>{reportData.schoolAddress}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* A. Sikap */}
                    <div className="mb-4">
                        <h3 className="font-bold text-[11pt] mb-1">A. Sikap</h3>
                        <table className="w-full border border-black">
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
                                    <td className="text-center p-1">{reportData.attendance.sakit} hari</td>
                                </tr>
                                <tr>
                                    <td className="text-center p-1">2</td>
                                    <td className="p-1">Izin</td>
                                    <td className="text-center p-1">{reportData.attendance.izin} hari</td>
                                </tr>
                                <tr>
                                    <td className="text-center p-1">3</td>
                                    <td className="p-1">Tanpa Keterangan</td>
                                    <td className="text-center p-1">{reportData.attendance.alpha} hari</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* E. Pribadian */}
                    <div className="mb-4 print-break-inside-avoid">
                        <h3 className="font-bold text-[11pt] mb-1">E. Pribadian</h3>
                        <table className="w-full border border-black text-[10pt]">
                            <thead className="bg-gray-100 text-center font-bold">
                                <tr>
                                    <th className="w-[30px]">No</th>
                                    <th>Aspek yang dinilai</th>
                                    <th>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.personalities.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="text-center p-1">{idx + 1}</td>
                                        <td className="p-1">{item.aspect}</td>
                                        <td className="p-1">{item.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* F. Nilai (Ringkasan) */}
                    {/* Based on image, it looks like a summary table */}
                    <div className="mb-6 print-break-inside-avoid">
                        <h3 className="font-bold text-[11pt] mb-1">F. Nilai</h3>
                        <table className="w-full border border-black text-[10pt]">
                            <thead className="bg-gray-100 text-center font-bold">
                                <tr>
                                    <th className="w-[30px]">No</th>
                                    <th>Jumlah</th>
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
                                <p className="font-bold underline uppercase">{schoolSettingsGlobal.principal || "H. AHMAD FULAN, M.Pd"}</p>
                                <p>NIP. {schoolSettingsGlobal.nipPrincipal || "19800101 200501 1 001"}</p>
                            </div>

                            <div className="w-[200px]">
                                <p className="mb-20">Wali Kelas</p>
                                <p className="font-bold underline uppercase">
                                    {classesDataGlobal.find(c => c.nama === selectedClass)?.wali || "SITI AMINAH, S.Pd"}
                                </p>
                                <p>NIP/NKTAM. {
                                    teachersDataGlobal.find(t => t.nama === (classesDataGlobal.find(c => c.nama === selectedClass)?.wali))?.nip || "-"
                                }</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ERapor;
