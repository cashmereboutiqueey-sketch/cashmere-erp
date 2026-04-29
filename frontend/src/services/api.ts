import Cookies from 'js-cookie';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

// Registered by AuthContext — calls the refresh endpoint and updates cookies.
// Returns the new access token, or null if refresh failed.
let _refreshCallback: (() => Promise<string | null>) | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

export function registerRefreshCallback(cb: () => Promise<string | null>): void {
    _refreshCallback = cb;
}

async function doRefresh(): Promise<string | null> {
    if (_isRefreshing) {
        return new Promise(resolve => _refreshQueue.push(resolve));
    }
    _isRefreshing = true;
    try {
        const token = _refreshCallback ? await _refreshCallback() : null;
        _refreshQueue.forEach(resolve => resolve(token));
        _refreshQueue = [];
        return token;
    } finally {
        _isRefreshing = false;
    }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = Cookies.get('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

// Executes a fetch, retries once with a refreshed token on 401.
// `makeFetch` must re-read the cookie each call so the retry gets the new token.
async function withRetry(makeFetch: () => Promise<Response>): Promise<Response> {
    let res = await makeFetch();
    if (res.status === 401 && _refreshCallback) {
        const newToken = await doRefresh();
        if (newToken) {
            res = await makeFetch();
        }
    }
    return res;
}

/** Drop-in replacement for fetch() that injects Bearer token and retries on 401. */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return withRetry(() => {
        const token = Cookies.get('access_token');
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers as Record<string, string> || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    });
}

const api = {
    get: async <T>(endpoint: string): Promise<{ data: T }> => {
        const res = await withRetry(() =>
            fetch(`${BASE_URL}${endpoint}`, { cache: 'no-store', headers: authHeaders() })
        );
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    post: async <T>(endpoint: string, body: unknown): Promise<{ data: T }> => {
        const bodyStr = JSON.stringify(body);
        const res = await withRetry(() =>
            fetch(`${BASE_URL}${endpoint}`, { method: 'POST', headers: authHeaders(), body: bodyStr })
        );
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    patch: async <T>(endpoint: string, body: unknown): Promise<{ data: T }> => {
        const bodyStr = JSON.stringify(body);
        const res = await withRetry(() =>
            fetch(`${BASE_URL}${endpoint}`, { method: 'PATCH', headers: authHeaders(), body: bodyStr })
        );
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    put: async <T>(endpoint: string, body: unknown): Promise<{ data: T }> => {
        const bodyStr = JSON.stringify(body);
        const res = await withRetry(() =>
            fetch(`${BASE_URL}${endpoint}`, { method: 'PUT', headers: authHeaders(), body: bodyStr })
        );
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
        const data = await res.json();
        return { data };
    },

    delete: async (endpoint: string): Promise<void> => {
        const res = await withRetry(() =>
            fetch(`${BASE_URL}${endpoint}`, { method: 'DELETE', headers: authHeaders() })
        );
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`API Error ${res.status}: ${errorBody || res.statusText}`);
        }
    },

    postForm: async <T>(endpoint: string, formData: FormData): Promise<{ data: T }> => {
        const res = await withRetry(() => {
            const token = Cookies.get('access_token');
            return fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
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
