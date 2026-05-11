// Firebase Admin SDK singleton — server-only.
// Service account JSON is provided base64-encoded via FIREBASE_ADMIN_PRIVATE_KEY_JSON
// to avoid newline-escaping pain in Cloud Run env vars.

import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { env } from "@/lib/env";

let cached: { app: App; auth: Auth; db: Firestore; storage: Storage } | null = null;

function decodeServiceAccount(b64: string): Record<string, string> {
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, string>;
}

export function getFirebaseAdmin() {
  if (cached) return cached;

  const existing = getApps()[0];
  let app: App;

  if (existing) {
    app = existing;
  } else {
    const b64 = env.server.FIREBASE_ADMIN_PRIVATE_KEY_JSON;
    if (!b64) {
      throw new Error(
        "FIREBASE_ADMIN_PRIVATE_KEY_JSON env var not set. Encode service-account.json with `base64 -w0` and place in .env.local.",
      );
    }
    const sa = decodeServiceAccount(b64);
    app = initializeApp({
      credential: cert({
        projectId: sa.projectId ?? sa.project_id,
        clientEmail: sa.clientEmail ?? sa.client_email,
        privateKey: (sa.privateKey ?? sa.private_key)?.replace(/\\n/g, "\n"),
      }),
      storageBucket: env.client.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return cached;
}
