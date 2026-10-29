"use server";

import { FieldValue } from "firebase-admin/firestore";

import { DEPARTMENT_MAX, isCohort, isDegree } from "@/lib/authors";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { userConverter } from "@/lib/firestore/converters";
import { requireUser } from "@/lib/server/auth";
import { renameStudentFolders } from "@/lib/server/drive";
import type { Degree, User } from "@/lib/types";

const NAME_MIN = 2;
const NAME_MAX = 30;
const BIO_MAX = 400;

export interface UpdateProfilePatch {
  profileDisplayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  /** "" clears the field */
  department?: string;
  /** null clears the field */
  degree?: Degree | null;
  /** null clears the field */
  cohort?: number | null;
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: "invalid_input" | "internal" };

export async function updateProfileAction(patch: UpdateProfilePatch): Promise<UpdateProfileResult> {
  const u = await requireUser();

  const update: Partial<Omit<User, "department" | "degree" | "cohort">> & {
    department?: string | FieldValue;
    degree?: Degree | FieldValue;
    cohort?: number | FieldValue;
  } = {};

  if (patch.profileDisplayName !== undefined) {
    const name = patch.profileDisplayName.trim();
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return { ok: false, error: "invalid_input" };
    }
    update.profileDisplayName = name;
  }
  if (patch.bio !== undefined) {
    if (typeof patch.bio !== "string" || patch.bio.length > BIO_MAX) {
      return { ok: false, error: "invalid_input" };
    }
    update.bio = patch.bio;
  }
  if (patch.avatarUrl !== undefined) {
    if (patch.avatarUrl !== null && typeof patch.avatarUrl !== "string") {
      return { ok: false, error: "invalid_input" };
    }
    update.avatarUrl = patch.avatarUrl;
  }
  if (patch.department !== undefined) {
    if (typeof patch.department !== "string") return { ok: false, error: "invalid_input" };
    const department = patch.department.trim();
    if (department.length > DEPARTMENT_MAX) return { ok: false, error: "invalid_input" };
    update.department = department || FieldValue.delete();
  }
  if (patch.degree !== undefined) {
    if (patch.degree !== null && !isDegree(patch.degree)) {
      return { ok: false, error: "invalid_input" };
    }
    update.degree = patch.degree ?? FieldValue.delete();
  }
  if (patch.cohort !== undefined) {
    if (patch.cohort !== null && !isCohort(patch.cohort)) {
      return { ok: false, error: "invalid_input" };
    }
    update.cohort = patch.cohort ?? FieldValue.delete();
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { db } = getFirebaseAdmin();
  const usersCol = db.collection("users").withConverter(userConverter);
  try {
    await usersCol.doc(u.uid).set(
      {
        ...update,
        updatedAt: FieldValue.serverTimestamp(),
      } as Partial<User> as User,
      { merge: true },
    );
    if (update.profileDisplayName !== undefined) {
      void renameStudentFolders(u.uid, u.email, update.profileDisplayName).catch((err) =>
        console.error("[drive-sync] renameStudentFolders failed", { uid: u.uid, err }),
      );
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}

/** Records that the user finished or skipped the editor walkthrough, so it
 *  doesn't open again on their next visit (or on another device). */
export async function markEditorTourSeenAction(): Promise<{ ok: boolean }> {
  const u = await requireUser();
  const { db } = getFirebaseAdmin();
  try {
    await db
      .collection("users")
      .doc(u.uid)
      .set({ editorTourSeen: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** @deprecated Use updateProfileAction instead */
export type SetProfileNameResult =
  { ok: true } | { ok: false; error: "invalid_length" | "internal" };

/** @deprecated Use updateProfileAction instead */
export async function setProfileNameAction(rawName: string): Promise<SetProfileNameResult> {
  const result = await updateProfileAction({ profileDisplayName: rawName });
  if (result.ok) return { ok: true };
  return { ok: false, error: "invalid_length" };
}
