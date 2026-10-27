"use client";
// docs/design-v2.md §4.2 — the lead block as a carousel of the latest reports.
// The card frame stays put; only its content slides. Advances left every 6s; after the last slide it moves on to a copy of the
// first and then jumps back without a transition, so it always slides left.
// Swipe and the dots move it by hand. Auto-advance pauses on hover, on focus
// and while the tab is hidden, and never runs under prefers-reduced-motion.

import * as React from "react";

import { ReportListItem, type ReportItem } from "@/components/public/ReportListItem";
import { cn } from "@/lib/utils";

interface LeadItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

const INTERVAL_MS = 6000;
const SLIDE_MS = 500;
const SWIPE_PX = 48;

export function LeadCarousel({ items, basePath }: { items: LeadItem[]; basePath: string }) {
  const n = items.length;
  // index runs 0..n; n is the copy of slide 0 at the end of the track
  const [index, setIndex] = React.useState(0);
  const [animate, setAnimate] = React.useState(true);
  const [held, setHeld] = React.useState(false); // hover / focus
  const [hidden, setHidden] = React.useState(false); // tab in background
  const [reduced, setReduced] = React.useState(false);
  const drag = React.useRef<{ x: number; moved: boolean } | null>(null);

  const current = index % n;

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const go = (next: number) => {
    setAnimate(true);
    setIndex(next);
  };
  const step = React.useCallback(
    (dir: 1 | -1) => {
      if (dir === 1) {
        setAnimate(true);
        setIndex(Math.min(index + 1, n));
      } else if (index % n === 0) {
        // from slide 0, wrap to the last slide without sliding through the track
        setAnimate(false);
        setIndex(n - 1);
      } else {
        setAnimate(true);
        setIndex((index % n) - 1);
      }
    },
    [index, n],
  );

  // landed on the copy → snap back to slide 0 once the slide finishes
  React.useEffect(() => {
    if (index !== n) return;
    const t = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, SLIDE_MS + 20);
    return () => window.clearTimeout(t);
  }, [index, n]);

  // re-enable the transition on the frame after a jump
  React.useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  const running = n > 1 && !held && !hidden && !reduced;
  React.useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => step(1), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [running, index, step]);

  if (n === 0) return null;
  if (n === 1) {
    const r = items[0]!;
    return (
      <ReportListItem
        report={r}
        courseSlug={r.courseSlug}
        variant="lead"
        basePath={basePath}
        badgeLabel={r.badgeLabel}
        className="rise-once"
      />
    );
  }

  const slides = [...items, items[0]!];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="最新發表"
      className="rise-once"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      {/* one fixed card frame; the content slides inside its padding box */}
      <div className="border-border bg-surface rounded-feature shadow-soft has-[a:focus-visible]:ring-accent overflow-hidden border p-[26px] has-[a:focus-visible]:ring-2">
        <div className="overflow-hidden">
          <div
            className={cn(
              "flex touch-pan-y",
              animate && "ease-enter transition-transform duration-500",
            )}
            style={{ transform: `translateX(-${index * 100}%)` }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              drag.current = { x: e.clientX, moved: false };
            }}
            onPointerMove={(e) => {
              if (drag.current && Math.abs(e.clientX - drag.current.x) > 10) drag.current.moved = true;
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              if (!d) return;
              const dx = e.clientX - d.x;
              if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
              // keep d.moved for the click that follows, clear it after
              window.setTimeout(() => (drag.current = null), 0);
            }}
            onPointerCancel={() => (drag.current = null)}
            // dragging a link or image starts a native drag, which cancels the pointer
            onDragStart={(e) => e.preventDefault()}
            // a swipe must not also open the article
            onClickCapture={(e) => {
              if (drag.current?.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {slides.map((r, i) => {
              const isCopy = i === n;
              const active = i === index;
              return (
                <div
                  key={isCopy ? "copy" : `${r.courseSlug}-${r.slug}`}
                  role={isCopy ? undefined : "group"}
                  aria-roledescription={isCopy ? undefined : "slide"}
                  aria-label={isCopy ? undefined : `${i + 1} / ${n}`}
                  aria-hidden={isCopy || !active || undefined}
                  inert={!active}
                  className="w-full shrink-0"
                >
                  <ReportListItem
                    report={r}
                    courseSlug={r.courseSlug}
                    variant="lead"
                    basePath={basePath}
                    badgeLabel={r.badgeLabel}
                    frameless
                    // slides share the tallest one's height; on one column keep the
                    // content at the top so the spare height sits below the tags
                    className="h-full max-md:content-start"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" role="group" aria-label="選擇文章">
        {items.map((r, i) => (
          <button
            key={`${r.courseSlug}-${r.slug}`}
            type="button"
            aria-label={`第 ${i + 1} 篇：${r.title}`}
            aria-current={i === current || undefined}
            onClick={() => go(i)}
            className="group flex h-6 items-center"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-[width,background-color] duration-200",
                i === current
                  ? "bg-accent w-6"
                  : "bg-border-strong group-hover:bg-muted w-1.5",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
