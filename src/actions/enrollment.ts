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
    // Still auto-set profileDisplayName in case the user enrolled before the
    // name step was removed and their doc still has an empty profileDisplayName.
    if (!u.profileDisplayName) {
      const fallbackName = u.displayName || u.email.split("@")[0] || "學生";
      await db
        .collection("users")
        .doc(u.uid)
        .set({ profileDisplayName: fallbackName }, { merge: true });
    }
    return { ok: true, courseId, alreadyEnrolled: true };
  }

  // Only check enrollment_open AFTER idempotency — existing students don't get
  // kicked out when teacher closes enrollment mid-course.
  if (!course.enrollmentOpen) {
    return { ok: false, error: "enrollment_closed" };
  }

  // Create enrollment + report atomically.
  const rRef = reportsCol.doc(reportId(courseId, u.uid));

  // Auto-populate profileDisplayName from Google name or email prefix so the
  // user is considered "onboarded" immediately after enrolling.
  const autoName = u.displayName || u.email.split("@")[0] || "學生";
  const profileDisplayName = u.profileDisplayName || autoName;

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
      author: profileDisplayName,
      summary: "摘要",
      coverImageUrl: null,
      contentMd: DEFAULT_REPORT_TEMPLATE_MD,
      publishedAt: null,
      hasNewChanges: false,
      createdAt: FieldValue.serverTimestamp() as unknown as Report["createdAt"],
      updatedAt: FieldValue.serverTimestamp() as unknown as Report["updatedAt"],
    });
    if (!u.profileDisplayName) {
      batch.set(
        db.collection("users").doc(u.uid),
        { profileDisplayName: autoName },
        { merge: true },
      );
    }
    await batch.commit();
  } catch {
    return { ok: false, error: "internal" };
  }

  return { ok: true, courseId, alreadyEnrolled: false };
}
