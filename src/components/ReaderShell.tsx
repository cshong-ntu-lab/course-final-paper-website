"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import type { TocEntry } from "@/lib/markdown/extractToc";

interface AdjacentReport {
  slug: string;
  title: string;
  author: string;
}

interface ReaderShellProps {
  courseSlug: string;
  courseName: string;
  courseCode: string;
  snap: {
    title: string;
    author: string;
    summary: string;
    coverImageUrl: string | null;
    contentMd: string;
    publishedAt: string; // ISO string
    subtitle?: string;
    tags?: string[];
    authorBio?: string;
    authorAffiliation?: string;
    coverCaption?: string;
  };
  readingMins: number;
  toc: TocEntry[];
  prev: AdjacentReport | null;
  next: AdjacentReport | null;
  // Preview-mode options
  basePath?: string; // default "/c"
  previewMode?: boolean; // shows draft badge, hides citation, adjusts sticky offset
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function ReaderShell({
  courseSlug,
  courseName,
  courseCode,
  snap,
  readingMins,
  toc,
  prev,
  next,
  basePath = "/c",
  previewMode = false,
}: ReaderShellProps) {
  const progress = useScrollProgress();
  const [activeId, setActiveId] = useState<string>("");

  const year = new Date(snap.publishedAt).getFullYear();
  const remainMin = Math.max(1, Math.round(readingMins * (1 - progress / 100)));

  const citationText = `${snap.author} (${year}). 〈${snap.title}〉. 《台大社會系研究筆記》, ${courseCode}.`;

  const copyLink = useCallback(() => void navigator.clipboard.writeText(window.location.href), []);
  const copyCitation = useCallback(
    () => void navigator.clipboard.writeText(citationText),
    [citationText],
  );
  const print = useCallback(() => window.print(), []);

  // Track active TOC heading via IntersectionObserver
  useEffect(() => {
    if (toc.length === 0) return;
    const headingEls = toc
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  // sticky top offset: preview pages sit below a PreviewBanner
  const stickyTop = previewMode ? "top-8" : "top-0";
  const tocStickyTop = previewMode ? "top-[88px]" : "top-20";

  return (
    <div className="bg-background min-h-screen">
      {/* Sticky reader header */}
      <header
        className={`border-border bg-background/95 sticky ${stickyTop} z-40 border-b backdrop-blur`}
      >
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
          <Link
            href={`${basePath}/${courseSlug}`}
            className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            ← 返回 {courseName}
          </Link>
          <div className="flex items-center gap-3">
            {previewMode && (
              <span className="rounded border border-warning/40 bg-warning-soft px-2 py-0.5 font-mono text-2xs text-warning-fg">
                草稿
              </span>
            )}
            <Link href="/" className="font-serif text-sm font-semibold tracking-tight">
              台大社會系
            </Link>
          </div>
        </div>
        {/* Progress sliver */}
        <div className="bg-border-strong/30 h-[2px]">
          <div
            className="bg-accent h-full transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main grid: article + right rail */}
      <div className="mx-auto grid max-w-[1180px] gap-x-16 px-6 py-14 lg:grid-cols-[minmax(0,720px)_200px] lg:justify-center">
        <article id="main">
          {/* Article masthead */}
          <header className="animate-fade-up mb-10">
            <div className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
              <span>{courseCode}</span>
              <span className="bg-accent animate-pulse-dot inline-block h-[5px] w-[5px] rounded-full" />
              <span>期末報告</span>
            </div>

            <h1 className="text-foreground m-0 font-serif text-[58px] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              {snap.title || "（無標題）"}
            </h1>

            {snap.subtitle && (
              <p className="text-muted m-0 mt-[22px] max-w-[32em] font-serif italic text-[21px] leading-[1.5] text-pretty">
                {snap.subtitle}
              </p>
            )}

            {snap.tags && snap.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {snap.tags.map((t) => (
                  <span
                    key={t}
                    className="border-accent/30 bg-accent/[0.08] text-accent hover:bg-accent hover:text-background inline-flex items-center rounded-[2px] border px-2 py-[2px] text-[11px] tracking-[0.02em] transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Author meta */}
            <div className="mt-8 flex flex-wrap items-center gap-[18px] text-sm">
              <div className="flex items-center gap-3">
                <span className="bg-accent text-background font-serif inline-grid h-10 w-10 shrink-0 place-items-center rounded-full text-[18px] font-semibold">
                  {(snap.author || "？")[0]}
                </span>
                <div>
                  <div className="text-foreground font-serif text-[15px] font-semibold">
                    {snap.author || "（未署名）"}
                  </div>
                  {snap.authorAffiliation && (
                    <div className="text-subtle text-[12px]">{snap.authorAffiliation}</div>
                  )}
                </div>
              </div>
              <div className="border-border h-[30px] w-px" />
              <div>
                <div className="text-subtle font-mono text-[11px] uppercase tracking-[0.14em]">
                  {previewMode ? "更新" : "發布"}
                </div>
                <div className="text-foreground mt-1 text-[13.5px]">
                  {formatDate(snap.publishedAt)}
                </div>
              </div>
              <div>
                <div className="text-subtle font-mono text-[11px] uppercase tracking-[0.14em]">
                  閱讀
                </div>
                <div className="text-foreground mt-1 text-[13.5px]">{readingMins} 分鐘</div>
              </div>
            </div>

            <hr className="border-border-strong mt-8 border-t" />
          </header>

          {/* Cover figure */}
          {snap.coverImageUrl && (
            <figure className="mb-9 m-0">
              <div className="bg-border ring-border-strong overflow-hidden ring-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snap.coverImageUrl} alt="" className="aspect-video w-full object-cover" />
              </div>
              {snap.coverCaption && (
                <figcaption className="text-subtle mt-2.5 text-center font-sans text-[12px]">
                  {snap.coverCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article body */}
          <MarkdownRenderer content={snap.contentMd} />

          {/* Author bio card */}
          {(snap.authorBio || snap.authorAffiliation) && (
            <section className="border-border bg-surface mt-14 flex gap-[18px] rounded-[5px] border px-6 py-[22px]">
              <span className="bg-accent text-background font-serif inline-grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full text-[24px] font-semibold">
                {(snap.author || "？")[0]}
              </span>
              <div>
                <p className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                  關於作者
                </p>
                <p className="m-0 mt-1.5 font-serif text-[18px] font-semibold">{snap.author}</p>
                {snap.authorAffiliation && (
                  <p className="text-subtle m-0 mt-0.5 text-[12.5px]">{snap.authorAffiliation}</p>
                )}
                {snap.authorBio && (
                  <p className="text-muted m-0 mt-2.5 font-serif text-[14.5px] leading-[1.7] text-pretty">
                    {snap.authorBio}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Citation card — hidden in preview mode (draft is not citable) */}
          {!previewMode && (
            <section className="border-border bg-surface mt-6 rounded-[5px] border px-6 py-[22px]">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-subtle m-0 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                  引用格式 · APA
                </p>
                <button
                  onClick={copyCitation}
                  className="text-accent border-0 bg-transparent text-[13px] underline underline-offset-[3px]"
                >
                  複製
                </button>
              </div>
              <p className="m-0 font-serif text-[15px] leading-[1.75] text-pretty">
                {citationText}
              </p>
            </section>
          )}

          {/* Prev / Next nav — not shown in preview (drafts have no adjacent order) */}
          {!previewMode && (prev || next) && (
            <nav className="mt-7 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {prev && (
                <Link
                  href={`${basePath}/${courseSlug}/r/${prev.slug}`}
                  className="border-border hover:border-accent block rounded-[5px] border px-[22px] py-[18px] transition-colors"
                >
                  <p className="text-subtle m-0 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    ← 較早一篇
                  </p>
                  <p className="m-0 mt-2 font-serif text-[16px] font-semibold leading-[1.35] text-pretty">
                    {prev.title}
                  </p>
                  <p className="text-subtle m-0 mt-1.5 text-[12px]">{prev.author}</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`${basePath}/${courseSlug}/r/${next.slug}`}
                  className="border-border hover:border-accent block rounded-[5px] border px-[22px] py-[18px] text-right transition-colors"
                >
                  <p className="text-subtle m-0 font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    較新一篇 →
                  </p>
                  <p className="m-0 mt-2 font-serif text-[16px] font-semibold leading-[1.35] text-pretty">
                    {next.title}
                  </p>
                  <p className="text-subtle m-0 mt-1.5 text-[12px]">{next.author}</p>
                </Link>
              )}
            </nav>
          )}

          {/* Back link */}
          <Link
            href={`${basePath}/${courseSlug}`}
            className="border-accent/40 text-accent hover:border-accent mt-7 inline-flex items-center gap-1.5 border-b pb-[1px] text-[14px]"
          >
            ← 返回 {courseName} 所有報告
          </Link>
        </article>

        {/* Right rail */}
        {toc.length > 0 && (
          <aside className={`sticky ${tocStickyTop} mt-20 hidden h-fit flex-col gap-6 lg:flex`}>
            <nav aria-label="目錄">
              <p className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                本文目錄
              </p>
              <ol className="border-border mt-3 flex flex-col gap-2.5 border-t pt-3">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={[
                        "-ml-px block border-l-2 leading-[1.4]",
                        h.level === 3 ? "pl-4 text-[12.5px]" : "pl-2.5 text-[13.5px]",
                        activeId === h.id
                          ? "border-accent text-accent font-semibold"
                          : "border-transparent text-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      {h.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="border-border border-t pt-3.5">
              <p className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                閱讀進度
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-accent font-serif text-[24px] font-semibold">
                  {Math.round(progress)}
                  <span className="text-subtle text-[14px] font-normal">%</span>
                </span>
                <span className="text-subtle text-[11px]">還 {remainMin} 分鐘</span>
              </div>
            </div>

            <div className="border-border flex flex-col gap-2 border-t pt-3.5">
              <p className="text-subtle font-mono text-[10.5px] uppercase tracking-[0.14em]">
                工具
              </p>
              <button
                onClick={copyLink}
                className="text-muted hover:text-accent mt-1 text-left text-[13px] transition-colors"
              >
                複製連結
              </button>
              {!previewMode && (
                <button
                  onClick={copyCitation}
                  className="text-muted hover:text-accent text-left text-[13px] transition-colors"
                >
                  複製引用
                </button>
              )}
              <button
                onClick={print}
                className="text-muted hover:text-accent text-left text-[13px] transition-colors"
              >
                列印 / PDF
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
