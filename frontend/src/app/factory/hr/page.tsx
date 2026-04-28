'use client';

import React, { useEffect, useState } from 'react';
import {
    Users, Clock, Factory, Plus, CheckCircle,
    Calendar, FileText, DollarSign
} from 'lucide-react';
import { hrService, Worker, WorkerAttendance, ProductionLog, HRStats, PayrollRecord } from '../../../services/hr';
import { jobsService, ProductionJob } from '../../../services/factory';
import KPICard from '@/components/KPICard';
import DataGrid from '@/components/DataGrid';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FactoryHRPage() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<HRStats | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [activeTab, setActiveTab] = useState<'attendance' | 'production'>('attendance');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // View Mode
    const [viewMode, setViewMode] = useState<'directory' | 'payroll'>('directory');

    // Payroll State
    const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
    const [payrollStartDate, setPayrollStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // First day of current month
        return d.toISOString().split('T')[0];
    });
    const [payrollEndDate, setPayrollEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Modal States
    const [openWorkerModal, setOpenWorkerModal] = useState(false);
    const [newWorker, setNewWorker] = useState({ name: '', role: 'Worker', hourly_rate: '' });

    // Daily Entry States
    const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

    // Attendance State
    const [hoursWorked, setHoursWorked] = useState('');

    // Production State
    const [productionQuantity, setProductionQuantity] = useState('');
    const [jobs, setJobs] = useState<ProductionJob[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<number | ''>('');

    useEffect(() => {
        fetchData();
        fetchJobs();
    }, []);

    useEffect(() => {
        if (viewMode === 'payroll') {
            fetchPayroll();
        }
    }, [viewMode, payrollStartDate, payrollEndDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [workersData, statsData] = await Promise.all([
                hrService.getWorkers(),
                hrService.getStats()
            ]);
            setWorkers(workersData);
            setStats(statsData);
        } catch (error) {
            console.error("Error fetching HR data", error);
            setFetchError('Failed to load HR data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPayroll = async () => {
        try {
            const data = await hrService.getPayroll(payrollStartDate, payrollEndDate);
            setPayrollData(data.payroll);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchJobs = async () => {
        try {
            const data = await jobsService.getJobs();
            setJobs(data);

        } catch (e) {
            console.error(e);
        }
    };

    const handleAddWorker = async () => {
        if (!newWorker.name || !newWorker.hourly_rate) return;
        try {
            await hrService.createWorker(newWorker);
            setOpenWorkerModal(false);
            setNewWorker({ name: '', role: 'Worker', hourly_rate: '' });
            fetchData();
        } catch (error: any) {
            console.error("Add Worker Error:", error);
            // Support both Axios-like errors (if any) and standard JS/API errors
            const msg = error.response?.data
                ? JSON.stringify(error.response.data)
                : (error.message || 'Failed to create worker');
            alert(`Error: ${msg}`);
        }
    };

    const handleLogAttendance = async () => {
        if (!selectedWorkerId || !hoursWorked) return;
        try {
            await hrService.logAttendance({
                worker: Number(selectedWorkerId),
                date: entryDate,
                hours_worked: Number(hoursWorked),
                notes: 'Logged via HR Dashboard'
            });
            alert('Attendance Logged!');
            setHoursWorked('');
            fetchData(); // Refresh stats
        } catch (error) {
            alert('Failed to log attendance');
        }
    };

    const handleLogProduction = async () => {
        if (!selectedWorkerId || !productionQuantity) return;
        try {
            await hrService.logProduction({
                worker: Number(selectedWorkerId),
                date: entryDate,
                quantity: Number(productionQuantity),
                job: selectedJobId ? Number(selectedJobId) : undefined
            });
            alert('Production Logged!');
            setProductionQuantity('');
            fetchData(); // Refresh stats
        } catch (error) {
            alert('Failed to log production');
        }
    };

    const handleProcessPayroll = async () => {
        const total = payrollData.reduce((sum, p) => sum + Number(p.total_pay), 0);
        if (total <= 0) {
            alert('No payroll amount to process.');
            return;
        }

        if (!confirm(`Are you sure you want to process payroll for ${payrollStartDate} to ${payrollEndDate}?\n\nTotal Amount: ${total.toLocaleString()} EGP\n\nThis will record an expense in the Finance module.`)) {
            return;
        }

        try {
            const res = await hrService.processPayroll(payrollStartDate, payrollEndDate);
            alert(res.message);
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to process payroll';
            alert(`Error: ${msg}`);
        }
    };

    const columns = [
        { key: 'name', label: t('factoryHr.name') },
        { key: 'role', label: t('factoryHr.role') },
        { key: 'hourly_rate', label: `${t('factoryHr.rate')} (${t('common.currency') || 'EGP'})` },
        {
            key: 'active',
            label: t('factoryHr.status'),
            render: (row: Worker) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                    {row.active ? t('factoryHr.active') : t('factoryHr.inactive')}
                </span>
            )
        },
    ];

    if (loading) return <div className="p-8">{t('common.loading')}</div>;
    if (fetchError) return <div className="p-8 text-center text-red-600 font-medium">{fetchError}</div>;

    return (
        <div className="p-8 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-serif text-cashmere-maroon">{t('factoryHr.title')}</h1>
                    <p className="text-stone-500 mt-2">{t('factoryHr.subtitle')}</p>
                </div>
                <button
                    onClick={() => setOpenWorkerModal(true)}
                    className="bg-cashmere-black text-white px-4 py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    {t('factoryHr.addWorker')}
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title={t('factoryHr.totalWorkers')}
                    value={stats?.total_workers || 0}
                    icon={Users}
                    subtext={t('factoryHr.activePersonnel')}
                />
                <KPICard
                    title={t('factoryHr.hoursToday')}
                    value={`${stats?.total_hours_today || 0} ${'hrs'}`}
                    icon={Clock}
                    subtext={t('factoryHr.dailyLabor')}
                />
                <KPICard
                    title={t('factoryHr.piecesToday')}
                    value={`${stats?.total_production_today || 0} ${'pcs'}`}
                    icon={Factory}
                    subtext={t('factoryHr.dailyOutput')}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* Left: Workers List / Payroll */}
                <div className="lg:col-span-7 h-full flex flex-col gap-4">

                    {/* View Toggle */}
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200 shadow-sm">
                        <div className="flex bg-stone-100 p-1 rounded-md">
                            <button
                                onClick={() => setViewMode('directory')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${viewMode === 'directory'
                                    ? 'bg-white text-cashmere-black shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                {t('factoryHr.directory')}
                            </button>
                            <button
                                onClick={() => setViewMode('payroll')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${viewMode === 'payroll'
                                    ? 'bg-white text-cashmere-black shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                {t('factoryHr.payroll') || 'Payroll'}
                            </button>
                        </div>

                        {viewMode === 'payroll' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={payrollStartDate}
                                    onChange={(e) => setPayrollStartDate(e.target.value)}
                                    className="text-xs border-stone-200 rounded-md py-1"
                                />
                                <span className="text-stone-400">-</span>
                                <input
                                    type="date"
                                    value={payrollEndDate}
                                    onChange={(e) => setPayrollEndDate(e.target.value)}
                                    className="text-xs border-stone-200 rounded-md py-1"
                                />
                            </div>
                        )}
                    </div>

                    {viewMode === 'directory' ? (
                        <DataGrid
                            title={t('factoryHr.directory')}
                            columns={columns}
                            data={workers}
                            selectable={false}
                        />
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                            <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                                <h3 className="font-bold text-stone-700">{t('factoryHr.payrollReport') || 'Payroll Report'}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                        Total: {payrollData.reduce((sum, p) => sum + Number(p.total_pay), 0).toFixed(2)} EGP
                                    </span>
                                    <button
                                        onClick={handleProcessPayroll}
                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                                    >
                                        <DollarSign size={14} />
                                        Process Payment
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-stone-50 text-stone-500 font-serif">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Worker</th>
                                            <th className="px-4 py-3 font-medium">Rate</th>
                                            <th className="px-4 py-3 font-medium">Hours</th>
                                            <th className="px-4 py-3 font-medium text-right">Total Pay</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {payrollData.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-stone-400">No data for this period</td></tr>
                                        ) : (
                                            payrollData.map(p => (
                                                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-stone-800">{p.name}</td>
                                                    <td className="px-4 py-3 text-stone-600">{p.hourly_rate}</td>
                                                    <td className="px-4 py-3 text-stone-600">{p.total_hours} hrs</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                                        {Number(p.total_pay).toLocaleString()} EGP
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Daily Entry Form */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="text-cashmere-gold" size={24} />
                            <h3 className="font-serif text-xl font-bold text-stone-800">{t('factoryHr.dailyLog')}</h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-stone-100 p-1 rounded-lg mb-6">
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'attendance'
                                    ? 'bg-white text-cashmere-black shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                {t('factoryHr.logAttendance')}
                            </button>
                            <button
                                onClick={() => setActiveTab('production')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'production'
                                    ? 'bg-white text-cashmere-black shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                {t('factoryHr.logProduction')}
                            </button>
                        </div>

                        {/* Date Picker */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t('finance.date')}</label>
                            <input
                                type="date"
                                className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                value={entryDate}
                                onChange={(e) => setEntryDate(e.target.value)}
                            />
                        </div>

                        {activeTab === 'attendance' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.worker')}</label>
                                    <select
                                        className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                        value={selectedWorkerId}
                                        onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                                    >
                                        <option value="">-- {t('common.select')} --</option>
                                        {workers.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.hours')}</label>
                                    <input
                                        type="number"
                                        className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                        value={hoursWorked}
                                        onChange={(e) => setHoursWorked(e.target.value)}
                                        placeholder="e.g. 8"
                                    />
                                </div>
                                <button
                                    onClick={handleLogAttendance}
                                    disabled={!selectedWorkerId || !hoursWorked}
                                    className="w-full bg-cashmere-black text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                                >
                                    {t('factoryHr.saveAttendance')}
                                </button>
                            </div>
                        )}

                        {activeTab === 'production' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.worker')}</label>
                                    <select
                                        className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                        value={selectedWorkerId}
                                        onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                                    >
                                        <option value="">-- {t('common.select')} --</option>
                                        {workers.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.job')} ({t('common.optional')})</label>
                                    <select
                                        className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(Number(e.target.value))}
                                    >
                                        <option value="">-- {t('factoryHr.general')} --</option>
                                        {jobs.map(j => (
                                            <option key={j.id} value={j.id}>{j.name} - {j.product_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.quantity')}</label>
                                    <input
                                        type="number"
                                        className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                        value={productionQuantity}
                                        onChange={(e) => setProductionQuantity(e.target.value)}
                                        placeholder="Pieces"
                                    />
                                </div>
                                <button
                                    onClick={handleLogProduction}
                                    disabled={!selectedWorkerId || !productionQuantity}
                                    className="w-full bg-cashmere-black text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                                >
                                    {t('factoryHr.saveLog')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Worker Modal */}
            <Dialog
                isOpen={openWorkerModal}
                onClose={() => setOpenWorkerModal(false)}
                title={t('factoryHr.addWorker')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.name')}</label>
                        <input
                            type="text"
                            className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                            value={newWorker.name}
                            onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.role')}</label>
                        <input
                            type="text"
                            className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                            value={newWorker.role}
                            onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">{t('factoryHr.rate')} ({t('common.currency') || 'EGP'})</label>
                        <input
                            type="number"
                            className="w-full border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                            value={newWorker.hourly_rate}
                            onChange={(e) => setNewWorker({ ...newWorker, hourly_rate: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setOpenWorkerModal(false)}
                            className="px-4 py-2 text-stone-600 hover:text-stone-800 font-bold"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleAddWorker}
                            className="bg-cashmere-maroon text-white px-6 py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors"
                        >
                            {t('factoryHr.createWorker')}
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}

