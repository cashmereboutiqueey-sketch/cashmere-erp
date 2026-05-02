
"use client";

import React, { useEffect, useState } from 'react';
import DataGrid from '@/components/DataGrid';
import Dialog from '@/components/Dialog';
import { Plus, DollarSign, History, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

interface Supplier {
    id: number;
    name: string;
    contact_info: string;
    payment_terms: string;
    balance: number;
}

interface RawMaterial {
    id: number;
    name: string;
    unit: string;
    cost_per_unit: string;
    supplier: number; // Supplier ID
}

interface PurchaseValues {
    supplier: string;
    raw_material: string;
    quantity: string;
    cost_per_unit: string;
}

interface PaymentValues {
    supplier: string;
    amount: string;
    method: string;
    notes: string;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const { token } = useAuth();

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Selected Supplier for History
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierHistory, setSupplierHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form States
    const [createForm, setCreateForm] = useState({ name: '', contact_info: '', payment_terms: '' });
    const [purchaseForm, setPurchaseForm] = useState<PurchaseValues>({ supplier: '', raw_material: '', quantity: '', cost_per_unit: '' });
    const [paymentForm, setPaymentForm] = useState<PaymentValues>({ supplier: '', amount: '', method: 'CASH', notes: '' });

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [supRes, matRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/suppliers/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/materials/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const supData = await supRes.json();
            const matData = await matRes.json();
            setSuppliers(Array.isArray(supData) ? supData : supData.results || supData.data || []);
            setMaterials(Array.isArray(matData) ? matData : matData.results || matData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    // --- Actions ---

    const handleCreateSupplier = async () => {
        { toast.error("Name is required"); return; }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/suppliers/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(createForm)
            });
            if (res.ok) {
                setIsCreateOpen(false);
                setCreateForm({ name: '', contact_info: '', payment_terms: '' });
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleRegisterPurchase = async () => {
        if (!purchaseForm.supplier || !purchaseForm.raw_material || !purchaseForm.quantity || !purchaseForm.cost_per_unit) {
            { toast.error("All fields are required"); return; }
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/purchases/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    supplier: parseInt(purchaseForm.supplier),
                    raw_material: parseInt(purchaseForm.raw_material),
                    quantity: parseFloat(purchaseForm.quantity),
                    cost_per_unit: parseFloat(purchaseForm.cost_per_unit),
                    total_cost: parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.cost_per_unit)
                })
            });
            if (res.ok) {
                setIsPurchaseOpen(false);
                setPurchaseForm({ supplier: '', raw_material: '', quantity: '', cost_per_unit: '' });
                fetchData(); // Update balance
            } else {
                toast.error("Failed to register purchase");
            }
        } catch (err) { console.error(err); }
    };

    const handleRegisterPayment = async () => {
        { toast.error("Supplier and Amount are required"); return; }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/payments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    supplier: parseInt(paymentForm.supplier),
                    amount: parseFloat(paymentForm.amount),
                    method: paymentForm.method,
                    notes: paymentForm.notes
                })
            });
            if (res.ok) {
                setIsPaymentOpen(false);
                setPaymentForm({ supplier: '', amount: '', method: 'CASH', notes: '' });
                fetchData(); // Update balance
            } else {
                toast.error("Failed to register payment");
            }
        } catch (err) { console.error(err); }
    };

    const handleViewHistory = async (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            // Fetch purchases for this supplier
            // Since we don't have a direct filter endpoint yet, strict filtering on client side or we could add ?supplier=ID to backend ViewSet
            // For now, let's fetch all purchases and filter (assuming low volume for demo)
            // Ideally: update backend ViewSet to support filtering.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/purchases/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allPurchasesData = await res.json();
            const allPurchases = Array.isArray(allPurchasesData) ? allPurchasesData : (allPurchasesData.results || []);
            const filtered = allPurchases.filter((p: any) => p.supplier === supplier.id);
            setSupplierHistory(filtered);
        } catch (err) { console.error(err); }
        finally { setHistoryLoading(false); }
    };

    const columns = [
        { key: 'name', label: t('suppliers.supplier'), render: (row: Supplier) => <span className="font-medium text-stone-900">{row.name}</span> },
        { key: 'contact_info', label: t('suppliers.contact') },
        { key: 'payment_terms', label: t('finance.terms') || 'Terms' }, // Fallback if no specific key, unlikely
        {
            key: 'balance',
            label: t('suppliers.balance'),
            render: (row: Supplier) => (
                <span className={`font-mono font-bold ${Number(row.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(row.balance).toLocaleString()} EGP
                </span>
            )
        },
        {
            key: 'actions',
            label: t('common.actions'),
            render: (row: Supplier) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setPaymentForm(prev => ({ ...prev, supplier: row.id.toString() }));
                            setIsPaymentOpen(true);
                        }}
                        className="text-xs border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded text-stone-600 flex items-center gap-1"
                        title={t('suppliers.pay')}
                    >
                        <DollarSign size={14} /> {t('finance.types.payment') || 'Pay'}
                    </button>
                    <button
                        onClick={() => handleViewHistory(row)}
                        className="text-xs border border-stone-200 hover:bg-stone-50 px-2 py-1 rounded text-stone-600 flex items-center gap-1"
                        title={t('suppliers.paymentHistory')}
                    >
                        <History size={14} /> {t('common.history') || 'History'}
                    </button>
                </div>
            )
        }
    ];

    if (loading) return <div className="p-8 text-center text-stone-500 font-serif">Loading Suppliers...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-serif text-cashmere-maroon">{t('suppliers.directory')}</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsPurchaseOpen(true)}
                        className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 flex items-center gap-2 shadow-sm"
                    >
                        <ShoppingCart size={16} /> {t('factoryInventory.confirmPurchase') || 'Register Purchase'}
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                        <Plus size={16} /> {t('suppliers.addSupplier')}
                    </button>
                </div>
            </div>

            <DataGrid
                title="Active Vendors & Balances"
                columns={columns}
                data={suppliers}
            />

            {/* Create Supplier Dialog */}
            <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('suppliers.addSupplier')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('suppliers.supplier')} *</label>
                        <input
                            type="text"
                            className="w-full border-stone-200 rounded-lg text-sm focus:ring-cashmere-maroon focus:border-cashmere-maroon"
                            value={createForm.name}
                            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('suppliers.contact')}</label>
                        <input
                            type="text"
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={createForm.contact_info}
                            onChange={e => setCreateForm({ ...createForm, contact_info: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('finance.terms') || 'Payment Terms'}</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={createForm.payment_terms}
                            onChange={e => setCreateForm({ ...createForm, payment_terms: e.target.value })}
                        >
                            <option value="">{t('common.select') || 'Select Terms...'}</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                            <option value="Cash on Delivery">Cash on Delivery</option>
                            <option value="Advance">Advance Payment</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-4">
                        <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800">{t('common.cancel')}</button>
                        <button onClick={handleCreateSupplier} className="btn-primary text-sm px-6">{t('common.save')}</button>
                    </div>
                </div>
            </Dialog>

            {/* Register Purchase Dialog */}
            <Dialog isOpen={isPurchaseOpen} onClose={() => setIsPurchaseOpen(false)} title="Register Material Purchase">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Supplier *</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={purchaseForm.supplier}
                            onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Raw Material *</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={purchaseForm.raw_material}
                            onChange={e => {
                                const selectedMat = materials.find(m => m.id === parseInt(e.target.value));
                                setPurchaseForm({
                                    ...purchaseForm,
                                    raw_material: e.target.value,
                                    cost_per_unit: selectedMat ? selectedMat.cost_per_unit : purchaseForm.cost_per_unit // Auto-fill cost if available
                                });
                            }}
                        >
                            <option value="">Select Material...</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Quantity *</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                value={purchaseForm.quantity}
                                onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Unit Cost (EGP) *</label>
                            <input
                                type="number"
                                className="w-full border-stone-200 rounded-lg text-sm"
                                value={purchaseForm.cost_per_unit}
                                onChange={e => setPurchaseForm({ ...purchaseForm, cost_per_unit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800 flex justify-between items-center">
                        <span className="font-medium">Total Cost (Debt Increase):</span>
                        <span className="font-bold text-lg">
                            {(parseFloat(purchaseForm.quantity || '0') * parseFloat(purchaseForm.cost_per_unit || '0')).toFixed(2)} EGP
                        </span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-4">
                        <button onClick={() => setIsPurchaseOpen(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
                        <button onClick={handleRegisterPurchase} className="btn-primary text-sm px-6">Register Purchase</button>
                    </div>
                </div>
            </Dialog>

            {/* Pay Supplier Dialog */}
            <Dialog isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={t('suppliers.pay') || "Pay Supplier"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('suppliers.supplier')} *</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={paymentForm.supplier}
                            onChange={e => setPaymentForm({ ...paymentForm, supplier: e.target.value })}
                        >
                            <option value="">{t('common.select') || 'Select...'}</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({t('common.due') || 'Due'}: {Number(s.balance).toLocaleString()} EGP)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('finance.amount')} (EGP) *</label>
                        <input
                            type="number"
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={paymentForm.amount}
                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('pos.payment.method')}</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={paymentForm.method}
                            onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                        >
                            <option value="CASH">{t('common.cash') || 'Cash'}</option>
                            <option value="BANK">{t('common.bank') || 'Bank Transfer'}</option>
                            <option value="CHECK">{t('common.check') || 'Check'}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                        <textarea
                            className="w-full border-stone-200 rounded-lg text-sm"
                            rows={2}
                            value={paymentForm.notes}
                            onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-4">
                        <button onClick={() => setIsPaymentOpen(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800">Cancel</button>
                        <button onClick={handleRegisterPayment} className="btn-primary text-sm px-6 bg-green-600 hover:bg-green-700 text-white">Confirm Payment</button>
                    </div>
                </div>
            </Dialog>

            {/* History Dialog */}
            <Dialog isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`${t('common.history')}: ${selectedSupplier?.name}`}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {historyLoading ? (
                        <div className="text-center py-4 text-stone-500">{t('common.loading')}</div>
                    ) : supplierHistory.length === 0 ? (
                        <div className="text-center py-8 text-stone-400 italic">{t('common.noRecords')}</div>
                    ) : (
                        <div className="space-y-3">
                            {supplierHistory.map((item, idx) => (
                                <div key={idx} className="bg-stone-50 border border-stone-100 p-3 rounded-lg flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-semibold text-stone-800">{item.raw_material_name}</div>
                                        <div className="text-xs text-stone-500">
                                            {new Date(item.date).toLocaleDateString()} • {item.quantity} {t('factoryInventory.unitCost')} @ {item.cost_per_unit} EGP
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-cashmere-maroon">
                                            {Number(item.total_cost).toLocaleString()} EGP
                                        </div>
                                        <div className="text-[10px] text-stone-400 uppercase tracking-wide">{t('factoryInventory.confirmPurchase')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="pt-4 border-t border-stone-100">
                        <div className="text-sm text-stone-600 flex justify-between">
                            <span>{t('suppliers.balance')}:</span>
                            <span className="font-bold text-red-600">{Number(selectedSupplier?.balance || 0).toLocaleString()} EGP</span>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
