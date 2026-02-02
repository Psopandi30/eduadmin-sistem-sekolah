import { useState, useEffect, useCallback } from 'react';
import {
    savingsDataGlobal,
    savingsTransactionsGlobal,
    updateSavingsDataGlobal,
    addSavingsTransactionGlobal,
    SavingsData,
    SavingsTransaction
} from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export type { SavingsData, SavingsTransaction };

export const useSavings = () => {
    // Initialize from Local Storage or Global Store
    const [savingsData, setSavingsData] = useState<SavingsData[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('savings_data_v10');
            if (saved) return JSON.parse(saved);
        }
        return savingsDataGlobal;
    });

    const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('savings_transactions_v10');
            if (saved) return JSON.parse(saved);
        }
        return savingsTransactionsGlobal;
    });

    const [loading, setLoading] = useState(false);

    // 1. Fetch from Supabase
    const fetchSavings = useCallback(async () => {
        if (!isSupabaseConfigured()) return;
        setLoading(true);
        try {
            // Fetch Savings Data
            const { data: dataRes } = await supabase.from('app_settings').select('value').eq('key', 'savings_data_v10').maybeSingle();
            if (dataRes?.value) {
                const parsed = typeof dataRes.value === 'string' ? JSON.parse(dataRes.value) : dataRes.value;
                setSavingsData(parsed);
                updateSavingsDataGlobal(parsed);
                localStorage.setItem('savings_data_v10', JSON.stringify(parsed));
            }

            // Fetch Transactions
            const { data: trxRes } = await supabase.from('app_settings').select('value').eq('key', 'savings_transactions_v10').maybeSingle();
            if (trxRes?.value) {
                const parsed = typeof trxRes.value === 'string' ? JSON.parse(trxRes.value) : trxRes.value;
                setSavingsTransactions(parsed);
                localStorage.setItem('savings_transactions_v10', JSON.stringify(parsed));
            }
        } catch (err) {
            console.warn('No cloud savings data found');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSavings();
    }, [fetchSavings]);

    // 2. Save/Sync to Supabase
    const saveSavings = async (newData?: SavingsData[], newTrx?: SavingsTransaction[]) => {
        const d = newData || savingsData;
        const t = newTrx || savingsTransactions;

        setSavingsData(d);
        setSavingsTransactions(t);
        updateSavingsDataGlobal(d);
        localStorage.setItem('savings_data_v10', JSON.stringify(d));
        localStorage.setItem('savings_transactions_v10', JSON.stringify(t));

        if (!isSupabaseConfigured()) return;

        try {
            await Promise.all([
                supabase.from('app_settings').upsert({ key: 'savings_data_v10', value: d, updated_at: new Date().toISOString() }),
                supabase.from('app_settings').upsert({ key: 'savings_transactions_v10', value: t, updated_at: new Date().toISOString() })
            ]);
            toast.success("Data tabungan berhasil disinkronkan ke cloud!");
        } catch (err) {
            console.error("Error syncing savings", err);
            toast.error("Gagal sinkron ke cloud.");
        }
    };

    return {
        savingsData,
        setSavingsData,
        savingsTransactions,
        setSavingsTransactions,
        saveSavings,
        loading,
        refresh: fetchSavings
    };
};
