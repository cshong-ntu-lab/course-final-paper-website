// Session helpers + ensureUserDoc.
// Reads session cookie minted by /api/auth/session, verifies via Firebase Admin,
// returns a typed CurrentUser. Computes admin role from ADMIN_EMAILS env var.

import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { userConverter } from "@/lib/firestore/converters";
import type { Role, User } from "@/lib/types";

export const SESSION_COOKIE = "session";
// Firebase session cookie max lifetime is 14 days; we mint for 5 to keep risk bounded.
export const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export interface CurrentUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
  profileDisplayName: string;
  isOnboarded: boolean; // true once profileDisplayName is set (i.e. not empty)
  // v4 extended profile fields
  title: string;
  bio: string;
  avatarUrl: string | null;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return env.server.ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Returns the signed-in user, or null if no/invalid session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  const { auth, db } = getFirebaseAdmin();

  let decoded;
  try {
    // checkRevoked=true would call /tokens/info on every request; skip for perf.
    decoded = await auth.verifySessionCookie(sessionCookie, false);
  } catch {
    return null;
  }

  const usersCol = db.collection("users").withConverter(userConverter);
  const snap = await usersCol.doc(decoded.uid).get();
  const userDoc = snap.data();

  const role: Role = decoded.isAdmin === true || isAdminEmail(decoded.email) ? "admin" : "student";

  return {
    uid: decoded.uid,
    email: decoded.email ?? "",
    displayName: decoded.name ?? userDoc?.displayNameGoogle ?? "",
    photoURL: decoded.picture ?? userDoc?.photoURLGoogle ?? null,
    role,
    profileDisplayName: userDoc?.profileDisplayName ?? "",
    isOnboarded: Boolean(userDoc?.profileDisplayName),
    title: userDoc?.title ?? "",
    bio: userDoc?.bio ?? "",
    avatarUrl: userDoc?.avatarUrl ?? null,
  };
}

/** Server Action / Route Handler guard — throws 401 if not signed in. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

/** Throws 403 if not admin. */
export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("FORBIDDEN");
  return u;
}

/**
 * Upsert the user doc and set the isAdmin custom claim. Call from the session
 * route handler right after verifying the Google ID token.
 * Returns true when the role changed (so caller can revoke + re-mint).
 */
export async function ensureUserDoc(decoded: {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<{ role: Role; roleChanged: boolean }> {
  const { auth, db } = getFirebaseAdmin();
  const role: Role = isAdminEmail(decoded.email) ? "admin" : "student";

  // Sync custom claim if it doesn't match.
  const userRecord = await auth.getUser(decoded.uid);
  const currentIsAdmin = Boolean(userRecord.customClaims?.isAdmin);
  const desiredIsAdmin = role === "admin";
  const roleChanged = currentIsAdmin !== desiredIsAdmin;
  if (roleChanged) {
    await auth.setCustomUserClaims(decoded.uid, {
      ...userRecord.customClaims,
      isAdmin: desiredIsAdmin,
    });
  }

  const usersCol = db.collection("users").withConverter(userConverter);
  const docRef = usersCol.doc(decoded.uid);
  const existing = await docRef.get();

  if (existing.exists) {
    // Refresh Google-sourced fields + role; keep profileDisplayName as-is.
    await docRef.set(
      {
        email: decoded.email ?? "",
        displayNameGoogle: decoded.name ?? "",
        photoURLGoogle: decoded.picture ?? null,
        role,
        updatedAt: FieldValue.serverTimestamp(),
      } as Partial<User> as User,
      { merge: true },
    );
  } else {
    await docRef.set({
      email: decoded.email ?? "",
      displayNameGoogle: decoded.name ?? "",
      photoURLGoogle: decoded.picture ?? null,
      profileDisplayName: "", // empty until onboarding completes
      role,
      // serverTimestamp is opaque to TS but is the documented runtime value.
      createdAt: FieldValue.serverTimestamp() as unknown as User["createdAt"],
      updatedAt: FieldValue.serverTimestamp() as unknown as User["updatedAt"],
    });
  }

  return { role, roleChanged };
}
