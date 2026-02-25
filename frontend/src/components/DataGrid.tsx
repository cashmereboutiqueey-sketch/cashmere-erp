"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';

interface Column {
    key: string;
    label: string;
    render?: (row: any) => React.ReactNode;
}

interface DataGridProps {
    title: string;
    columns: Column[];
    data: any[];
    action?: React.ReactNode;
    selectable?: boolean;
    onSelectionChange?: (selectedIndices: number[]) => void;
    loading?: boolean;
}

export default function DataGrid({ title, columns, data, action, selectable = false, onSelectionChange, loading = false }: DataGridProps) {
    const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIndices = data.map((_, idx) => idx);
            setSelectedIndices(allIndices);
            onSelectionChange?.(allIndices);
        } else {
            setSelectedIndices([]);
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (index: number) => {
        let newSelected = [...selectedIndices];
        if (newSelected.includes(index)) {
            newSelected = newSelected.filter(i => i !== index);
        } else {
            newSelected.push(index);
        }
        setSelectedIndices(newSelected);
        onSelectionChange?.(newSelected);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                    <h3 className="font-serif text-lg text-cashmere-black font-semibold">{title}</h3>
                    {selectable && selectedIndices.length > 0 && (
                        <span className="text-xs font-bold bg-cashmere-maroon text-white px-2 py-0.5 rounded-full">
                            {selectedIndices.length} Selected
                        </span>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-stone-100 text-stone-700 font-medium uppercase tracking-wider text-xs">
                        <tr>
                            {selectable && (
                                <th className="px-4 py-2 border-b border-stone-200 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-stone-300 text-cashmere-maroon focus:ring-cashmere-maroon"
                                        onChange={handleSelectAll}
                                        checked={data.length > 0 && selectedIndices.length === data.length}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-2 border-b border-stone-200">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-stone-400">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-stone-300 border-t-cashmere-gold rounded-full animate-spin"></div>
                                        <span>Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-stone-400 italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className={`hover:bg-amber-50/30 transition-colors ${selectable && selectedIndices.includes(rowIndex) ? 'bg-amber-50' : ''}`}>
                                    {selectable && (
                                        <td className="px-4 py-1.5 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-stone-300 text-cashmere-maroon focus:ring-cashmere-maroon"
                                                checked={selectedIndices.includes(rowIndex)}
                                                onChange={() => handleSelectRow(rowIndex)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td key={`${rowIndex}-${col.key}`} className="px-4 py-1.5 whitespace-nowrap">
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 border-t border-stone-100 bg-stone-50 text-xs text-stone-400 text-right">
                {data.length} records
            </div>
        </div>
    );
}
