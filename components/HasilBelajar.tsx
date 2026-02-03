import React, { useState } from 'react';
import { ChevronRight, ClipboardList, FileSpreadsheet, BookOpen, GraduationCap } from 'lucide-react';
import RapotSiswa from './RapotSiswa';
import DetailNilai from './DetailNilai';

interface HasilBelajarProps {
    onBack: () => void;
    user: any;
}

const HasilBelajar: React.FC<HasilBelajarProps> = ({ onBack, user }) => {
    const [internalView, setInternalView] = useState<'menu' | 'rapot' | 'detail'>('menu');
    const [detailCategory, setDetailCategory] = useState<'Nilai Ulangan' | 'Nilai Ujian'>('Nilai Ulangan');
    const [chartData, setChartData] = useState<any[]>([]);

    React.useEffect(() => {
        const levels = ['1', '2', '3', '4', '5', '6'];
        const colors = ['bg-yellow-400', 'bg-[#9F8FEF]', 'bg-[#EE8686]', 'bg-[#8DBF82]', 'bg-[#4AB7CC]', 'bg-orange-400'];
        const borders = ['border-yellow-600', 'border-[#7c69db]', 'border-[#d66565]', 'border-[#6ea063]', 'border-[#388A99]', 'border-orange-600'];

        const dynamicData: any[] = [];
        const studentName = user?.studentName || user?.nama;
        const currentClass = user?.studentClass || '1A';
        const parallel = currentClass.replace(/\d+/, '');

        levels.forEach((lvl, idx) => {
            const className = `${lvl}${parallel}`;
            let totalGrade = 0;
            let subjectCount = 0;

            const studentId = (user?.studentId || user?.id || user?.nis || '').toString();
            const savedSubjects = localStorage.getItem('subjects_data_v2');
            const subjects = savedSubjects ? JSON.parse(savedSubjects) : [];
            const semesterStr = "1 (Ganjil)"; // Default for overall trend, or can be dynamic

            for (const sub of subjects) {
                const key = `grades_v2_${className}_${sub.name}_${semesterStr}`;
                const saved = localStorage.getItem(key);
                if (saved) {
                    try {
                        const data = JSON.parse(saved);
                        const student = data.find((s: any) => {
                            const rowId = (s.studentId || s.id || s.nis || '').toString();
                            return (rowId && rowId === studentId) ||
                                (s.studentName?.toLowerCase() === (user?.studentName || user?.nama || '').toLowerCase());
                        });
                        if (student && student.finalScore) {
                            totalGrade += student.finalScore;
                            subjectCount++;
                        }
                    } catch (e) { }
                }
            }

            if (subjectCount > 0) {
                dynamicData.push({
                    label: `Kelas ${lvl}`,
                    value: Math.round(totalGrade / subjectCount),
                    color: colors[idx],
                    borderColor: borders[idx]
                });
            }
        });

        if (dynamicData.length === 0) {
            setChartData([{ label: 'No Data', value: 0, color: 'bg-slate-200', borderColor: 'border-slate-300' }]);
        } else {
            setChartData(dynamicData);
        }
    }, [user]);

    if (internalView === 'rapot') {
        return <RapotSiswa onBack={() => setInternalView('menu')} user={user} />;
    }

    if (internalView === 'detail') {
        return <DetailNilai onBack={() => setInternalView('menu')} category={detailCategory} user={user} />;
    }

    const handleMenuClick = (label: string) => {
        if (label === 'Rapot Semester') {
            setInternalView('rapot');
        } else if (label === 'Nilai Ulangan') {
            setDetailCategory('Nilai Ulangan');
            setInternalView('detail');
        } else if (label === 'Nilai Ujian') {
            setDetailCategory('Nilai Ujian');
            setInternalView('detail');
        }
    };


    // Helper to calculate polyline points dynamically based on data length
    const getPolylinePoints = () => {
        const count = chartData.length;
        if (count === 0) return "";
        const segmentWidth = 100 / count;

        return chartData.map((data, index) => {
            const x = (segmentWidth / 2) + (index * segmentWidth);
            const y = 100 - data.value; // Inverted Y-axis
            return `${x}%,${y}%`;
        }).join(' ');
    };

    const count = chartData.length;
    const segmentWidth = count > 0 ? 100 / count : 0;
    const lastPoint = count > 0 ? chartData[count - 1] : { value: 0 };
    const lastX = count > 0 ? (segmentWidth / 2) + ((count - 1) * segmentWidth) : 0;
    const lastY = count > 0 ? 100 - lastPoint.value : 100;

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 h-full flex flex-col">
            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-emerald-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight className="rotate-180" size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">Hasil Belajar</h3>
                    <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Capaian Akademik Siswa</p>
                </div>
            </div>

            <div className="p-4 sm:p-10 flex-1 overflow-y-auto scrollbar-hide">
                {/* Submenus */}
                <div className="grid grid-cols-3 gap-3 sm:gap-10 mb-8 sm:mb-12">
                    {[
                        { label: 'Nilai Ulangan', icon: <ClipboardList size={28} className="sm:w-10 sm:h-10" />, color: 'bg-gradient-to-br from-blue-500 to-indigo-700' },
                        { label: 'Nilai Ujian', icon: <FileSpreadsheet size={28} className="sm:w-10 sm:h-10" />, color: 'bg-gradient-to-br from-violet-500 to-purple-700' },
                        { label: 'Rapot Semester', icon: <BookOpen size={28} className="sm:w-10 sm:h-10" />, color: 'bg-gradient-to-br from-emerald-500 to-teal-700' }
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleMenuClick(item.label)}
                            className="flex flex-col items-center gap-3 sm:gap-6 group transition-all"
                        >
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2.5rem] ${item.color} text-white flex items-center justify-center shadow-xl shadow-blue-900/10 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 relative overflow-hidden active:scale-95`}>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                {React.cloneElement(item.icon, { strokeWidth: 2.5 } as any)}
                            </div>
                            <span className="text-[9px] sm:text-xs md:text-sm text-center font-black text-slate-600 leading-tight group-hover:text-[#004AAD] transition-colors uppercase tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="bg-slate-50/50 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 border-2 border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                            <GraduationCap size={18} sm:size={22} strokeWidth={2.5} />
                        </div>
                        <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight">Grafik Capaian Belajar</h4>
                    </div>

                    <div className="relative h-60 sm:h-72 w-full pr-2 sm:pr-4 pb-8 sm:pb-4">
                        {/* Chart Container with Axes */}
                        <div className="relative h-full w-full border-l-[3px] sm:border-l-4 border-b-[3px] sm:border-b-4 border-slate-300 flex items-end justify-around px-1 sm:px-4">

                            {/* Axis Arrow Heads */}
                            <div className="absolute -top-3 -left-[5px] sm:-left-[8px] w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-transparent border-r-[4px] sm:border-r-[6px] border-r-transparent border-b-[8px] sm:border-b-[12px] border-b-slate-300"></div>
                            <div className="absolute -bottom-[5px] sm:-bottom-[8px] -right-3 w-0 h-0 border-t-[4px] sm:border-t-transparent border-b-[4px] sm:border-b-transparent border-l-[8px] sm:border-l-[12px] border-l-slate-300"></div>

                            {/* Dynamic Bars */}
                            {chartData.map((data, index) => (
                                <div
                                    key={index}
                                    className={`w-[14%] max-w-[45px] ${data.color} rounded-t-lg sm:rounded-t-xl relative group cursor-pointer hover:brightness-110 transition-all shadow-lg hover:-translate-y-1`}
                                    style={{ height: `${data.value * 0.8}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] sm:text-[11px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap z-20">
                                        {data.label}: {data.value}
                                    </div>
                                    <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-black text-slate-500 whitespace-nowrap uppercase tracking-tighter">
                                        {data.label}
                                    </div>
                                </div>
                            ))}

                            {/* Trend Line (SVG Overlay) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" style={{ overflow: 'visible' }}>
                                <polyline
                                    points={getPolylinePoints()}
                                    fill="none"
                                    stroke="#F59E0B"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="drop-shadow-lg"
                                />
                                {/* Arrow Head at the end of line */}
                                <path
                                    d={`M ${lastX}% ${lastY}% l -6 8 m 6 -8 l -10 2`}
                                    stroke="#F59E0B"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                />
                            </svg>

                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-12 bg-white/50 p-3 rounded-2xl w-fit">
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                        <p className="text-[10px] md:text-xs text-slate-500 font-extrabold uppercase tracking-widest">Keterangan: Tren Nilai Akademik Siswa</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HasilBelajar;
