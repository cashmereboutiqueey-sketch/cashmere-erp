"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { registerRefreshCallback, registerGetToken } from "@/services/api";

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
    login: (accessToken: string) => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        try {
            const res = await fetch('/api/auth/refresh', { method: 'POST' });
            if (!res.ok) return false;
            const data = await res.json();
            const newAccess = data.access;
            setToken(newAccess);
            setUser(decodeUser(newAccess));
            scheduleRefresh(newAccess, () => tryRefreshToken(), refreshTimerRef);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Wire api.ts token getter and 401-retry to this context
    useEffect(() => {
        registerGetToken(() => tokenRef.current);
        registerRefreshCallback(async () => {
            const ok = await tryRefreshToken();
            return ok ? tokenRef.current : null;
        });
    }, [tryRefreshToken]);

    const logout = useCallback(async () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
            });
        } catch { /* non-critical */ }

        setUser(null);
        setToken(null);
        router.push("/login");
    }, [router]);

    // On mount: attempt silent token refresh from HttpOnly cookie
    useEffect(() => {
        tryRefreshToken().then((ok) => {
            if (!ok) {
                // No valid session — stay logged out
            }
            setLoading(false);
        });

        return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
    }, []);

    // login: receives only access token (refresh token is set HttpOnly by the /api/auth/login route)
    const login = (accessToken: string) => {
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
