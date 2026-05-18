// Student editor — design.md §3.3 (E3 Focus Mode).
// Server component: validates ownership, hydrates the client editor with the
// report doc + course metadata + initial uploads. All interactivity lives in
// <ReportEditor>.

import { notFound, redirect } from "next/navigation";

import { ReportEditor, type EditorReport } from "@/app/workspace/c/[courseId]/editor";
import type { UploadedFile } from "@/components/editor/FilesSidebar";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import { reportId as makeReportId } from "@/lib/types";

interface Params {
  params: Promise<{ courseId: string }>;
}

export default async function EditorPage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (!user.isOnboarded) redirect("/workspace/onboarding");

  const { courseId } = await params;
  const { db } = getFirebaseAdmin();

  const [courseSnap, reportSnap] = await Promise.all([
    db.collection("courses").withConverter(courseConverter).doc(courseId).get(),
    db
      .collection("reports")
      .withConverter(reportConverter)
      .doc(makeReportId(courseId, user.uid))
      .get(),
  ]);

  const course = courseSnap.data();
  const report = reportSnap.data();
  if (!course || !report) notFound();
  if (report.uid !== user.uid) notFound();

  const uploadsSnap = await reportSnap.ref
    .collection("uploads")
    .orderBy("uploadedAt", "desc")
    .get();
  const initialUploads: UploadedFile[] = uploadsSnap.docs.map((d) => {
    const data = d.data() as {
      filename: string;
      downloadURL: string;
      sizeBytes: number;
      contentType: string;
    };
    return {
      id: d.id,
      filename: data.filename,
      downloadURL: data.downloadURL,
      sizeBytes: data.sizeBytes,
      contentType: data.contentType,
    };
  });

  const initial: EditorReport = {
    id: reportSnap.id,
    courseId,
    courseCode: course.code,
    courseName: course.name,
    title: report.title,
    author: report.author,
    summary: report.summary,
    coverImageUrl: report.coverImageUrl,
    contentMd: report.contentMd,
    publishedAt: report.publishedAt
      ? (report.publishedAt as unknown as { toDate(): Date }).toDate().toISOString()
      : null,
    hasNewChanges: report.hasNewChanges,
    updatedAtIso: (report.updatedAt as unknown as { toDate(): Date }).toDate().toISOString(),
    // v4 extended fields
    subtitle: report.subtitle ?? "",
    tags: (report.tags ?? []).join(", "),
    pullQuote: report.pullQuote ?? "",
    coverCaption: report.coverCaption ?? "",
    coAuthors: report.coAuthors ?? [],
    // Default to the report owner so the chip shows immediately on first edit.
    authorUid: report.authorUid ?? user.uid,
  };

  return <ReportEditor initial={initial} initialUploads={initialUploads} />;
}
