import { NextRequest, NextResponse } from 'next/server';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
        return NextResponse.json({ detail: 'No refresh token' }, { status: 401 });
    }

    const djangoRes = await fetch(`${DJANGO_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!djangoRes.ok) {
        const res = NextResponse.json({ detail: 'Refresh failed' }, { status: 401 });
        res.cookies.delete('refresh_token');
        return res;
    }

    const data = await djangoRes.json();
    const res = NextResponse.json({ access: data.access });

    // Rotate refresh token if backend returns a new one
    const newRefresh = data.refresh ?? refreshToken;
    res.cookies.set('refresh_token', newRefresh, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 60 * 60 * 24 * 30,
    });
    return res;
}
