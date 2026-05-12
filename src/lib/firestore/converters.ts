// Typed Firestore data converters. Use these on collection refs so reads
// return your domain types directly without manual casting.
//
//   const usersCol = adminDb.collection("users").withConverter(userConverter);
//   const snap = await usersCol.doc(uid).get();   // snap.data() is User | undefined

import "server-only";

import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import type { Course, Enrollment, Report, User } from "@/lib/types";

function makeConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(value: T) {
      return value;
    },
    fromFirestore(snap: QueryDocumentSnapshot) {
      return snap.data() as T;
    },
  };
}

export const userConverter = makeConverter<User>();
export const courseConverter = makeConverter<Course>();
export const enrollmentConverter = makeConverter<Enrollment>();
export const reportConverter = makeConverter<Report>();
