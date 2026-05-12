// Idempotent seed: ensures one open course with code TEST01 exists,
// owned by the first email in ADMIN_EMAILS. Used during Phase 2 E2E.
//
// Run from repo root:
//   node --env-file=.env.local scripts/seed-test-course.mjs

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local");
  process.exit(1);
}
if (adminEmails.length === 0) {
  console.error("Missing ADMIN_EMAILS in .env.local");
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
const db = getFirestore(app);
const auth = getAuth(app);

// Resolve admin uid by email.
const ownerEmail = adminEmails[0];
let ownerUid;
try {
  const user = await auth.getUserByEmail(ownerEmail);
  ownerUid = user.uid;
} catch {
  console.error(
    `[seed] Admin user ${ownerEmail} not found in Firebase Auth. Sign in with that account once first, then re-run this script.`,
  );
  process.exit(1);
}

// Code alphabet matches src/lib/courseCode.ts — excludes 0/O/1/I/L to avoid
// confusion. So `TEST23` is valid but `TEST01` is not.
const CODE = "TEST23";
const NOW = FieldValue.serverTimestamp();

const coursesCol = db.collection("courses");

// Idempotency: if a course with code TEST01 already exists, reuse it.
const existing = await coursesCol.where("code", "==", CODE).limit(1).get();
if (!existing.empty) {
  const doc = existing.docs[0];
  console.log(`[seed] Course already exists — id=${doc.id} code=${CODE}`);
  process.exit(0);
}

const ref = await coursesCol.add({
  name: "質性研究方法 · 測試課程",
  year: 114,
  semester: "2",
  description: "Phase 2 測試用課程。學生輸入代碼 TEST01 即可加入。",
  coverImageUrl: null,
  code: CODE,
  enrollmentOpen: true,
  ownerUid,
  createdAt: NOW,
  updatedAt: NOW,
});

console.log(`[seed] Created course id=${ref.id} code=${CODE} ownerUid=${ownerUid}`);
process.exit(0);
