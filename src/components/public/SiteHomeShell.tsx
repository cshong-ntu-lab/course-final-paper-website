// Single source of truth for the sitewide report feed layout — shared by the
// public homepage (/) and the preview homepage (/preview). Any layout change
// here applies to both automatically; do not fork this into separate copies.

import Link from "next/link";

import { Footer } from "@/components/Footer";
import { ReportFeed } from "@/components/public/ReportFeed";
import type { ReportItem } from "@/components/public/ReportListItem";
import type { FeedSelection } from "@/lib/feed";

interface FeedReportItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

interface SiteHomeShellProps {
  reportItems: FeedReportItem[];
  /** From repeated ?topic= / ?course= / ?semester= (parseFeedSelection). */
  initialSelection?: FeedSelection;
  basePath?: string; // default "/c"; preview passes "/preview/c"
  homeHref?: string; // default "/"; preview passes "/preview"
  stickyTop?: string; // default "top-0"; preview passes "top-8" to sit below PreviewBanner
  headerExtra?: React.ReactNode; // e.g. preview's "← 工作區" link
}

export function SiteHomeShell({
  reportItems,
  initialSelection,
  basePath = "/c",
  homeHref = "/",
  stickyTop = "top-0",
  headerExtra,
}: SiteHomeShellProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Site header */}
      <header
        className={`border-border bg-background/95 sticky ${stickyTop} z-40 border-b backdrop-blur`}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href={homeHref} className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">台大社會系</span>
            <span className="text-subtle font-mono text-[0.65rem] tracking-[0.06em]">NTU SOC</span>
          </Link>
          {headerExtra}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1180px] px-6 pt-12">
        <ReportFeed
          reportItems={reportItems}
          initialSelection={initialSelection}
          basePath={basePath}
          homeHref={homeHref}
        />
      </main>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
