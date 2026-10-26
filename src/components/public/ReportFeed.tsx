"use client";
// docs/design-v2.md §4.2 — sitewide report feed: latest report as the lead
// block, the rest as cards or rows (switchable).

import * as React from "react";

import { ReportListItem, type ReportItem } from "@/components/public/ReportListItem";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeedReportItem extends ReportItem {
  courseSlug: string;
  badgeLabel?: string;
}

interface CourseOption {
  slug: string;
  tag: string;
}

interface ReportFeedProps {
  reportItems: FeedReportItem[];
  courseOptions: CourseOption[];
  basePath?: string; // default "/c"
}

type View = "grid" | "list";

export function ReportFeed({ reportItems, courseOptions, basePath = "/c" }: ReportFeedProps) {
  const [selectedCourse, setSelectedCourse] = React.useState("all");
  const [view, setView] = React.useState<View>("grid");
  // Cards rise in one after another when the set of reports changes (first
  // render, course filter); switching grid ↔ list only cross-fades.
  const [entrance, setEntrance] = React.useState<"stagger-in" | "swap-in">("stagger-in");

  const filtered =
    selectedCourse === "all"
      ? reportItems
      : reportItems.filter((r) => r.courseSlug === selectedCourse);
  const [lead, ...rest] = filtered;

  return (
    <>
      <div className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b pb-[18px]">
        <h2 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]">報告發表</h2>
        <div className="flex items-center gap-3">
          <Select
            value={selectedCourse}
            onValueChange={(v) => {
              setEntrance("stagger-in");
              setSelectedCourse(v);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部課程</SelectItem>
              {courseOptions.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {!lead ? (
        <p className="text-muted py-12 text-center text-sm italic">尚無已發布報告。</p>
      ) : (
        <div key={selectedCourse} className="pt-10">
          <ReportListItem
            report={lead}
            courseSlug={lead.courseSlug}
            variant="lead"
            basePath={basePath}
            badgeLabel={lead.badgeLabel}
            className="rise-once"
          />
          {rest.length > 0 && (
            <div
              key={`${selectedCourse}-${view}`}
              className={
                view === "grid"
                  ? `${entrance} grid gap-[22px] pt-11 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]`
                  : `${entrance} flex flex-col gap-3.5 pt-11`
              }
            >
              {rest.map((r, i) => (
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
          )}
        </div>
      )}
    </>
  );
}
