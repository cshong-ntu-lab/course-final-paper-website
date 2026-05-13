// design.md §2.2 — report card for the public course page list.

import Link from "next/link";

export interface ReportListItemProps {
  report: {
    slug: string; // uid used as slug
    title: string;
    author: string;
    summary: string;
    coverImageUrl: string | null;
    publishedAt: string; // ISO string
    readingMinutes: number;
  };
  courseSlug: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function ReportListItem({ report, courseSlug }: ReportListItemProps) {
  return (
    <Link
      href={`/c/${courseSlug}/r/${report.slug}`}
      className="group block rounded-md border border-border bg-surface p-4 transition-colors hover:border-border-strong md:p-5"
    >
      <div className="flex gap-3 md:gap-5">
        {report.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.coverImageUrl}
            alt=""
            className="bg-canvas h-16 w-16 shrink-0 rounded object-cover md:h-24 md:w-24"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl font-semibold leading-tight tracking-tight group-hover:text-accent">
            {report.title}
          </h3>
          <p className="text-muted mt-2 line-clamp-2 text-sm leading-relaxed">{report.summary}</p>
          <div className="text-subtle mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted font-medium">{report.author}</span>
            <span>·</span>
            <time dateTime={report.publishedAt}>{formatDate(report.publishedAt)}</time>
            <span>·</span>
            <span>{report.readingMinutes} 分鐘閱讀</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
