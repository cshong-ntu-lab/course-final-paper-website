"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportConverter } from "@/lib/firestore/converters";
import { requireUser } from "@/lib/server/auth";
import { deleteStorageObject } from "@/lib/server/storage";
import type { Report } from "@/lib/types";

const TITLE_MAX = 120;
const AUTHOR_MAX = 60;
const SUMMARY_MAX = 400;
const CONTENT_MAX = 200_000; // ~50K Chinese chars — plenty for a graduate paper

export interface SaveReportPatch {
  contentMd?: string;
  title?: string;
  author?: string;
  summary?: string;
  coverImageUrl?: string | null;
}

export type SaveReportResult =
  | { ok: true; hasNewChanges: boolean; savedAt: number }
  | { ok: false; error: "not_found" | "forbidden" | "invalid_input" | "internal" };

function validate(patch: SaveReportPatch): SaveReportPatch | { error: SaveReportResult } {
  const out: SaveReportPatch = {};
  if (patch.contentMd !== undefined) {
    if (typeof patch.contentMd !== "string" || patch.contentMd.length > CONTENT_MAX) {
      return { error: { ok: false, error: "invalid_input" } };
    }
    out.contentMd = patch.contentMd;
  }
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (t.length === 0 || t.length > TITLE_MAX) {
      return { error: { ok: false, error: "invalid_input" } };
    }
    out.title = t;
  }
  if (patch.author !== undefined) {
    const a = patch.author.trim();
    if (a.length === 0 || a.length > AUTHOR_MAX) {
      return { error: { ok: false, error: "invalid_input" } };
    }
    out.author = a;
  }
  if (patch.summary !== undefined) {
    if (typeof patch.summary !== "string" || patch.summary.length > SUMMARY_MAX) {
      return { error: { ok: false, error: "invalid_input" } };
    }
    out.summary = patch.summary;
  }
  if (patch.coverImageUrl !== undefined) {
    if (patch.coverImageUrl !== null && typeof patch.coverImageUrl !== "string") {
      return { error: { ok: false, error: "invalid_input" } };
    }
    out.coverImageUrl = patch.coverImageUrl;
  }
  return out;
}

export async function saveReportDraftAction(
  reportId: string,
  rawPatch: SaveReportPatch,
): Promise<SaveReportResult> {
  const u = await requireUser();
  const validated = validate(rawPatch);
  if ("error" in validated) return validated.error;
  if (Object.keys(validated).length === 0) {
    // No-op patch; treat as success without a write.
    return { ok: true, hasNewChanges: false, savedAt: Date.now() };
  }

  const { db } = getFirebaseAdmin();
  const reportsCol = db.collection("reports").withConverter(reportConverter);
  const ref = reportsCol.doc(reportId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false as const, error: "not_found" as const };
      const data = snap.data()!;
      if (data.uid !== u.uid) return { ok: false as const, error: "forbidden" as const };

      // Compute hasNewChanges:
      // - If we're changing contentMd AND there has been a previous publish,
      //   the diff against the published snapshot triggers the "+New" badge.
      // - We approximate by setting hasNewChanges=true whenever contentMd
      //   changes after the report has ever been published.
      const contentChanged =
        validated.contentMd !== undefined && validated.contentMd !== data.contentMd;
      const hasNewChanges = data.publishedAt !== null && (contentChanged || data.hasNewChanges);

      tx.set(
        ref,
        {
          ...validated,
          hasNewChanges,
          updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
        } as Partial<Report> as Report,
        { merge: true },
      );

      return { ok: true as const, hasNewChanges };
    });

    if (!result.ok) return result;
    return { ok: true, hasNewChanges: result.hasNewChanges, savedAt: Date.now() };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export type DeleteUploadResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export async function deleteUploadAction(
  reportId: string,
  uploadId: string,
): Promise<DeleteUploadResult> {
  const u = await requireUser();
  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(reportId);
  const uploadRef = reportRef.collection("uploads").doc(uploadId);

  try {
    const reportSnap = await reportRef.get();
    const report = reportSnap.data();
    if (!reportSnap.exists || !report) return { ok: false, error: "not_found" };
    if (report.uid !== u.uid) return { ok: false, error: "forbidden" };

    const uploadSnap = await uploadRef.get();
    if (!uploadSnap.exists) return { ok: false, error: "not_found" };
    const uploadData = uploadSnap.data() as { storagePath?: string } | undefined;

    if (uploadData?.storagePath) {
      await deleteStorageObject(uploadData.storagePath);
    }
    await uploadRef.delete();
    return { ok: true };
  } catch (err) {
    console.error("[deleteUploadAction] failed", { reportId, uploadId, err });
    return { ok: false, error: "internal" };
  }
}
