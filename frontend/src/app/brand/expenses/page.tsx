"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Send, Clock } from 'lucide-react';
import DataGrid from '@/components/DataGrid';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

interface Transaction {
    id: number;
    amount: string;
    description: string;
    reference_id: string;
    created_at: string;
    type: string;
}

export default function ExpensesPage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        reference_id: ''
    });

    const fetchTransactions = () => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/?type=EXPENSE`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setTransactions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (token) fetchTransactions();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) { toast.error(t('finance.alerts.required')); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/finance/transactions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    type: 'EXPENSE',
                    amount: parseFloat(formData.amount), // Expenses are stored as positive values usually, logic depends on P&L calc
                    description: formData.description,
                    reference_id: formData.reference_id || `EXP-${Date.now()}`
                })
            });

            if (res.ok) {
                setFormData({ amount: '', description: '', reference_id: '' });
                fetchTransactions();
            } else {
                toast.error("Failed to record expense");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { key: 'created_at', label: t('finance.date'), render: (row: Transaction) => new Date(row.created_at).toLocaleDateString() },
        { key: 'reference_id', label: t('finance.refId') },
        { key: 'description', label: t('finance.description') },
        {
            key: 'amount',
            label: t('finance.amount'),
            render: (row: Transaction) => (
                <span className="font-mono text-red-700 font-bold">
                    -{parseFloat(row.amount).toLocaleString()} EGP
                </span>
            )
        }
    ];

    return (
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Input Form */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-8">
                    <h2 className="text-xl font-serif font-bold text-cashmere-maroon mb-6 flex items-center gap-2">
                        <DollarSign size={20} /> {t('finance.recordExpense')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.amount')} (EGP)</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-lg font-mono text-red-800 bg-red-50 focus:ring-red-200 focus:border-red-300"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.description')}</label>
                            <textarea
                                rows={3}
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="e.g. Store Rent, Facebook Ads..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('finance.refId')} (Optional)</label>
                            <input
                                type="text"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                placeholder="Invoice #"
                                value={formData.reference_id}
                                onChange={e => setFormData({ ...formData, reference_id: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4"
                        >
                            <Send size={16} /> {t('finance.recordTx')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Ledger */}
            <div className="lg:col-span-2">
                <h1 className="text-3xl font-serif text-cashmere-black mb-6">{t('finance.ledger')}</h1>
                <DataGrid
                    title={t('finance.recentExpenses')}
                    columns={columns}
                    data={transactions}
                />
            </div>
        </div>
    );
}
