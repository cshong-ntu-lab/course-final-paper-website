// Server-side Firestore query helpers.
// All functions use the Admin SDK and require server context.

import "server-only";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, reportConverter } from "@/lib/firestore/converters";
import { courseSlug } from "@/lib/slug";
import type { Course, PublishSnapshot, Report } from "@/lib/types";

export type CourseDoc = Course & { id: string };
export type ReportDoc = Report & { id: string };
export type SnapshotDoc = PublishSnapshot & { id: string };

/** All courses, ordered newest first. */
export async function getAllCourses(): Promise<CourseDoc[]> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("courses")
    .withConverter(courseConverter)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/** Courses that have at least one published report, ordered newest first. */
export async function getCoursesWithPublishedReports(): Promise<CourseDoc[]> {
  const { db } = getFirebaseAdmin();
  const [coursesSnap, publishedSnap] = await Promise.all([
    db.collection("courses").withConverter(courseConverter).orderBy("createdAt", "desc").get(),
    db.collection("reports").where("publishedAt", "!=", null).select("courseId").get(),
  ]);
  const withContent = new Set(publishedSnap.docs.map((d) => d.get("courseId") as string));
  return coursesSnap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .filter((c) => withContent.has(c.id));
}

/** All reports for a course (draft + published), newest-updated first. Used by /preview. */
export async function getAllReportsByCourse(courseId: string): Promise<ReportDoc[]> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("reports")
    .withConverter(reportConverter)
    .where("courseId", "==", courseId)
    .orderBy("updatedAt", "desc")
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/** Published reports for a course, newest-published first. */
export async function getPublishedReportsByCourse(courseId: string): Promise<ReportDoc[]> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("reports")
    .withConverter(reportConverter)
    .where("courseId", "==", courseId)
    .where("publishedAt", "!=", null)
    .orderBy("publishedAt", "desc")
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/** Latest publish snapshot for a report, or null if never published. */
export async function getLatestSnapshot(reportId: string): Promise<SnapshotDoc | null> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("reports")
    .doc(reportId)
    .collection("publishSnapshots")
    .orderBy("publishedAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { ...(doc.data() as PublishSnapshot), id: doc.id };
}

/** All report drafts, newest-updated first. Used by the staging home page. */
export async function getAllReportDocs(): Promise<ReportDoc[]> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("reports")
    .withConverter(reportConverter)
    .orderBy("updatedAt", "desc")
    .get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

/** Single report document by ID (latest draft). */
export async function getReportDoc(reportId: string): Promise<ReportDoc | null> {
  const { db } = getFirebaseAdmin();
  const snap = await db.collection("reports").withConverter(reportConverter).doc(reportId).get();
  if (!snap.exists) return null;
  return { ...snap.data()!, id: snap.id };
}

/** Find a course by its URL slug. Returns null if not found. */
export async function getCourseBySlug(slug: string): Promise<CourseDoc | null> {
  const courses = await getAllCourses();
  let normalized: string;
  try {
    normalized = decodeURIComponent(slug);
  } catch {
    normalized = slug;
  }
  return courses.find((c) => courseSlug(c) === normalized) ?? null;
}
