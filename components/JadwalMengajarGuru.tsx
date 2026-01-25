import React, { useState } from 'react';
import { ChevronLeft, Calendar, Clock, MapPin } from 'lucide-react';

interface JadwalMengajarGuruProps {
    onBack: () => void;
}

const JadwalMengajarGuru: React.FC<JadwalMengajarGuruProps> = ({ onBack }) => {
    const [selectedSemester, setSelectedSemester] = useState('1 (Ganjil)');
    // Dummy Data Jadwal
    const jadwal = [
        { id: 1, hari: 'Senin', jam: '07:30 - 09:00', kelas: '5A', mapel: 'Pendidikan Agama Islam', ruang: 'R. 5A' },
        { id: 2, hari: 'Senin', jam: '09:30 - 11:00', kelas: '4B', mapel: 'Pendidikan Agama Islam', ruang: 'R. 4B' },
        { id: 3, hari: 'Selasa', jam: '08:00 - 09:30', kelas: '6A', mapel: 'Pendidikan Agama Islam', ruang: 'R. 6A' },
        { id: 4, hari: 'Rabu', jam: '10:00 - 11:30', kelas: '3C', mapel: 'Pendidikan Agama Islam', ruang: 'R. 3C' },
        { id: 5, hari: 'Kamis', jam: '07:30 - 09:00', kelas: '5B', mapel: 'Pendidikan Agama Islam', ruang: 'R. 5B' },
    ];

    const getHariColor = (hari: string) => {
        switch (hari) {
            case 'Senin': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Selasa': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Rabu': return 'bg-green-100 text-green-700 border-green-200';
            case 'Kamis': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Jumat': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} />
                    Jadwal Mengajar
                </h2>
            </div>
            <div className="flex gap-2 p-4 pb-0">
                <div className="bg-white border rounded-xl px-4 py-2 text-sm font-bold text-blue-600 flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Semester:</span>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer pr-1"
                    >
                        <option>1 (Ganjil)</option>
                        <option>2 (Genap)</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                <div className="grid gap-4">
                    {jadwal.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 ${getHariColor(item.hari)} shrink-0`}>
                                    <span className="text-xs font-bold uppercase">{item.hari.substring(0, 3)}</span>
                                    <span className="text-xl font-bold">{item.hari === 'Senin' ? '12' : item.hari === 'Selasa' ? '13' : '14'}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{item.mapel}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Kelas {item.kelas}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {item.jam}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm md:text-right md:justify-end pl-20 md:pl-0">
                                <MapPin size={16} />
                                <span>{item.ruang}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default JadwalMengajarGuru;
