// Firebase Web SDK singleton — initialized lazily so server-rendered modules that
// import this file don't crash during build when client env vars are missing.

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, getStorage } from "firebase/storage";

import { env } from "@/lib/env";

let cached: { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } | null = null;

export function getFirebaseClient() {
  if (cached) return cached;

  const config = {
    apiKey: env.client.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.client.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.client.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.client.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.client.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.client.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps()[0] ?? initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  cached = { app, auth, db, storage };
  return cached;
}
