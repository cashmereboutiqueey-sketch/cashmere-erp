"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface User {
    user_id: number;
    username: string;
    email: string;
    groups: string[]; // Role names
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const tryRefreshToken = async (): Promise<boolean> => {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) return false;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/token/refresh/`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: refreshToken }) }
            );
            if (!res.ok) return false;
            const data = await res.json();
            Cookies.set("access_token", data.access);
            setToken(data.access);
            const decoded: any = jwtDecode(data.access);
            setUser({ user_id: decoded.user_id, username: decoded.username || "User", email: "", groups: decoded.groups || [], is_superuser: decoded.is_superuser || false });
            return true;
        } catch { return false; }
    };

    useEffect(() => {
        const storedToken = Cookies.get("access_token");
        if (storedToken) {
            try {
                const decoded: any = jwtDecode(storedToken);
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    // Expired — try to refresh silently
                    tryRefreshToken().then(ok => { if (!ok) logout(); });
                    setLoading(false);
                    return;
                }
                setToken(storedToken);
                setUser({ user_id: decoded.user_id, username: decoded.username || "User", email: "", groups: decoded.groups || [], is_superuser: decoded.is_superuser || false });
                // Schedule a refresh 2 min before expiry
                const msUntilExpiry = decoded.exp * 1000 - Date.now() - 2 * 60 * 1000;
                if (msUntilExpiry > 0) {
                    const timer = setTimeout(() => tryRefreshToken(), msUntilExpiry);
                    return () => clearTimeout(timer);
                }
            } catch (error) {
                console.error("Invalid token", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = (accessToken: string, refreshToken: string) => {
        Cookies.set("access_token", accessToken);
        Cookies.set("refresh_token", refreshToken);
        setToken(accessToken);

        const decoded: any = jwtDecode(accessToken);
        setUser({
            user_id: decoded.user_id,
            username: decoded.username || "User",
            email: "",
            groups: decoded.groups || [],
            is_superuser: decoded.is_superuser || false
        });

        router.push("/"); // Redirect to dashboard
    };

    const logout = () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        setUser(null);
        setToken(null);
        router.push("/login");
    };

    const hasRole = (role: string) => {
        // Basic check. If admin, true.
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
