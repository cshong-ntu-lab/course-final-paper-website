// Shared domain types — see tasks/plan.md §4.1 for Firestore schema.

import type { Timestamp } from "firebase-admin/firestore";

export type Role = "student" | "admin";

export type Semester = "1" | "2";

export type ReportStatus = "unpublished" | "published" | "published-new";

export interface User {
  email: string;
  displayNameGoogle: string;
  photoURLGoogle: string | null;
  profileDisplayName: string;
  role: Role;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Course {
  name: string;
  year: number;
  semester: Semester;
  description: string;
  coverImageUrl: string | null;
  code: string;
  enrollmentOpen: boolean;
  ownerUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Enrollment {
  courseId: string;
  uid: string;
  enrolledAt: Timestamp;
}

export interface Report {
  courseId: string;
  uid: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  contentMd: string;
  publishedAt: Timestamp | null;
  hasNewChanges: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublishSnapshot {
  contentMd: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  publishedAt: Timestamp;
  publishedBy: string;
}

// IDs are encoded by their component pieces to enforce 1:1 uniqueness.
export const enrollmentId = (courseId: string, uid: string) => `${courseId}_${uid}`;
export const reportId = (courseId: string, uid: string) => `${courseId}_${uid}`;
