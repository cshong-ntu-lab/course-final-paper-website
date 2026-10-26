"use client";
// docs/design-v2.md §4.1 — report reader, modelled on twreporter's article page:
// meta rail (author, tags, tools) | centred reading column | quiet TOC rail.
// Layout lives in globals.css (.reader-grid); this file owns behaviour.

import { Check, Printer, Quote, Share2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { MarkSliceCorner } from "@/components/MarkSlice";
import { TagPill } from "@/components/TagPill";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import type { TocEntry } from "@/lib/markdown/extractToc";
import { activeHeading, parentH2Indices } from "@/lib/scrollSpy";
import { cn } from "@/lib/utils";

interface AdjacentReport {
  slug: string;
  title: string;
  author: string;
}

interface SnapCoAuthor {
  name: string;
  title?: string;
  bio?: string;
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
    /** Body without the old template's "## 摘要" section (see stripAbstractSection). */
    contentMd: string;
    publishedAt: string; // ISO string
    subtitle?: string;
    tags?: string[];
    authorBio?: string;
    authorAffiliation?: string;
    authorAvatarUrl?: string | null;
    coverCaption?: string;
    coAuthors?: SnapCoAuthor[];
  };
  readingMins: number;
  toc: TocEntry[];
  semesterTag?: string; // e.g. "114-2"
  /** From the course semester (semesterCitationYear); falls back to the publish year. */
  citationYear?: number;
  prev: AdjacentReport | null;
  next: AdjacentReport | null;
  // Preview-mode options
  basePath?: string; // default "/c"
  previewMode?: boolean; // shows draft badge, hides citation, adjusts sticky offset
  // Overrides the "back to course" link (defaults to `${basePath}/${courseSlug}`).
  // The public reader has no per-course index page, so it points home instead.
  backHref?: string;
  backLabel?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// rehype-sanitize prefixes heading ids (DOM-clobbering guard), so a TOC slug
// "一研究動機" is rendered as id="user-content-一研究動機".
const headingDomId = (slug: string) => `user-content-${slug}`;

/** Tool icon that cross-fades into a check for a moment after success. */
function SwapIcon({ Icon, done }: { Icon: LucideIcon; done: boolean }) {
  const layer = "col-start-1 row-start-1 size-4 transition-[opacity,transform] duration-150";
  return (
    <span className="inline-grid shrink-0" aria-hidden="true">
      <Icon className={cn(layer, done && "scale-60 opacity-0")} />
      <Check className={cn(layer, "text-accent", !done && "scale-60 opacity-0")} />
    </span>
  );
}

const TOOL =
  "text-muted hover:text-accent flex items-center gap-2.5 py-1.5 text-left text-sm transition-colors";

export function ReaderShell({
  courseSlug,
  courseName,
  courseCode,
  semesterTag,
  citationYear,
  snap,
  readingMins,
  toc,
  prev,
  next,
  basePath = "/c",
  previewMode = false,
  backHref,
  backLabel,
}: ReaderShellProps) {
  const progress = useScrollProgress();
  const [current, setCurrent] = useState(toc.length > 0 ? 0 : -1);
  const [done, setDone] = useState<"share" | "cite" | null>(null);
  const pinnedRef = useRef(-1); // a clicked TOC entry stays current until the reader scrolls
  const trunkRef = useRef<HTMLOListElement>(null);
  const chipsRef = useRef<HTMLOListElement>(null);
  const doneTimer = useRef<number | undefined>(undefined);

  const resolvedBackHref = backHref ?? `${basePath}/${courseSlug}`;
  const resolvedBackLabel = backLabel ?? `返回 ${courseName}`;

  const year = citationYear ?? new Date(snap.publishedAt).getFullYear();
  const citationText = `${snap.author} (${year}). 〈${snap.title}〉. 《台大社會系研究筆記》, ${courseCode}.`;

  const chipOf = useMemo(() => parentH2Indices(toc.map((h) => h.level)), [toc]);
  const chips = useMemo(
    () => toc.map((h, i) => ({ h, i })).filter(({ h }) => h.level === 2),
    [toc],
  );

  // --- current section ---------------------------------------------------
  useEffect(() => {
    if (toc.length === 0) return;
    const headings = toc.map((h) => document.getElementById(headingDomId(h.id)));
    let frame = 0;
    const update = () => {
      frame = 0;
      if (pinnedRef.current >= 0) return setCurrent(pinnedRef.current);
      const vh = window.innerHeight;
      const remaining = document.documentElement.scrollHeight - vh - window.scrollY;
      const tops = headings.map((el) => (el ? el.getBoundingClientRect().top : Infinity));
      setCurrent(activeHeading(tops, vh, remaining));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const unpin = () => {
      if (pinnedRef.current < 0) return;
      pinnedRef.current = -1;
      schedule();
    };
    const unpinOn = ["wheel", "touchstart", "keydown"] as const;
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    unpinOn.forEach((ev) => window.addEventListener(ev, unpin, { passive: true }));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      unpinOn.forEach((ev) => window.removeEventListener(ev, unpin));
    };
  }, [toc]);

  // trunk fill down to the current entry; current chip centred in its row
  useEffect(() => {
    const trunk = trunkRef.current;
    const li = trunk?.children[current] as HTMLElement | undefined;
    trunk?.style.setProperty("--fill", li ? `${li.offsetTop + li.offsetHeight / 2}px` : "0px");

    const row = chipsRef.current;
    const chip = row?.children[chipOf[current] ?? -1] as HTMLElement | undefined;
    if (row && chip && row.offsetParent) {
      row.scrollTo({
        left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  }, [current, chipOf]);

  // fade whichever edge of the chip row still hides chips
  const updateFades = useCallback(() => {
    const row = chipsRef.current;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    row.classList.toggle("fade-start", row.scrollLeft > 2);
    row.classList.toggle("fade-end", row.scrollLeft < max - 2);
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(updateFades);
    window.addEventListener("resize", updateFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateFades);
    };
  }, [updateFades]);

  const jumpTo = (i: number) => (e: React.MouseEvent) => {
    const entry = toc[i];
    const el = entry && document.getElementById(headingDomId(entry.id));
    if (!el) return;
    e.preventDefault();
    pinnedRef.current = i;
    setCurrent(i);
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${el.id}`);
  };

  // --- tools -----------------------------------------------------------------
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);
  const flash = (key: "share" | "cite") => {
    setDone(key);
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setDone(null), 1600);
  };
  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  const share = async () => {
    const url = window.location.href.split("#")[0] ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: snap.title, url });
        flash("share");
      } catch (err) {
        if ((err as Error).name !== "AbortError" && (await copy(url))) flash("share");
      }
      return;
    }
    if (await copy(url)) flash("share");
  };
  const copyCitation = async () => {
    if (await copy(citationText)) flash("cite");
  };

  // sticky offsets: the reader header (56px + 2px progress sliver), plus PreviewBanner
  const stickyTop = previewMode ? "top-8" : "top-0";
  const readerTop = previewMode ? "90px" : "58px";
  const people = [
    { name: snap.author, title: snap.authorAffiliation, avatarUrl: snap.authorAvatarUrl },
    ...(snap.coAuthors ?? []).map((ca) => ({ name: ca.name, title: ca.title, avatarUrl: null })),
  ];
  const bios = [
    ...(snap.authorBio
      ? [
          {
            name: snap.author,
            title: snap.authorAffiliation,
            bio: snap.authorBio,
            avatarUrl: snap.authorAvatarUrl,
          },
        ]
      : []),
    ...(snap.coAuthors ?? [])
      .filter((ca) => ca.bio)
      .map((ca) => ({ ...ca, avatarUrl: null as string | null })),
  ];

  return (
    <div
      className="bg-background min-h-screen"
      style={{ "--reader-top": readerTop } as React.CSSProperties}
    >
      {/* Sticky reader header */}
      <header
        className={`border-border bg-background/95 sticky ${stickyTop} z-40 border-b backdrop-blur`}
      >
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
          <Link
            href={resolvedBackHref}
            className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            ← {resolvedBackLabel}
          </Link>
          <div className="flex items-center gap-3">
            {previewMode && (
              <span className="border-warning/40 bg-warning-soft text-2xs text-warning-fg rounded border px-2 py-0.5 font-mono">
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

      <div className="reader-grid mx-auto max-w-[1180px] px-6 py-14">
        {/* Head: course → title → subtitle → abstract, rising in 60ms apart */}
        <header className="reader-head">
          <p className="text-gold-ink m-0 text-sm font-bold tracking-[0.08em]">{courseName}</p>
          <h1
            className="text-title text-foreground m-0 mt-2.5 mb-3 font-serif font-bold text-balance"
            style={{ animationDelay: "60ms" }}
          >
            {snap.title || "（無標題）"}
          </h1>
          {snap.subtitle && (
            <p
              className="text-muted m-0 mb-4 font-serif text-base italic text-pretty"
              style={{ animationDelay: "120ms" }}
            >
              {snap.subtitle}
            </p>
          )}
          {snap.summary && (
            <section
              aria-label="摘要"
              className="border-border bg-surface rounded-card relative isolate mt-7 overflow-hidden border px-6 pt-5 pb-6"
              style={{ animationDelay: "180ms" }}
            >
              <MarkSliceCorner className="mark-grow" />
              <p className="text-2xs text-muted m-0 mb-3 font-bold tracking-[0.24em]">摘要</p>
              <p className="text-ink-read m-0 text-base leading-[1.9] text-pretty">
                {snap.summary}
              </p>
            </section>
          )}
        </header>

        {/* Meta rail: authors, date, tags; tools stay in view */}
        <aside className="reader-meta" aria-label="作者與標籤">
          <div className="reader-meta-block">
            {people.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="border-border bg-canvas rounded-thumb flex items-center gap-2.5 border px-2.5 py-2"
              >
                <Avatar name={p.name || "？"} src={p.avatarUrl} size={i === 0 ? "md" : "sm"} />
                <div className="min-w-0">
                  <div className="text-foreground text-sm font-bold">{p.name || "（未署名）"}</div>
                  {p.title && (
                    <div className="text-subtle text-xs [word-break:keep-all]">{p.title}</div>
                  )}
                </div>
              </div>
            ))}
            <p className="text-subtle m-0 text-xs leading-relaxed [word-break:keep-all]">
              {previewMode ? "更新" : "發布"} {formatDate(snap.publishedAt)} ·{" "}
              {`閱讀 ${readingMins} 分鐘`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {snap.tags?.map((t) => (
                <TagPill key={t} kind="topic">
                  {t}
                </TagPill>
              ))}
              <TagPill kind="course">{courseName}</TagPill>
              {semesterTag && <TagPill kind="semester">{semesterTag}</TagPill>}
            </div>
          </div>
          <div className="reader-tools">
            <button type="button" onClick={() => void share()} className={TOOL}>
              <SwapIcon Icon={Share2} done={done === "share"} />
              分享
            </button>
            {!previewMode && (
              <button type="button" onClick={() => void copyCitation()} className={TOOL}>
                <SwapIcon Icon={Quote} done={done === "cite"} />
                {done === "cite" ? "已複製引用" : "複製引用"}
              </button>
            )}
            <button type="button" onClick={() => window.print()} className={TOOL}>
              <SwapIcon Icon={Printer} done={false} />
              列印 / PDF
            </button>
          </div>
        </aside>

        {/* Narrow screens: sticky row of h2 chips */}
        {chips.length > 0 && (
          <nav className="reader-chips" aria-label="目錄">
            <ol
              ref={chipsRef}
              onScroll={updateFades}
              className="m-0 flex list-none gap-1 overflow-x-auto overscroll-x-contain p-0 py-1.5 [scrollbar-width:none] [@media(hover:hover)_and_(pointer:fine)]:[scrollbar-width:thin]"
            >
              {chips.map(({ h, i }, k) => {
                const isCurrent = k === chipOf[current];
                return (
                  <li key={h.id} className="shrink-0">
                    <a
                      href={`#${headingDomId(h.id)}`}
                      onClick={jumpTo(i)}
                      aria-current={isCurrent ? "location" : undefined}
                      className={cn(
                        "text-subtle inline-flex min-h-10 items-center rounded-full px-3.5 text-xs whitespace-nowrap no-underline transition-colors",
                        isCurrent && "bg-accent-soft text-accent font-bold",
                      )}
                    >
                      {h.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="reader-main">
          {/* Cover figure */}
          {snap.coverImageUrl && (
            <figure className="m-0 mb-9">
              <div className="bg-border rounded-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snap.coverImageUrl} alt="" className="aspect-video w-full object-cover" />
              </div>
              {snap.coverCaption && (
                <figcaption className="text-subtle mt-2 text-center text-xs">
                  {snap.coverCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article body */}
          <MarkdownRenderer content={snap.contentMd} />

          {/* Author bio cards */}
          {bios.length > 0 && (
            <div className="mt-14 flex flex-col gap-4">
              {bios.map((a, i) => (
                <section
                  key={`${a.name}-${i}`}
                  className="border-border bg-surface rounded-card flex gap-[18px] border px-6 py-[22px]"
                >
                  <Avatar name={a.name || "？"} src={a.avatarUrl} size="md" />
                  <div>
                    <p className="text-2xs text-subtle m-0 font-bold tracking-[0.24em]">關於作者</p>
                    <p className="m-0 mt-1.5 font-serif text-lg font-bold">{a.name}</p>
                    {a.title && <p className="text-subtle m-0 mt-0.5 text-xs">{a.title}</p>}
                    {a.bio && (
                      <p className="text-ink-read m-0 mt-2.5 text-sm leading-[1.8] text-pretty">
                        {a.bio}
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Citation card — hidden in preview mode (draft is not citable) */}
          {!previewMode && (
            <section className="border-border bg-surface rounded-card mt-6 border px-6 py-[22px]">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-2xs text-subtle m-0 font-bold tracking-[0.24em]">引用格式</p>
                <button
                  type="button"
                  onClick={() => void copyCitation()}
                  className="text-accent border-0 bg-transparent text-sm underline underline-offset-[3px]"
                >
                  {done === "cite" ? "已複製" : "複製"}
                </button>
              </div>
              <p className="text-ink-read m-0 text-sm leading-[1.8] text-pretty">{citationText}</p>
            </section>
          )}

          {/* Prev / Next nav — not shown in preview (drafts have no adjacent order) */}
          {!previewMode && (prev || next) && (
            <nav className="mt-7 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {prev && (
                <Link
                  href={`${basePath}/${courseSlug}/r/${prev.slug}`}
                  className="border-border hover:border-accent rounded-card block border px-[22px] py-[18px] transition-colors"
                >
                  <p className="text-2xs text-subtle m-0 font-bold tracking-[0.1em]">← 較早一篇</p>
                  <p className="m-0 mt-2 font-serif text-base leading-[1.4] font-bold text-pretty">
                    {prev.title}
                  </p>
                  <p className="text-subtle m-0 mt-1.5 text-xs">{prev.author}</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`${basePath}/${courseSlug}/r/${next.slug}`}
                  className="border-border hover:border-accent rounded-card block border px-[22px] py-[18px] text-right transition-colors"
                >
                  <p className="text-2xs text-subtle m-0 font-bold tracking-[0.1em]">較新一篇 →</p>
                  <p className="m-0 mt-2 font-serif text-base leading-[1.4] font-bold text-pretty">
                    {next.title}
                  </p>
                  <p className="text-subtle m-0 mt-1.5 text-xs">{next.author}</p>
                </Link>
              )}
            </nav>
          )}

          {/* Back link */}
          <Link
            href={resolvedBackHref}
            className="border-accent/40 text-accent hover:border-accent mt-7 inline-flex items-center gap-1.5 border-b pb-[1px] text-sm"
          >
            ← {resolvedBackLabel}
          </Link>
        </div>

        {/* TOC rail */}
        <aside className="reader-toc">
          {toc.length > 0 && (
            <nav aria-label="目錄" className="sticky top-[calc(var(--reader-top)+24px)]">
              <p className="text-2xs text-subtle m-0 mb-3 font-mono tracking-[0.06em]">目錄</p>
              <ol ref={trunkRef} className="toc-trunk relative m-0 list-none p-0">
                {toc.map((h, i) => (
                  <li key={h.id}>
                    <a
                      href={`#${headingDomId(h.id)}`}
                      onClick={jumpTo(i)}
                      aria-current={i === current ? "location" : undefined}
                      className={cn(
                        "toc-link text-subtle hover:text-foreground relative block py-1.5 pl-3.5 text-xs leading-[1.6] no-underline transition-colors",
                        h.level === 3 && "text-2xs pl-[26px]",
                      )}
                    >
                      {h.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}
