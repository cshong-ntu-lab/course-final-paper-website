// /preview/c/[courseSlug] — v4 editorial layout mirroring the public course page,
// but shows ALL reports (draft + published) and links into /preview/c/...

import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { ReportListItem } from "@/components/public/ReportListItem";
import { getAllCourses, getAllReportsByCourse, getCourseBySlug } from "@/lib/server/firestore";
import { courseSlug as toCourseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export default async function PreviewCoursePage({ params }: Props) {
  const { courseSlug: slug } = await params;

  const [course, allCourses] = await Promise.all([getCourseBySlug(slug), getAllCourses()]);
  if (!course) notFound();

  const reports = await getAllReportsByCourse(course.id);

  const reportItems = reports.map((r) => {
    const updatedTs = r.updatedAt as unknown as { toDate?: () => Date } | null;
    const publishedTs = r.publishedAt as unknown as { toDate?: () => Date } | null;
    const dateIso =
      publishedTs?.toDate?.().toISOString() ??
      updatedTs?.toDate?.().toISOString() ??
      new Date().toISOString();
    const status = !r.publishedAt ? "草稿" : r.hasNewChanges ? "新草稿" : undefined;
    return {
      slug: reportSlug(r.uid),
      title: r.title || "（無標題）",
      author: r.author || "（未署名）",
      summary: r.summary,
      coverImageUrl: r.coverImageUrl,
      publishedAt: dateIso,
      readingMinutes: estimateReadingMinutes(r.contentMd),
      tags: r.tags,
      pullQuote: r.pullQuote,
      subtitle: r.subtitle,
      authorAffiliation: r.authorAffiliation,
      badgeLabel: status,
    };
  });

  const eyebrowCode = course.courseNo ?? course.code;
  const rocYear = course.year - 1911;
  const termCode = course.termRange ?? `${rocYear}-${course.semester}`;

  return (
    <div className="bg-background min-h-screen">
      {/* Site header — top-8 to sit below PreviewBanner */}
      <header className="border-border bg-background/95 sticky top-8 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/preview" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">台大社會系</span>
            <span className="text-subtle font-mono text-[0.65rem] tracking-[0.06em]">NTU SOC</span>
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
                    href={`/preview/c/${cSlug}`}
                    className={[
                      "block whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors",
                      active
                        ? "border-accent text-foreground"
                        : "border-transparent text-muted hover:border-border-strong hover:text-foreground",
                    ].join(" ")}
                  >
                    <span className="text-subtle mr-1.5 font-mono text-[0.65rem] tracking-[0.06em]">
                      {c.courseNo ?? c.code}
                    </span>
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <main id="main" className="mx-auto max-w-[1180px] px-6 pt-[72px]">
        {/* Course header */}
        <section className="animate-fade-up border-b-2 border-foreground pb-9 text-center">
          <div className="mb-[18px] inline-flex flex-wrap items-center justify-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.28em] text-subtle">
            <span>NTU SOC</span>
            <span className="bg-accent animate-pulse-dot inline-block h-[5px] w-[5px] rounded-full" />
            <span>{eyebrowCode}</span>
            <span className="bg-accent animate-pulse-dot inline-block h-[5px] w-[5px] rounded-full" />
            <span>{reportItems.length} ARTICLES</span>
          </div>

          <h1 className="m-0 font-serif text-[72px] font-semibold leading-[1.02] tracking-[-0.035em]">
            {course.name}
          </h1>

          <div className="mt-3 flex justify-center">
            <span className="bg-accent animate-draw-line inline-block h-[2px] w-16 origin-left" />
          </div>

          <p className="text-muted mx-auto mt-[22px] max-w-[44ch] font-serif italic text-[19px] leading-[1.55] text-pretty">
            {course.description ||
              "研究生在學期末撰寫的田野觀察、訪談筆記與個案分析，署名公開、可供引用。"}
          </p>

          {(course.teacher || course.termRange) && (
            <div className="text-muted mt-6 flex flex-wrap items-center justify-center gap-8 text-[12.5px]">
              {course.teacher && (
                <span>
                  <span className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    授課教師
                  </span>
                  <span className="text-foreground ml-2.5 font-serif font-semibold">
                    {course.teacher}
                  </span>
                </span>
              )}
              {course.termRange && (
                <span>
                  <span className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    學期
                  </span>
                  <span className="font-mono ml-2.5 text-[12px]">{termCode}</span>
                </span>
              )}
            </div>
          )}
        </section>

        {/* Reports section */}
        <section className="pt-[52px]">
          <div className="border-border flex items-baseline justify-between border-b pb-[18px]">
            <h2 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]">
              所有報告（含草稿）
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">
              {reportItems.length} 篇
            </span>
          </div>

          {reportItems.length === 0 ? (
            <p className="text-muted py-12 text-center text-sm italic">本課程尚無報告。</p>
          ) : (
            <>
              <ReportListItem
                report={reportItems[0]!}
                courseSlug={slug}
                variant="lead"
                basePath="/preview/c"
                badgeLabel={reportItems[0]!.badgeLabel}
              />

              {reportItems.length >= 2 && (
                <figure className="border-border animate-fade-up m-0 border-b py-16 text-center">
                  <blockquote className="text-foreground m-0 mx-auto max-w-[760px] font-serif italic text-[28px] font-medium leading-[1.45] tracking-[-0.015em] text-balance">
                    <span className="text-accent/45 mr-1 inline-block font-serif text-[1.1em] leading-none">
                      &ldquo;
                    </span>
                    The future of AI research will require training models to better understand the
                    science of social relationships.
                    <span className="text-accent/45 ml-1 inline-block font-serif text-[1.1em] leading-none">
                      &rdquo;
                    </span>
                  </blockquote>
                  <figcaption className="text-muted mx-auto mt-[22px] max-w-[720px] font-sans text-[12.5px] leading-[1.7] text-pretty">
                    C.A. Bail, <em className="italic">Can Generative AI improve social science?</em>
                    , <span className="font-serif">Proc. Natl. Acad. Sci. U.S.A.</span>{" "}
                    <strong className="text-foreground font-semibold">121</strong> (21) e2314021121
                    (2024).
                  </figcaption>
                </figure>
              )}

              {reportItems.length >= 2 && (
                <div className="grid grid-cols-1 gap-9 pt-11 md:grid-cols-3">
                  {reportItems.slice(1).map((r, i) => (
                    <ReportListItem
                      key={r.slug}
                      report={r}
                      courseSlug={slug}
                      variant={i % 2 === 0 ? "text-only" : "default"}
                      basePath="/preview/c"
                      badgeLabel={r.badgeLabel}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
