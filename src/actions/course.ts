"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter } from "@/lib/firestore/converters";
import { generateCourseCode } from "@/lib/courseCode";
import { requireAdmin } from "@/lib/server/auth";
import { renameCourseFolder } from "@/lib/server/drive";
import { deleteStorageObject, deleteStoragePrefix } from "@/lib/server/storage";
import type { Course, Semester } from "@/lib/types";

const NAME_MAX = 120;
const DESC_MAX = 10_000;
const COURSE_NO_MAX = 30;
const TEACHER_MAX = 60;
const TERM_RANGE_MAX = 60;
const MAX_CODE_RETRIES = 5;

export interface CreateCourseInput {
  name: string;
  year: number;
  semester: Semester;
  description: string;
  coverImageUrl: string | null;
  // v4 extended fields
  courseNo?: string;
  teacher?: string;
  termRange?: string;
}

export type CreateCourseResult =
  | { ok: true; courseId: string; code: string }
  | { ok: false; error: "invalid_input" | "code_conflict" | "internal" };

export type UpdateCourseResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "invalid_input" | "internal" };

export type ToggleEnrollmentResult =
  | { ok: true; open: boolean }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export type RegenerateCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: "not_found" | "forbidden" | "code_conflict" | "internal" };

export type DeleteCourseResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

export type DeleteStudentResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "forbidden" | "internal" };

function validateCourseInput(input: Partial<CreateCourseInput>): string | null {
  if (input.name !== undefined) {
    const n = input.name.trim();
    if (n.length === 0 || n.length > NAME_MAX) return "invalid_input";
  }
  if (input.year !== undefined) {
    if (!Number.isInteger(input.year) || input.year < 100 || input.year > 200)
      return "invalid_input";
  }
  if (input.semester !== undefined) {
    if (input.semester !== "1" && input.semester !== "2") return "invalid_input";
  }
  if (input.description !== undefined) {
    if (typeof input.description !== "string" || input.description.length > DESC_MAX)
      return "invalid_input";
  }
  if (input.courseNo !== undefined) {
    if (typeof input.courseNo !== "string" || input.courseNo.length > COURSE_NO_MAX)
      return "invalid_input";
  }
  if (input.teacher !== undefined) {
    if (typeof input.teacher !== "string" || input.teacher.length > TEACHER_MAX)
      return "invalid_input";
  }
  if (input.termRange !== undefined) {
    if (typeof input.termRange !== "string" || input.termRange.length > TERM_RANGE_MAX)
      return "invalid_input";
  }
  return null;
}

/** Generate a code that is not already used. Retries up to MAX_CODE_RETRIES times. */
async function allocateUniqueCode(
  db: FirebaseFirestore.Firestore,
  excludeDocId?: string,
): Promise<string | null> {
  const coursesCol = db.collection("courses").withConverter(courseConverter);
  for (let i = 0; i < MAX_CODE_RETRIES; i++) {
    const code = generateCourseCode();
    const existing = await coursesCol.where("code", "==", code).limit(1).get();
    // If the only match is the course we're regenerating for, treat as free.
    const conflict = existing.docs.some((d) => d.id !== excludeDocId);
    if (!conflict) return code;
  }
  return null;
}

