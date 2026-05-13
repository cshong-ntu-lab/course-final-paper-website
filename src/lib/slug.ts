// URL slug helpers. See tasks/plan.md §5 for the routing convention.

import type { Course } from "@/lib/types";

/** Converts a string to a URL-safe slug.
 *  Keeps Unicode letters/digits; replaces spaces and other chars with "-".
 *  Chinese/CJK characters are preserved (browsers percent-encode them but
 *  they display correctly in the address bar). */
function slugify(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** `113-2-質性研究方法` — year + semester + slugified name. */
export function courseSlug(course: Pick<Course, "year" | "semester" | "name">): string {
  return `${course.year}-${course.semester}-${slugify(course.name)}`;
}

/** The report slug is the author's Firebase UID — already URL-safe and
 *  globally unique within a course. Given courseId + uid we can reconstruct
 *  the Firestore reportId (`${courseId}_${uid}`). */
export function reportSlug(uid: string): string {
  return uid;
}

/** Estimates reading time in minutes for mixed Chinese/Latin text.
 *  Uses ~300 CJK characters / min + ~200 Latin words / min. */
export function estimateReadingMinutes(text: string): number {
  const cjk = (text.match(/[　-鿿豈-﫿]/g) ?? []).length;
  const latin = (text.match(/\b[a-zA-Z]+\b/g) ?? []).length;
  const minutes = cjk / 300 + latin / 200;
  return Math.max(1, Math.round(minutes));
}
