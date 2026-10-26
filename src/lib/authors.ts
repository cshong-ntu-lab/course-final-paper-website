// Author identity and author-page helpers — docs/design-v2.md §2.2, §3.1, §4.3.

import type { Degree } from "@/lib/types";

export const DEGREES: readonly Degree[] = ["學士班", "碩士班", "博士班"];

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

/** "社會系碩士班 · 112級"; unknown parts are dropped, down to just "社會系". */
export function authorLine(degree?: Degree | null, cohort?: number | null): string {
  const programme = `社會系${degree ?? ""}`;
  return cohort ? `${programme} · ${cohort}級` : programme;
}

interface AuthoredReport {
  uid: string;
  authorUid?: string;
  coAuthors?: { uid: string }[];
  tags?: string[];
  courseId: string;
}

/** The primary author is `authorUid` (falls back to the report owner); co-authors count too. */
export function isReportByAuthor(report: AuthoredReport, uid: string): boolean {
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
