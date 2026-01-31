import { useState, useEffect, useCallback } from 'react';
import { initialFinanceDataGlobal, schoolSettingsGlobal } from '../../../data/sharedData';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export interface CashAccount {
    id: number;
    name: string;
    type: 'KAS' | 'BANK';
    balance: number;
    isPrimary: boolean;
    number: string;
}

export interface PaymentType {
    id: number;
    name: string;
    type: 'BULANAN' | 'SEKALI' | 'TAHUNAN';
    amount: number;
    category: string;
}

export interface StudentBill {
    id: number;
    studentId: number;
    studentName: string;
    class: string;
    paymentName: string;
    amount: number;
    period: string;
    status: string;
    dueDate: string;
    type: string;
}

export interface Expense {
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
    proof: string;
}

const initialPaymentTypes: PaymentType[] = [];

export const useFinance = () => {
    const [financialYear, setFinancialYear] = useState(schoolSettingsGlobal.academicYear || '2025/2026');
    const [loading, setLoading] = useState(false);

    // Initialize state
    const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(() => {
        const saved = localStorage.getItem('finance_cash_accounts_v10');
        return saved ? JSON.parse(saved) : initialFinanceDataGlobal.cashAccounts;
    });

    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>(() => {
        const saved = localStorage.getItem('finance_payment_types_v10');
        return saved ? JSON.parse(saved) : initialPaymentTypes;
    });

    const [studentBills, setStudentBills] = useState<StudentBill[]>(() => {
        const saved = localStorage.getItem('finance_student_bills_v10');
        return saved ? JSON.parse(saved) : initialFinanceDataGlobal.studentBills;
    });

    const [expenses, setExpenses] = useState<Expense[]>(() => {
        const saved = localStorage.getItem('finance_expenses_v10');
        return saved ? JSON.parse(saved) : initialFinanceDataGlobal.expenses;
    });

    const [paymentHistory, setPaymentHistory] = useState<any[]>(() => {
        const saved = localStorage.getItem('payments_data_v10');
        return saved ? JSON.parse(saved) : [];
    });

    // --- SUPABASE INTEGRATION ---

    const [isInitialFetched, setIsInitialFetched] = useState(false);

    const fetchFinanceData = useCallback(async () => {
        if (isInitialFetched) return;
        if (!isSupabaseConfigured()) {
            setIsInitialFetched(true);
            return;
        }
        setLoading(true);
        try {
            // 1. Cash Accounts
            const { data: accountsData } = await supabase.from('finance_accounts').select('*');
            if (accountsData && accountsData.length > 0) {
                setCashAccounts(accountsData.map(a => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    balance: a.balance,
                    isPrimary: a.is_primary,
                    number: a.number
                })));
            }

            // 2. Payment Types
            const { data: typesData } = await supabase.from('payment_types').select('*');
            if (typesData && typesData.length > 0) {
                setPaymentTypes(typesData.map(t => ({
                    id: t.id,
                    name: t.name,
                    type: t.type,
                    amount: t.amount,
                    category: t.category
                })));
            }

            // 3. Bills (Limit to recent for checking)
            const { data: billsData } = await supabase.from('student_bills').select('*').limit(500);
            if (billsData && billsData.length > 0) {
                setStudentBills(billsData.map(b => ({
                    id: b.id,
                    studentId: b.student_id,
                    studentName: b.student_name,
                    class: b.class_name,
                    paymentName: b.payment_name,
                    amount: b.amount,
                    period: b.period,
                    status: b.status,
                    dueDate: b.due_date,
                    type: b.billing_type
                })));
            }

            // 4. Expenses
            const { data: expensesData } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(100);
            if (expensesData && expensesData.length > 0) {
                setExpenses(expensesData.map(e => ({
                    id: e.id,
                    date: e.date,
                    description: e.description,
                    category: e.category,
                    amount: e.amount,
                    proof: e.proof_url || ''
                })));
            }
            setIsInitialFetched(true);
        } catch (err) {
            console.error("Error fetching finance data:", err);
            toast.error("Gagal memuat data keuangan", { id: 'error-fetch-finance' });
        } finally {
            setLoading(false);
            setIsInitialFetched(true);
        }
    }, [isInitialFetched]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    // --- ACTIONS ---

    const addCashAccount = async (account: Omit<CashAccount, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('finance_accounts').insert([{
                name: account.name,
                type: account.type,
                balance: account.balance,
                is_primary: account.isPrimary,
                number: account.number
            }]).select();

            if (!error && data) {
                setCashAccounts(prev => [...prev, { ...account, id: data[0].id }]);
                toast.success("Akun kas berhasil ditambahkan");
            } else {
                toast.error("Gagal menambahkan akun kas");
            }
        } else {
            setCashAccounts(prev => [...prev, { ...account, id: Date.now() }]);
        }
    };

    const addPaymentType = async (type: Omit<PaymentType, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('payment_types').insert([{
                name: type.name,
                type: type.type,
                amount: type.amount,
                category: type.category
            }]).select();

            if (!error && data) {
                setPaymentTypes(prev => [...prev, { ...type, id: data[0].id }]);
                toast.success("Jenis pembayaran disimpan");
            }
        } else {
            setPaymentTypes(prev => [...prev, { ...type, id: Date.now() }]);
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id'>) => {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase.from('expenses').insert([{
                date: expense.date,
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
                proof_url: expense.proof
            }]).select();

            if (!error && data) {
                setExpenses(prev => [{ ...expense, id: data[0].id }, ...prev]);
                toast.success("Pengeluaran dicatat");
            }
        } else {
            setExpenses(prev => [{ ...expense, id: Date.now() }, ...prev]);
        }
    }

    // Auto-save effects (Legacy Support for fallback)
    useEffect(() => {
        localStorage.setItem('finance_cash_accounts_v10', JSON.stringify(cashAccounts));
    }, [cashAccounts]);

    useEffect(() => {
        localStorage.setItem('finance_payment_types_v10', JSON.stringify(paymentTypes));
    }, [paymentTypes]);

    useEffect(() => {
        localStorage.setItem('finance_student_bills_v10', JSON.stringify(studentBills));
    }, [studentBills]);

    useEffect(() => {
        localStorage.setItem('finance_expenses_v10', JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        localStorage.setItem('payments_data_v10', JSON.stringify(paymentHistory));
    }, [paymentHistory]);

    return {
        financialYear,
        setFinancialYear,
        cashAccounts,
        setCashAccounts,
        addCashAccount,
        paymentTypes,
        setPaymentTypes,
        addPaymentType,
        studentBills,
        setStudentBills,
        expenses,
        setExpenses,
        addExpense,
        paymentHistory,
        setPaymentHistory,
        loading,
        refreshFinance: fetchFinanceData
    };
};
