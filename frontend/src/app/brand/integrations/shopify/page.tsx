"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Save, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from '@/lib/toast';

export default function ShopifySettingsPage() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [config, setConfig] = useState({
        shop_url: '',
        access_token: '',
        is_active: true
    });

    const [isConnected, setIsConnected] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        if (token) fetchConfig();
    }, [token]);

    const fetchConfig = () => {
        fetch(`${apiBase}/api/brand/shopify/config/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.configured) {
                    setConfig(prev => ({ ...prev, shop_url: data.shop_url, is_active: true }));
                    setLastSync(data.last_sync_at);
                    checkConnection();
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const checkConnection = async () => {
        setTesting(true);
        setConnectionError(null);
        try {
            const res = await fetch(`${apiBase}/api/brand/shopify/test_connection/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setIsConnected(true);
            } else {
                setIsConnected(false);
                setConnectionError(data.error || 'Connection Failed');
            }
        } catch {
            setIsConnected(false);
            setConnectionError("Network Error");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${apiBase}/api/brand/shopify/config/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast.success("Settings Saved");
                checkConnection();
            } else {
                toast.error("Failed to save");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <header className="mb-8 border-b border-stone-200 pb-4">
                <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">Shopify Configuration</h1>
                <p className="text-stone-500">Enter your store API credentials to enable synchronization.</p>
            </header>

            {/* Connection Status Card */}
            <div className={`mb-8 p-4 rounded-lg border flex items-center justify-between ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                    {isConnected ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-500" />}
                    <div>
                        <h3 className={`font-bold ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                            {isConnected ? 'Connected to Shopify' : 'Not Connected'}
                        </h3>
                        {connectionError && <p className="text-xs text-red-600 mt-1">{connectionError}</p>}
                        {lastSync && isConnected && <p className="text-xs text-green-700 mt-1">Last Sync: {new Date(lastSync).toLocaleString()}</p>}
                    </div>
                </div>
                <button
                    onClick={checkConnection}
                    disabled={testing}
                    className="text-xs flex items-center gap-1 bg-white px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-50 transition-colors"
                >
                    <RefreshCw size={12} className={testing ? "animate-spin" : ""} /> Test
                </button>
            </div>

            {/* Config Form */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Store URL</label>
                    <div className="flex items-center">
                        <span className="bg-stone-100 text-stone-500 px-3 py-2 border border-r-0 border-stone-300 rounded-l-lg text-sm">https://</span>
                        <input
                            type="text"
                            className="flex-1 border-stone-300 rounded-r-lg text-sm"
                            placeholder="your-store.myshopify.com"
                            value={config.shop_url}
                            onChange={(e) => setConfig({ ...config, shop_url: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">Admin API Access Token</label>
                    <input
                        type="password"
                        className="w-full border-stone-300 rounded-lg text-sm"
                        placeholder="shpat_xxxxxxxxxxxxxxxx"
                        value={config.access_token}
                        onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                    />
                    <p className="text-xs text-stone-500 mt-1">
                        Go to Shopify Admin {'>'} Settings {'>'} Apps {'>'} Develop Apps {'>'} Create App {'>'} Configure Admin API scopes (read_products, write_products) {'>'} Install App.
                    </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
