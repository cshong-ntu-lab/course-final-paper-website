// /preview/c/[courseSlug]/r/[reportSlug] — renders the latest draft (not snapshot).

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { getCourseBySlug, getReportDoc } from "@/lib/server/firestore";
import { estimateReadingMinutes } from "@/lib/slug";
import { reportId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ courseSlug: string; reportSlug: string }>;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function PreviewReportPage({ params }: Props) {
  const { courseSlug, reportSlug } = await params;

  const course = await getCourseBySlug(courseSlug);
  if (!course) notFound();

  const rid = reportId(course.id, reportSlug);
  const report = await getReportDoc(rid);
  if (!report) notFound();

  const termLabel = `${course.year} 學年度第 ${course.semester} 學期`;
  const readingMins = estimateReadingMinutes(report.contentMd);
  const updatedTs = report.updatedAt as unknown as { toDate?: () => Date } | null;
  const updatedIso = updatedTs?.toDate?.().toISOString() ?? "";

  return (
    <div>
      {/* Sticky header — top-8 accounts for the PreviewBanner height */}
      <header className="border-border bg-background/95 sticky top-8 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href={`/preview/c/${courseSlug}`}
            className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回課程
          </Link>
          <span className="rounded border border-warning/40 bg-warning-soft px-2 py-0.5 font-mono text-2xs text-warning-fg">
            草稿
          </span>
        </div>
      </header>

      <article id="main" className="mx-auto max-w-[680px] px-6 py-14">
        <header className="mb-12">
          <div className="text-subtle mb-3 font-mono text-[0.65rem] uppercase tracking-[0.12em]">
            {course.code} · {termLabel} · 草稿預覽
          </div>
          <h1 className="font-serif text-5xl font-semibold leading-[1.15] tracking-tight text-pretty">
            {report.title || "（未命名）"}
          </h1>
          <div className="text-muted mt-7 flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-accent/15 text-accent inline-flex h-7 w-7 items-center justify-center rounded-full font-serif text-sm font-semibold">
              {(report.author || "？")[0]}
            </span>
            <span className="text-foreground font-medium">{report.author || "（未署名）"}</span>
            {updatedIso && (
              <>
                <span>·</span>
                <time dateTime={updatedIso}>更新於 {formatDate(updatedIso)}</time>
              </>
            )}
            <span>·</span>
            <span>{readingMins} 分鐘閱讀</span>
          </div>
          <hr className="border-border mt-7" />
        </header>

        <MarkdownRenderer content={report.contentMd} />

        <footer className="border-border mt-20 border-t pt-10">
          <Link
            href={`/preview/c/${courseSlug}`}
            className="text-accent hover:text-accent-hover inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回 {course.name} 所有報告
          </Link>
        </footer>
      </article>
    </div>
  );
}
