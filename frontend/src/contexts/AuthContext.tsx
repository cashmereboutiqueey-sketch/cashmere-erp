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

    useEffect(() => {
        const storedToken = Cookies.get("access_token");
        if (storedToken) {
            setToken(storedToken);
            try {
                const decoded: any = jwtDecode(storedToken);
                // Check if token is expired
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    console.warn("Token expired, logging out automatically.");
                    logout();
                    return;
                }

                // The simplejwt token doesn't include groups by default unless customized.

                // Let's defer fetching user details to a separate effect or assume token has enough info for now
                // if we customize the token serializer.
                setUser({
                    user_id: decoded.user_id,
                    username: decoded.username || "User",
                    email: "",
                    groups: decoded.groups || [], // Requires backend customization
                    is_superuser: decoded.is_superuser || false
                });
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
