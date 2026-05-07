import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-this"
);

const SESSION_COOKIE_NAME = "session";

async function getSessionFromRequest(
  request: NextRequest
): Promise<{ userId: string; email: string } | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  console.log("Proxy checking session:", {
    path: request.nextUrl.pathname,
    hasCookie: !!token,
    allCookies: request.cookies.getAll().map(c => c.name),
  });

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log("Session validated for user:", payload);
    return payload as { userId: string; email: string };
  } catch (error) {
    console.error("Invalid session token:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  // Define protected routes
  const protectedRoutes = [
    "/dashboard",
    "/articles",
    "/sponsors",
    "/admin-history",
    "/top-news",
    "/settings",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing protected route without being logged in, redirect to login
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and accessing auth pages, redirect to dashboard
  if (
    session &&
    (request.nextUrl.pathname.startsWith("/auth/sign-in") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard if logged in, otherwise to sign-in
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = session ? "/dashboard" : "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
