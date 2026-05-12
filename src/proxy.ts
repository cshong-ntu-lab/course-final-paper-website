// Edge proxy (Next.js 16 — was `middleware`) — gates /workspace + /admin.
// Cannot use Firebase Admin SDK here (Edge runtime), so we only check cookie
// presence. Real verification happens in server components via getCurrentUser().

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session";

const PROTECTED_PREFIXES = ["/workspace", "/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  // Redirect to /login with ?from for post-login return.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/workspace/:path*", "/admin/:path*"],
};
