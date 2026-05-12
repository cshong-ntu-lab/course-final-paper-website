// POST: exchange a Google ID token for an HttpOnly session cookie.
// DELETE: clear the cookie (logout).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { ensureUserDoc, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/server/auth";

export async function POST(req: Request) {
  const { idToken } = (await req.json().catch(() => ({}))) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  const { auth } = getFirebaseAdmin();

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    return NextResponse.json({ error: "invalid_id_token" }, { status: 401 });
  }

  // ID token freshness: require the user to have signed in within the last 5 minutes
  // (createSessionCookie enforces this implicitly but we surface a clearer error).
  const authTimeMs = decoded.auth_time * 1000;
  if (Date.now() - authTimeMs > 5 * 60 * 1000) {
    return NextResponse.json({ error: "stale_id_token_reauth_required" }, { status: 401 });
  }

  const { role } = await ensureUserDoc({
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name as string | undefined,
    picture: decoded.picture as string | undefined,
  });

  // Custom claim may or may not be present on the current id token (depends on
  // whether this is the user's first login). `getCurrentUser` falls back to
  // email-based admin lookup, so this isn't blocking — the claim is just an
  // optimisation for future session-cookie verifications.

  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: sessionCookie,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return NextResponse.json({ ok: true, role });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
