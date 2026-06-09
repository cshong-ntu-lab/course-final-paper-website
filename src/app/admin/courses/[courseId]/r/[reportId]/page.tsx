// design.md §3.9 — report review: Latest / Diff / History tabs + Publish controls.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import type { PublishSnapshot, ReportStatus } from "@/lib/types";

import { ReportReviewClient } from "./client";

interface Props {
  params: Promise<{ courseId: string; reportId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportId } = await params;
  const { db } = getFirebaseAdmin();
  const snap = await db.collection("reports").withConverter(reportConverter).doc(reportId).get();
  if (!snap.exists) return { title: "報告審核" };
  const r = snap.data()!;
  return { title: `${r.author} — ${r.title}` };
}

export default async function ReportReviewPage({ params }: Props) {
  const { courseId, reportId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { db } = getFirebaseAdmin();

  const [courseSnap, reportSnap] = await Promise.all([
    db.collection("courses").withConverter(courseConverter).doc(courseId).get(),
    db.collection("reports").withConverter(reportConverter).doc(reportId).get(),
  ]);

  if (!courseSnap.exists || !reportSnap.exists) notFound();

  const course = { ...courseSnap.data()!, id: courseSnap.id };
  const report = { ...reportSnap.data()!, id: reportSnap.id };

  // Load all publish snapshots (for Diff + History tabs).
  const snapshotsSnap = await db
    .collection("reports")
    .doc(reportId)
    .collection("publishSnapshots")
    .orderBy("publishedAt", "desc")
    .get();

  const snapshots = snapshotsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PublishSnapshot),
    publishedAtMs: (d.data() as PublishSnapshot).publishedAt.toMillis(),
  }));

  // Latest publish snapshot (skip "withdraw" entries which record the current
  // content at withdrawal time, not the published baseline for diffing).
  const latestPublishSnapshot = snapshots.find((s) => s.type !== "withdraw") ?? null;

  // Compute hasNewChanges from actual content diff against the published baseline,
  // bypassing the stored sticky flag which may be stale for pre-migration reports.
  const realHasNewChanges = latestPublishSnapshot
    ? report.contentMd !== latestPublishSnapshot.contentMd
    : report.hasNewChanges;

  const status: ReportStatus = report.adminWithdrawn
    ? realHasNewChanges
      ? report.reviewRequested
        ? "admin-withdrawn-new-review"
        : "admin-withdrawn-new"
      : "admin-withdrawn"
    : !report.publishedAt
      ? report.reviewRequested
        ? "unpublished-review"
        : "unpublished"
      : realHasNewChanges
        ? report.reviewRequested
          ? "published-new-review"
          : "published-new"
        : "published";

  return (
    <>
      <AppHeader
        context="admin"
        user={{
          displayName: user.profileDisplayName || user.displayName,
          email: user.email,
        }}
        breadcrumb={[
          { label: course.name, href: `/admin/courses/${courseId}` },
          { label: `${report.author} 的報告` },
        ]}
      />

      <main id="main" className="mx-auto max-w-5xl px-7 py-7">
        <ReportReviewClient
          reportId={reportId}
          report={{
            title: report.title,
            author: report.author,
            contentMd: report.contentMd,
            updatedAtMs: report.updatedAt.toMillis(),
            publishedAtMs: report.publishedAt?.toMillis() ?? null,
            hasNewChanges: realHasNewChanges,
            status,
          }}
          latestSnapshotContentMd={latestPublishSnapshot?.contentMd ?? null}
          snapshots={snapshots.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            author: s.author,
            contentMd: s.contentMd,
            publishedAtMs: s.publishedAtMs,
            publishedBy: s.publishedBy,
          }))}
        />
      </main>
    </>
  );
}
