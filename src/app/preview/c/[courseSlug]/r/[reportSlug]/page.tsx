// /preview/c/[courseSlug]/r/[reportSlug] — renders the latest draft using the
// same ReaderShell as the public reader, with previewMode=true.

import { notFound } from "next/navigation";

import { ReaderShell } from "@/components/ReaderShell";
import { Footer } from "@/components/Footer";
import { extractToc } from "@/lib/markdown/extractToc";
import { stripAbstractSection } from "@/lib/markdown/stripAbstract";
import { semesterLabel } from "@/lib/semester";
import { getCourseBySlug, getReportDoc, getUsersByUids } from "@/lib/server/firestore";
import { estimateReadingMinutes } from "@/lib/slug";
import { reportId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ courseSlug: string; reportSlug: string }>;
}

export default async function PreviewReportPage({ params }: Props) {
  const { courseSlug, reportSlug } = await params;

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const rid = reportId(course.id, reportSlug);
  const report = await getReportDoc(rid);
  if (!report) notFound();

  const updatedTs = report.updatedAt as unknown as { toDate?: () => Date } | null;
  const updatedIso = updatedTs?.toDate?.().toISOString() ?? new Date().toISOString();

  const readingMins = estimateReadingMinutes(report.contentMd);
  // the abstract shows in its own card; old reports also repeat it as "## 摘要"
  const contentMd = stripAbstractSection(report.contentMd);
  const toc = extractToc(contentMd);

  // Fetch primary author + co-author profiles (public reader reads from enriched snapshot).
  const primaryAuthorUid = report.authorUid ?? report.uid;
  const coAuthorUids = (report.coAuthors ?? []).map((a) => a.uid);
  const allUids = [primaryAuthorUid, ...coAuthorUids].filter(Boolean);
  const profiles = await getUsersByUids(allUids);
  const profileMap = new Map(profiles.map((u) => [u.uid, u]));

  const primaryProfile = profileMap.get(primaryAuthorUid);
  const enrichedCoAuthors = (report.coAuthors ?? []).map((a) => ({
    uid: a.uid,
    name: a.name,
    title: profileMap.get(a.uid)?.title,
    bio: profileMap.get(a.uid)?.bio,
  }));

  return (
    <>
      <ReaderShell
        courseSlug={courseSlug}
        courseName={course.name}
        courseCode={course.courseNo ?? course.code}
        semesterTag={semesterLabel(course.year, course.semester)}
        snap={{
          title: report.title || "（無標題）",
          author: report.author || "（未署名）",
          summary: report.summary,
          coverImageUrl: report.coverImageUrl,
          contentMd,
          publishedAt: updatedIso,
          subtitle: report.subtitle,
          tags: report.tags,
          authorBio: primaryProfile?.bio,
          authorAffiliation: primaryProfile?.title,
          authorAvatarUrl: primaryProfile?.avatarUrl ?? null,
          authorUid: primaryAuthorUid,
          authorDegree: primaryProfile?.degree ?? null,
          authorCohort: primaryProfile?.cohort ?? null,
          coverCaption: report.coverCaption,
          coAuthors: enrichedCoAuthors.length > 0 ? enrichedCoAuthors : undefined,
        }}
        readingMins={readingMins}
        toc={toc}
        prev={null}
        next={null}
        basePath="/preview/c"
        previewMode={true}
        backHref="/preview"
        backLabel="返回首頁"
      />
      <Footer />
    </>
  );
}
