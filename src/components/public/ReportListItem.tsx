// docs/design-v2.md §4.2 — report card in three densities: the lead block, a
// card for the grid, and a row for the list view. Same inner order everywhere:
// byline → title → summary → tags.
//
// The whole card opens the report, yet the byline links to the author page —
// links can't nest, so the title link is "stretched" over the card (::after,
// inset 0) and the byline link sits above it (relative z-10).
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { MarkSliceCover } from "@/components/MarkSlice";
import { CardTags } from "@/components/TagPill";
import { cn } from "@/lib/utils";

export interface ReportItem {
  slug: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  publishedAt: string; // ISO string
  readingMinutes: number;
  // v4 extended fields
  tags?: string[];
  pullQuote?: string;
  subtitle?: string;
  authorAffiliation?: string;
  authorAvatarUrl?: string | null;
  courseName?: string; // e.g. "計算社會學"
  semesterTag?: string; // e.g. "114-2"
  // v2: byline links to /u/{authorUid} and shows "姓名 · 112級"
  authorUid?: string;
  authorCohort?: number | null;
}

export interface ReportListItemProps {
  report: ReportItem;
  courseSlug: string;
  variant?: "lead" | "card" | "row";
  basePath?: string; // default "/c"
  badgeLabel?: string; // optional status badge (preview pages)
  /** On the author page every work has the same author. */
  hideByline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Title link whose ::after covers the nearest `relative` ancestor (the card). */
const STRETCHED =
  "after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none";

/** Uploaded cover, or the department-mark slice; zooms slightly on card hover. */
function Cover({ report, id, className }: { report: ReportItem; id: string; className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface relative shrink-0 overflow-hidden",
        "[&>*]:ease-enter [&>*]:transition-transform [&>*]:duration-[400ms] group-hover:[&>*]:scale-[1.03]",
        className,
      )}
    >
      {report.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={report.coverImageUrl} alt="" className="block size-full object-cover" />
      ) : (
        <MarkSliceCover id={id} />
      )}
    </div>
  );
}

function Byline({ report, badgeLabel }: { report: ReportItem; badgeLabel?: string }) {
  const who = (
    <>
      <Avatar name={report.author || "？"} src={report.authorAvatarUrl} size="sm" />
      <span className="truncate">
        <span className="text-foreground">{report.author}</span>
        {report.authorCohort ? ` · ${report.authorCohort}級` : ""}
      </span>
    </>
  );
  return (
    <div className="text-subtle flex min-w-0 items-center gap-2.5 text-xs">
      {report.authorUid ? (
        <Link
          href={`/u/${report.authorUid}`}
          className="relative z-10 flex min-w-0 items-center gap-2.5 hover:[&_span_span]:underline"
        >
          {who}
        </Link>
      ) : (
        who
      )}
      {badgeLabel && (
        <span className="border-warning/40 bg-warning-soft text-warning-fg ml-auto shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
          {badgeLabel}
        </span>
      )}
    </div>
  );
}

function Tags({ report, className }: { report: ReportItem; className?: string }) {
  return (
    <CardTags
      topics={report.tags ?? []}
      course={report.courseName}
      semester={report.semesterTag}
      className={className}
    />
  );
}

const TITLE =
  "text-foreground group-hover:text-accent m-0 font-serif font-bold text-pretty transition-colors";

export function ReportListItem({
  report,
  courseSlug,
  variant = "card",
  basePath = "/c",
  badgeLabel,
  hideByline = false,
  className,
  style,
}: ReportListItemProps) {
  const href = `${basePath}/${courseSlug}/r/${report.slug}`;
  const coverId = `${courseSlug}/${report.slug}`;
  const byline = hideByline ? null : <Byline report={report} badgeLabel={badgeLabel} />;
  // keyboard focus on the title link outlines the whole card
  const focusRing = "has-[a:focus-visible]:ring-accent has-[a:focus-visible]:ring-2";

  // ─── Lead · cover beside text ───────────────────────────────────────────────
  if (variant === "lead") {
    return (
      <article
        style={style}
        className={cn(
          "group border-border bg-surface rounded-feature shadow-soft relative grid grid-cols-1 items-center gap-9 border p-[26px] md:grid-cols-[1.15fr_1fr]",
          focusRing,
          className,
        )}
      >
        <Cover report={report} id={coverId} className="rounded-thumb aspect-video" />
        <div className="min-w-0">
          <span className="bg-gold-soft text-gold-ink text-2xs mb-4 inline-flex rounded-full px-3 py-1 font-bold tracking-[0.2em]">
            最新發表
          </span>
          {byline}
          <h3 className={cn(TITLE, "mt-2.5 mb-2.5 text-3xl leading-[1.45]")}>
            <Link href={href} className={STRETCHED}>
              {report.title}
            </Link>
          </h3>
          <p className="text-muted m-0 mb-4 line-clamp-4 text-base leading-[1.8] text-pretty">
            {report.summary}
          </p>
          <Tags report={report} />
        </div>
      </article>
    );
  }

  // ─── Row · list view ───────────────────────────────────────────────────────
  if (variant === "row") {
    return (
      <article
        style={style}
        className={cn(
          "group border-border bg-surface rounded-card hover:shadow-hover relative flex items-start gap-[18px] border p-3.5 transition-[transform,box-shadow] duration-150 hover:-translate-y-px max-[560px]:flex-col",
          focusRing,
          className,
        )}
      >
        <Cover
          report={report}
          id={coverId}
          className="rounded-thumb aspect-[4/3] w-[130px] max-[560px]:aspect-video max-[560px]:w-full"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {byline}
          <h3 className={cn(TITLE, "text-[1.08rem] leading-[1.45]")}>
            <Link href={href} className={STRETCHED}>
              {report.title}
            </Link>
          </h3>
          <p className="text-muted m-0 line-clamp-2 text-sm leading-[1.7]">{report.summary}</p>
          <Tags report={report} />
        </div>
      </article>
    );
  }

  // ─── Card · grid view ──────────────────────────────────────────────────────
  return (
    <article
      style={style}
      className={cn(
        "group border-border bg-surface rounded-card shadow-soft hover:shadow-hover relative flex flex-col overflow-hidden border transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5",
        focusRing,
        className,
      )}
    >
      <Cover report={report} id={coverId} className="aspect-video" />
      <div className="flex flex-1 flex-col gap-3 px-5 pt-[18px] pb-5">
        {byline}
        <h3 className={cn(TITLE, "text-[1.08rem] leading-[1.45]")}>
          <Link href={href} className={STRETCHED}>
            {report.title}
          </Link>
        </h3>
        <p className="text-muted m-0 line-clamp-3 text-sm leading-[1.7]">{report.summary}</p>
        <Tags report={report} className="mt-auto pt-0.5" />
      </div>
    </article>
  );
}
