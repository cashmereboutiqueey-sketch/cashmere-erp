const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

const api = {
    get: async <T>(endpoint: string): Promise<{ data: T }> => {
        const res = await fetch(`${BASE_URL}${endpoint}`, { cache: 'no-store' });
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
        });
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
    }
};

export default api;
