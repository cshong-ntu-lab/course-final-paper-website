// Single source of truth for the sitewide report feed layout — shared by the
// public homepage (/) and the preview homepage (/preview). Any layout change
// here applies to both automatically; do not fork this into separate copies.

import { Footer } from "@/components/Footer";
import { ReportFeed } from "@/components/public/ReportFeed";
import type { ReportItem } from "@/components/public/ReportListItem";
import { SiteHeader } from "@/components/public/SiteHeader";

interface FeedReportItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

interface SiteHomeShellProps {
  reportItems: FeedReportItem[];
  basePath?: string; // default "/c"; preview passes "/preview/c"
  homeHref?: string; // default "/"; preview passes "/preview"
  stickyTop?: string; // default "top-0"; preview passes "top-8" to sit below PreviewBanner
  /** Carousel picks (see ReportFeed); preview omits it and shows the latest. */
  leadKeys?: string[];
}

export function SiteHomeShell({
  reportItems,
  basePath = "/c",
  homeHref = "/",
  stickyTop = "top-0",
  leadKeys,
}: SiteHomeShellProps) {
  return (
    <div className="bg-background min-h-screen">
      <SiteHeader homeHref={homeHref} stickyTop={stickyTop} />

      <main id="main" className="mx-auto max-w-[1180px] px-6 pt-12">
        <ReportFeed
          reportItems={reportItems}
          basePath={basePath}
          homeHref={homeHref}
          leadKeys={leadKeys}
        />
      </main>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
