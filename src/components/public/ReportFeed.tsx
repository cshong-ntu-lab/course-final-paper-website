"use client";

import * as React from "react";

import { ReportListItem, type ReportItem } from "@/components/public/ReportListItem";
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

export function ReportFeed({ reportItems, courseOptions, basePath = "/c" }: ReportFeedProps) {
  const [selectedCourse, setSelectedCourse] = React.useState("all");

  const filtered =
    selectedCourse === "all"
      ? reportItems
      : reportItems.filter((r) => r.courseSlug === selectedCourse);

  return (
    <>
      <div className="border-border flex items-baseline justify-between border-b pb-[18px]">
        <h2 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]">報告發表</h2>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted py-12 text-center text-sm italic">尚無已發布報告。</p>
      ) : (
        <>
          {/* Lead card — always shown when there are reports */}
          <ReportListItem
            report={filtered[0]!}
            courseSlug={filtered[0]!.courseSlug}
            variant="lead"
            basePath={basePath}
            badgeLabel={filtered[0]!.badgeLabel}
          />

          {/* Remaining reports grid */}
          {filtered.length >= 2 && (
            <div className="grid grid-cols-1 gap-9 pt-11 md:grid-cols-3">
              {filtered.slice(1).map((r) => (
                <ReportListItem
                  key={`${r.courseSlug}-${r.slug}`}
                  report={r}
                  courseSlug={r.courseSlug}
                  variant="default"
                  basePath={basePath}
                  badgeLabel={r.badgeLabel}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
