"use client";

import React, { useEffect, useState } from 'react';
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Play,
    CheckCircle,
    AlertCircle,
    Package,
    ClipboardList,
    ArrowRight,
    Search,
    Wrench,
    XCircle,
    FileText,
    CheckSquare,
    Square
} from 'lucide-react';

interface Job {
    id: number;
    name: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'QC' | 'COMPLETED' | 'CANCELLED';
    qc_status: 'NA' | 'PASS' | 'REJECT' | 'REPAIR';
    source_order?: number;
    source_order_number?: string;
    notes?: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

export default function ActiveJobsPage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_PROGRESS' | 'QC' | 'COMPLETED'>('PENDING');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Selection State for Pending Jobs
    const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());

    // Locations for transfer target
    const [locations, setLocations] = useState<{ id: number; name: string; type: string }[]>([]);
    const [transferLocationId, setTransferLocationId] = useState<string>('');

    // Create Manual Job State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [newJobData, setNewJobData] = useState({
        product: '',
        quantity: 1,
        notes: ''
    });

    const fetchJobs = () => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                setJobs(Array.isArray(data) ? data : (data.results || []));
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    const fetchProducts = () => {
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/?lite=true`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setProducts(Array.isArray(data) ? data : (data.results || [])))
            .catch(err => console.error("Failed to fetch products", err));
    };

    useEffect(() => {
        if (token) {
            fetchJobs();
            fetchProducts();
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/locations/`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.json())
                .then(data => {
                    const locs: { id: number; name: string; type: string }[] = Array.isArray(data) ? data : (data.results || []);
                    setLocations(locs);
                    // Default: first WAREHOUSE, then first of any type
                    const wh = locs.find(l => l.type === 'WAREHOUSE') || locs[0];
                    if (wh) setTransferLocationId(wh.id.toString());
                })
                .catch(err => console.error('Failed to fetch locations', err));
        }
    }, [token]);

    const toggleJobSelection = (id: number) => {
        const newSet = new Set(selectedJobIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedJobIds(newSet);
    };

    const toggleGroupSelection = (jobIds: number[]) => {
        const allSelected = jobIds.every(id => selectedJobIds.has(id));
        const newSet = new Set(selectedJobIds);

        if (allSelected) {
            jobIds.forEach(id => newSet.delete(id));
        } else {
            jobIds.forEach(id => newSet.add(id));
        }
        setSelectedJobIds(newSet);
    };

    const handleCreateJob = async () => {
        if (!newJobData.product) return alert("Please select a product");
        if (newJobData.quantity <= 0) return alert("Quantity must be greater than 0");

        try {
            // Generate a manual job name
            const timestamp = new Date().getTime();
            const jobName = `JOB-MANUAL-${timestamp}`;

            const payload = {
                name: jobName,
                product: parseInt(newJobData.product),
                quantity: newJobData.quantity,
                notes: newJobData.notes,
                status: 'PENDING'
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Job Created Successfully!");
                setIsCreateDialogOpen(false);
                setNewJobData({ product: '', quantity: 1, notes: '' });
                fetchJobs();
            } else {
                const err = await res.json();
                console.error("Create failed:", err);
                alert("Failed to create job: " + JSON.stringify(err));
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error occurred.");
        }
    };

    const handleAction = async (id: number, action: 'start' | 'qc' | 'pass_qc' | 'fail_qc' | 'repair_qc' | 'cancel', payload?: any) => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/${id}/`;
            let method = 'PATCH';
            let body = {};

            if (action === 'start') {
                url += 'start/';
                method = 'POST';
            } else if (action === 'qc') {
                body = { status: 'QC' };
            } else if (action === 'pass_qc') {
                body = { qc_status: 'PASS' };
            } else if (action === 'fail_qc') {
                body = { qc_status: 'REJECT' };
            } else if (action === 'repair_qc') {
                body = { qc_status: 'REPAIR' };
            } else if (action === 'cancel') {
                body = { status: 'CANCELLED' };
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: method === 'PATCH' ? JSON.stringify(body) : undefined
            });

            if (res.ok) {
                fetchJobs();
            } else {
                const err = await res.json();
                console.error("Action failed:", err);
                // Clean up Python list string representation if present
                let msg = err.error || JSON.stringify(err);
                if (msg.startsWith("['") && msg.endsWith("']")) {
                    msg = msg.slice(2, -2);
                }
                alert("Action Failed: " + msg);
            }
        } catch (error) {
            console.error("Network or parsing error:", error);
            alert("Failed to perform action. Check console for details.");
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const confirmTransfer = async () => {
        if (!selectedJob) return;
        setIsSubmitting(true);
        try {
            console.log(`Attempting to complete job ${selectedJob.id}...`);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/${selectedJob.id}/complete/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ location_id: transferLocationId ? parseInt(transferLocationId) : null }),
            });

            if (res.ok) {
                console.log("Job completed successfully.");
                setShowTransferModal(false);
                fetchJobs();
                alert(`Job Completed Successfully! Inventory transferred.`);
            } else {
                const err = await res.json();
                console.error("Transfer failed:", err);

                let msg = err.error || JSON.stringify(err);
                // Handle detailed Django error structs
                if (typeof err === 'object') {
                    msg = Object.entries(err).map(([k, v]) => `${k}: ${v}`).join('\n');
                }

                if (msg.startsWith("['") && msg.endsWith("']")) {
                    msg = msg.slice(2, -2);
                }
                alert("Transfer Error:\n" + msg);
            }
        } catch (err) {
            console.error("Network error during transfer:", err);
            alert("Transfer failed due to network error. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredJobs = jobs.filter(j => j.status === activeTab);

    if (loading) return <div className="p-8 text-center text-stone-400">{t('common.loading')}</div>;

    return (
        <div className="p-8">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-cashmere-maroon">{t('factoryJobs.title')}</h1>
                    <p className="text-stone-500 mt-1">{t('factoryJobs.subtitle')}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                        <ClipboardList size={16} />
                        <span>+ {t('factoryJobs.manualJob')}</span>
                    </button>
                    <div className="flex bg-stone-100 p-1 rounded-lg">
                        {(['PENDING', 'IN_PROGRESS', 'QC', 'COMPLETED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-white text-cashmere-black shadow-sm'
                                    : 'text-stone-400 hover:text-stone-600'
                                    }`}
                            >
                                {t(`factoryJobs.${tab === 'IN_PROGRESS' ? 'inProgress' : tab.toLowerCase()}`)}
                                <span className="ml-2 text-xs bg-stone-100 px-1.5 py-0.5 rounded-full border border-stone-200 text-stone-500">
                                    {jobs.filter(j => j.status === tab).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {activeTab === 'PENDING' ? (
                // Grouped View for Pending Jobs
                <div className="space-y-6">
                    {Object.entries(
                        filteredJobs.reduce((acc, job) => {
                            // Extract Style Name (assuming format "Style Name - Size/Color" or just grouping by Name)
                            // Ideally, we group by Product Name (Style)
                            const styleName = job.product_name.split(' - ')[0]; // Simple split fallback
                            if (!acc[styleName]) acc[styleName] = [];
                            acc[styleName].push(job);
                            return acc;
                        }, {} as Record<string, Job[]>)
                    ).map(([styleName, groupJobs]) => {
                        const totalQty = groupJobs.reduce((sum, j) => sum + j.quantity, 0);
                        const groupIds = groupJobs.map(j => j.id);

                        // Valid selection: intersection of this group's IDs and selected IDs
                        const groupSelectedIds = groupIds.filter(id => selectedJobIds.has(id));
                        const isAllSelected = groupSelectedIds.length === groupJobs.length && groupJobs.length > 0;
                        const isPartiallySelected = groupSelectedIds.length > 0 && !isAllSelected;

                        // Calculate total qty for SELECTED items only
                        const selectedQty = groupJobs.filter(j => selectedJobIds.has(j.id)).reduce((sum, j) => sum + j.quantity, 0);

                        return (
                            <div key={styleName} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleGroupSelection(groupIds)}
                                            className="text-stone-400 hover:text-stone-600 transition-colors"
                                        >
                                            {isAllSelected ? (
                                                <CheckSquare size={20} className="text-cashmere-maroon" />
                                            ) : isPartiallySelected ? (
                                                <div className="relative">
                                                    <Square size={20} />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 bg-cashmere-maroon rounded-sm"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-serif font-bold text-cashmere-black">{styleName}</h3>
                                            <p className="text-stone-500 text-sm mt-1">
                                                {groupJobs.length} {t('factoryJobs.pendingOrders')} • {t('factoryJobs.totalUnits')}: {totalQty}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (groupSelectedIds.length === 0) return;
                                            if (!confirm(`Start cutting ${selectedQty} units (from selected ${groupSelectedIds.length} jobs) of ${styleName}?`)) return;

                                            type JobResult = { id: number; ok: boolean; error?: string };
                                            const results: JobResult[] = await Promise.all(
                                                groupSelectedIds.map(async (id: number): Promise<JobResult> => {
                                                    try {
                                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/${id}/start/`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                                                        });
                                                        if (!res.ok) {
                                                            const err = await res.json();
                                                            return { id, ok: false, error: `Job ${id}: ${(err.error || JSON.stringify(err)).replace(/\[|\]|"/g, '')}` };
                                                        }
                                                        return { id, ok: true };
                                                    } catch (e: any) {
                                                        return { id, ok: false, error: `Job ${id}: ${e.message || 'Network error'}` };
                                                    }
                                                })
                                            );

                                            const succeeded = results.filter(r => r.ok);
                                            const failed = results.filter(r => !r.ok);

                                            if (succeeded.length > 0) {
                                                const newSet = new Set(selectedJobIds);
                                                succeeded.forEach(r => newSet.delete(r.id));
                                                setSelectedJobIds(newSet);
                                                fetchJobs();
                                            }

                                            if (failed.length === 0) {
                                                alert(`All ${succeeded.length} job(s) started successfully!`);
                                                setActiveTab('IN_PROGRESS');
                                            } else {
                                                const failMsgs = failed.map(r => r.error || `Job ${r.id} failed`).join('\n');
                                                alert(`${succeeded.length} started, ${failed.length} failed:\n${failMsgs}`);
                                            }
                                        }}
                                        disabled={groupSelectedIds.length === 0}
                                        className={`flex items-center gap-2 px-6 py-3 transition-colors ${groupSelectedIds.length > 0
                                            ? 'btn-primary'
                                            : 'bg-stone-200 text-stone-400 cursor-not-allowed rounded-lg font-bold'
                                            }`}
                                    >
                                        <Play size={18} />
                                        <span>
                                            {groupSelectedIds.length > 0
                                                ? `${t('factoryJobs.startBatch')} (${selectedQty} units)`
                                                : t('factoryJobs.selectToStart')}
                                        </span>
                                    </button>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupJobs.map(job => {
                                        const isSelected = selectedJobIds.has(job.id);
                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => toggleJobSelection(job.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                    ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200 shadow-sm'
                                                    : 'bg-stone-50 border-stone-100 hover:border-stone-200'
                                                    }`}
                                            >
                                                <div className={`text-stone-400 ${isSelected ? 'text-amber-600' : ''}`}>
                                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div className="flex-1 flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-stone-700 text-sm">{job.product_name}</div>
                                                        <div className="text-xs text-stone-400 font-mono">{job.product_sku}</div>
                                                        {job.source_order_number && (
                                                            <div className="mt-1 flex flex-col gap-1 items-start">
                                                                <div className="text-[10px] text-amber-600 font-bold bg-amber-50 inline-block px-1.5 py-0.5 rounded border border-amber-100">
                                                                    ORD #{job.source_order_number}
                                                                </div>
                                                                {job.notes?.includes("Customer:") && (
                                                                    <div className="text-[10px] text-stone-500 font-medium bg-white px-1.5 py-0.5 rounded border border-stone-100 italic">
                                                                        {job.notes.split('\n').find(l => l.startsWith("Customer:"))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-lg text-cashmere-maroon">{job.quantity}</div>
                                                        <div className="text-[10px] text-stone-400 uppercase">{t('factoryJobs.units')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {filteredJobs.length === 0 && (
                        <div className="py-12 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                            {t('factoryJobs.noJobs')}
                        </div>
                    )}
                </div>
            ) : (
                // Original Grid View for Non-Pending
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                            {t('factoryJobs.noJobs')}
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <div key={job.id} className="relative bg-white p-6 rounded-xl shadow-sm border border-stone-200 group hover:shadow-md transition-all">
                                {/* Made-to-Order Badge */}
                                {job.source_order_number && (
                                    <div className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1 shadow-sm">
                                        <ClipboardList size={10} />
                                        {t('factoryJobs.order')} #{job.source_order_number}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-stone-800 line-clamp-1">{job.product_name}</h3>
                                        <p className="text-sm font-mono text-stone-500">{job.product_sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-cashmere-black">{job.quantity}</span>
                                        <span className="text-xs text-stone-400 uppercase">{t('factoryJobs.units')}</span>
                                    </div>
                                </div>

                                {job.notes && (
                                    <div className="mb-4 text-xs text-stone-500 bg-stone-50 p-2 rounded border border-stone-100 flex gap-1.5">
                                        <FileText size={12} className="shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{job.notes}</span>
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t border-stone-100">
                                    {activeTab === 'IN_PROGRESS' && (
                                        <button onClick={() => handleAction(job.id, 'qc')} className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-2">
                                            <Search size={16} /> {t('factoryJobs.sendQc')}
                                        </button>
                                    )}
                                    {activeTab === 'QC' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-stone-500">{t('factoryJobs.qcStatus')}:</span>
                                                <span className={`font-bold ${job.qc_status === 'PASS' ? 'text-green-600' : job.qc_status === 'REJECT' ? 'text-red-600' : job.qc_status === 'REPAIR' ? 'text-amber-600' : 'text-stone-800'}`}>
                                                    {job.qc_status === 'PASS' ? t('factoryJobs.pass') : job.qc_status === 'REJECT' ? t('factoryJobs.reject') : job.qc_status === 'REPAIR' ? t('factoryJobs.repair') : job.qc_status}
                                                </span>
                                            </div>
                                            {job.qc_status !== 'PASS' ? (
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button onClick={() => handleAction(job.id, 'pass_qc')} className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center justify-center gap-1" title={t('factoryJobs.pass')}><CheckCircle size={16} /> {t('factoryJobs.pass')}</button>
                                                    <button onClick={() => handleAction(job.id, 'repair_qc')} className={`py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 flex items-center justify-center gap-1 ${job.qc_status === 'REPAIR' ? 'ring-2 ring-amber-400' : ''}`} title={t('factoryJobs.repair')}><Wrench size={16} /> {t('factoryJobs.repair')}</button>
                                                    <button onClick={() => handleAction(job.id, 'fail_qc')} className={`py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 flex items-center justify-center gap-1 ${job.qc_status === 'REJECT' ? 'ring-2 ring-red-400' : ''}`} title={t('factoryJobs.reject')}><AlertCircle size={16} /> {t('factoryJobs.reject')}</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setSelectedJob(job); setShowTransferModal(true); }} className="w-full btn-primary flex items-center justify-center gap-2">
                                                    <Package size={16} /> {t('factoryJobs.transferStock')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'COMPLETED' && (
                                        <div className="text-center py-2 bg-stone-50 rounded text-stone-400 text-sm flex items-center justify-center gap-2"><CheckCircle size={14} /> {t('factoryJobs.completed')}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Dialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                title={t('factoryJobs.createManual')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryJobs.product')} *</label>
                        <select
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={newJobData.product}
                            onChange={e => setNewJobData({ ...newJobData, product: e.target.value })}
                        >
                            <option value="">{t('bom.selectProduct')}</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('factoryJobs.quantity')} *</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border-stone-200 rounded-lg text-sm"
                            value={newJobData.quantity}
                            onChange={e => setNewJobData({ ...newJobData, quantity: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('common.notes')}</label>
                        <textarea
                            className="w-full border-stone-200 rounded-lg text-sm"
                            rows={3}
                            placeholder={t('factoryJobs.reason')}
                            value={newJobData.notes}
                            onChange={e => setNewJobData({ ...newJobData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-6">
                        <button
                            onClick={() => setIsCreateDialogOpen(false)}
                            className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleCreateJob}
                            className="btn-primary text-sm px-6"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </Dialog>

            {showTransferModal && selectedJob && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-stone-200 z-[101]">
                        <div className="flex items-center gap-3 mb-6 text-cashmere-maroon">
                            <div className="p-3 bg-cashmere-maroon/10 rounded-full">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-bold">{t('factoryJobs.transferInventory')}</h2>
                                <p className="text-xs text-stone-500">{t('factoryJobs.confirmFinish')}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 bg-stone-50 p-4 rounded-lg border border-stone-100">
                            <div className="flex justify-between"><span className="text-stone-500 text-sm">{t('factoryJobs.product')}</span><span className="font-bold text-stone-800">{selectedJob.product_sku}</span></div>
                            <div className="flex justify-between"><span className="text-stone-500 text-sm">{t('factoryJobs.quantity')}</span><span className="font-bold text-stone-800">{selectedJob.quantity} {t('factoryJobs.units')}</span></div>
                            <div className="flex justify-between items-center">
                                <span className="text-stone-500 text-sm">{t('factoryJobs.target')}</span>
                                <select
                                    className="border-stone-300 rounded-md text-sm font-bold text-cashmere-maroon focus:ring-cashmere-maroon focus:border-cashmere-maroon"
                                    value={transferLocationId}
                                    onChange={e => setTransferLocationId(e.target.value)}
                                >
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmTransfer}
                                disabled={isSubmitting}
                                className={`px-6 py-2 bg-cashmere-maroon text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isSubmitting ? t('factoryJobs.processing') : t('factoryJobs.confirmTransfer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
