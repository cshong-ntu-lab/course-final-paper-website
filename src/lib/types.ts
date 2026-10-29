// Shared domain types — see tasks/plan.md §4.1 for Firestore schema.

import type { Timestamp } from "firebase-admin/firestore";

export type Role = "student" | "admin";

export type Semester = "1" | "2";

/** Degree programme; the department itself is free text (`User.department`). */
export type Degree = "學士班" | "碩士班" | "碩士在職專班" | "博士班";

export type ReportStatus =
  | "unpublished"
  | "unpublished-review"
  | "published"
  | "published-new"
  | "published-new-review"
  | "admin-withdrawn"
  | "admin-withdrawn-new"
  | "admin-withdrawn-new-review";

export interface User {
  email: string;
  displayNameGoogle: string;
  photoURLGoogle: string | null;
  profileDisplayName: string;
  role: Role;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Extended profile fields (v4)
  /** @deprecated 稱謂 is no longer edited; older docs may still carry it. */
  title?: string;
  bio?: string;
  avatarUrl?: string | null;
  // shown as "社會學系碩士班 · 112級" (authorLine)
  department?: string; // 系所, free text
  degree?: Degree;
  cohort?: number; // entering class (ROC year), e.g. 112
  editorTourSeen?: boolean; // the editor walkthrough opens until this is set
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

export interface CoAuthor {
  uid: string;
  name: string;
}

export interface CoAuthorSnapshot {
  uid: string;
  name: string;
  title?: string;
  bio?: string;
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
  publishedContentMd?: string;
  adminWithdrawn?: boolean;
  reviewRequested?: boolean;
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
  coAuthors?: CoAuthor[];
  authorUid?: string; // UID of the selected primary author (for profile lookup at publish)
  viewCount?: number; // public reader opens, one per browser session (/api/reports/view)
}

export interface PublishSnapshot {
  type?: "publish" | "withdraw";
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
  coAuthors?: CoAuthorSnapshot[];
}

// IDs are encoded by their component pieces to enforce 1:1 uniqueness.
export const enrollmentId = (courseId: string, uid: string) => `${courseId}_${uid}`;
export const reportId = (courseId: string, uid: string) => `${courseId}_${uid}`;
