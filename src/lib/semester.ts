// Semester labels and citation years — docs/design-v2.md §2.4.
// Course.year is the NTU academic year (學年度, ROC calendar). Semester 1 runs
// August–January (starts in year + 1911); semester 2 runs February–July of the
// following calendar year.

import type { Semester } from "@/lib/types";

/** `114-1` — the semester tag shown on cards and in the article meta. */
export function semesterLabel(year: number, semester: Semester): string {
  return `${year}-${semester}`;
}

/** Calendar year used in citations: 114-1 → 2025, 114-2 → 2026. */
export function semesterCitationYear(year: number, semester: Semester): number {
  return year + 1911 + (semester === "2" ? 1 : 0);
}
