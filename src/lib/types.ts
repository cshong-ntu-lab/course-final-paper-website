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
  // Extended profile fields (v4)
  title?: string;
  bio?: string;
  avatarUrl?: string | null;
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
  driveFolderId?: string;
  // Extended course fields (v4)
  courseNo?: string; // official university course number, shown publicly
  teacher?: string; // 授課教師
  termRange?: string; // 學期時間 display string e.g. "2026/02–2026/06"
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
  driveFolderId?: string;
  // Extended report fields (v4)
  subtitle?: string;
  tags?: string[];
  pullQuote?: string;
  authorBio?: string;
  authorAffiliation?: string;
  coverCaption?: string;
}

export interface PublishSnapshot {
  contentMd: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  publishedAt: Timestamp;
  publishedBy: string;
  // Extended snapshot fields — mirror Report v4 fields
  subtitle?: string;
  tags?: string[];
  pullQuote?: string;
  authorBio?: string;
  authorAffiliation?: string;
  coverCaption?: string;
}

// IDs are encoded by their component pieces to enforce 1:1 uniqueness.
export const enrollmentId = (courseId: string, uid: string) => `${courseId}_${uid}`;
export const reportId = (courseId: string, uid: string) => `${courseId}_${uid}`;
