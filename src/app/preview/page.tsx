// /preview — mirrors the public homepage (/) via the shared SiteHomeShell, but
// aggregates ALL reports (draft + published) across all courses and links into
// /preview/c/... report pages. Do not duplicate SiteHomeShell's markup here.

import Link from "next/link";

import {
  getAllCourses,
  getAllReportsByCourse,
  getUsersByUids,
  type ReportDoc,
} from "@/lib/server/firestore";
import { semesterLabel } from "@/lib/semester";
import { parseFeedSelection } from "@/lib/feed";
import { courseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";
import { SiteHomeShell } from "@/components/public/SiteHomeShell";

export const dynamic = "force-dynamic";

function reportBadgeLabel(r: ReportDoc): string | undefined {
  if (!r.publishedAt) return "草稿";
  if (r.hasNewChanges) return "新草稿";
  return undefined;
}

export default async function PreviewHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialSelection = parseFeedSelection(await searchParams);
  const courses = await getAllCourses();

  const reportsByCourse = await Promise.all(
    courses.map((course) => getAllReportsByCourse(course.id)),
  );

  const allReports = courses.flatMap((course, i) =>
    reportsByCourse[i]!.map((r) => ({ report: r, course })),
  );
  allReports.sort((a, b) => b.report.updatedAt.toMillis() - a.report.updatedAt.toMillis());

  const authorUids = [...new Set(allReports.map(({ report: r }) => r.authorUid ?? r.uid))];
  const authorProfiles = await getUsersByUids(authorUids);
  const profileMap = new Map(authorProfiles.map((u) => [u.uid, u]));

  const reportItems = allReports.map(({ report: r, course }) => ({
    slug: reportSlug(r.uid),
    title: r.title || "（無標題）",
    author: r.author || "（未署名）",
    summary: r.summary,
    coverImageUrl: r.coverImageUrl,
    publishedAt: (r.publishedAt ?? r.updatedAt).toDate().toISOString(),
    readingMinutes: estimateReadingMinutes(r.contentMd),
    tags: r.tags,
    pullQuote: r.pullQuote,
    subtitle: r.subtitle,
    authorAffiliation: r.authorAffiliation,
    authorAvatarUrl: profileMap.get(r.authorUid ?? r.uid)?.avatarUrl ?? null,
    authorUid: r.authorUid ?? r.uid,
    authorCohort: profileMap.get(r.authorUid ?? r.uid)?.cohort ?? null,
    courseName: course.name,
    semesterTag: semesterLabel(course.year, course.semester),
    courseSlug: courseSlug(course),
    badgeLabel: reportBadgeLabel(r),
  }));

  return (
    <SiteHomeShell
      reportItems={reportItems}
      initialSelection={initialSelection}
      basePath="/preview/c"
      homeHref="/preview"
      stickyTop="top-8"
      headerExtra={
        <Link
          href="/workspace"
          className="border-border text-muted hover:border-accent hover:text-accent rounded border px-3 py-1.5 font-mono text-[11px] transition-colors"
        >
          ← 工作區
        </Link>
      }
    />
  );
}
