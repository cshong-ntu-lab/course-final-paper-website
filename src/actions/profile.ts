"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { userConverter } from "@/lib/firestore/converters";
import { requireUser } from "@/lib/server/auth";
import { renameStudentFolders } from "@/lib/server/drive";
import type { User } from "@/lib/types";

const NAME_MIN = 2;
const NAME_MAX = 30;
const TITLE_MAX = 60;
const BIO_MAX = 400;

export interface UpdateProfilePatch {
  profileDisplayName?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string | null;
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: "invalid_input" | "internal" };

export async function updateProfileAction(patch: UpdateProfilePatch): Promise<UpdateProfileResult> {
  const u = await requireUser();

  const update: Partial<User> = {};

  if (patch.profileDisplayName !== undefined) {
    const name = patch.profileDisplayName.trim();
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return { ok: false, error: "invalid_input" };
    }
    update.profileDisplayName = name;
  }
  if (patch.title !== undefined) {
    if (typeof patch.title !== "string" || patch.title.length > TITLE_MAX) {
      return { ok: false, error: "invalid_input" };
    }
    update.title = patch.title;
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

/** @deprecated Use updateProfileAction instead */
export type SetProfileNameResult =
  | { ok: true }
  | { ok: false; error: "invalid_length" | "internal" };

/** @deprecated Use updateProfileAction instead */
export async function setProfileNameAction(rawName: string): Promise<SetProfileNameResult> {
  const result = await updateProfileAction({ profileDisplayName: rawName });
  if (result.ok) return { ok: true };
  return { ok: false, error: "invalid_length" };
}
