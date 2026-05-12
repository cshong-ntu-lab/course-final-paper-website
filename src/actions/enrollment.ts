"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, enrollmentConverter, reportConverter } from "@/lib/firestore/converters";
import { isValidCourseCode, normalizeCourseCode } from "@/lib/courseCode";
import { DEFAULT_REPORT_TEMPLATE_MD } from "@/lib/reportTemplate";
import { requireUser } from "@/lib/server/auth";
import { enrollmentId, reportId, type Enrollment, type Report } from "@/lib/types";

export type EnrollResult =
  | { ok: true; courseId: string; alreadyEnrolled: boolean }
  | {
      ok: false;
      error: "invalid_code_format" | "code_not_found" | "enrollment_closed" | "internal";
    };

export async function enrollWithCodeAction(rawCode: string): Promise<EnrollResult> {
  const u = await requireUser();
  const code = normalizeCourseCode(rawCode);

  if (!isValidCourseCode(code)) {
    return { ok: false, error: "invalid_code_format" };
  }

  const { db } = getFirebaseAdmin();
  const coursesCol = db.collection("courses").withConverter(courseConverter);
  const enrollmentsCol = db.collection("enrollments").withConverter(enrollmentConverter);
  const reportsCol = db.collection("reports").withConverter(reportConverter);

  // Find course by code.
  const courseQuery = await coursesCol.where("code", "==", code).limit(1).get();
  if (courseQuery.empty) {
    return { ok: false, error: "code_not_found" };
  }
  const courseSnap = courseQuery.docs[0];
  if (!courseSnap) return { ok: false, error: "code_not_found" };

  const courseId = courseSnap.id;
  const course = courseSnap.data();

  // Idempotency: if already enrolled, return success without creating duplicates.
  const eRef = enrollmentsCol.doc(enrollmentId(courseId, u.uid));
  const existingEnrollment = await eRef.get();
  if (existingEnrollment.exists) {
    return { ok: true, courseId, alreadyEnrolled: true };
  }

  // Only check enrollment_open AFTER idempotency — existing students don't get
  // kicked out when teacher closes enrollment mid-course.
  if (!course.enrollmentOpen) {
    return { ok: false, error: "enrollment_closed" };
  }

  // Create enrollment + report atomically.
  const rRef = reportsCol.doc(reportId(courseId, u.uid));

  try {
    const batch = db.batch();
    batch.set(eRef, {
      courseId,
      uid: u.uid,
      enrolledAt: FieldValue.serverTimestamp() as unknown as Enrollment["enrolledAt"],
    });
    batch.set(rRef, {
      courseId,
      uid: u.uid,
      title: "標題",
      author: u.profileDisplayName || u.displayName || "佚名",
      summary: "摘要",
      coverImageUrl: null,
      contentMd: DEFAULT_REPORT_TEMPLATE_MD,
      publishedAt: null,
      hasNewChanges: false,
      createdAt: FieldValue.serverTimestamp() as unknown as Report["createdAt"],
      updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
    });
    await batch.commit();
  } catch {
    return { ok: false, error: "internal" };
  }

  return { ok: true, courseId, alreadyEnrolled: false };
}
