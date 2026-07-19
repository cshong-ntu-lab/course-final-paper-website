// Single source of truth for the sitewide report feed layout — shared by the
// public homepage (/) and the preview homepage (/preview). Any layout change
// here applies to both automatically; do not fork this into separate copies.

import Link from "next/link";

import { Footer } from "@/components/Footer";
import { ReportFeed } from "@/components/public/ReportFeed";
import type { ReportItem } from "@/components/public/ReportListItem";

const SITE_TITLE_LINE1 = "台大社會系";
const SITE_TITLE_LINE2 = "人工智慧課程成果";
const SITE_QUOTE =
  "The future of AI research will require training models to better understand the science of social relationships.";
const SITE_QUOTE_CITATION =
  "C.A. Bail, Can Generative AI improve social science?, Proc. Natl. Acad. Sci. U.S.A. 121 (21) e2314021121 (2024).";

interface FeedReportItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

interface SiteHomeShellProps {
  reportItems: FeedReportItem[];
  courseOptions: { slug: string; tag: string }[];
  basePath?: string; // default "/c"; preview passes "/preview/c"
  homeHref?: string; // default "/"; preview passes "/preview"
  stickyTop?: string; // default "top-0"; preview passes "top-8" to sit below PreviewBanner
  headerExtra?: React.ReactNode; // e.g. preview's "← 工作區" link
}

export function SiteHomeShell({
  reportItems,
  courseOptions,
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

      <main id="main" className="mx-auto max-w-[1180px] px-6 pt-[72px]">
        {/* Masthead */}
        <section className="animate-fade-up border-b-2 border-foreground pb-9 text-center">
          <div className="mb-[18px] inline-flex flex-wrap items-center justify-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.28em] text-subtle">
            <span>NTU SOC</span>
            <span className="bg-accent animate-pulse-dot inline-block h-[5px] w-[5px] rounded-full" />
            <span>{reportItems.length} ARTICLES</span>
          </div>

          <h1 className="m-0 font-serif text-[72px] font-semibold leading-[1.02] tracking-[-0.035em]">
            <span className="block">{SITE_TITLE_LINE1}</span>
            <span className="block">{SITE_TITLE_LINE2}</span>
          </h1>

          <div className="mt-3 flex justify-center">
            <span className="bg-accent animate-draw-line inline-block h-[2px] w-16 origin-left" />
          </div>

          <blockquote className="text-muted mx-auto mt-[22px] max-w-[44ch] font-serif italic text-[19px] leading-[1.55] text-pretty">
            &ldquo;{SITE_QUOTE}&rdquo;
          </blockquote>
          <p className="text-subtle mx-auto mt-2.5 max-w-[44ch] font-sans text-[12px] leading-[1.6] text-pretty">
            {SITE_QUOTE_CITATION}
          </p>
        </section>

        {/* Reports section */}
        <section className="pt-[52px]">
          <ReportFeed reportItems={reportItems} courseOptions={courseOptions} basePath={basePath} />
        </section>
      </main>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
