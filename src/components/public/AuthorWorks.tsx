"use client";
// docs/design-v2.md §4.3 — an author's works, as rows (default, like
// twreporter's author page) or cards. Every work is by this author, so the
// byline is hidden.

import * as React from "react";

import { ReportListItem, type ReportItem } from "@/components/public/ReportListItem";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export interface AuthorWork extends ReportItem {
  courseSlug: string;
}

type View = "list" | "grid";

export function AuthorWorks({ works }: { works: AuthorWork[] }) {
  const [view, setView] = React.useState<View>("list");
  // works rise in one after another on load; switching views only cross-fades
  const [entrance, setEntrance] = React.useState<"stagger-in" | "swap-in">("stagger-in");

  return (
    <section aria-labelledby="author-works">
      <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 max-sm:grid-cols-[1fr_auto]">
        <h2
          id="author-works"
          className="col-start-2 m-0 font-serif text-lg font-bold max-sm:col-start-1"
        >
          所有文章（{works.length}）
        </h2>
        {works.length > 0 && (
          <SegmentedControl
            label="顯示方式"
            value={view}
            onChange={(v) => {
              setEntrance("swap-in");
              setView(v);
            }}
            options={[
              { value: "list", label: "列表" },
              { value: "grid", label: "卡片" },
            ]}
            className="col-start-3 justify-self-end max-sm:col-start-2"
          />
        )}
      </div>

      {works.length === 0 ? (
        <p className="text-muted py-12 text-center text-sm">尚無已發表的文章。</p>
      ) : (
        <div
          key={view}
          className={
            view === "grid"
              ? `${entrance} grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]`
              : `${entrance} flex flex-col gap-3.5`
          }
        >
          {works.map((w, i) => (
            <ReportListItem
              key={`${w.courseSlug}-${w.slug}`}
              report={w}
              courseSlug={w.courseSlug}
              variant={view === "grid" ? "card" : "row"}
              hideByline
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </section>
  );
}
