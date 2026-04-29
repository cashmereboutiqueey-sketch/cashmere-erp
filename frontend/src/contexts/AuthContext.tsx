"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { registerRefreshCallback } from "@/services/api";

interface User {
    user_id: number;
    username: string;
    email: string;
    groups: string[];
    is_superuser: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, refresh: string) => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function decodeUser(accessToken: string): User | null {
    try {
        const decoded: any = jwtDecode(accessToken);
        return {
            user_id: decoded.user_id,
            username: decoded.username || "User",
            email: decoded.email || "",
            groups: decoded.groups || [],
            is_superuser: decoded.is_superuser || false
        };
    } catch {
        return null;
    }
}

function scheduleRefresh(
    accessToken: string,
    refreshFn: () => void,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
) {
    try {
        const decoded: any = jwtDecode(accessToken);
        const msUntilExpiry = decoded.exp * 1000 - Date.now() - 2 * 60 * 1000;
        if (msUntilExpiry > 0) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(refreshFn, msUntilExpiry);
        }
    } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenRef = useRef<string | null>(null);

    // Keep tokenRef in sync for use inside callbacks without stale closure
    useEffect(() => { tokenRef.current = token; }, [token]);

    const tryRefreshToken = useCallback(async (): Promise<boolean> => {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${API_BASE}/api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken })
            });
            if (!res.ok) return false;
            const data = await res.json();
            const newAccess = data.access;
            Cookies.set("access_token", newAccess);
            // Rotate refresh token if backend sends one back
            if (data.refresh) Cookies.set("refresh_token", data.refresh);
            setToken(newAccess);
            setUser(decodeUser(newAccess));
            // Reschedule refresh for the new token's lifetime
            scheduleRefresh(newAccess, () => tryRefreshToken(), refreshTimerRef);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Wire api.ts 401-retry to this context's refresh function
    useEffect(() => {
        registerRefreshCallback(async () => {
            const ok = await tryRefreshToken();
            return ok ? (Cookies.get('access_token') ?? null) : null;
        });
    }, [tryRefreshToken]);

    const logout = useCallback(async () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        // Blacklist the refresh token server-side
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
            try {
                await fetch(`${API_BASE}/api/users/logout/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenRef.current ? { 'Authorization': `Bearer ${tokenRef.current}` } : {})
                    },
                    body: JSON.stringify({ refresh: refreshToken })
                });
            } catch { /* network errors on logout are non-critical */ }
        }

        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        setUser(null);
        setToken(null);
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const storedToken = Cookies.get("access_token");
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const decoded: any = jwtDecode(storedToken);
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                // Token expired — attempt silent refresh, keep loading=true until resolved
                tryRefreshToken().then((ok: boolean) => {
                    if (!ok) logout();
                    setLoading(false);
                });
                return;
            }
            setToken(storedToken);
            setUser(decodeUser(storedToken));
            scheduleRefresh(storedToken, () => tryRefreshToken(), refreshTimerRef);
        } catch {
            logout();
        }
        setLoading(false);

        return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
    }, []);

    const login = (accessToken: string, refreshToken: string) => {
        Cookies.set("access_token", accessToken);
        Cookies.set("refresh_token", refreshToken);
        setToken(accessToken);
        setUser(decodeUser(accessToken));
        scheduleRefresh(accessToken, () => tryRefreshToken(), refreshTimerRef);
        router.push("/");
    };

    const hasRole = (role: string) => {
        if (user?.groups.includes("Admin")) return true;
        return user?.groups.includes(role) || false;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
