// Firebase Admin SDK singleton — server-only.
//
// Credential resolution order:
//   1. Emulator — when FIREBASE_USE_EMULATOR=1 or *_EMULATOR_HOST env vars are set,
//      Admin SDK auto-connects to local emulators; no creds needed.
//   2. Explicit service account — FIREBASE_ADMIN_PRIVATE_KEY_JSON (base64-encoded
//      JSON). Use this when running outside GCP or when org policy permits keys.
//   3. Application Default Credentials (ADC) — picks up either:
//        - `gcloud auth application-default login` creds (local dev)
//        - Cloud Run / GCE attached service account via metadata server (prod)
//      This is the recommended path; no long-lived key on disk.

import "server-only";

import { type App, applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { env } from "@/lib/env";

let cached: { app: App; auth: Auth; db: Firestore; storage: Storage } | null = null;

const USE_EMULATOR =
  process.env.FIREBASE_USE_EMULATOR === "1" ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

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
  } else if (USE_EMULATOR) {
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "course-final-paper-website-demo",
      storageBucket: "demo-emulator.appspot.com",
    });
  } else {
    const b64 = env.server.FIREBASE_ADMIN_PRIVATE_KEY_JSON;
    const storageBucket = env.client.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const projectId = env.client.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (b64) {
      // Explicit service account key path.
      const sa = decodeServiceAccount(b64);
      app = initializeApp({
        credential: cert({
          projectId: sa.projectId ?? sa.project_id,
          clientEmail: sa.clientEmail ?? sa.client_email,
          privateKey: (sa.privateKey ?? sa.private_key)?.replace(/\\n/g, "\n"),
        }),
        storageBucket,
      });
    } else {
      // ADC path — works locally after `gcloud auth application-default login`
      // and on Cloud Run via the attached service account / metadata server.
      app = initializeApp({
        credential: applicationDefault(),
        projectId,
        storageBucket,
      });
    }
  }

  cached = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return cached;
}
