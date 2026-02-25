import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    // Public paths that don't require authentication
    // We can also check if the path starts with /login or /static, etc.
    const publicPaths = ["/login", "/api/auth"];

    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // If trying to access a protected path without a token, redirect to login
    if (!token && !isPublicPath) {
        if (request.nextUrl.pathname.startsWith("/_next") ||
            request.nextUrl.pathname.startsWith("/static") ||
            request.nextUrl.pathname.startsWith("/favicon.ico")) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is already logged in and tries to go to login page, redirect to dashboard?
    if (token && isPublicPath && request.nextUrl.pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
