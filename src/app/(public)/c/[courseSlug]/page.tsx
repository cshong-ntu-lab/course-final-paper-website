// design.md §3.1 — D1 Editorial Index.
// Public course page: sticky site header, course tab nav, course description,
// published reports list.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import {
  getAllCourses,
  getCourseBySlug,
  getPublishedReportsByCourse,
} from "@/lib/server/firestore";
import { courseSlug as toCourseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";
import { ReportListItem } from "@/components/public/ReportListItem";

export const revalidate = 60;

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);
  if (!course) return {};
  return {
    title: course.name,
    description: course.description.slice(0, 160),
  };
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug: slug } = await params;

  const [course, allCourses] = await Promise.all([getCourseBySlug(slug), getAllCourses()]);

  if (!course) notFound();

  const reports = await getPublishedReportsByCourse(course.id);

  const termLabel = `${course.year} 學年度第 ${course.semester} 學期`;

  const reportItems = reports.map((r) => ({
    slug: reportSlug(r.uid),
    title: r.title || "（無標題）",
    author: r.author,
    summary: r.summary,
    coverImageUrl: r.coverImageUrl,
    publishedAt: r.publishedAt!.toDate().toISOString(),
    readingMinutes: estimateReadingMinutes(r.contentMd),
  }));

  return (
    <div className="bg-background min-h-screen">
      {/* Site header */}
      <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">研究筆記</span>
            <span className="text-subtle font-mono text-[0.65rem] tracking-[0.06em]">NTU SOC</span>
          </Link>
          <Link
            href="/login"
            className="text-muted hover:text-foreground text-sm transition-colors"
          >
            登入
          </Link>
        </div>
      </header>

      {/* Course tab nav */}
      <nav aria-label="課程" className="border-border border-b bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <ul className="scrollbar-thin -mb-px flex gap-7 overflow-x-auto">
            {allCourses.map((c) => {
              const cSlug = toCourseSlug(c);
              const active = cSlug === slug;
              return (
                <li key={c.id}>
                  <Link
                    href={`/c/${cSlug}`}
                    className={[
                      "block whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors",
                      active
                        ? "border-accent text-foreground"
                        : "border-transparent text-muted hover:text-foreground hover:border-border-strong",
                    ].join(" ")}
                  >
                    <span className="text-subtle mr-1.5 font-mono text-[0.65rem] tracking-[0.06em]">
                      {c.code}
                    </span>
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <main id="main" className="mx-auto max-w-5xl px-6 py-10">
        {/* Course header */}
        <section className="mb-10">
          <div className="text-subtle mb-2 font-mono text-[0.65rem] uppercase tracking-[0.12em]">
            {course.code} · {termLabel}
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">{course.name}</h1>
          {course.description && (
            <div className="prose prose-sm prose-research mt-5 max-w-prose text-pretty">
              <MarkdownRenderer content={course.description} />
            </div>
          )}
        </section>

        {/* Reports list */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-semibold">已發布報告</h2>
            <span className="text-subtle text-xs">{reportItems.length} 篇</span>
          </div>
          {reportItems.length === 0 ? (
            <p className="text-muted py-12 text-center text-sm italic">本課程尚無已發布報告。</p>
          ) : (
            <div className="grid gap-3">
              {reportItems.map((r) => (
                <ReportListItem key={r.slug} report={r} courseSlug={slug} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-border mt-20 border-t py-10 text-center text-xs">
        <span className="text-subtle">© {new Date().getFullYear()} NTU Sociology · </span>
        <Link href="/privacy" className="text-subtle hover:underline">
          隱私
        </Link>
        <span className="text-subtle"> · </span>
        <Link href="/tos" className="text-subtle hover:underline">
          條款
        </Link>
      </footer>
    </div>
  );
}
