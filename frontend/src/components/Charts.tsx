"use client";

import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

// --- Types ---
interface VelocityData {
    date: string;
    quantity: number;
}

interface PnLData {
    category: string;
    amount: number;
    type: 'revenue' | 'cost';
}

// --- Velocity Chart (Line) ---
export function VelocityChart({ data }: { data: VelocityData[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-stone-400 text-sm">No production data yet.</div>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#858585"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#858585"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#FDFBF7', borderColor: '#E5E5E5', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#722F37', fontWeight: 600 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="quantity"
                        stroke="#722F37"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#722F37', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- Donut Chart (Payment Methods) ---
export function DonutChart({ data, colors }: { data: { name: string; value: number }[], colors?: string[] }) {
    const COLORS = colors || ['#722F37', '#C5A059', '#3f3f46', '#a1a1aa'];

    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-stone-400">No Data</div>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                        itemStyle={{ fontWeight: 'bold', color: '#333' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- Generic Bar Chart (Sales Sources) ---
export function SimpleBarChart({ data, color }: { data: { name: string; value: number }[], color?: string }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-stone-400">No Data</div>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}
                    />
                    <Bar dataKey="value" fill={color || "#722F37"} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- P&L Chart (Bar) ---
export function PnLChart({ data }: { data: PnLData[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-stone-400 text-sm">No financial data yet.</div>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="category"
                        type="category"
                        stroke="#2C2C2C"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#FDFBF7', borderColor: '#E5E5E5', borderRadius: '8px' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32}>
                        {
                            data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.type === 'revenue' ? '#C5A059' : '#858585'} />
                            ))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
