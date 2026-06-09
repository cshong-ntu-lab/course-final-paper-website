"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { reportConverter, userConverter } from "@/lib/firestore/converters";
import { requireAdmin } from "@/lib/server/auth";
import { getUsersByUids } from "@/lib/server/firestore";
import { syncReportToDrive } from "@/lib/server/drive";
import type { CoAuthorSnapshot, PublishSnapshot, Report } from "@/lib/types";

export type PublishResult =
  | { ok: true; snapshotId: string; publishedAt: number }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export type WithdrawResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export async function publishReportAction(reportId: string): Promise<PublishResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(reportId);
  const snapshotsCol = reportRef.collection("publishSnapshots");

  try {
    // Pre-read to get the author's UID + co-authors so we can fetch profiles outside the transaction.
    const preSnap = await reportRef.get();
    if (!preSnap.exists) return { ok: false, error: "not_found" };
    const preData = preSnap.data()!;
    // authorUid is the selected author; fall back to the report owner (report.uid).
    const authorUid = preData.authorUid ?? preData.uid;
    const coAuthorUids = (preData.coAuthors ?? []).map((a) => a.uid);
    const coAuthorProfiles = await getUsersByUids(coAuthorUids);
    const coAuthorProfileMap = new Map(coAuthorProfiles.map((u) => [u.uid, u]));

    const result = await db.runTransaction(async (tx) => {
      const [snap, userSnap] = await Promise.all([
        tx.get(reportRef),
        tx.get(db.collection("users").withConverter(userConverter).doc(authorUid)),
      ]);
      if (!snap.exists) return { ok: false as const, error: "not_found" as const };

      const report = snap.data()!;
      const authorProfile = userSnap.data();
      const now = Timestamp.now();

      // Enrich co-authors with their profile data.
      const enrichedCoAuthors: CoAuthorSnapshot[] | undefined =
        report.coAuthors && report.coAuthors.length > 0
          ? report.coAuthors.map((a) => {
              const profile = coAuthorProfileMap.get(a.uid);
              return {
                uid: a.uid,
                name: a.name,
                ...(profile?.title && { title: profile.title }),
                ...(profile?.bio && { bio: profile.bio }),
              };
            })
          : undefined;

      // Write publish snapshot — authorAffiliation/authorBio come from the author's profile.
      const snapshotRef = snapshotsCol.doc();
      const snapshot: PublishSnapshot = {
        type: "publish",
        contentMd: report.contentMd,
        title: report.title,
        author: report.author,
        summary: report.summary,
        coverImageUrl: report.coverImageUrl,
        publishedAt: now,
        publishedBy: admin.uid,
        ...(report.subtitle !== undefined && { subtitle: report.subtitle }),
        ...(report.tags !== undefined && { tags: report.tags }),
        ...(report.pullQuote !== undefined && { pullQuote: report.pullQuote }),
        ...(authorProfile?.title && { authorAffiliation: authorProfile.title }),
        ...(authorProfile?.bio && { authorBio: authorProfile.bio }),
        ...(report.coverCaption !== undefined && { coverCaption: report.coverCaption }),
        ...(enrichedCoAuthors && { coAuthors: enrichedCoAuthors }),
      };
      tx.set(snapshotRef, snapshot);

      // Update report: set publishedAt + clear hasNewChanges + clear adminWithdrawn.
      tx.set(
        reportRef,
        {
          publishedAt: now,
          hasNewChanges: false,
          adminWithdrawn: false,
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

export async function withdrawReportAction(reportId: string): Promise<WithdrawResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const reportRef = db.collection("reports").withConverter(reportConverter).doc(reportId);
  const snapshotsCol = reportRef.collection("publishSnapshots");

  try {
    const snap = await reportRef.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    const report = snap.data()!;

    const now = Timestamp.now();

    // Write a lightweight withdrawal record to history.
    const withdrawSnapshot: PublishSnapshot = {
      type: "withdraw",
      contentMd: report.contentMd,
      title: report.title,
      author: report.author,
      summary: report.summary,
      coverImageUrl: report.coverImageUrl,
      publishedAt: now,
      publishedBy: admin.uid,
    };
    await snapshotsCol.doc().set(withdrawSnapshot);

    await reportRef.set(
      {
        publishedAt: null,
        hasNewChanges: false,
        adminWithdrawn: true,
        updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
      } as Report,
      { merge: true },
    );
    void syncReportToDrive(reportId).catch((err) =>
      console.error("[drive-sync] withdrawReport failed", { reportId, err }),
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}