export async function createCourseAction(input: CreateCourseInput): Promise<CreateCourseResult> {
  const admin = await requireAdmin();
  const validationError = validateCourseInput(input);
  if (validationError) return { ok: false, error: "invalid_input" };

  const { db } = getFirebaseAdmin();
  const code = await allocateUniqueCode(db);
  if (!code) return { ok: false, error: "code_conflict" };

  try {
    const ref = db.collection("courses").withConverter(courseConverter).doc();
    const now = FieldValue.serverTimestamp() as unknown as Course["createdAt"];
    await ref.set({
      name: input.name.trim(),
      year: input.year,
      semester: input.semester,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      code,
      enrollmentOpen: true,
      ownerUid: admin.uid,
      createdAt: now,
      updatedAt: now,
      ...(input.courseNo !== undefined && { courseNo: input.courseNo }),
      ...(input.teacher !== undefined && { teacher: input.teacher }),
      ...(input.termRange !== undefined && { termRange: input.termRange }),
    });
    return { ok: true, courseId: ref.id, code };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function updateCourseAction(
  courseId: string,
  patch: Partial<
    Pick<
      Course,
      | "name"
      | "year"
      | "semester"
      | "description"
      | "coverImageUrl"
      | "courseNo"
      | "teacher"
      | "termRange"
    >
  >,
): Promise<UpdateCourseResult> {
  const admin = await requireAdmin();
  const validationError = validateCourseInput(patch);
  if (validationError) return { ok: false, error: "invalid_input" };

  const { db } = getFirebaseAdmin();
  const ref = db.collection("courses").withConverter(courseConverter).doc(courseId);

  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    if (snap.data()!.ownerUid !== admin.uid) return { ok: false, error: "forbidden" };

    const update: Partial<Course> = {
      ...patch,
      updatedAt: FieldValue.serverTimestamp() as unknown as Course["updatedAt"],
    };
    if (patch.name !== undefined) update.name = patch.name.trim();
    await ref.set(update as Course, { merge: true });
    if (patch.name !== undefined || patch.year !== undefined || patch.semester !== undefined) {
      void renameCourseFolder(courseId).catch((err) =>
        console.error("[drive-sync] renameCourseFolder failed", { courseId, err }),
      );
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function toggleEnrollmentAction(
  courseId: string,
  open: boolean,
): Promise<ToggleEnrollmentResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const ref = db.collection("courses").withConverter(courseConverter).doc(courseId);

  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    if (snap.data()!.ownerUid !== admin.uid) return { ok: false, error: "forbidden" };

    await ref.set(
      {
        enrollmentOpen: open,
        updatedAt: FieldValue.serverTimestamp() as unknown as Course["updatedAt"],
      } as Course,
      { merge: true },
    );
    return { ok: true, open };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function regenerateCourseCodeAction(courseId: string): Promise<RegenerateCodeResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const ref = db.collection("courses").withConverter(courseConverter).doc(courseId);

  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    if (snap.data()!.ownerUid !== admin.uid) return { ok: false, error: "forbidden" };

    const code = await allocateUniqueCode(db, courseId);
    if (!code) return { ok: false, error: "code_conflict" };

    await ref.set(
      {
        code,
        updatedAt: FieldValue.serverTimestamp() as unknown as Course["updatedAt"],
      } as Course,
      { merge: true },
    );
    return { ok: true, code };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function deleteCourseAction(courseId: string): Promise<DeleteCourseResult> {
  const admin = await requireAdmin();
  const { db } = getFirebaseAdmin();
  const ref = db.collection("courses").withConverter(courseConverter).doc(courseId);

  try {
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    if (snap.data()!.ownerUid !== admin.uid) return { ok: false, error: "forbidden" };

    // Delete all reports (+ subcollections: publishSnapshots, uploads docs) for this course.
    const reportsSnap = await db.collection("reports").where("courseId", "==", courseId).get();
    await Promise.all(reportsSnap.docs.map((d) => db.recursiveDelete(d.ref)));

    // Delete all enrollment docs for this course.
    const enrollmentsSnap = await db
      .collection("enrollments")
      .where("courseId", "==", courseId)
      .get();
    const batch = db.batch();
    enrollmentsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // Delete Storage: all student uploads and the course cover image.
    await Promise.all([
      deleteStoragePrefix(`reports/${courseId}/`),
      deleteStorageObject(`covers/courses/${courseId}`),
    ]);

    await ref.delete();
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}

export async function deleteStudentFromCourseAction(
  courseId: string,
  uid: string,
): Promise<DeleteStudentResult> {
  await requireAdmin();
  const { db } = getFirebaseAdmin();

  try {
    const reportSnap = await db
      .collection("reports")
      .where("courseId", "==", courseId)
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (!reportSnap.empty) {
      const doc = reportSnap.docs[0]!;
      await Promise.all([
        // Delete Storage: student's uploaded images and report cover.
        deleteStoragePrefix(`reports/${courseId}/${uid}/`),
        deleteStorageObject(`covers/reports/${doc.id}`),
        // Delete report doc + publishSnapshots + uploads subcollections.
        db.recursiveDelete(doc.ref),
      ]);
    }

    // Delete enrollment (ID is deterministic: courseId_uid).
    await db.collection("enrollments").doc(`${courseId}_${uid}`).delete();

    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}
