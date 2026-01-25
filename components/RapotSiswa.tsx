import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface RapotSiswaProps {
    onBack: () => void;
    user?: any;
}

const RapotSiswa: React.FC<RapotSiswaProps> = ({ onBack, user }) => {
    const [selectedClass, setSelectedClass] = useState(user?.studentClass || '1A');
    const [selectedSemester, setSelectedSemester] = useState('Semester 1');
    const [rapotType, setRapotType] = useState<'diknas' | 'yayasan'>('diknas');

    // Standard subjects list matching NilaiView
    const subjectList = [
        "Pendidikan Agama", "Pendidikan Pancasila", "Bahasa Indonesia",
        "Matematika", "IPAS", "Seni Budaya", "PJOK", "Bahasa Inggris"
    ];

    const [subjects, setSubjects] = useState<any[]>([]);

    useEffect(() => {
        const loadGrades = () => {
            const currentSemesterFull = selectedSemester === 'Semester 1' ? '1 (Ganjil)' : '2 (Genap)';
            const loadedSubjects: any[] = [];

            subjectList.forEach((subj, index) => {
                // Key format from NilaiView: grades_v1_${selectedClass}_${selectedSubject}_${selectedSemester}
                const key = `grades_v1_${selectedClass}_${subj}_${currentSemesterFull}`;
                const localData = localStorage.getItem(key);

                let daily = 0;
                let exam = 0;
                let report = 0;
                let teacher = 'Guru Mapel'; // Placeholder or fetch if available

                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        // Find student data
                        // Matching by Name is safest if NIS isn't strictly passed, but mostly User has Name
                        const studentRow = parsed.find((s: any) => s.studentName === user?.studentName || s.studentName === user?.nama);

                        if (studentRow) {
                            daily = studentRow.avgSumatif || 0;
                            // Exam: Take max of PAS/PAT or just specific field? 
                            // NilaiView logic uses max, but let's just show PAS (Sem 1) or PAT (Sem 2) if we want specific
                            // Or just use the weighted calculation components if we want to reverse engineer.
                            // Let's use 'pts' + 'pas' average or just 'pas' for simplicity in this view
                            exam = Math.max(studentRow.pas || 0, studentRow.pat || 0, studentRow.ujisn || 0);
                            report = studentRow.finalScore || 0;
                        }
                    } catch (e) {
                        console.error("Error parsing grades for " + subj, e);
                    }
                }

                loadedSubjects.push({
                    id: index + 1,
                    name: subj,
                    teacher: teacher,
                    daily: daily,
                    exam: exam,
                    report: report
                });
            });

            setSubjects(loadedSubjects);
        };

        loadGrades();
    }, [selectedClass, selectedSemester, user]);

    // Calculate Averages
    const averageDaily = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.daily, 0) / subjects.length) : 0;
    const averageExam = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.exam, 0) / subjects.length) : 0;
    const averageReport = subjects.length > 0 ? Math.round(subjects.reduce((acc, curr) => acc + curr.report, 0) / subjects.length) : 0;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">Nilai Rapot Persemester</h3>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {/* RAPOT TABS (Diknas / Yayasan) */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                    {['Rapot Diknas', 'Rapot Yayasan'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setRapotType(tab === 'Rapot Diknas' ? 'diknas' : 'yayasan')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${(rapotType === 'diknas' && tab === 'Rapot Diknas') || (rapotType === 'yayasan' && tab === 'Rapot Yayasan')
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-slate-600 font-bold whitespace-nowrap">Kelas</label>
                        <div className="relative w-full">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option>1A</option>
                                <option>1B</option>
                                <option>2A</option>
                                <option>2B</option>
                                <option>3A</option>
                                <option>3B</option>
                                <option>4A</option>
                                <option>4B</option>
                                <option>5A</option>
                                <option>5B</option>
                                <option>6A</option>
                                <option>6B</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <label className="text-slate-600 font-bold whitespace-nowrap">Semester</label>
                        <div className="relative w-full">
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option>Semester 1</option>
                                <option>Semester 2</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                {/* Subject List */}
                <div className="space-y-3 pb-20">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="border border-slate-300 rounded-2xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">Mata pelajaran</p>
                                    <h4 className="font-bold text-slate-800 text-sm">{subject.id}. {subject.name}</h4>
                                    <p className="text-[10px] text-slate-500">{subject.teacher}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-6 mt-1 text-center">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">Nilai Harian</p>
                                    <p className="text-sm font-bold text-slate-800">{subject.daily}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">Ujian</p>
                                    <p className="text-sm font-bold text-slate-800">{subject.exam}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold mb-0.5">Rapot</p>
                                    <p className="text-sm font-extrabold text-slate-900">{subject.report}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer - Average */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                <div className="border border-slate-300 rounded-2xl p-4 bg-white flex items-center justify-between shadow-sm">
                    <span className="font-bold text-slate-800 text-sm">Nilai Rata-Rata</span>
                    <div className="flex gap-6 text-center">
                        <div className="w-12">
                            <p className="text-[10px] text-slate-500 font-bold mb-0.5">Nilai Harian</p>
                            <p className="text-sm font-bold text-slate-800">{averageDaily}</p>
                        </div>
                        <div className="w-10">
                            <p className="text-[10px] text-slate-500 font-bold mb-0.5">Ujian</p>
                            <p className="text-sm font-bold text-slate-800">{averageExam}</p>
                        </div>
                        <div className="w-10">
                            <p className="text-[10px] text-slate-500 font-bold mb-0.5">Rapot</p>
                            <p className="text-sm font-extrabold text-slate-900">{averageReport}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RapotSiswa;
