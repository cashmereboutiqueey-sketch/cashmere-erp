"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Trash2, Edit2, Shield, Check, X } from 'lucide-react';

interface ERPUser {
    id: number;
    username: string;
    email: string;
    is_superuser: boolean;
    is_active: boolean;
    groups: string[];
    date_joined: string;
}

const ROLE_COLORS: Record<string, string> = {
    'Admin': 'bg-red-100 text-red-800 border-red-200',
    'Brand Manager': 'bg-purple-100 text-purple-800 border-purple-200',
    'Factory Manager': 'bg-blue-100 text-blue-800 border-blue-200',
    'Worker': 'bg-stone-100 text-stone-700 border-stone-200',
    'Accountant': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'General Manager': 'bg-amber-100 text-amber-800 border-amber-200',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
    'Admin': 'Full access to everything',
    'Brand Manager': 'Brand, POS, Orders, Finance',
    'Factory Manager': 'Factory, HR, Production, Finance',
    'Worker': 'Production & Inventory only',
    'Accountant': 'Financial reports & data',
    'General Manager': 'Financial reports & data',
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UsersPage() {
    const { token, user: me } = useAuth();
    const [users, setUsers] = useState<ERPUser[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({ username: '', password: '', email: '', role: 'Brand Manager' });
    const [editForm, setEditForm] = useState({ role: '', password: '', is_active: true });

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchUsers = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch(`${apiBase}/api/users/`, { headers }),
                fetch(`${apiBase}/api/users/roles/`, { headers }),
            ]);
            if (!usersRes.ok) { setError('Access denied.'); setLoading(false); return; }
            const usersData = await usersRes.json();
            const rolesData = await rolesRes.json();
            setUsers(Array.isArray(usersData) ? usersData : (usersData.results || []));
            setRoles(Array.isArray(rolesData) ? rolesData : (rolesData.results || []));
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (token) fetchUsers(); }, [token]);

    const handleCreate = async () => {
        if (!form.username || !form.password) return alert('Username and password required.');
        const res = await fetch(`${apiBase}/api/users/`, {
            method: 'POST', headers,
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setForm({ username: '', password: '', email: '', role: 'Brand Manager' });
            setShowAdd(false);
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to create user.');
        }
    };

    const handleUpdate = async (id: number) => {
        const res = await fetch(`${apiBase}/api/users/${id}/`, {
            method: 'PATCH', headers,
            body: JSON.stringify(editForm),
        });
        if (res.ok) { setEditingId(null); fetchUsers(); }
        else { const d = await res.json(); alert(d.error || 'Update failed.'); }
    };

    const handleDelete = async (id: number, username: string) => {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
        const res = await fetch(`${apiBase}/api/users/${id}/`, { method: 'DELETE', headers });
        if (res.ok) fetchUsers();
        else { const d = await res.json(); alert(d.error || 'Delete failed.'); }
    };

    const startEdit = (u: ERPUser) => {
        setEditingId(u.id);
        setEditForm({ role: u.groups[0] || '', password: '', is_active: u.is_active });
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-screen">
            <div className="text-stone-400 font-serif">Loading users...</div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-cashmere-maroon flex items-center gap-3">
                        <Shield size={28} className="text-cashmere-gold" /> User Management
                    </h1>
                    <p className="text-stone-500 mt-1 text-sm">Add users and assign their roles. Only Admins can access this page.</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 bg-cashmere-black text-white px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-colors text-sm font-medium"
                >
                    <UserPlus size={16} /> Add User
                </button>
            </div>

            {/* Add User Form */}
            {showAdd && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="font-serif text-lg font-bold text-stone-800 mb-5">New User</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Username *</label>
                            <input
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="john.doe"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Password *</label>
                            <input
                                type="password"
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Email (optional)</label>
                            <input
                                type="email"
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="john@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Role *</label>
                            <select
                                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {form.role && (
                                <p className="text-xs text-stone-400 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-stone-100">
                        <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded-lg">Cancel</button>
                        <button onClick={handleCreate} className="px-6 py-2 text-sm bg-cashmere-black text-white rounded-lg hover:bg-stone-800">
                            Create User
                        </button>
                    </div>
                </div>
            )}

            {/* Role Legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {roles.map(role => (
                    <div key={role} className="bg-white rounded-lg border border-stone-100 p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] || 'bg-stone-100 text-stone-700'}`}>
                            {role}
                        </span>
                        <p className="text-[10px] text-stone-400 mt-1.5 leading-tight">{ROLE_DESCRIPTIONS[role]}</p>
                    </div>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-bold uppercase text-stone-500">User</th>
                            <th className="text-left px-5 py-3 text-xs font-bold uppercase text-stone-500">Role</th>
                            <th className="text-left px-5 py-3 text-xs font-bold uppercase text-stone-500">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-bold uppercase text-stone-500">Joined</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-medium text-stone-800">{u.username}</div>
                                    {u.email && <div className="text-xs text-stone-400">{u.email}</div>}
                                    {u.is_superuser && <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-bold">SUPERUSER</span>}
                                </td>
                                <td className="px-5 py-4">
                                    {editingId === u.id ? (
                                        <select
                                            className="border border-stone-200 rounded-lg px-2 py-1 text-xs"
                                            value={editForm.role}
                                            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        >
                                            <option value="">— No Role —</option>
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    ) : (
                                        u.groups.length > 0
                                            ? <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ROLE_COLORS[u.groups[0]] || 'bg-stone-100 text-stone-700'}`}>{u.groups[0]}</span>
                                            : <span className="text-xs text-stone-400 italic">No role</span>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    {editingId === u.id ? (
                                        <select
                                            className="border border-stone-200 rounded-lg px-2 py-1 text-xs"
                                            value={editForm.is_active ? 'active' : 'inactive'}
                                            onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Suspended</option>
                                        </select>
                                    ) : (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {u.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-xs text-stone-400">
                                    {new Date(u.date_joined).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2 justify-end">
                                        {editingId === u.id ? (
                                            <>
                                                <div className="mr-2">
                                                    <input
                                                        type="password"
                                                        className="border border-stone-200 rounded-lg px-2 py-1 text-xs w-28"
                                                        placeholder="New password"
                                                        value={editForm.password}
                                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                    />
                                                </div>
                                                <button onClick={() => handleUpdate(u.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200">
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(u)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                {u.id !== me?.user_id && (
                                                    <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
