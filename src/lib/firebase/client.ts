// Firebase Web SDK singleton — initialized lazily so server-rendered modules that
// import this file don't crash during build when client env vars are missing.
// Set NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1 to wire to local emulators
// (firebase.json: auth 9099 / firestore 8080 / storage 9199).

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, type Firestore, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, type FirebaseStorage, getStorage } from "firebase/storage";

import { env } from "@/lib/env";

let cached: { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } | null = null;

const USE_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "1";

export function getFirebaseClient() {
  if (cached) return cached;

  const config = USE_EMULATOR
    ? {
        apiKey: "demo-emulator-key",
        authDomain: "localhost",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "course-final-paper-website-demo",
        storageBucket: "demo-emulator.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:demo",
      }
    : {
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

  if (USE_EMULATOR) {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  }

  cached = { app, auth, db, storage };
  return cached;
}
