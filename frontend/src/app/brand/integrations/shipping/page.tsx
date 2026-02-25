"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save, CheckCircle, Truck, Info } from 'lucide-react';

export default function ShippingSettingsPage() {
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);

    // Mock Config State for now
    const [config, setConfig] = useState({
        provider: 'QUIGO',
        apiKey: '',
        clientCode: '',
        autoCreateManifest: true
    });

    const handleSave = () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            alert("Shipping Settings Saved (Simulation)");
        }, 1000);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <header className="mb-8 border-b border-stone-200 pb-4">
                <h1 className="text-3xl font-serif font-bold text-cashmere-maroon mb-2">Shipping Configuration</h1>
                <p className="text-stone-500">Manage your courier integrations and automation rules.</p>
            </header>

            {/* Provider Selection */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6 mb-6">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Default Courier Provider</label>
                    <div className="grid grid-cols-3 gap-4">
                        {['QUIGO', 'BOSTA', 'ARAMEX'].map(provider => (
                            <button
                                key={provider}
                                onClick={() => setConfig({ ...config, provider })}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${config.provider === provider
                                    ? 'border-cashmere-maroon bg-red-50 text-cashmere-maroon font-bold'
                                    : 'border-stone-100 hover:border-stone-300 text-stone-500'}`}
                            >
                                {provider}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Credentials Form */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-4 text-stone-800 font-bold border-b border-stone-100 pb-2">
                    <Truck size={20} />
                    <h3>{config.provider} Credentials</h3>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">API Key</label>
                    <input
                        type="password"
                        className="w-full border-stone-300 rounded-lg text-sm"
                        placeholder={`Enter your ${config.provider} API Key`}
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    />
                </div>

                {config.provider === 'QUIGO' && (
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Client Code / Account ID</label>
                        <input
                            type="text"
                            className="w-full border-stone-300 rounded-lg text-sm"
                            placeholder="e.g. QG-12345"
                            value={config.clientCode}
                            onChange={(e) => setConfig({ ...config, clientCode: e.target.value })}
                        />
                    </div>
                )}

                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p>
                        Integration allows for automatic Waybill generation and status updates (Delivered, Returns).
                        Manifests must still be physically signed by the driver.
                    </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-cashmere-black text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
