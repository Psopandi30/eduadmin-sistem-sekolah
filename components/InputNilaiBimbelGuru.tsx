import React, { useState, useEffect } from 'react';
import { ChevronLeft, FolderInput, Save, TrendingUp, Award, ClipboardList } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { toast } from 'react-hot-toast';

interface InputNilaiBimbelGuruProps {
    onBack: () => void;
}

const InputNilaiBimbelGuru: React.FC<InputNilaiBimbelGuruProps> = ({ onBack }) => {
    const [siswa, setSiswa] = useState('Ahmad Dahlan');
    const [filterPeriode, setFilterPeriode] = useState('Semua');
    const [cbtResults, setCbtResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCbtResults();
    }, []);

    const fetchCbtResults = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cbt_results')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Map database fields to UI fields
                const mappedData = data.map((item: any) => ({
                    id: item.id,
                    title: item.exam_title,
                    score: item.score,
                    total: item.total_score,
                    date: new Date(item.submitted_at).toLocaleDateString('id-ID'),
                    status: item.status,
                    type: item.exam_type
                }));
                setCbtResults(mappedData);
            }
        } catch (error) {
            console.error('Error fetching CBT results:', error);
            // Fallback to empty or dummy if strictly needed, but better to show empty state for "real" experience
            // setCbtResults([]); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FolderInput className="text-indigo-500" size={20} />
                        Hasil Nilai Bimbel
                    </h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">

                {/* Siswa Selector */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Pilih Siswa Bimbel</label>
                    <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={siswa}
                        onChange={(e) => setSiswa(e.target.value)}
                    >
                        <option>Ahmad Dahlan (Privat)</option>
                        <option>Budi Santoso (Privat)</option>
                    </select>
                </div>

                {/* Filter & Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-400 mb-1">Total Ujian</p>
                        <p className="text-2xl font-bold text-indigo-700">{cbtResults.length} <span className="text-sm font-medium text-indigo-400">Kali</span></p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <p className="text-xs font-bold text-green-500 mb-1">Rata-rata Skor</p>
                        <p className="text-2xl font-bold text-green-700">
                            {cbtResults.length > 0
                                ? Math.round(cbtResults.reduce((acc, curr) => acc + (curr.score / curr.total * 100), 0) / cbtResults.length)
                                : 0}
                        </p>
                    </div>
                </div>

                {/* List Hasil CBT */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Award className="text-yellow-500" size={20} />
                        Riwayat Hasil Ujian (CBT)
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : cbtResults.length > 0 ? (
                        cbtResults.map((result) => (
                            <div key={result.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${result.type === 'Tryout' ? 'bg-purple-50 text-purple-600' :
                                            result.type === 'Latihan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {result.type}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-sm md:text-base">{result.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{result.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            {result.score}<span className="text-xs text-slate-400 ml-0.5">/{result.total}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${result.status === 'Lulus' || result.status === 'Kompeten' ? 'text-green-500' : 'text-yellow-500'
                                            }`}>
                                            {result.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${(result.score / result.total) >= 0.8 ? 'bg-green-500' :
                                            (result.score / result.total) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${(result.score / result.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <ClipboardList size={40} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada data nilai CBT.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InputNilaiBimbelGuru;
