import React, { useState, useEffect } from 'react';
import { ChevronRight, CreditCard, History, Receipt, Calendar, CheckCircle, Clock, FileText, Printer, X, Search } from 'lucide-react';
import { paymentHistoryGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

interface PembayaranSiswaProps {
    onBack: () => void;
    user?: any;
}

const PembayaranSiswa: React.FC<PembayaranSiswaProps> = ({ onBack, user }) => {
    // --- SYNC DATA ---
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const loadFinanceData = async () => {
            setLoading(true);
            const studentName = user?.studentName || user?.nama || user?.namaLengkap;
            const studentId = user?.studentId || user?.nis || user?.id;

            // 1. Attempt Cloud Sync if available
            if (isSupabaseConfigured()) {
                try {
                    // Load Billing Data from Cloud
                    const { data: billsRes } = await supabase.from('app_settings').select('value').eq('key', 'finance_student_bills_v10').single();
                    if (billsRes?.value) {
                        const allBills = typeof billsRes.value === 'string' ? JSON.parse(billsRes.value) : billsRes.value;
                        const myUnpaid = allBills.filter((b: any) =>
                            (String(b.studentId) === String(studentId) ||
                                String(b.nis) === String(studentId) ||
                                b.studentName?.toLowerCase() === studentName?.toLowerCase()) &&
                            b.status !== 'Lunas'
                        ).map((b: any) => ({
                            ...b,
                            title: b.paymentName,
                            amount: Number(b.amount) || 0,
                            deadline: b.dueDate || (b.period ? '10 ' + b.period : '-'),
                            status: 'Belum Lunas'
                        }));
                        setUnpaidBills(myUnpaid);
                        localStorage.setItem('finance_student_bills_v10', JSON.stringify(allBills));
                    }

                    // Load History (Payments) from Cloud
                    const { data: historyRes } = await supabase.from('app_settings').select('value').eq('key', 'payments_data_v10').single();
                    if (historyRes?.value) {
                        const allHistory = typeof historyRes.value === 'string' ? JSON.parse(historyRes.value) : historyRes.value;
                        const myHistory = allHistory.filter((h: any) =>
                            String(h.studentId) === String(studentId) ||
                            String(h.nis) === String(studentId) ||
                            h.studentName?.toLowerCase() === studentName?.toLowerCase()
                        );
                        myHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        setHistoryData(myHistory);
                        localStorage.setItem('payments_data_v10', JSON.stringify(allHistory));
                    }
                    setLoading(false);
                    return;
                } catch (err) {
                    console.error("Cloud sync failed, falling back to local", err);
                }
            }

            // 2. Fallback to Local Storage
            try {
                const savedBills = localStorage.getItem('finance_student_bills_v10');
                if (savedBills) {
                    const allBills = JSON.parse(savedBills);
                    const myUnpaid = allBills.filter((b: any) =>
                        (String(b.studentId) === String(studentId) ||
                            String(b.nis) === String(studentId) ||
                            b.studentName?.toLowerCase() === studentName?.toLowerCase()) &&
                        b.status !== 'Lunas'
                    ).map((b: any) => ({
                        ...b,
                        title: b.paymentName,
                        amount: Number(b.amount) || 0,
                        deadline: b.dueDate || (b.period ? '10 ' + b.period : '-'),
                        status: 'Belum Lunas'
                    }));
                    setUnpaidBills(myUnpaid);
                }

                const savedHistory = localStorage.getItem('payments_data_v10');
                if (savedHistory) {
                    const allHistory = JSON.parse(savedHistory);
                    const myHistory = allHistory.filter((h: any) =>
                        String(h.studentId) === String(studentId) ||
                        String(h.nis) === String(studentId) ||
                        h.studentName?.toLowerCase() === studentName?.toLowerCase()
                    );
                    myHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setHistoryData(myHistory);
                }
            } catch (err) {
                console.error("Local data load failed", err);
            } finally {
                setLoading(false);
            }
        };

        loadFinanceData();
    }, [user]);

    // Summary calculation
    const totalPaidVal = historyData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const outstandingVal = unpaidBills.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const summary = {
        totalLimit: totalPaidVal + outstandingVal,
        totalPaid: totalPaidVal,
        outstanding: outstandingVal
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight className="rotate-180" size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight">Administrasi & Pembayaran</h3>
                    {loading ? (
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                            <p className="text-[8px] sm:text-[10px] text-blue-500 font-black uppercase tracking-widest">Sinkronisasi...</p>
                        </div>
                    ) : (
                        <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Riwayat & Tagihan Keuangan</p>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-10 flex-1 overflow-y-auto scrollbar-hide">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-[#004AAD] via-[#0052CC] to-[#003580] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white mb-6 sm:mb-10 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/15 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-3xl group-hover:bg-blue-400/30 transition-all duration-700"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <CreditCard size={14} sm:size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-blue-100/80 text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Total Kewajiban (T.A)</p>
                        </div>
                        <h2 className="text-xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-8 tracking-tighter drop-shadow-md">{formatCurrency(summary.totalLimit)}</h2>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-[1.5rem] p-3 sm:p-5 border border-white/20 shadow-inner">
                                <p className="text-[7px] sm:text-[10px] font-black text-blue-100/70 uppercase tracking-widest mb-1 sm:mb-1.5">Telah Dibayar</p>
                                <p className="font-black text-xs sm:text-xl md:text-2xl tracking-tight leading-none">{formatCurrency(summary.totalPaid)}</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-[1.5rem] p-3 sm:p-5 border border-white/30 shadow-inner overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-1 sm:w-1.5 h-full bg-yellow-400"></div>
                                <p className="text-[7px] sm:text-[10px] font-black text-blue-100/70 uppercase tracking-widest mb-1 sm:mb-1.5">Sisa Tagihan</p>
                                <p className="font-black text-xs sm:text-xl md:text-2xl tracking-tight text-yellow-300 leading-none">{formatCurrency(summary.outstanding)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unpaid Bills */}
                <div className="mb-10 sm:mb-12">
                    <div className="flex items-center justify-between mb-5 sm:mb-6 px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 sm:h-6 bg-orange-500 rounded-full"></div>
                            <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight">Tagihan Belum Lunas</h4>
                        </div>
                        {unpaidBills.length > 0 && (
                            <span className="bg-orange-100 text-orange-600 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {unpaidBills.length} Tagihan
                            </span>
                        )}
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {unpaidBills.length === 0 ? (
                            <div className="py-12 sm:py-16 text-center bg-slate-50/50 rounded-[2rem] sm:rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100">
                                    <CheckCircle size={28} sm:size={32} strokeWidth={2.5} />
                                </div>
                                <p className="text-slate-400 font-black text-[10px] sm:text-sm uppercase tracking-widest italic">Semua tagihan lunas</p>
                            </div>
                        ) : (
                            unpaidBills.map((bill) => (
                                <div key={bill.id} className="bg-white border-2 border-slate-50 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 flex justify-between items-center hover:border-orange-200 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group active:scale-[0.98] relative overflow-hidden">
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="flex items-center gap-4 sm:gap-6 min-w-0 relative z-10">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-amber-600 text-white rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                                            <Receipt size={24} sm:size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-black text-slate-800 text-sm sm:text-xl tracking-tight truncate uppercase leading-tight mb-2 group-hover:text-orange-600 transition-colors">{bill.title}</h5>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-black px-3 py-1 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-widest group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100 transition-colors">
                                                    <Calendar size={12} strokeWidth={3} />
                                                    {bill.deadline}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3 relative z-10 flex flex-col items-end gap-2">
                                        <p className="font-black text-lg sm:text-2xl text-slate-800 tracking-tighter leading-none">{formatCurrency(bill.amount)}</p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedRecord({ ...bill, type: 'Tagihan' });
                                                    setShowDetailModal(true);
                                                }}
                                                className="text-[9px] sm:text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all uppercase tracking-widest"
                                            >
                                                Lihat Rincian
                                            </button>
                                            <span className="text-[9px] sm:text-[11px] text-white bg-orange-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg border-b-4 border-orange-800 text-center">TAGIHAN</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* History */}
                <div>
                    <div className="flex items-center gap-3 mb-6 sm:mb-8 px-1">
                        <div className="w-1.5 h-5 sm:h-6 bg-emerald-500 rounded-full"></div>
                        <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight">Riwayat Pembayaran</h4>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                        {historyData.length === 0 ? (
                            <p className="text-center text-slate-400 font-extrabold text-[10px] sm:text-xs py-10 uppercase tracking-widest italic">Belum ada riwayat</p>
                        ) : (
                            historyData.map((record, idx) => (
                                <div key={idx} className="relative pl-6 sm:pl-10 pb-6 sm:pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-emerald-50 shadow-sm"></div>
                                    <div className="bg-white border-2 border-slate-50 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 hover:border-emerald-200 shadow-md shadow-blue-900/5 transition-all group">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3 sm:mb-6">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner shrink-0">
                                                    <History size={18} sm:size={24} strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-black text-slate-800 text-[10px] sm:text-base tracking-tight truncate leading-tight mb-0.5">{record.type || 'Pembayaran'} {record.month && record.year ? `- ${record.month} ${record.year}` : ''}</h5>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{record.method}</span>
                                                        <span className="text-slate-200">•</span>
                                                        <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{record.paymentName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                                                <p className="font-black text-sm sm:text-lg text-emerald-600 tracking-tight leading-none mb-1">{formatCurrency(record.amount)}</p>
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRecord({ ...record, type: 'Pembayaran' });
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="text-[7px] sm:text-[9px] font-black text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-100 hover:bg-emerald-50 transition-all uppercase tracking-widest"
                                                    >
                                                        Lihat Rincian
                                                    </button>
                                                    <span className="text-[7px] sm:text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">Lunas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-black text-slate-400 border-t border-slate-50 pt-2 sm:pt-4 mt-0.5 uppercase tracking-tighter">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} sm:size={12} strokeWidth={2.5} />
                                                {record.date}
                                            </span>
                                            <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Petugas: {record.officer || 'Sistem'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Receipt size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg tracking-tight">Detail {selectedRecord.type}</h4>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Rincian Transaksi Keuangan</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body (Receipt Style) */}
                        <div className="p-8">
                            <div className="space-y-6">
                                <div className="text-center pb-6 border-b-2 border-dashed border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2 text-center">Nominal {selectedRecord.type === 'Tagihan' ? 'Tagihan' : 'Pembayaran'}</p>
                                    <h2 className={`text-4xl font-black tracking-tighter ${selectedRecord.type === 'Tagihan' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(selectedRecord.amount)}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nama Pembayaran</span>
                                        <span className="text-slate-700 font-black text-right">{selectedRecord.paymentName || selectedRecord.title}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Siswa</span>
                                        <span className="text-slate-700 font-black text-right">{user?.studentName || user?.nama}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tanggal/Periode</span>
                                        <span className="text-slate-700 font-black text-right">{selectedRecord.date || selectedRecord.period || selectedRecord.deadline}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Status</span>
                                        <span className={`font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${selectedRecord.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {selectedRecord.status}
                                        </span>
                                    </div>
                                    {selectedRecord.method && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Metode Bayar</span>
                                            <span className="text-slate-700 font-black text-right">{selectedRecord.method}</span>
                                        </div>
                                    )}
                                    {selectedRecord.officer && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Petugas</span>
                                            <span className="text-slate-700 font-black text-right">{selectedRecord.officer}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t-2 border-dashed border-slate-100 mt-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all border border-slate-100 shadow-sm"
                                    >
                                        <Printer size={18} /> Cetak Bukti Pembayaran
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 flex justify-center">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-10 py-3 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Tutup Rincian
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PembayaranSiswa;
