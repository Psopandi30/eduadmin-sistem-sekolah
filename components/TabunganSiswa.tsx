import React, { useState, useEffect } from 'react';
import { ChevronRight, Wallet, ArrowUpCircle, ArrowDownCircle, History, Filter } from 'lucide-react';
import { savingsDataGlobal, savingsTransactionsGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import logger from '../src/utils/logger';

interface TabunganSiswaProps {
    onBack: () => void;
    user?: any;
}

const TabunganSiswa: React.FC<TabunganSiswaProps> = ({ onBack, user }) => {
    // State for Data
    const [mySavings, setMySavings] = useState<any>(null);
    const [myTransactions, setMyTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            try {
                const sName = user?.studentName || user?.nama;
                const studentId = user?.studentId || user?.id;

                // 1. Load Savings Data (Balance) from Cloud
                const { data: dataRes } = await supabase.from('app_settings').select('value').eq('key', 'savings_data_v10').maybeSingle();
                if (dataRes?.value) {
                    const allSavings = typeof dataRes.value === 'string' ? JSON.parse(dataRes.value) : dataRes.value;
                    const foundSaver = allSavings.find((s: any) => s.nama === sName || String(s.id) === String(studentId));
                    setMySavings(foundSaver);
                }

                // 2. Load Transactions from Cloud
                const { data: trxRes } = await supabase.from('app_settings').select('value').eq('key', 'savings_transactions_v10').maybeSingle();
                if (trxRes?.value) {
                    const allTrx = typeof trxRes.value === 'string' ? JSON.parse(trxRes.value) : trxRes.value;
                    const foundTrx = allTrx.filter((t: any) =>
                        t.studentName === sName || String(t.studentId) === String(studentId)
                    );
                    foundTrx.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setMyTransactions(foundTrx);
                }
            } catch (err) {
                logger.error("Failed to fetch savings from cloud", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Calculate Summary
    const totalDeposit = myTransactions
        .filter(t => t.type === 'Setor')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdraw = myTransactions
        .filter(t => t.type === 'Tarik')
        .reduce((sum, t) => sum + t.amount, 0);

    const summary = {
        balance: mySavings?.saldo || 0,
        totalDeposit: totalDeposit,
        totalWithdraw: totalWithdraw
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const [filter, setFilter] = useState<'all' | 'Setor' | 'Tarik'>('all');

    const filteredTransactions = myTransactions.filter(t => filter === 'all' || t.type === filter);

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 h-full flex flex-col">
            {/* Header */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-pink-50/50 to-rose-50/30">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-pink-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronRight className="rotate-180" size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight leading-none">Tabungan Siswa</h3>
                    <p className="text-[8px] sm:text-xs font-bold text-rose-600/60 uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">{mySavings ? `${mySavings.nama} - ${mySavings.kelas}` : 'Data tidak ditemukan'}</p>
                </div>
            </div>

            <div className="p-4 sm:p-10 flex-1 overflow-y-auto scrollbar-hide">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white mb-6 sm:mb-10 shadow-2xl shadow-pink-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-pink-50">
                                <Wallet size={14} sm:size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-pink-100/80 text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Saldo Tersedia</p>
                        </div>
                        <h2 className="text-xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 tracking-tighter drop-shadow-md">{formatCurrency(summary.balance)}</h2>

                        <div className="grid grid-cols-2 gap-3 sm:gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-[1.5rem] p-3 sm:p-5 border border-white/20 shadow-inner">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <ArrowUpCircle size={10} sm:size={14} className="text-emerald-300" strokeWidth={2.5} />
                                    <p className="text-[7px] sm:text-[10px] font-black text-pink-100/70 uppercase tracking-widest leading-none">Setoran</p>
                                </div>
                                <p className="font-black text-xs sm:text-lg md:text-xl tracking-tight leading-none">{formatCurrency(summary.totalDeposit)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-[1.5rem] p-3 sm:p-5 border border-white/20 shadow-inner">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <ArrowDownCircle size={10} sm:size={14} className="text-yellow-300" strokeWidth={2.5} />
                                    <p className="text-[7px] sm:text-[10px] font-black text-pink-100/70 uppercase tracking-widest leading-none">Tarikan</p>
                                </div>
                                <p className="font-black text-xs sm:text-lg md:text-xl tracking-tight leading-none">{formatCurrency(summary.totalWithdraw)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter / Actions */}
                <div className="flex gap-2 mb-6 sm:mb-10 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
                    {[
                        { id: 'all', label: 'Semua Trx', color: 'bg-slate-800' },
                        { id: 'Setor', label: 'Pemasukan', color: 'bg-emerald-600' },
                        { id: 'Tarik', label: 'Pengeluaran', color: 'bg-rose-600' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id as any)}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border-2 ${filter === btn.id
                                ? `${btn.color} text-white border-transparent shadow-lg scale-105`
                                : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* History List */}
                <div>
                    <div className="flex items-center gap-3 mb-6 sm:mb-8 px-1">
                        <div className="w-1.5 h-5 sm:h-6 bg-pink-500 rounded-full"></div>
                        <h4 className="font-black text-slate-800 text-sm sm:text-lg tracking-tight">Riwayat Transaksi</h4>
                    </div>
                    <div className="space-y-4">
                        {filteredTransactions.length === 0 ? (
                            <div className="py-16 sm:py-20 text-center bg-slate-50/50 rounded-[2rem] sm:rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center text-slate-200">
                                    <History size={28} sm:size={32} strokeWidth={2.5} />
                                </div>
                                <p className="text-slate-400 font-black text-[10px] sm:text-sm uppercase tracking-widest italic leading-none">Belum ada transaksi</p>
                            </div>
                        ) : (
                            filteredTransactions.map((item) => (
                                <div key={item.id} className="bg-white border-2 border-slate-50 rounded-2xl sm:rounded-[2.5rem] p-3.5 sm:p-7 flex justify-between items-center hover:border-pink-200 shadow-md shadow-blue-900/5 transition-all duration-300 group active:scale-[0.98] relative overflow-hidden">
                                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-pink-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="flex items-center gap-3 sm:gap-6 min-w-0 relative z-10">
                                        <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.8rem] flex items-center justify-center shadow-md border-2 transition-all duration-500 shrink-0 ${item.type === 'Setor'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {item.type === 'Setor' ? <ArrowUpCircle size={18} sm:size={36} strokeWidth={2.5} /> : <ArrowDownCircle size={18} sm:size={36} strokeWidth={2.5} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-black text-slate-800 text-[10px] sm:text-xl tracking-tight uppercase leading-tight mb-0.5 sm:mb-2">{item.type === 'Setor' ? 'SETORAN' : 'PENARIKAN'}</h5>
                                            <div className="flex items-center gap-1.5 text-[8px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 leading-none">{item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-black text-xs sm:text-2xl tracking-tighter relative z-10 ${item.type === 'Setor' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.type === 'Setor' ? '+' : '-'}{formatCurrency(item.amount)}
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

export default TabunganSiswa;
