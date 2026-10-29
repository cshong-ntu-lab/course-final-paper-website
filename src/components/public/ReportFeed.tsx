"use client";
// docs/design-v2.md §4.2 — home: centred heading, tag filter panel, then the
// feed (a carousel of picked reports, then every report as cards or rows).
// Several tags can be selected (OR within a group, AND across groups). The
// URL is the only copy of the selection: chips write it with
// history.replaceState (no server round-trip), tag links elsewhere navigate to
// it, and both reach this component through useSearchParams.

import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { LeadCarousel } from "@/components/public/LeadCarousel";
import { ReportListItem, type ReportItem } from "@/components/public/ReportListItem";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  EMPTY_SELECTION,
  FEED_FILTER_HASH,
  FEED_FILTER_KINDS,
  LEAD_COUNT,
  OPEN_FEED_FILTER_EVENT,
  feedFacets,
  feedSelectionHref,
  matchesFeedSelection,
  parseFeedSelection,
  selectionCount,
  toggleSelection,
  visibleTopics,
  type FeedFilterKind,
  type FeedSelection,
} from "@/lib/feed";
import { cn } from "@/lib/utils";

interface FeedReportItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

interface ReportFeedProps {
  reportItems: FeedReportItem[];
  basePath?: string; // default "/c"
  homeHref?: string; // default "/"; preview passes "/preview"
  /** Carousel reports as `${courseSlug}/${slug}`, drawn on the server
   *  (weightedSample); omitted → the latest LEAD_COUNT. */
  leadKeys?: string[];
}

type View = "grid" | "list";

const GROUP_LABELS: Record<FeedFilterKind, string> = {
  topic: "主題",
  course: "課程名稱",
  semester: "學期",
};

// spec §2.3: soft at rest, solid when selected (white text ≥ 4.5:1 on each)
const CHIP_CLASSES: Record<FeedFilterKind | "all", { rest: string; active: string }> = {
  all: {
    rest: "border-border-strong bg-surface text-muted",
    active: "border-foreground bg-foreground text-background font-bold",
  },
  topic: { rest: "bg-accent-soft text-accent", active: "bg-accent text-accent-foreground font-bold" },
  course: { rest: "bg-gold-soft text-gold-ink", active: "bg-gold-ink text-accent-foreground font-bold" },
  semester: { rest: "bg-stone-soft text-stone", active: "bg-stone text-accent-foreground font-bold" },
};

function Chip({
  kind,
  active,
  onClick,
  children,
}: {
  kind: FeedFilterKind | "all";
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border border-transparent px-[15px] py-[7px] text-sm transition-[translate,background-color,color] duration-150 hover:-translate-y-px",
        active ? CHIP_CLASSES[kind].active : CHIP_CLASSES[kind].rest,
      )}
    >
      {children}
    </button>
  );
}

/** "住宅研究、114-1", or "住宅研究、勞動研究 等 4 項" once it gets long. */
function selectionLabel(sel: FeedSelection): string {
  const values = FEED_FILTER_KINDS.flatMap((k) => sel[k]);
  return values.length <= 3 ? values.join("、") : `${values.slice(0, 2).join("、")} 等 ${values.length} 項`;
}

