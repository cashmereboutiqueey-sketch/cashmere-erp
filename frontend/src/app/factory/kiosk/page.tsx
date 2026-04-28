"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Hammer, CheckCircle, User, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Simplified Types for Kiosk
interface Worker {
    id: number;
    name: string;
}

interface Job {
    id: number;
    name: string; // "JOB-101"
    product_name: string; // "Black Blazer"
    quantity: number;
    status: string;
}

export default function KioskPage() {
    const { t } = useLanguage();
    const { token, loading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);

    // Selection State
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        if (!token || authLoading) return;

        // Fetch Workers
        fetch(`${API_URL}/api/factory/workers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load workers');
                return res.json();
            })
            .then(data => {
                const list = Array.isArray(data) ? data : (data.results || []);
                setWorkers(list.filter((w: any) => w.active));
            })
            .catch(err => console.error("Worker fetch error:", err));

        // Fetch Active/Pending Jobs
        fetch(`${API_URL}/api/factory/jobs/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load jobs');
                return res.json();
            })
            .then(data => {
                const list = Array.isArray(data) ? data : (data.results || []);
                setJobs(list.filter((j: any) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED'));
            })
            .catch(err => console.error("Job fetch error:", err));
    }, [token, authLoading]);

    const handleStartJob = async () => {
        if (!selectedJob || !token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/factory/jobs/${selectedJob.id}/start/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start job');

            // Success
            setStep(4); // Success Screen
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCompleteJob = async () => {
        if (!selectedJob || !token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/factory/jobs/${selectedJob.id}/complete/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to complete job');

            setStep(4); // Success Screen
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // --- STEPS ---

    // 1. SELECT WORKER
    const renderStep1 = () => (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 text-stone-700">Who are you?</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {workers.map(worker => (
                    <button
                        key={worker.id}
                        onClick={() => { setSelectedWorker(worker); setStep(2); }}
                        className="bg-white border-2 border-stone-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-cashmere-gold hover:bg-amber-50 transition-all shadow-sm"
                    >
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                            <User size={32} />
                        </div>
                        <span className="font-bold text-xl text-stone-800">{worker.name}</span>
                    </button>
                ))}
            </div>
            {workers.length === 0 && <p className="text-center text-stone-400">No workers found.</p>}
        </div>
    );

    // 2. SELECT JOB
    const renderStep2 = () => (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-stone-500 font-bold"><ArrowLeft /> Back</button>
            <h1 className="text-3xl font-bold text-center mb-2 text-stone-700">Hello, {selectedWorker?.name}</h1>
            <p className="text-center text-stone-500 mb-8">What are you working on?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                    <button
                        key={job.id}
                        onClick={() => { setSelectedJob(job); setStep(3); }}
                        className={`p-6 rounded-xl border-2 text-left transition-all shadow-sm flex justify-between items-center ${job.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                            }`}
                    >
                        <div>
                            <span className="text-xs font-bold text-stone-400 block mb-1">{job.name}</span>
                            <span className="text-xl font-bold text-stone-800 block">{job.product_name}</span>
                            <span className="text-sm font-bold text-stone-500">{job.quantity} units</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' : 'bg-stone-100 text-stone-500'
                            }`}>
                            {job.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    // 3. ACTION (Start or Complete)
    const renderStep3 = () => {
        if (!selectedJob) return null;
        const isStarted = selectedJob.status === 'IN_PROGRESS';

        return (
            <div className="max-w-md mx-auto text-center">
                <button onClick={() => setStep(2)} className="mb-6 flex items-center gap-2 text-stone-500 font-bold mx-auto"><ArrowLeft /> Back</button>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 mb-6">
                    <h2 className="text-2xl font-bold text-stone-800 mb-2">{selectedJob.product_name}</h2>
                    <p className="text-stone-500 font-mono mb-6">{selectedJob.name}</p>

                    <div className="text-4xl font-bold text-cashmere-black mb-8">
                        {selectedJob.quantity} <span className="text-lg text-stone-400 font-normal">Units</span>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm font-bold flex items-center gap-2 text-left">
                            <AlertTriangle size={20} className="shrink-0 text-red-500" />
                            {error}
                        </div>
                    )}

                    {!isStarted ? (
                        <button
                            onClick={handleStartJob}
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-green-700 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Check Stock...' : 'START JOB'}
                        </button>
                    ) : (
                        <button
                            onClick={handleCompleteJob}
                            disabled={loading}
                            className="w-full bg-cashmere-black text-white py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-stone-800 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <CheckCircle size={24} />
                            {loading ? 'Processing...' : 'FINISH JOB'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // 4. SUCCESS
    const renderStep4 = () => (
        <div className="max-w-md mx-auto text-center pt-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">Great Job!</h1>
            <p className="text-stone-500 mb-8">System updated successfully.</p>

            <button
                onClick={() => {
                    setStep(1);
                    setSelectedJob(null);
                    setSelectedWorker(null);
                    setError(null);
                    setLoading(false);
                    // Re-fetch jobs logic omitted for simplicity, ideally trigger refetch
                }}
                className="bg-stone-100 text-stone-800 px-8 py-3 rounded-full font-bold hover:bg-stone-200"
            >
                Start New Task
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 p-6 flex flex-col" suppressHydrationWarning>
            {/* Header */}
            <div className="flex justify-between items-center mb-8" suppressHydrationWarning>
                <div className="flex items-center gap-2" suppressHydrationWarning>
                    <Hammer className="text-cashmere-maroon" />
                    <span className="font-serif font-bold text-xl text-cashmere-maroon">FACTORY KIOSK</span>
                </div>
                <Link href="/factory" className="text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600">Exit Kiosk</Link>
            </div>

            <div className="flex-1 flex flex-col justify-center" suppressHydrationWarning>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>
        </div>
    );
}
