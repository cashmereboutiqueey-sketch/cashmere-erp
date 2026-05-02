"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';

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

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [bomProductIds, setBomProductIds] = useState<Set<number>>(new Set());
    const [selectedProduct, setSelectedProduct] = useState<string>(productIdParam);
    const [editingBomId, setEditingBomId] = useState<number | null>(null);
    const [lines, setLines] = useState<BOMLineItem[]>([]);
    const [factoryMargin, setFactoryMargin] = useState<number>(30);
    const [laborCost, setLaborCost] = useState<number>(0);
    const [overheadCost, setOverheadCost] = useState<number>(0);
    const [applyToVariants, setApplyToVariants] = useState(false);
    const [editProductId, setEditProductId] = useState<string>('');

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 'Authorization': `Bearer ${token}` };

    const productsWithoutBOM = allProducts.filter(p => !bomProductIds.has(p.id));
    const productsWithBOM = allProducts.filter(p => bomProductIds.has(p.id));

    // Fetch products, materials, and existing BOMs
    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${API}/api/brand/products/?page_size=500&lite=true`, { headers }).then(r => r.json()),
            fetch(`${API}/api/factory/materials/?page_size=500`, { headers }).then(r => r.json()),
            fetch(`${API}/api/factory/boms/?page_size=500`, { headers }).then(r => r.json()),
        ]).then(([prodData, matData, bomData]) => {
            const prods: Product[] = Array.isArray(prodData) ? prodData : prodData.results || [];
            const mats: RawMaterial[] = Array.isArray(matData) ? matData : matData.results || [];
            const boms: { id: number; product: number; items: BOMLineItem[] }[] = Array.isArray(bomData) ? bomData : bomData.results || [];
            setAllProducts(prods);
            setMaterials(mats);
            setBomProductIds(new Set(boms.map(b => b.product)));
        });
    }, [token]);

    // Load existing BOM when edit product is selected
    const loadBomForEdit = async (productId: string) => {
        if (!productId) { setEditProductId(''); setSelectedProduct(''); setEditingBomId(null); setLines([]); return; }
        setEditProductId(productId);
        setSelectedProduct(productId);
        try {
            const res = await fetch(`${API}/api/factory/boms/?product=${productId}`, { headers });
            const data = await res.json();
            const boms = Array.isArray(data) ? data : data.results || [];
            if (boms.length > 0) {
                const bom = boms[0];
                setEditingBomId(bom.id);
                setLines(bom.items.map((item: { raw_material: number; quantity: number; waste_percentage: number }) => ({
                    raw_material_id: item.raw_material,
                    quantity: item.quantity,
                    waste_percentage: item.waste_percentage,
                })));
            }
        } catch (e) { console.error(e); }
    };

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
        { toast.error(t('bom.alerts.selectProduct')); return; }
        { toast.error(t('bom.alerts.noItems')); return; }
        { toast.error('Please select a material for every row.'); return; }

        const payload = {
            product: parseInt(selectedProduct),
            apply_to_variants: applyToVariants,
            factory_margin: factoryMargin,
            items: lines.map(line => ({
                raw_material: line.raw_material_id,
                quantity: line.quantity,
                waste_percentage: line.waste_percentage,
            })),
            labor_cost: laborCost,
            overhead_cost: overheadCost,
        };

        const isUpdate = !!editingBomId;
        const url = isUpdate
            ? `${API}/api/factory/boms/${editingBomId}/`
            : `${API}/api/factory/boms/`;
        const method = isUpdate ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(isUpdate ? 'BOM updated successfully.' : t('bom.alerts.saved'));
                // Update local state so newly created BOM appears in the edit list
                if (!isUpdate) {
                    setBomProductIds(prev => new Set([...prev, parseInt(selectedProduct)]));
                }
                setLines([]);
                setSelectedProduct('');
                setEditProductId('');
                setEditingBomId(null);
                setApplyToVariants(false);
            } else {
                const err = await res.json();
                console.error(err);
                toast.error(t('bom.alerts.error') + ': ' + JSON.stringify(err));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('bom.alerts.error'));
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
                <div className="w-1/3 space-y-4">
                    {/* New BOM — products without a BOM */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                            {t('bom.targetProduct')}
                            {productsWithoutBOM.length > 0 && (
                                <span className="ml-2 text-amber-600 font-normal normal-case">
                                    ({productsWithoutBOM.length} need a BOM)
                                </span>
                            )}
                        </label>
                        <select
                            className="w-full border-stone-300 rounded-md shadow-sm focus:ring-cashmere-maroon focus:border-cashmere-maroon sm:text-sm"
                            value={editingBomId ? '' : selectedProduct}
                            onChange={(e) => { setEditingBomId(null); setEditProductId(''); setSelectedProduct(e.target.value); setLines([]); }}
                        >
                            <option value="">{t('bom.selectProduct')}</option>
                            {productsWithoutBOM.map(p => (
                                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Edit existing BOM */}
                    {productsWithBOM.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                                Edit Existing BOM
                                <span className="ml-2 text-stone-400 font-normal normal-case">({productsWithBOM.length} products)</span>
                            </label>
                            <select
                                className="w-full border-stone-300 rounded-md shadow-sm focus:ring-cashmere-maroon focus:border-cashmere-maroon sm:text-sm"
                                value={editProductId}
                                onChange={(e) => loadBomForEdit(e.target.value)}
                            >
                                <option value="">Select to edit…</option>
                                {productsWithBOM.map(p => (
                                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                                ))}
                            </select>
                            {editingBomId && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Editing existing BOM — Save will update it.</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
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
