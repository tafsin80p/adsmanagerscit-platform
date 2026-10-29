import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface SessionPayload {
  id?: string;
  email?: string;
  role?: "client" | "admin";
  timestamp?: number;
}

function parseSession(cookieValue?: string): SessionPayload | null {
  if (!cookieValue) return null;
  try {
    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = atob(cookieValue);
    } else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(cookieValue, "base64").toString("utf-8");
    }
    const data = JSON.parse(jsonStr);
    if (data && data.email && data.role) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("scit_auth_session")?.value;
  const session = parseSession(sessionCookie);
  const isAuthenticated = Boolean(session && session.email);
  const userRole = session?.role;

  // 1. PUBLIC API ROUTES (Authentication endpoints & public checks)
  const isPublicApi =
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/test-db" ||
    pathname === "/api/facebook/page-info";

  if (pathname.startsWith("/api/")) {
    if (isPublicApi) {
      return NextResponse.next();
    }

    // All other internal API routes require authentication
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required to access this resource." },
        { status: 401 }
      );
    }

    // Admin-only API endpoints: Clients must never access client management, system settings, or Meta config
    const isAdminOnlyApi =
      pathname.startsWith("/api/clients") ||
      pathname.startsWith("/api/settings") ||
      pathname.startsWith("/api/meta/");

    if (isAdminOnlyApi && userRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. PUBLIC AUTH PAGES
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login";

  // If already authenticated and visiting auth pages, redirect to respective console
  if (isAuthPage && isAuthenticated) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    } else {
      // If a logged-in client tries to visit /admin/login, redirect to client portal
      if (pathname === "/admin/login") {
        const clientHome = new URL("/", req.url);
        clientHome.searchParams.set("unauthorized", "admin_restricted");
        return NextResponse.redirect(clientHome);
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Allow unauthenticated visitors to view login & register pages
  if (isAuthPage) {
    return NextResponse.next();
  }

  // 3. ADMIN CONSOLE PAGES (/admin, /admin/...)
  const isAdminPage = pathname.startsWith("/admin");
  if (isAdminPage) {
    // A: Without login -> Redirect to /admin/login
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // B: Logged-in client trying to access Admin pages -> BLOCKED & REDIRECTED TO CLIENT HOME
    if (userRole !== "admin") {
      const clientHomeUrl = new URL("/", req.url);
      clientHomeUrl.searchParams.set("unauthorized", "admin_restricted");
      return NextResponse.redirect(clientHomeUrl);
    }

    // C: Authenticated admin -> Allowed
    return NextResponse.next();
  }

  // 4. CLIENT PORTAL PAGES (/, /create-order, /my-orders, /all-boosts, /payment-history, /performance, /profile, etc.)
  // Without login -> No one can access any page; Redirect to /login
  if (!isAuthenticated) {
    const clientLoginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      clientLoginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(clientLoginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg, icon.png, apple-icon.png
     * - images directory & common static asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.png|apple-icon\\.png|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};

