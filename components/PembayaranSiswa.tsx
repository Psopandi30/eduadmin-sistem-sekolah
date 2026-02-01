import React, { useState, useEffect } from 'react';
import { ChevronRight, CreditCard, History, Receipt, Calendar, CheckCircle, Clock } from 'lucide-react';
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

    useEffect(() => {
        const loadFinanceData = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            try {
                const studentName = user?.studentName || user?.nama;
                const studentId = user?.studentId || user?.id;

                // 1. Load Billing Data from Cloud
                const { data: billsRes } = await supabase.from('app_settings').select('value').eq('key', 'finance_student_bills_v10').single();
                if (billsRes?.value) {
                    const allBills = typeof billsRes.value === 'string' ? JSON.parse(billsRes.value) : billsRes.value;
                    const myUnpaid = allBills.filter((b: any) =>
                        (String(b.studentId) === String(studentId) || b.studentName === studentName) &&
                        b.status !== 'Lunas'
                    ).map((b: any) => ({
                        id: b.id,
                        title: b.paymentName,
                        amount: b.amount,
                        deadline: b.dueDate || (b.period ? '10 ' + b.period : '-'),
                        status: 'Belum Lunas'
                    }));
                    setUnpaidBills(myUnpaid);
                }

                // 2. Load History (Payments) from Cloud
                const { data: historyRes } = await supabase.from('app_settings').select('value').eq('key', 'payments_data_v10').single();
                if (historyRes?.value) {
                    const allHistory = typeof historyRes.value === 'string' ? JSON.parse(historyRes.value) : historyRes.value;
                    const myHistory = allHistory.filter((h: any) =>
                        String(h.studentId) === String(studentId) || h.studentName === studentName
                    );
                    myHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setHistoryData(myHistory);
                }
            } catch (err) {
                console.error("Failed to load finance data from cloud", err);
            } finally {
                setLoading(false);
            }
        };

        loadFinanceData();
    }, [user]);

    // Summary calculation
    const summary = {
        totalLimit: 5000000,
        totalPaid: historyData.reduce((acc, curr) => acc + (curr.amount || 0), 0),
        outstanding: unpaidBills.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">Informasi Pembayaran</h3>
                    {loading && <p className="text-[10px] text-blue-500 animate-pulse font-bold uppercase tracking-widest">Sinkronisasi Cloud...</p>}
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-[#004AAD] to-[#0066CC] rounded-3xl p-6 text-white mb-8 shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8"></div>

                    <div className="relative z-10">
                        <p className="text-blue-100 text-xs font-medium mb-1">Total Limit Pembayaran (Tahun Ajaran)</p>
                        <h2 className="text-3xl font-bold mb-6">{formatCurrency(summary.totalLimit)}</h2>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-[10px] text-blue-100 mb-1">Sudah Dibayar</p>
                                <p className="font-bold text-lg">{formatCurrency(summary.totalPaid)}</p>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                                <p className="text-[10px] text-blue-100 mb-1">Sisa Tagihan</p>
                                <p className="font-bold text-lg text-yellow-300">{formatCurrency(summary.outstanding)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unpaid Bills */}
                <div className="mb-8">
                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                        <Receipt size={18} className="text-orange-500" />
                        Rincian Tagihan Belum Lunas
                    </h4>
                    <div className="space-y-3">
                        {unpaidBills.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2 opacity-20" />
                                <p className="text-xs text-slate-500 italic">Semua tagihan sudah lunas atau belum ada tagihan.</p>
                            </div>
                        ) : (
                            unpaidBills.map((bill) => (
                                <div key={bill.id} className="border border-orange-100 bg-orange-50/30 rounded-2xl p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                                    <div>
                                        <h5 className="font-bold text-slate-800 text-sm">{bill.title}</h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock size={12} className="text-orange-500" />
                                            <span className="text-[10px] text-orange-600 font-medium">Jatuh Tempo: {bill.deadline}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[#004AAD]">{formatCurrency(bill.amount)}</p>
                                        <span className="text-[10px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold">Unpaid</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* History */}
                <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                        <History size={18} className="text-emerald-500" />
                        Riwayat Pembayaran
                    </h4>
                    <div className="space-y-4">
                        {historyData.length === 0 ? (
                            <p className="text-center text-slate-400 text-xs py-4">Belum ada riwayat pembayaran.</p>
                        ) : (
                            historyData.map((record, idx) => (
                                <div key={idx} className="relative pl-6 pb-4 border-l border-slate-200 last:border-0 last:pb-0 animate-in slide-in-from-left-2">
                                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50"></div>
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-sm">{record.type || 'Pembayaran'} {record.month && record.year ? `- ${record.month} ${record.year}` : ''}</h5>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{record.method} • {record.paymentName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">{formatCurrency(record.amount)}</p>
                                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">{record.status || 'Success'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-50 pt-2 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {record.date}
                                            </span>
                                            <span>Petugas: {record.officer || 'Sistem'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PembayaranSiswa;
