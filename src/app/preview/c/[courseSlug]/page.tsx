// /preview/c/[courseSlug] — same layout as the public course page but lists ALL reports
// (draft + published) and links into /preview/c/.../r/... for draft rendering.

import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { getAllCourses, getAllReportsByCourse, getCourseBySlug } from "@/lib/server/firestore";
import type { ReportDoc } from "@/lib/server/firestore";
import { courseSlug as toCourseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";
import { StatusTag } from "@/components/ui/StatusTag";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

function reportStatus(r: ReportDoc) {
  if (!r.publishedAt) return "unpublished" as const;
  if (r.hasNewChanges) return "published-new" as const;
  return "published" as const;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function PreviewCoursePage({ params }: Props) {
  const { courseSlug: slug } = await params;

  const [course, allCourses] = await Promise.all([getCourseBySlug(slug), getAllCourses()]);
  if (!course) notFound();

  const reports = await getAllReportsByCourse(course.id);
  const termLabel = `${course.year} 學年度第 ${course.semester} 學期`;

  return (
    <div className="bg-background min-h-screen">
      {/* Site header — top-8 accounts for the PreviewBanner height */}
      <header className="border-border bg-background/95 sticky top-8 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">台大社會系</span>
            <span className="text-subtle font-mono text-[0.65rem] tracking-[0.06em]">NTU SOC</span>
          </Link>
          <span className="rounded border border-warning/40 bg-warning-soft px-2 py-0.5 font-mono text-2xs text-warning-fg">
            預覽模式
          </span>
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
                    href={`/preview/c/${cSlug}`}
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
            <h2 className="font-serif text-2xl font-semibold">所有報告（含草稿）</h2>
            <span className="text-subtle text-xs">{reports.length} 篇</span>
          </div>
          {reports.length === 0 ? (
            <p className="text-muted py-12 text-center text-sm italic">本課程尚無報告。</p>
          ) : (
            <div className="grid gap-3">
              {reports.map((r) => {
                const rSlug = reportSlug(r.uid);
                const updatedTs = r.updatedAt as unknown as { toDate?: () => Date } | null;
                const updatedIso = updatedTs?.toDate?.().toISOString() ?? "";
                return (
                  <Link
                    key={r.id}
                    href={`/preview/c/${slug}/r/${rSlug}`}
                    className="group block rounded-md border border-border bg-surface p-4 transition-colors hover:border-border-strong md:p-5"
                  >
                    <div className="flex gap-3 md:gap-5">
                      {r.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.coverImageUrl}
                          alt=""
                          className="bg-canvas h-16 w-16 shrink-0 rounded object-cover md:h-24 md:w-24"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-serif text-xl font-semibold leading-tight tracking-tight group-hover:text-accent">
                            {r.title || "（未命名）"}
                          </h3>
                          <StatusTag kind={reportStatus(r)} />
                        </div>
                        {r.summary && (
                          <p className="text-muted mt-2 line-clamp-2 text-sm leading-relaxed">
                            {r.summary}
                          </p>
                        )}
                        <div className="text-subtle mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted font-medium">{r.author || "—"}</span>
                          {updatedIso && (
                            <>
                              <span>·</span>
                              <span>更新於 {formatDate(updatedIso)}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{estimateReadingMinutes(r.contentMd)} 分鐘閱讀</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
