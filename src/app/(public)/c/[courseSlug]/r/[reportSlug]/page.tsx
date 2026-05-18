// design.md §3.2 — R1 Classical report reader (v4 redesign).
// RSC shell for data fetching + SEO; interactive parts in ReaderShell (client).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { extractToc } from "@/lib/markdown/extractToc";
import {
  getCourseBySlug,
  getAdjacentPublishedReports,
  getLatestSnapshot,
} from "@/lib/server/firestore";
import { estimateReadingMinutes } from "@/lib/slug";
import { reportId } from "@/lib/types";
import { ReaderShell } from "@/components/ReaderShell";

export const revalidate = 60;

interface Props {
  params: Promise<{ courseSlug: string; reportSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug, reportSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  if (!course) return {};
  const rid = reportId(course.id, reportSlug);
  const snap = await getLatestSnapshot(rid);
  if (!snap) return {};
  return {
    title: snap.title || "期末報告",
    description: snap.summary?.slice(0, 160) || undefined,
    openGraph: {
      title: snap.title,
      description: snap.summary?.slice(0, 160) || undefined,
      images: snap.coverImageUrl ? [{ url: snap.coverImageUrl }] : [],
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { courseSlug, reportSlug } = await params;

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const uid = reportSlug;
  const rid = reportId(course.id, uid);
  const snap = await getLatestSnapshot(rid);
  if (!snap) notFound();

  const publishedMs = snap.publishedAt.toDate().getTime();
  const readingMins = estimateReadingMinutes(snap.contentMd);
  const toc = extractToc(snap.contentMd);

  const adjacent = await getAdjacentPublishedReports(course.id, publishedMs);

  return (
    <>
      <ReaderShell
        courseSlug={courseSlug}
        courseName={course.name}
        courseCode={course.courseNo ?? course.code}
        snap={{
          title: snap.title || "（無標題）",
          author: snap.author || "（未署名）",
          summary: snap.summary,
          coverImageUrl: snap.coverImageUrl,
          contentMd: snap.contentMd,
          publishedAt: snap.publishedAt.toDate().toISOString(),
          subtitle: snap.subtitle,
          tags: snap.tags,
          authorBio: snap.authorBio,
          authorAffiliation: snap.authorAffiliation,
          coverCaption: snap.coverCaption,
        }}
        readingMins={readingMins}
        toc={toc}
        prev={adjacent.prev}
        next={adjacent.next}
      />
      <Footer />
    </>
  );
}
