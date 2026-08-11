// Server-side Firestore query helpers.
// All functions use the Admin SDK and require server context.

import "server-only";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, reportConverter, userConverter } from "@/lib/firestore/converters";
import { courseSlug } from "@/lib/slug";
import type { Course, PublishSnapshot, Report, User } from "@/lib/types";

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
    .get();
  // "withdraw" snapshots are lightweight history records (contentMd/title/author/
  // summary/coverImageUrl only — no tags/subtitle/pullQuote/etc.) and must never be
  // treated as the public content to render. Skip them and return the latest real
  // "publish" snapshot instead. Legacy docs without a `type` field predate the
  // withdraw feature, so they're always a publish snapshot.
  const publishDoc = snap.docs.find((d) => (d.data() as PublishSnapshot).type !== "withdraw");
  if (!publishDoc) return null;
  return { ...(publishDoc.data() as PublishSnapshot), id: publishDoc.id };
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

export interface AdjacentReports {
  prev: { slug: string; title: string; author: string } | null;
  next: { slug: string; title: string; author: string } | null;
}

/**
 * Returns the report published immediately before and after the current one
 * (ordered by publishedAt ascending) within the same course.
 */
export async function getAdjacentPublishedReports(
  courseId: string,
  currentPublishedAtMs: number,
): Promise<AdjacentReports> {
  const { db } = getFirebaseAdmin();
  const col = db
    .collection("reports")
    .withConverter(reportConverter)
    .where("courseId", "==", courseId)
    .where("publishedAt", "!=", null);

  const [prevSnap, nextSnap] = await Promise.all([
    col
      .where("publishedAt", "<", new Date(currentPublishedAtMs))
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get(),
    col
      .where("publishedAt", ">", new Date(currentPublishedAtMs))
      .orderBy("publishedAt", "asc")
      .limit(1)
      .get(),
  ]);

  const toItem = (docs: typeof prevSnap.docs) => {
    if (docs.length === 0) return null;
    const d = docs[0]!;
    const data = d.data();
    return { slug: data.uid, title: data.title, author: data.author };
  };

  return { prev: toItem(prevSnap.docs), next: toItem(nextSnap.docs) };
}

export type UserDoc = User & { uid: string };

/** Fetch multiple users by UID. Returns only found docs (missing UIDs are skipped). */
export async function getUsersByUids(uids: string[]): Promise<UserDoc[]> {
  if (uids.length === 0) return [];
  const { db } = getFirebaseAdmin();
  const refs = uids.map((uid) => db.collection("users").withConverter(userConverter).doc(uid));
  const snaps = await db.getAll(...refs);
  return snaps.filter((s) => s.exists).map((s) => ({ ...(s.data() as User), uid: s.id }));
}

/** All users, for author/co-author search. Returns lean records only. */
export async function getAllUsersForSearch(): Promise<
  { uid: string; name: string; email: string; title?: string }[]
> {
  const { db } = getFirebaseAdmin();
  const snap = await db.collection("users").withConverter(userConverter).get();
  return snap.docs
    .filter((d) => d.data().role === "student")
    .map((d) => ({
      uid: d.id,
      name: d.data().profileDisplayName,
      email: d.data().email,
      title: d.data().title,
    }));
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
