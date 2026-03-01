"use client";

import React, { useState, useEffect } from 'react';
import DataGrid from '@/components/DataGrid';
import Dialog from '@/components/Dialog';
import ClientProfileModal from '@/components/ClientProfileModal';
import { User, Phone, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    tier: string;
    sizing_profile: any;
    ltv_score: string;
    birth_date?: string;
    style_preferences?: string;
    total_spent: string;
    current_debt: string;
}

import { useAuth } from '@/contexts/AuthContext';

// ... (existing imports)

export default function CustomersPage() {
    const { t, language } = useLanguage();
    const { token } = useAuth(); // Get token
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Clienteling State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, tierFilter, orderStatusFilter, token]); // Added token dependency

    const fetchCustomers = React.useCallback(() => {
        if (!token) return;

        setLoading(true);
        let url = '`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`api/brand/customers/?';
        if (searchQuery) url += `search=${searchQuery}&`;
        if (tierFilter) url += `tier=${tierFilter}&`;
        if (orderStatusFilter) url += `order_status=${orderStatusFilter}&`;

        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCustomers(data);
                } else {
                    console.error("API returned non-array:", data);
                    setCustomers([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [searchQuery, tierFilter, orderStatusFilter, token]);

    // Initial fetch handled by the effect above due to dependency on state

    const handleCreate = async () => {
        if (!formData.name || !formData.phone) return alert("Name and Phone are required");
        if (!token) return;

        try {
            const res = await fetch('`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/`api/brand/customers/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setFormData({ name: '', phone: '', email: '' });
                fetchCustomers();
            } else {
                alert("Failed to create customer");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openProfile = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsProfileOpen(true);
    };

    const columns = [
        {
            key: 'name',
            label: t('brandCustomers.customer'),
            render: (row: Customer) => (
                <div onClick={() => openProfile(row)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-stone-500 relative ${row.tier === 'VVIP' || row.tier === 'ELITE' ? 'bg-amber-100 text-amber-600' : 'bg-stone-100'
                        }`}>
                        <User size={16} />
                        {(row.tier === 'VIP' || row.tier === 'VVIP' || row.tier === 'ELITE') && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <Crown size={10} className="text-amber-500 fill-amber-500" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-stone-800 group-hover:text-cashmere-gold transition-colors">{row.name}</div>
                        <div className="text-xs text-stone-500 flex items-center gap-1">
                            {row.tier !== 'STANDARD' && <span className="font-bold text-amber-600 text-[10px] uppercase tracking-wider">{row.tier}</span>}
                            <span>{row.email}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            label: t('brandCustomers.phone'),
            render: (row: Customer) => (
                <div className="flex items-center gap-1 text-stone-600 font-mono text-xs">
                    <Phone size={12} /> {row.phone}
                </div>
            )
        },
        {
            key: 'ltv',
            label: t('brandCustomers.ltv'),
            render: (row: Customer) => (
                <div>
                    <div className="font-serif font-bold text-stone-800">{parseFloat(row.total_spent).toLocaleString()} {t('common.currency') || 'EGP'}</div>
                    {parseFloat(row.ltv_score) > 0 && <div className="text-[10px] text-stone-400">LTV: {parseFloat(row.ltv_score).toLocaleString()}</div>}
                </div>
            )
        },
        {
            key: 'current_debt',
            label: t('brandCustomers.debt'),
            render: (row: Customer) => {
                const debt = parseFloat(row.current_debt);
                return debt > 0 ? (
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-bold border border-red-100">
                        {debt.toLocaleString()} {t('common.currency') || 'EGP'} {t('brandCustomers.due')}
                    </span>
                ) : (
                    <span className="text-stone-400 text-xs text-opacity-50">{t('brandCustomers.clear')}</span>
                );
            }
        },
        {
            key: 'actions',
            label: '',
            render: (row: Customer) => (
                <button
                    onClick={() => openProfile(row)}
                    className="text-xs text-stone-400 hover:text-stone-800 underline decoration-stone-200"
                >
                    {t('brandCustomers.viewProfile')}
                </button>
            )
        }
    ];

    if (loading && !customers.length) return <div className="p-12 text-center text-stone-500 font-serif" suppressHydrationWarning>{t('common.loading')}</div>;

    return (
        <div className="p-8" suppressHydrationWarning>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">{t('brandCustomers.title')}</h1>
                    <p className="text-stone-500">{t('brandCustomers.subtitle')}</p>
                </div>
            </header>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 mb-6 flex gap-4 items-center">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder={t('brandCustomers.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 focus:bg-white transition-all shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className={`absolute top-2.5 text-stone-400 ${language === 'ar' ? 'right-3' : 'left-3'}`}>
                        <User size={16} />
                    </div>
                </div>
                <div className="w-48">
                    <select
                        className="w-full py-2 px-3 border border-stone-200 rounded-lg text-sm bg-stone-50"
                        value={orderStatusFilter}
                        onChange={e => setOrderStatusFilter(e.target.value)}
                    >
                        <option value="">{t('brandCustomers.allOrders')}</option>
                        <option value="PROCESSING">{t('brandCustomers.processing')}</option>
                        <option value="SHIPPED">{t('brandCustomers.shipped')}</option>
                    </select>
                </div>
                <div className="w-48">
                    <select
                        className="w-full py-2 px-3 border border-stone-200 rounded-lg text-sm bg-stone-50"
                        value={tierFilter}
                        onChange={e => setTierFilter(e.target.value)}
                    >
                        <option value="">{t('brandCustomers.allTiers')}</option>
                        <option value="STANDARD">{t('brandCustomers.standard')}</option>
                        <option value="VIP">VIP</option>
                        <option value="VVIP">VVIP</option>
                        <option value="ELITE">Elite</option>
                    </select>
                </div>
            </div>

            <DataGrid
                title={`${customers.length} ${t('brandCustomers.activeProfiles')}`}
                columns={columns}
                data={customers}
                action={
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                    >
                        <User size={14} />
                        <span>{t('brandCustomers.newClient')}</span>
                    </button>
                }
            />

            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={t('brandCustomers.addTitle')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('brandCustomers.fullName')} *</label>
                        <input
                            type="text"
                            className="w-full border-stone-200 rounded-lg text-sm"
                            placeholder="e.g. Ahmed Ali"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('brandCustomers.phone')} *</label>
                        <input
                            type="tel"
                            className="w-full border-stone-200 rounded-lg text-sm font-mono"
                            placeholder="e.g. 01xxxxxxxxx"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            className="w-full border-stone-200 rounded-lg text-sm"
                            placeholder="client@example.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-6">
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleCreate}
                            className="btn-primary text-sm px-6"
                        >
                            {t('brandCustomers.saveProfile')}
                        </button>
                    </div>
                </div>
            </Dialog>

            <ClientProfileModal
                isOpen={isProfileOpen}
                customer={selectedCustomer}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
}
