"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { userConverter } from "@/lib/firestore/converters";
import { requireUser } from "@/lib/server/auth";
import { renameStudentFolders } from "@/lib/server/drive";
import type { User } from "@/lib/types";

const NAME_MIN = 2;
const NAME_MAX = 30;

export type SetProfileNameResult =
  | { ok: true }
  | { ok: false; error: "invalid_length" | "internal" };

export async function setProfileNameAction(rawName: string): Promise<SetProfileNameResult> {
  const u = await requireUser();
  const name = rawName.trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { ok: false, error: "invalid_length" };
  }

  const { db } = getFirebaseAdmin();
  const usersCol = db.collection("users").withConverter(userConverter);
  try {
    await usersCol.doc(u.uid).set(
      {
        profileDisplayName: name,
        updatedAt: FieldValue.serverTimestamp(),
      } as Partial<User> as User,
      { merge: true },
    );
    void renameStudentFolders(u.uid, u.email, name).catch((err) =>
      console.error("[drive-sync] renameStudentFolders failed", { uid: u.uid, err }),
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "internal" };
  }
}
