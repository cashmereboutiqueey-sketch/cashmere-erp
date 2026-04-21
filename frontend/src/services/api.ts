import Cookies from 'js-cookie';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

/** Drop-in replacement for fetch() that automatically injects the Bearer token */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = Cookies.get('access_token');
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers as Record<string, string> || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = Cookies.get('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

const api = {
    get: async <T>(endpoint: string): Promise<{ data: T }> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            cache: 'no-store',
            headers: authHeaders(),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    post: async <T>(endpoint: string, body: any): Promise<{ data: T }> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    patch: async <T>(endpoint: string, body: any): Promise<{ data: T }> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    put: async <T>(endpoint: string, body: any): Promise<{ data: T }> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    delete: async (endpoint: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
    },

    postForm: async <T>(endpoint: string, formData: FormData): Promise<{ data: T }> => {
        const token = Cookies.get('access_token');
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },
};

export default api;
