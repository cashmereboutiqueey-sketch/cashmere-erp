import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Let static assets pass through without any auth checks
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico")
    ) {
        return NextResponse.next();
    }

    const publicPaths = ["/login", "/api/auth"];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    const tokenValue = request.cookies.get("access_token")?.value;
    // Validate token presence AND that it has not expired
    const isAuthenticated = !!tokenValue && !isTokenExpired(tokenValue);

    if (!isAuthenticated && !isPublicPath) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthenticated && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
