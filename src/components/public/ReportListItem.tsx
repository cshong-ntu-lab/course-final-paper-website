import Link from "next/link";

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
  courseTag?: string; // e.g. "114-2 計算社會學"
}

export interface ReportListItemProps {
  report: ReportItem;
  courseSlug: string;
  variant?: "lead" | "default" | "text-only";
  basePath?: string; // default "/c"
  badgeLabel?: string; // optional status badge shown in the card footer
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-border bg-background text-muted hover:border-accent hover:bg-accent hover:text-background inline-flex items-center rounded-[2px] border px-2 py-[2px] text-[11px] tracking-[0.02em] transition-colors">
      {children}
    </span>
  );
}

function CourseTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-accent/35 bg-accent/8 text-accent inline-flex items-center rounded-[2px] border px-2 py-[2px] font-mono text-[10px] tracking-[0.04em]">
      {children}
    </span>
  );
}

function Avatar({
  name,
  avatarUrl,
  size = 28,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="bg-accent text-background font-serif font-semibold inline-grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {name[0]}
    </span>
  );
}

function CardBody({ report, badgeLabel }: { report: ReportItem; badgeLabel?: string }) {
  return (
    <>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {report.courseTag && <CourseTag>{report.courseTag}</CourseTag>}
        {report.tags?.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
      <h3 className="text-foreground group-hover:text-accent mt-2.5 font-serif text-[21px] font-semibold leading-[1.3] tracking-[-0.005em] text-pretty transition-colors">
        {report.title}
      </h3>
      <p className="text-muted mt-2 font-serif text-[14.5px] leading-[1.7] text-pretty line-clamp-3">
        {report.summary}
      </p>
      <div className="border-border text-subtle mt-auto flex items-center gap-2.5 border-t pt-3.5 text-[12.5px]">
        <Avatar name={report.author} avatarUrl={report.authorAvatarUrl} size={22} />
        <span className="text-foreground font-serif text-[13px] font-semibold">{report.author}</span>
        {badgeLabel ? (
          <span className="ml-auto rounded border border-warning/40 bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] text-warning-fg">
            {badgeLabel}
          </span>
        ) : (
          <span className="font-mono ml-auto text-[11px]">{formatDate(report.publishedAt)}</span>
        )}
      </div>
    </>
  );
}

export function ReportListItem({
  report,
  courseSlug,
  variant = "default",
  basePath = "/c",
  badgeLabel,
}: ReportListItemProps) {
  const href = `${basePath}/${courseSlug}/r/${report.slug}`;

  // ─── Lead · full-width side-by-side ─────────────────────────────────────────
  if (variant === "lead") {
    return (
      <Link
        href={href}
        className="group border-border animate-fade-up grid grid-cols-1 items-center gap-12 border-b py-10 md:grid-cols-[1.1fr_1fr]"
      >
        <div className="bg-border ring-border-strong overflow-hidden ring-1">
          {report.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.coverImageUrl}
              alt=""
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0_6px,transparent_6px_12px)]" />
          )}
        </div>
        <div>
          {(report.courseTag || (report.tags && report.tags.length > 0)) && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {report.courseTag && <CourseTag>{report.courseTag}</CourseTag>}
              {report.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          )}
          <h3 className="text-foreground group-hover:text-accent font-serif text-[40px] font-semibold leading-[1.15] tracking-[-0.025em] text-pretty transition-colors">
            {report.title}
          </h3>
          <p className="text-muted mt-4 font-serif text-[16.5px] leading-[1.75] text-pretty">
            {report.summary}
          </p>
          <div className="text-subtle mt-5 flex items-center gap-3 text-[13px]">
            <Avatar name={report.author} avatarUrl={report.authorAvatarUrl} size={28} />
            <span className="text-foreground font-serif text-[14px] font-semibold">{report.author}</span>
            {badgeLabel ? (
              <span className="rounded border border-warning/40 bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] text-warning-fg">
                {badgeLabel}
              </span>
            ) : (
              <>
                <span>·</span>
                <time dateTime={report.publishedAt}>{formatDate(report.publishedAt)}</time>
              </>
            )}
            <span>·</span>
            <span>{report.readingMinutes} 分鐘閱讀</span>
          </div>
        </div>
      </Link>
    );
  }

  // ─── Text-only · pull-quote replaces cover ───────────────────────────────────
  if (variant === "text-only") {
    return (
      <Link href={href} className="group animate-fade-up flex flex-col">
        <div className="border-border bg-surface flex aspect-[3/2] items-center justify-center border px-6 py-5">
          <p className="text-foreground m-0 text-center font-serif italic text-[17px] leading-[1.55] text-balance">
            {`「${report.summary.slice(0, 60)}…」`}
          </p>
        </div>
        <CardBody report={report} badgeLabel={badgeLabel} />
      </Link>
    );
  }

  // ─── Default · cover-on-top, 3-col grid ─────────────────────────────────────
  return (
    <Link href={href} className="group animate-fade-up flex flex-col">
      <div className="bg-border ring-border-strong overflow-hidden ring-1">
        {report.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.coverImageUrl}
            alt=""
            className="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="aspect-[3/2] w-full bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0_6px,transparent_6px_12px)]" />
        )}
      </div>
      <CardBody report={report} badgeLabel={badgeLabel} />
    </Link>
  );
}
