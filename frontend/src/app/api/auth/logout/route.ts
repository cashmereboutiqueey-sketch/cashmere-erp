import { NextRequest, NextResponse } from 'next/server';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    const authHeader = req.headers.get('Authorization');

    if (refreshToken) {
        // Best-effort: blacklist the refresh token server-side
        await fetch(`${DJANGO_URL}/api/users/logout/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({ refresh: refreshToken }),
        }).catch(() => { /* non-critical */ });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete('refresh_token');
    return res;
}
