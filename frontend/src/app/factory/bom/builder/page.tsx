"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface RawMaterial {
    id: number;
    name: string;
    unit: string;
    cost_per_unit: string;
}

interface BOMLineItem {
    raw_material_id: number;
    quantity: number;
    waste_percentage: number;
}

export default function BOMBuilderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BOMBuilderContent />
        </Suspense>
    );
}

function BOMBuilderContent() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const productIdParam = searchParams.get('productId') || "";

    const [products, setProducts] = useState<Product[]>([]);
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>(productIdParam);
    const [lines, setLines] = useState<BOMLineItem[]>([]);
    const [factoryMargin, setFactoryMargin] = useState<number>(30); // Default 30%
    const [laborCost, setLaborCost] = useState<number>(0);
    const [overheadCost, setOverheadCost] = useState<number>(0);

    const [applyToVariants, setApplyToVariants] = useState(false);

    // Fetch Data on Load
    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/materials/`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]).then(([prodData, matData]) => {
            setProducts(Array.isArray(prodData) ? prodData : prodData.results || prodData.data || []);
            setMaterials(Array.isArray(matData) ? matData : matData.results || matData.data || []);
        });
    }, [token]);

    const addLine = () => {
        setLines([...lines, { raw_material_id: 0, quantity: 1, waste_percentage: 0 }]);
    };

    const updateLine = (index: number, field: keyof BOMLineItem, value: number) => {
        const newLines = [...lines];
        if (field === 'waste_percentage') value = Math.max(0, isNaN(value) ? 0 : value);
        if (field === 'quantity') value = Math.max(0.0001, isNaN(value) ? 0.0001 : value);
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const calculateTotalCost = () => {
        const materialCost = lines.reduce((total, line) => {
            const mat = materials.find(m => m.id === line.raw_material_id);
            if (!mat) return total;
            const cost = parseFloat(mat.cost_per_unit);
            const qty = line.quantity * (1 + line.waste_percentage / 100);
            return total + (cost * qty);
        }, 0);
        return materialCost + laborCost + overheadCost;
    };

    const saveBOM = async () => {
        if (!selectedProduct) return alert(t('bom.alerts.selectProduct'));
        if (lines.length === 0) return alert(t('bom.alerts.noItems'));

        const payload = {
            product: parseInt(selectedProduct),
            apply_to_variants: applyToVariants,
            factory_margin: factoryMargin,
            items: lines.map(line => ({
                raw_material: line.raw_material_id,
                quantity: line.quantity,
                waste_percentage: line.waste_percentage
            })),
            labor_cost: laborCost,
            overhead_cost: overheadCost
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/boms/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(t('bom.alerts.saved'));
                // Optional: redirect or clear
                setLines([]);
                setSelectedProduct("");
                setApplyToVariants(false);
            } else {
                const err = await res.json();
                console.error(err);
                alert(t('bom.alerts.error') + ": " + JSON.stringify(err));
            }
        } catch (e) {
            console.error(e);
            alert(t('bom.alerts.error'));
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif text-cashmere-maroon mb-2">{t('bom.title')}</h1>
                    <p className="text-stone-500 text-sm">{t('bom.subtitle')}</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={saveBOM} className="btn-primary">
                        {t('bom.saveRecipe')}
                    </button>
                </div>
            </div>

            {/* Header: Product Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-6 flex gap-6 items-center">
                <div className="w-1/3">
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.targetProduct')}</label>
                    <select
                        className="w-full border-stone-300 rounded-md shadow-sm focus:ring-cashmere-maroon focus:border-cashmere-maroon sm:text-sm"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">{t('bom.selectProduct')}</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                    </select>

                    <div className="mt-3 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="applyAll"
                            className="rounded border-stone-300 text-cashmere-maroon focus:ring-cashmere-maroon"
                            checked={applyToVariants}
                            onChange={(e) => setApplyToVariants(e.target.checked)}
                        />
                        <label htmlFor="applyAll" className="text-sm text-stone-600 font-medium cursor-pointer select-none">
                            {t('bom.applyToVariants')}
                        </label>
                    </div>
                </div>
                <div className="flex-1 text-right flex flex-col items-end gap-2">
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.estimatedCost')}</label>
                        <span className="text-xl font-serif text-stone-600 font-bold">
                            {calculateTotalCost().toFixed(2)} <span className="text-sm font-sans text-stone-400">EGP</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.directLabor')}</label>
                            <input
                                type="number"
                                className="w-24 border-stone-200 rounded text-sm text-right font-bold text-stone-700"
                                value={laborCost}
                                onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.overhead')}</label>
                            <input
                                type="number"
                                className="w-24 border-stone-200 rounded text-sm text-right font-bold text-stone-700"
                                value={overheadCost}
                                onChange={(e) => setOverheadCost(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.factoryMargin')}</label>
                            <input
                                type="number"
                                className="w-24 border-stone-200 rounded text-sm text-right font-bold text-emerald-700"
                                value={factoryMargin}
                                onChange={(e) => setFactoryMargin(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">{t('bom.factoryPrice')}</label>
                            <span className="text-2xl font-serif text-cashmere-maroon font-bold">
                                {(calculateTotalCost() * (1 + factoryMargin / 100)).toFixed(2)} <span className="text-sm font-sans text-stone-400">EGP</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spec Sheet Table */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-stone-50 text-stone-700 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4 border-b border-stone-200">{t('bom.tableIngredients')}</th>
                            <th className="px-6 py-4 border-b border-stone-200 w-32">{t('bom.tableQty')}</th>
                            <th className="px-6 py-4 border-b border-stone-200 w-32">{t('bom.tableWaste')}</th>
                            <th className="px-6 py-4 border-b border-stone-200 w-32 text-right">{t('bom.tableCost')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {lines.map((line, idx) => {
                            const mat = materials.find(m => m.id === line.raw_material_id);
                            const cost = mat ? parseFloat(mat.cost_per_unit) * line.quantity * (1 + line.waste_percentage / 100) : 0;

                            return (
                                <tr key={idx} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <select
                                            className="w-full border-stone-200 rounded text-sm"
                                            value={line.raw_material_id}
                                            onChange={(e) => updateLine(idx, 'raw_material_id', parseInt(e.target.value))}
                                        >
                                            <option value={0}>{t('bom.selectMaterial')}</option>
                                            {materials.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.unit}) - {m.cost_per_unit} EGP</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            className="w-full border-stone-200 rounded text-sm text-right"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            type="number"
                                            className="w-full border-stone-200 rounded text-sm text-right"
                                            value={line.waste_percentage}
                                            onChange={(e) => updateLine(idx, 'waste_percentage', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium text-stone-800">
                                        {cost.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Add Row Button */}
                        <tr>
                            <td colSpan={4} className="px-6 py-3 bg-stone-50 border-t border-stone-100">
                                <button
                                    onClick={addLine}
                                    className="text-cashmere-maroon text-xs font-bold uppercase tracking-wide hover:underline flex items-center gap-1"
                                >
                                    <span>{t('bom.addItem')}</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
