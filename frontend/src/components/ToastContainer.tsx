'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import toast from '@/lib/toast';

interface ToastItem {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

const ICONS = {
    success: <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />,
    error:   <XCircle    size={18} className="text-red-500 flex-shrink-0" />,
    info:    <Info       size={18} className="text-blue-500 flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
};

const BORDERS = {
    success: 'border-l-4 border-emerald-400',
    error:   'border-l-4 border-red-400',
    info:    'border-l-4 border-blue-400',
    warning: 'border-l-4 border-amber-400',
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        toast._register((message, type) => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4500);
        });
    }, []);

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`bg-white shadow-lg rounded-lg px-4 py-3 flex items-start gap-3 pointer-events-auto ${BORDERS[t.type]} animate-in slide-in-from-right-4 duration-200`}
                >
                    {ICONS[t.type]}
                    <p className="text-sm text-stone-800 flex-1 leading-snug">{t.message}</p>
                    <button onClick={() => dismiss(t.id)} className="text-stone-400 hover:text-stone-600 flex-shrink-0 mt-0.5">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
