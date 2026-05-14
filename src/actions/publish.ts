"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportConverter } from "@/lib/firestore/converters";
import { requireAdmin } from "@/lib/server/auth";
import { syncReportToDrive } from "@/lib/server/drive";
import type { PublishSnapshot, Report } from "@/lib/types";

export type PublishResult =
  | { ok: true; snapshotId: string; publishedAt: number }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export type UnpublishResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export async function publishReportAction(reportId: string): Promise<PublishResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(reportId);
  const snapshotsCol = reportRef.collection("publishSnapshots");

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(reportRef);
      if (!snap.exists) return { ok: false as const, error: "not_found" as const };

      const report = snap.data()!;
      const now = Timestamp.now();

      // Write publish snapshot.
      const snapshotRef = snapshotsCol.doc();
      const snapshot: PublishSnapshot = {
        contentMd: report.contentMd,
        title: report.title,
        author: report.author,
        summary: report.summary,
        coverImageUrl: report.coverImageUrl,
        publishedAt: now,
        publishedBy: admin.uid,
      };
      tx.set(snapshotRef, snapshot);

      // Update report: set publishedAt + clear hasNewChanges.
      tx.set(
        reportRef,
        {
          publishedAt: now,
          hasNewChanges: false,
          updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
        } as Report,
        { merge: true },
      );

      return { ok: true as const, snapshotId: snapshotRef.id, publishedAt: now.toMillis() };
    });

    if (result.ok) {
      void syncReportToDrive(reportId).catch((err) =>
        console.error("[drive-sync] publishReport failed", { reportId, err }),
      );
    }
    return result;
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function unpublishReportAction(reportId: string): Promise<UnpublishResult> {
  await requireAdmin();
  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(reportId);

  try {
    const snap = await reportRef.get();
    if (!snap.exists) return { ok: false, error: "not_found" };

    await reportRef.set(
      {
        publishedAt: null,
        hasNewChanges: false,
        updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
      } as Report,
      { merge: true },
    );
    void syncReportToDrive(reportId).catch((err) =>
      console.error("[drive-sync] unpublishReport failed", { reportId, err }),
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}
