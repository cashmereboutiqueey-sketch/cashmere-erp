import { NextRequest, NextResponse } from 'next/server';

// Server-side: prefer internal Docker URL over public URL for API routes
const DJANGO_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
    const body = await req.json();

    const djangoRes = await fetch(`${DJANGO_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!djangoRes.ok) {
        const err = await djangoRes.json().catch(() => ({}));
        return NextResponse.json(err, { status: djangoRes.status });
    }

    const { access, refresh } = await djangoRes.json();

    const res = NextResponse.json({ access });
    res.cookies.set('refresh_token', refresh, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
}
