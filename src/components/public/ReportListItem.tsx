// docs/design-v2.md §4.2 — report card in three densities: the lead block, a
// card for the grid, and a row for the list view. Same inner order everywhere:
// byline → title → summary → tags.
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
}

export interface ReportListItemProps {
  report: ReportItem;
  courseSlug: string;
  variant?: "lead" | "card" | "row";
  basePath?: string; // default "/c"
  badgeLabel?: string; // optional status badge (preview pages)
  className?: string;
  style?: React.CSSProperties;
}

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
  return (
    <div className="text-subtle flex min-w-0 items-center gap-2.5 text-xs">
      <Avatar name={report.author || "？"} src={report.authorAvatarUrl} size="sm" />
      <span className="text-foreground truncate">{report.author}</span>
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

export function ReportListItem({
  report,
  courseSlug,
  variant = "card",
  basePath = "/c",
  badgeLabel,
  className,
  style,
}: ReportListItemProps) {
  const href = `${basePath}/${courseSlug}/r/${report.slug}`;
  const coverId = `${courseSlug}/${report.slug}`;

  // ─── Lead · cover beside text ───────────────────────────────────────────────
  if (variant === "lead") {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          "group border-border bg-surface rounded-feature shadow-soft grid grid-cols-1 items-center gap-9 border p-[26px] md:grid-cols-[1.15fr_1fr]",
          className,
        )}
      >
        <Cover report={report} id={coverId} className="rounded-thumb aspect-video" />
        <div className="min-w-0">
          <span className="bg-gold-soft text-gold-ink text-2xs mb-4 inline-flex rounded-full px-3 py-1 font-bold tracking-[0.2em]">
            最新發表
          </span>
          <Byline report={report} badgeLabel={badgeLabel} />
          <h3 className="text-foreground group-hover:text-accent m-0 mt-2.5 mb-2.5 font-serif text-3xl leading-[1.45] font-bold text-pretty transition-colors">
            {report.title}
          </h3>
          <p className="text-muted m-0 mb-4 line-clamp-4 text-base leading-[1.8] text-pretty">
            {report.summary}
          </p>
          <Tags report={report} />
        </div>
      </Link>
    );
  }

  // ─── Row · list view ───────────────────────────────────────────────────────
  if (variant === "row") {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          "group border-border bg-surface rounded-card hover:shadow-hover flex items-start gap-[18px] border p-3.5 transition-[transform,box-shadow] duration-150 hover:-translate-y-px max-[560px]:flex-col",
          className,
        )}
      >
        <Cover
          report={report}
          id={coverId}
          className="rounded-thumb aspect-[4/3] w-[130px] max-[560px]:aspect-video max-[560px]:w-full"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Byline report={report} badgeLabel={badgeLabel} />
          <h3 className="text-foreground group-hover:text-accent m-0 font-serif text-[1.08rem] leading-[1.45] font-bold text-pretty transition-colors">
            {report.title}
          </h3>
          <p className="text-muted m-0 line-clamp-2 text-sm leading-[1.7]">{report.summary}</p>
          <Tags report={report} />
        </div>
      </Link>
    );
  }

  // ─── Card · grid view ──────────────────────────────────────────────────────
  return (
    <Link
      href={href}
      style={style}
      className={cn(
        "group border-border bg-surface rounded-card shadow-soft hover:shadow-hover flex flex-col overflow-hidden border transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5",
        className,
      )}
    >
      <Cover report={report} id={coverId} className="aspect-video" />
      <div className="flex flex-1 flex-col gap-3 px-5 pt-[18px] pb-5">
        <Byline report={report} badgeLabel={badgeLabel} />
        <h3 className="text-foreground group-hover:text-accent m-0 font-serif text-[1.08rem] leading-[1.45] font-bold text-pretty transition-colors">
          {report.title}
        </h3>
        <p className="text-muted m-0 line-clamp-3 text-sm leading-[1.7]">{report.summary}</p>
        <Tags report={report} className="mt-auto pt-0.5" />
      </div>
    </Link>
  );
}
