// /preview — mirrors the public homepage (/) via the shared SiteHomeShell, but
// adds the viewer's own drafts (admins see every draft) and links into
// /preview/c/... report pages. Do not duplicate SiteHomeShell's markup here.

import { redirect } from "next/navigation";

import {
  getAllCourses,
  getAllReportsByCourse,
  getUsersByUids,
  type ReportDoc,
} from "@/lib/server/firestore";
import { authorName } from "@/lib/authors";
import { getCurrentUser } from "@/lib/server/auth";
import { canPreviewDraft, isInPreviewFeed } from "@/lib/preview";
import { semesterLabel } from "@/lib/semester";
import { courseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";
import { SiteHomeShell } from "@/components/public/SiteHomeShell";

export const dynamic = "force-dynamic";

function reportBadgeLabel(r: ReportDoc): string | undefined {
  if (!r.publishedAt) return "草稿";
  if (r.hasNewChanges) return "新草稿";
  return undefined;
}

export default async function PreviewHomePage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?from=/preview");
  const courses = await getAllCourses();

  const reportsByCourse = await Promise.all(
    courses.map((course) => getAllReportsByCourse(course.id)),
  );

  const allReports = courses.flatMap((course, i) =>
    reportsByCourse[i]!.filter((r) => isInPreviewFeed(r, viewer)).map((r) => ({
      report: r,
      course,
    })),
  );
  allReports.sort((a, b) => b.report.updatedAt.toMillis() - a.report.updatedAt.toMillis());

  const authorUids = [...new Set(allReports.map(({ report: r }) => r.authorUid ?? r.uid))];
  const authorProfiles = await getUsersByUids(authorUids);
  const profileMap = new Map(authorProfiles.map((u) => [u.uid, u]));

  const reportItems = allReports.map(({ report: r, course }) => ({
    slug: reportSlug(r.uid),
    title: r.title || "（無標題）",
    author: authorName(profileMap.get(r.authorUid ?? r.uid), r.author) || "（未署名）",
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
    badgeLabel: canPreviewDraft(r, viewer) ? reportBadgeLabel(r) : undefined,
  }));

  return (
    <SiteHomeShell
      reportItems={reportItems}
      basePath="/preview/c"
      homeHref="/preview"
      stickyTop="top-8"
    />
  );
}
