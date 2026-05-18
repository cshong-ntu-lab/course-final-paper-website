// /preview/c/[courseSlug]/r/[reportSlug] — renders the latest draft using the
// same ReaderShell as the public reader, with previewMode=true.

import { notFound } from "next/navigation";

import { ReaderShell } from "@/components/ReaderShell";
import { Footer } from "@/components/Footer";
import { extractToc } from "@/lib/markdown/extractToc";
import { getCourseBySlug, getReportDoc } from "@/lib/server/firestore";
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
  const toc = extractToc(report.contentMd);

  return (
    <>
      <ReaderShell
        courseSlug={courseSlug}
        courseName={course.name}
        courseCode={course.courseNo ?? course.code}
        snap={{
          title: report.title || "（無標題）",
          author: report.author || "（未署名）",
          summary: report.summary,
          coverImageUrl: report.coverImageUrl,
          contentMd: report.contentMd,
          publishedAt: updatedIso,
          subtitle: report.subtitle,
          tags: report.tags,
          authorBio: report.authorBio,
          authorAffiliation: report.authorAffiliation,
          coverCaption: report.coverCaption,
        }}
        readingMins={readingMins}
        toc={toc}
        prev={null}
        next={null}
        basePath="/preview/c"
        previewMode={true}
      />
      <Footer />
    </>
  );
}
