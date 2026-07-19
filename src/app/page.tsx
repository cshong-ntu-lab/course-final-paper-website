// design.md §3.1 — D1 Editorial Index (v4 redesign), a single sitewide feed
// aggregating published reports across all courses. Layout lives in
// SiteHomeShell (shared with /preview) — do not duplicate markup here.

import type { Metadata } from "next";

import {
  getCoursesWithPublishedReports,
  getPublishedReportsByCourse,
  getUsersByUids,
} from "@/lib/server/firestore";
import { courseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";
import { SiteHomeShell } from "@/components/public/SiteHomeShell";

// Fetches from Firestore Admin at request time — must stay dynamic so `next build`
// doesn't try to prerender it (no Firestore credentials/network in the build container).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "台大社會系 人工智慧課程成果",
  description:
    "C.A. Bail, Can Generative AI improve social science?, Proc. Natl. Acad. Sci. U.S.A. 121 (21) e2314021121 (2024).",
};

export default async function RootPage() {
  const courses = await getCoursesWithPublishedReports();

  const reportsByCourse = await Promise.all(
    courses.map((course) => getPublishedReportsByCourse(course.id)),
  );

  const allReports = courses.flatMap((course, i) =>
    reportsByCourse[i]!.map((r) => ({ report: r, course })),
  );
  allReports.sort((a, b) => b.report.publishedAt!.toMillis() - a.report.publishedAt!.toMillis());

  const authorUids = [...new Set(allReports.map(({ report: r }) => r.authorUid ?? r.uid))];
  const authorProfiles = await getUsersByUids(authorUids);
  const profileMap = new Map(authorProfiles.map((u) => [u.uid, u]));

  const reportItems = allReports.map(({ report: r, course }) => ({
    slug: reportSlug(r.uid),
    title: r.title || "（無標題）",
    author: r.author,
    summary: r.summary,
    coverImageUrl: r.coverImageUrl,
    publishedAt: r.publishedAt!.toDate().toISOString(),
    readingMinutes: estimateReadingMinutes(r.contentMd),
    tags: r.tags,
    pullQuote: r.pullQuote,
    subtitle: r.subtitle,
    authorAffiliation: r.authorAffiliation,
    authorAvatarUrl: profileMap.get(r.authorUid ?? r.uid)?.avatarUrl ?? null,
    courseTag: `${course.year}-${course.semester} ${course.name}`,
    courseSlug: courseSlug(course),
  }));

  const courseOptions = courses.map((c) => ({
    slug: courseSlug(c),
    tag: `${c.year}-${c.semester} ${c.name}`,
  }));

  return <SiteHomeShell reportItems={reportItems} courseOptions={courseOptions} />;
}
