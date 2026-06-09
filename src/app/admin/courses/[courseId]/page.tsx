// design.md §3.8 — admin course detail: code display, enrollment toggle, report list.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, enrollmentConverter, reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import type { ReportStatus } from "@/lib/types";

import { CourseDetailClient } from "./client";

interface Props {
  params: Promise<{ courseId: string }>;
}

function termLabel(year: number, semester: "1" | "2"): string {
  return `${year} 學年第 ${semester} 學期`;
}

function relativeTime(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "剛剛";
  if (secs < 3600) return `${Math.floor(secs / 60)} 分鐘前`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} 小時前`;
  return `${Math.floor(secs / 86400)} 天前`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const { db } = getFirebaseAdmin();
  const snap = await db.collection("courses").withConverter(courseConverter).doc(courseId).get();
  if (!snap.exists) return { title: "課程" };
  return { title: snap.data()!.name };
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { db } = getFirebaseAdmin();
  const courseSnap = await db
    .collection("courses")
    .withConverter(courseConverter)
    .doc(courseId)
    .get();
  if (!courseSnap.exists) notFound();
  const course = { ...courseSnap.data()!, id: courseSnap.id };

  // Load all reports + student count in parallel.
  const [reportsSnap, studentCount] = await Promise.all([
    db.collection("reports").withConverter(reportConverter).where("courseId", "==", courseId).get(),
    db
      .collection("enrollments")
      .withConverter(enrollmentConverter)
      .where("courseId", "==", courseId)
      .count()
      .get()
      .then((r) => r.data().count),
  ]);

  const reports = reportsSnap.docs.map((d) => {
    const r = d.data();
    const status: ReportStatus = r.adminWithdrawn
      ? r.hasNewChanges
        ? "admin-withdrawn-new"
        : "admin-withdrawn"
      : !r.publishedAt
        ? "unpublished"
        : r.hasNewChanges
          ? "published-new"
          : "published";
    return {
      id: d.id,
      courseId,
      uid: r.uid,
      title: r.title,
      author: r.author,
      status,
      updatedRelative: relativeTime(r.updatedAt.toMillis()),
    };
  });

  const publishedCount = reports.filter(
    (r) => r.status === "published" || r.status === "published-new",
  ).length;
  const pendingCount = reports.filter(
    (r) =>
      r.status === "unpublished" ||
      r.status === "published-new" ||
      r.status === "admin-withdrawn-new",
  ).length;

  return (
    <>
      <AppHeader
        context="admin"
        user={{
          displayName: user.profileDisplayName || user.displayName,
          email: user.email,
        }}
        breadcrumb={[{ label: "我的課程", href: "/admin" }, { label: course.name }]}
      />

      <main id="main" className="mx-auto max-w-5xl px-7 py-9">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="font-mono text-xs text-subtle mb-1">
              {course.code} · {termLabel(course.year, course.semester)}
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{course.name}</h1>
          </div>
        </div>

        <CourseDetailClient
          courseId={courseId}
          courseName={course.name}
          code={course.code}
          enrollmentOpen={course.enrollmentOpen}
          reports={reports}
          studentCount={studentCount}
          publishedCount={publishedCount}
          pendingCount={pendingCount}
          description={course.description ?? ""}
          courseNo={course.courseNo ?? ""}
          teacher={course.teacher ?? ""}
          termRange={course.termRange ?? ""}
        />
      </main>
    </>
  );
}
