// POST { reportId } — adds 1 to a published report's viewCount (the home
// carousel's weighting, docs/design-v2.md §4.2). Sent by ViewCounter once per
// browser session. Unauthenticated by design; unknown, unpublished or
// withdrawn reports are ignored.

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// `${courseId}_${uid}` — Firestore auto-IDs and Firebase Auth UIDs
const REPORT_ID = /^[A-Za-z0-9_-]{1,200}$/;

export async function POST(req: Request) {
  let reportId: unknown;
  try {
    ({ reportId } = (await req.json()) as { reportId?: unknown });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof reportId !== "string" || !REPORT_ID.test(reportId)) {
    return new NextResponse(null, { status: 400 });
  }

  const { db } = getFirebaseAdmin();
  const ref = db.collection("reports").doc(reportId);
  const data = (await ref.get()).data();
  if (!data?.publishedAt || data.adminWithdrawn) return new NextResponse(null, { status: 204 });

  await ref.update({ viewCount: FieldValue.increment(1) });
  return new NextResponse(null, { status: 204 });
}