export function ReportFeed({
  reportItems,
  basePath = "/c",
  homeHref = "/",
  leadKeys,
}: ReportFeedProps) {
  // from the URL, so the header's 文章分類 links work while already on the home page
  const searchParams = useSearchParams();
  const selection = React.useMemo(
    () =>
      parseFeedSelection(
        Object.fromEntries(FEED_FILTER_KINDS.map((k) => [k, searchParams.getAll(k)])),
      ),
    [searchParams],
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [allTopics, setAllTopics] = React.useState(false);
  const filterRef = React.useRef<HTMLElement>(null);

  // the header's 「更多主題」 opens the panel: an event on this page, or the
  // #filter hash when it navigated here from another page
  React.useEffect(() => {
    const open = () => {
      setPanelOpen(true);
      requestAnimationFrame(() =>
        filterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    };
    if (window.location.hash === FEED_FILTER_HASH) open();
    window.addEventListener(OPEN_FEED_FILTER_EVENT, open);
    return () => window.removeEventListener(OPEN_FEED_FILTER_EVENT, open);
  }, []);
  const [view, setView] = React.useState<View>("grid");
  // Cards rise in one after another when the set of reports changes (first
  // render, filter); switching grid ↔ list only cross-fades.
  const [entrance, setEntrance] = React.useState<"stagger-in" | "swap-in">("stagger-in");

  const facets = React.useMemo(() => feedFacets(reportItems), [reportItems]);
  const count = selectionCount(selection);
  const filtered = reportItems.filter((r) => matchesFeedSelection(r, selection));
  const topics = allTopics
    ? { shown: facets.topic, hiddenCount: 0 }
    : visibleTopics(facets.topic, selection.topic);
  // the carousel only on the unfiltered feed (as in the prototype); the grid
  // below always lists every match, so it agrees with 「共 N 篇」
  const byKey = new Map(reportItems.map((r) => [`${r.courseSlug}/${r.slug}`, r]));
  const lead =
    count > 0
      ? []
      : leadKeys
        ? leadKeys.flatMap((k) => byKey.get(k) ?? [])
        : filtered.slice(0, LEAD_COUNT);
  const selectionKey = feedSelectionHref(selection);

  const applySelection = (next: FeedSelection) => {
    setEntrance("stagger-in");
    window.history.replaceState(null, "", feedSelectionHref(next, homeHref));
  };

  return (
    <>
      {/* Heading + filter (centred) */}
      <section
        ref={filterRef}
        className="mb-12 flex scroll-mt-20 flex-col items-center text-center"
      >
        <h1 className="m-0 mb-4 font-serif text-[clamp(1.7rem,3.2vw,2.3rem)] font-extrabold">
          AI課程成果發表
        </h1>
        {/* the quote the site has carried since v1 */}
        <blockquote className="text-muted m-0 max-w-[44ch] font-serif text-[1.05rem] leading-[1.6] italic text-pretty">
          &ldquo;The future of AI research will require training models to better understand the
          science of social relationships.&rdquo;
        </blockquote>
        <p className="text-subtle m-0 mt-2 mb-6 max-w-[52ch] text-xs leading-[1.6] text-pretty">
          C.A. Bail, Can Generative AI improve social science?, Proc. Natl. Acad. Sci. U.S.A. 121
          (21) e2314021121 (2024).
        </p>
        <button
          type="button"
          aria-expanded={panelOpen}
          aria-controls="feed-filter"
          onClick={() => setPanelOpen((o) => !o)}
          className="border-border-strong bg-surface text-muted hover:border-accent hover:text-accent flex max-w-full items-center gap-2 rounded-full border px-4 py-[9px] text-sm font-semibold transition-colors"
        >
          {count > 0 ? (
            <span className="truncate">
              篩選中：<span className="text-accent">{selectionLabel(selection)}</span>
            </span>
          ) : (
            "篩選標籤"
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-150",
              panelOpen && "rotate-180",
            )}
          />
        </button>

        {/* height unfolds via grid-template-rows 0fr → 1fr; content fades in after 40ms */}
        <div
          id="feed-filter"
          className={cn(
            "grid w-full max-w-[880px] transition-[grid-template-rows]",
            panelOpen
              ? "ease-enter grid-rows-[1fr] duration-[220ms]"
              : "ease-exit grid-rows-[0fr] duration-[160ms]",
          )}
        >
          <div className="min-h-0 overflow-hidden" inert={!panelOpen}>
            <div
              className={cn(
                "border-border bg-surface rounded-thumb mt-3.5 flex flex-col items-center gap-4 border p-[18px] transition-opacity",
                panelOpen
                  ? "opacity-100 delay-[40ms] duration-[160ms]"
                  : "opacity-0 duration-[120ms]",
              )}
            >
              <Chip kind="all" active={count === 0} onClick={() => applySelection(EMPTY_SELECTION)}>
                全部文章
              </Chip>
              <div className="border-border flex w-full flex-col gap-4 border-t pt-3.5">
                {FEED_FILTER_KINDS.map((kind) =>
                  facets[kind].length === 0 ? null : (
                    <div key={kind} className="flex flex-col items-center gap-2.5">
                      <p className="text-2xs text-subtle m-0 font-mono tracking-[0.05em]">
                        {GROUP_LABELS[kind]}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {(kind === "topic" ? topics.shown : facets[kind]).map((value) => (
                          <Chip
                            key={value}
                            kind={kind}
                            active={selection[kind].includes(value)}
                            onClick={() => applySelection(toggleSelection(selection, kind, value))}
                          >
                            {value}
                          </Chip>
                        ))}
                      </div>
                      {kind === "topic" && (allTopics || topics.hiddenCount > 0) && (
                        <button
                          type="button"
                          aria-expanded={allTopics}
                          onClick={() => setAllTopics((a) => !a)}
                          className="text-subtle hover:text-accent flex items-center gap-1 text-xs transition-colors"
                        >
                          {allTopics ? "收起主題" : `顯示全部主題（還有 ${topics.hiddenCount} 個）`}
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              "size-3 transition-transform duration-150",
                              allTopics && "rotate-180",
                            )}
                          />
                        </button>
                      )}
                    </div>
                  ),
                )}
              </div>
              <div className="border-border flex w-full items-center justify-center gap-5 border-t pt-3.5 text-sm">
                {count > 0 && (
                  <button
                    type="button"
                    onClick={() => applySelection(EMPTY_SELECTION)}
                    className="text-muted hover:text-foreground underline underline-offset-[3px]"
                  >
                    清除篩選
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="text-accent font-semibold hover:underline hover:underline-offset-[3px]"
                >
                  收起
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {lead.length > 0 && <LeadCarousel key={selectionKey} items={lead} basePath={basePath} />}

      {/* Result line + view switch */}
      <div className="mt-6 mb-[22px] flex flex-wrap items-center justify-between gap-3">
        <p className="text-subtle m-0 font-mono text-xs">
          {count > 0 && (
            <>
              篩選：<b className="text-foreground">{selectionLabel(selection)}</b> ·{" "}
            </>
          )}
          共 <b className="text-foreground">{filtered.length}</b> 篇
        </p>
        <SegmentedControl
          label="顯示方式"
          value={view}
          onChange={(v) => {
            setEntrance("swap-in");
            setView(v);
          }}
          options={[
            { value: "grid", label: "卡片" },
            { value: "list", label: "列表" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-subtle py-16 text-center text-sm">
          {count > 0 ? (
            <>
              目前沒有同時符合這些條件的文章。
              <button
                type="button"
                onClick={() => applySelection(EMPTY_SELECTION)}
                className="text-accent ml-1 underline underline-offset-[3px]"
              >
                清除篩選
              </button>
            </>
          ) : (
            "尚無已發布報告。"
          )}
        </div>
      ) : (
        filtered.length > 0 && (
          <div
            key={`${selectionKey}-${view}`}
            className={
              view === "grid"
                ? `${entrance} grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]`
                : `${entrance} flex flex-col gap-3.5`
            }
          >
            {filtered.map((r, i) => (
              <ReportListItem
                key={`${r.courseSlug}-${r.slug}`}
                report={r}
                courseSlug={r.courseSlug}
                variant={view === "grid" ? "card" : "row"}
                basePath={basePath}
                badgeLabel={r.badgeLabel}
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </div>
        )
      )}
    </>
  );
}
