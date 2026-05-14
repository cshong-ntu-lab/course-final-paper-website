// design.md §3.2 — R1 Classical report reader.
// Renders the latest publish snapshot with masthead + MarkdownRenderer.

import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { getCourseBySlug, getLatestSnapshot } from "@/lib/server/firestore";
import { estimateReadingMinutes } from "@/lib/slug";
import { reportId } from "@/lib/types";

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function ReportPage({ params }: Props) {
  const { courseSlug, reportSlug } = await params;

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const uid = reportSlug; // reportSlug === uid (see src/lib/slug.ts)
  const rid = reportId(course.id, uid);
  const snap = await getLatestSnapshot(rid);
  if (!snap) notFound();

  const termLabel = `${course.year} 學年度第 ${course.semester} 學期`;
  const publishedIso = snap.publishedAt.toDate().toISOString();
  const readingMins = estimateReadingMinutes(snap.contentMd);

  return (
    <div className="bg-background min-h-screen">
      {/* Minimal sticky header */}
      <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href={`/c/${courseSlug}`}
            className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回 {course.name}
          </Link>
          <Link href="/" className="font-serif text-sm font-semibold tracking-tight">
            台大社會系
          </Link>
        </div>
      </header>

      <article id="main" className="mx-auto max-w-[680px] px-6 py-14">
        {/* Masthead */}
        <header className="mb-12">
          <div className="text-subtle mb-3 font-mono text-[0.65rem] uppercase tracking-[0.12em]">
            {course.code} · {termLabel} · 期末報告
          </div>
          <h1 className="font-serif text-5xl font-semibold leading-[1.15] tracking-tight text-pretty">
            {snap.title || "（無標題）"}
          </h1>
          <div className="text-muted mt-7 flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-accent/15 text-accent inline-flex h-7 w-7 items-center justify-center rounded-full font-serif text-sm font-semibold">
              {(snap.author || "？")[0]}
            </span>
            <span className="text-foreground font-medium">{snap.author || "（未署名）"}</span>
            <span>·</span>
            <time dateTime={publishedIso}>發布於 {formatDate(publishedIso)}</time>
            <span>·</span>
            <span>{readingMins} 分鐘閱讀</span>
          </div>
          <hr className="border-border mt-7" />
        </header>

        <MarkdownRenderer content={snap.contentMd} />

        <footer className="border-border mt-20 border-t pt-10">
          <Link
            href={`/c/${courseSlug}`}
            className="text-accent hover:text-accent-hover inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回 {course.name} 所有報告
          </Link>
        </footer>
      </article>

      <Footer />
    </div>
  );
}
