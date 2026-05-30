// Records an upload in Firestore after the client successfully wrote the bytes
// to Cloud Storage via the Firebase Web SDK. The server's job is just
// validation (does this user own the report? is the path legitimate?) and
// persistence (reports/{id}/uploads/{uploadId}).

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import { UPLOAD_MAX_BYTES } from "@/lib/server/storage";

const Body = z.object({
  reportId: z.string().min(1),
  uploadId: z.string().min(1),
  storagePath: z.string().min(1),
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .regex(/^(image\/(png|jpeg|webp|gif|svg\+xml)|text\/csv|application\/json)$/),
  sizeBytes: z.number().int().positive().max(UPLOAD_MAX_BYTES),
  downloadUrl: z.string().url(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const body = parsed.data;

  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(body.reportId);
  const reportSnap = await reportRef.get();
  const report = reportSnap.data();
  if (!reportSnap.exists || !report) {
    return NextResponse.json({ error: "report_not_found" }, { status: 404 });
  }
  if (report.uid !== user.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Anchor the storage path to the current user's uploads prefix.
  const expectedPrefix = `reports/${body.reportId}/${user.uid}/`;
  if (!body.storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "path_mismatch" }, { status: 400 });
  }

  await reportRef.collection("uploads").doc(body.uploadId).set({
    filename: body.filename,
    storagePath: body.storagePath,
    downloadURL: body.downloadUrl,
    sizeBytes: body.sizeBytes,
    contentType: body.contentType,
    uploadedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
