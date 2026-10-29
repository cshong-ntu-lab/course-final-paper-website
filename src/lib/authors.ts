// Author identity and author-page helpers — docs/design-v2.md §2.2, §3.1, §4.3.

import type { Degree } from "@/lib/types";

export const DEGREES: readonly Degree[] = ["學士班", "碩士班", "碩士在職專班", "博士班"];

export function isDegree(value: unknown): value is Degree {
  return typeof value === "string" && (DEGREES as readonly string[]).includes(value);
}

/** Entering class, as an ROC year. Generous bounds — only rejects typos. */
export const COHORT_MIN = 60;
export const COHORT_MAX = 200;

export function isCohort(value: unknown): value is number {
  return (
    Number.isInteger(value) && (value as number) >= COHORT_MIN && (value as number) <= COHORT_MAX
  );
}

/** 系所 is free text — students come from any department. */
export const DEPARTMENT_MAX = 30;

/** "社會學系碩士班 · 112級"; unknown parts are dropped, down to "" when nothing is filled in. */
export function authorLine(
  department?: string | null,
  degree?: Degree | null,
  cohort?: number | null,
): string {
  const programme = `${department?.trim() ?? ""}${degree ?? ""}`;
  return [programme, cohort ? `${cohort}級` : ""].filter(Boolean).join(" · ");
}

/** authorLine for a stored profile. */
export function authorLineOf(
  profile: { department?: string; degree?: Degree; cohort?: number } | undefined,
): string {
  return profile ? authorLine(profile.department, profile.degree, profile.cohort) : "";
}

/**
 * The name to print for an author: their current profile name, so a rename in
 * 個人設定 shows everywhere at once. The name copied onto the report when it was
 * created (or when the author was picked in the editor) is only the fallback.
 */
export function authorName(
  profile: { profileDisplayName?: string } | undefined,
  stored: string,
): string {
  return profile?.profileDisplayName?.trim() || stored;
}

interface AuthoredReport {
  uid: string;
  authorUid?: string;
  coAuthors?: { uid: string }[];
  tags?: string[];
  courseId: string;
}

/** The primary author is `authorUid` (falls back to the report owner); co-authors count too. */
export function isReportByAuthor(
  report: Pick<AuthoredReport, "uid" | "authorUid" | "coAuthors">,
  uid: string,
): boolean {
  return (
    (report.authorUid ?? report.uid) === uid || (report.coAuthors ?? []).some((c) => c.uid === uid)
  );
}

/** Author-page counts: works, distinct topic keywords, distinct courses. */
export function authorStats(reports: AuthoredReport[]): {
  works: number;
  topics: string[];
  courses: number;
} {
  const topics = [...new Set(reports.flatMap((r) => r.tags ?? []))];
  return { works: reports.length, topics, courses: new Set(reports.map((r) => r.courseId)).size };
}
