import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Save, Zap, RotateCcw, FolderPlus,
    CheckCircle, Edit, Plus, GripVertical, X, Shirt, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MasterExamSchedule, DAYS } from '../../types';

interface JadwalUjianViewProps {
    subjects: any[];
    classes: any[];
    examSchedules: MasterExamSchedule[];
    saveExams: (newSchedules: MasterExamSchedule[]) => Promise<void>;
    setExamSchedules: React.Dispatch<React.SetStateAction<MasterExamSchedule[]>>;
    setConfirmModal: (modal: any) => void;
}

const JadwalUjianView: React.FC<JadwalUjianViewProps> = ({
    subjects,
    classes,
    examSchedules,
    saveExams,
    setExamSchedules,
    setConfirmModal
}) => {
    // --- LOCAL UI STATE ---
    const [activeExamId, setActiveExamId] = useState<number | null>(
        (examSchedules && examSchedules.length > 0) ? examSchedules[0].id : null
    );

    const [showExamModal, setShowExamModal] = useState(false);
    const [newExamData, setNewExamData] = useState<any>({
        type: 'PTS',
        semester: 'Ganjil',
        year: '2025/2026'
    });

    const [selectedExamTingkat, setSelectedExamTingkat] = useState('1');
    const [selectedExamClass, setSelectedExamClass] = useState('');

    // Auto-select first exam when loaded
    useEffect(() => {
        if (!activeExamId && examSchedules && examSchedules.length > 0) {
            setActiveExamId(examSchedules[0].id);
        }
    }, [examSchedules, activeExamId]);


    const [examTimeSlots, setExamTimeSlots] = useState<any[]>(() => {
        const saved = localStorage.getItem('exam_time_slots_v2');
        return saved ? JSON.parse(saved) : [
            { id: 1, start: '07:30', end: '09:00' },
            { id: 2, start: '09:30', end: '11:00' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('exam_time_slots_v2', JSON.stringify(examTimeSlots));
    }, [examTimeSlots]);

    const [showExamTimeModal, setShowExamTimeModal] = useState(false);
    const [newExamTime, setNewExamTime] = useState({ start: '', end: '' });

    const [examScheduleItems, setExamScheduleItems] = useState<Record<string, any>>(() => {
        const saved = localStorage.getItem('exam_schedule_items_v2');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('exam_schedule_items_v2', JSON.stringify(examScheduleItems));
    }, [examScheduleItems]);

    const [examDraggedItem, setExamDraggedItem] = useState<any>(null);

    const [examDailyUniforms, setExamDailyUniforms] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('exam_daily_uniforms_v2');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('exam_daily_uniforms_v2', JSON.stringify(examDailyUniforms));
    }, [examDailyUniforms]);

    const [showExamUniformModal, setShowExamUniformModal] = useState(false);
    const [selectedDayForExamUniform, setSelectedDayForExamUniform] = useState('');
    const [tempExamUniform, setTempExamUniform] = useState('');

    const [examDailyNotes, setExamDailyNotes] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('exam_daily_notes_v2');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('exam_daily_notes_v2', JSON.stringify(examDailyNotes));
    }, [examDailyNotes]);

    const [showExamNoteModal, setShowExamNoteModal] = useState(false);
    const [selectedDayForExamNote, setSelectedDayForExamNote] = useState('');
    const [tempExamNote, setTempExamNote] = useState('');

    // Set initial class when tingkat changes
    useEffect(() => {
        const filtered = classes.filter(c => c.tingkat?.toString() === selectedExamTingkat);
        if (filtered.length > 0) {
            setSelectedExamClass(filtered[0].nama);
        }
    }, [selectedExamTingkat, classes]);

    const handleAddExamType = () => {
        const newId = Date.now();
        const newExam: MasterExamSchedule = {
            id: newId,
            type: newExamData.type,
            semester: newExamData.semester,
            year: newExamData.year,
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        const updated = [...(examSchedules || []), newExam];

        setExamSchedules(updated);
        saveExams(updated);
        setActiveExamId(newId);
        setShowExamModal(false);
        toast.success(`Jenis Ujian ${newExamData.type} ditambahkan`);
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-4 h-full shadow-sm animate-in fade-in flex flex-col overflow-hidden">
            {/* Header & Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <ClipboardList size={28} className="text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold text-[#1E1B4B]">Manajemen Jadwal Ujian</h2>
                        <p className="text-slate-500 text-sm">Atur jadwal, sesi, dan seragam ujian.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => saveExams(examSchedules)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        <Save size={16} /> Simpan Semua
                    </button>
                    <button onClick={() => {
                        if (!activeExamId) return;
                        const updated = (examSchedules || []).map(ex => ex.id === activeExamId ? { ...ex, status: 'published' } : ex);

                        saveExams(updated);
                        toast.success("Jadwal Ujian Dipublikasikan!");
                    }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                        <Zap size={16} /> Publikasikan
                    </button>
                    <button onClick={() => setShowExamModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors shadow-lg">
                        <FolderPlus size={16} /> Tambah Jenis Ujian
                    </button>
                </div>
            </div>

            {/* Selector Row */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Jenis Ujian Aktif</label>
                    <select
                        value={activeExamId || ''}
                        onChange={(e) => setActiveExamId(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:border-blue-500"
                    >
                        {(!examSchedules || examSchedules.length === 0) && <option value="">Belum ada jadwal</option>}
                        {(examSchedules || []).map(exam => (
                            <option key={exam.id} value={exam.id}>{exam.type} - {exam.semester} {exam.year}</option>
                        ))}

                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tingkat</label>
                        <select
                            value={selectedExamTingkat}
                            onChange={(e) => setSelectedExamTingkat(e.target.value)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-blue-700 text-sm outline-none focus:border-blue-500"
                        >
                            {['1', '2', '3', '4', '5', '6'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kelas</label>
                        <select
                            value={selectedExamClass}
                            onChange={(e) => setSelectedExamClass(e.target.value)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-blue-700 text-sm outline-none focus:border-blue-500"
                        >
                            {classes.filter(c => c.tingkat?.toString() === selectedExamTingkat).map(c => (
                                <option key={c.id} value={c.nama}>{c.nama}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex-none">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                    <div className="h-10 flex items-center">
                        {activeExamId ? (
                            (examSchedules || []).find(e => e.id === activeExamId)?.status === 'published' ? (

                                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                                    <CheckCircle size={12} /> TERBIT
                                </span>
                            ) : (
                                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                                    <Edit size={12} /> DRAFT
                                </span>
                            )
                        ) : '-'}
                    </div>
                </div>
                <button onClick={() => {
                    setConfirmModal({
                        show: true,
                        message: 'Reset semua jadwal ujian? Tindakan ini tidak bisa dibatalkan.',
                        onConfirm: () => {
                            setExamScheduleItems({});
                            toast.success("Jadwal direset");
                            setConfirmModal({ show: false });
                        }
                    });
                }} className="ml-auto p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Workspace */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left: Subjects */}
                <div className="w-64 bg-slate-50 rounded-3xl border border-slate-200 p-4 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <GripVertical size={14} className="text-slate-400" /> Mata Pelajaran
                        </h3>
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                        {subjects.map((subj, idx) => {
                            const colors = [
                                'bg-blue-100 border-blue-200 text-blue-700',
                                'bg-emerald-100 border-emerald-200 text-emerald-700',
                                'bg-violet-100 border-violet-200 text-violet-700',
                                'bg-orange-100 border-orange-200 text-orange-700',
                                'bg-rose-100 border-rose-200 text-rose-700'
                            ];
                            const color = colors[idx % colors.length];
                            return (
                                <div
                                    key={subj.id}
                                    draggable
                                    onDragStart={() => setExamDraggedItem({ subject: subj.name, color })}
                                    className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${color} bg-opacity-40 font-bold text-xs`}
                                >
                                    {subj.name}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Grid */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-inner">
                    <div className="overflow-auto flex-1 relative custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm shadow-sm">
                                <tr>
                                    <th className="p-4 border-r border-b border-slate-200 w-32 bg-slate-100/50">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sesi Waktu</div>
                                        <button
                                            onClick={() => setShowExamTimeModal(true)}
                                            className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus size={14} className="mx-auto" />
                                        </button>
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="p-4 border-r border-b border-slate-200 min-w-[150px]">
                                            <div className="text-sm font-bold text-slate-800 mb-2 uppercase">{day}</div>
                                            <button
                                                onClick={() => {
                                                    setSelectedDayForExamUniform(day);
                                                    setTempExamUniform(examDailyUniforms[day] || '');
                                                    setShowExamUniformModal(true);
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold mx-auto transition-all ${examDailyUniforms[day] ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                                            >
                                                <Shirt size={12} />
                                                {examDailyUniforms[day] || 'SERAGAM'}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {examTimeSlots.map(slot => (
                                    <tr key={slot.id}>
                                        <td className="p-4 border-r border-b border-slate-100 bg-slate-50/50 text-center relative group">
                                            <div className="text-xs font-bold text-slate-700">{slot.start} - {slot.end}</div>
                                            <button
                                                onClick={() => setExamTimeSlots(prev => prev.filter(s => s.id !== slot.id))}
                                                className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </td>
                                        {DAYS.map(day => {
                                            const key = `${day}-${slot.id}-${selectedExamClass}`;
                                            const item = examScheduleItems[key];
                                            return (
                                                <td
                                                    key={day}
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={() => {
                                                        if (examDraggedItem) {
                                                            setExamScheduleItems(prev => ({ ...prev, [key]: examDraggedItem }));
                                                            setExamDraggedItem(null);
                                                        }
                                                    }}
                                                    className="p-1 border-r border-b border-slate-100 h-28 relative hover:bg-blue-50/30 transition-colors"
                                                >
                                                    {item ? (
                                                        <div className={`w-full h-full p-3 rounded-2xl border flex flex-col justify-center items-center relative group ${item.color}`}>
                                                            <button
                                                                onClick={() => {
                                                                    const newItems = { ...examScheduleItems };
                                                                    delete newItems[key];
                                                                    setExamScheduleItems(newItems);
                                                                }}
                                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/50 rounded-full p-1 text-red-500 transition-opacity shadow-sm"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                            <span className="font-bold text-[11px] text-center leading-tight">{item.subject}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full border-2 border-dashed border-transparent hover:border-slate-200 rounded-2xl flex items-center justify-center">
                                                            <Plus size={16} className="text-slate-200" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {/* Footer: Notes */}
                                <tr>
                                    <td className="p-4 border-r border-slate-200 bg-slate-100/50 text-center">
                                        <div className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                                            <FileText size={12} /> CATATAN
                                        </div>
                                    </td>
                                    {DAYS.map(day => (
                                        <td key={day} className="p-2 border-r border-slate-100">
                                            <button
                                                onClick={() => {
                                                    setSelectedDayForExamNote(day);
                                                    setTempExamNote(examDailyNotes[day] || '');
                                                    setShowExamNoteModal(true);
                                                }}
                                                className="w-full p-2 text-[10px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-left italic truncate"
                                            >
                                                {examDailyNotes[day] || 'Tambah catatan...'}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showExamModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Tambah Jenis Ujian</h3>
                            <button onClick={() => setShowExamModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tipe Ujian</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    value={newExamData.type}
                                    onChange={e => setNewExamData({ ...newExamData, type: e.target.value })}
                                >
                                    <option value="PH">Ulangan Harian (PH)</option>
                                    <option value="PTS">Penilaian Tengah Semester (PTS)</option>
                                    <option value="PAS/PAT">Penilaian Akhir Semester (PAS/PAT)</option>
                                    <option value="TryOut">Try Out</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={newExamData.semester}
                                        onChange={e => setNewExamData({ ...newExamData, semester: e.target.value })}
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        placeholder="2025/2026"
                                        value={newExamData.year}
                                        onChange={e => setNewExamData({ ...newExamData, year: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleAddExamType} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
                                BUAT JADWAL UJIAN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExamTimeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800">Tambah Sesi</h3>
                            <button onClick={() => setShowExamTimeModal(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="time" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newExamTime.start} onChange={e => setNewExamTime({ ...newExamTime, start: e.target.value })} />
                                <input type="time" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newExamTime.end} onChange={e => setNewExamTime({ ...newExamTime, end: e.target.value })} />
                            </div>
                            <button onClick={() => {
                                if (newExamTime.start && newExamTime.end) {
                                    setExamTimeSlots(prev => [...prev, { id: Date.now(), ...newExamTime }]);
                                    setShowExamTimeModal(false);
                                    toast.success("Sesi ditambahkan");
                                }
                            }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">TAMBAH</button>
                        </div>
                    </div>
                </div>
            )}

            {showExamUniformModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
                        <h3 className="font-bold text-slate-800 mb-4">Seragam Hari {selectedDayForExamUniform}</h3>
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold mb-4"
                            placeholder="Contoh: Putih Merah"
                            value={tempExamUniform}
                            onChange={e => setTempExamUniform(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowExamUniformModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Batal</button>
                            <button onClick={() => {
                                setExamDailyUniforms(prev => ({ ...prev, [selectedDayForExamUniform]: tempExamUniform }));
                                setShowExamUniformModal(false);
                                toast.success("Seragam diperbarui");
                            }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {showExamNoteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Catatan Hari {selectedDayForExamNote}</h3>
                        <textarea
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none min-h-[120px]"
                            placeholder="Apa catatan untuk hari ini?"
                            value={tempExamNote}
                            onChange={e => setTempExamNote(e.target.value)}
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowExamNoteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Batal</button>
                            <button onClick={() => {
                                setExamDailyNotes(prev => ({ ...prev, [selectedDayForExamNote]: tempExamNote }));
                                setShowExamNoteModal(false);
                                toast.success("Catatan disimpan");
                            }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JadwalUjianView;
