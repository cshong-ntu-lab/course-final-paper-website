"use client";
// Counts one view per report per browser session for the home carousel's
// weighting (docs/design-v2.md §4.2). Public reader only — /preview doesn't
// mount it. The page is ISR, so the count can't happen during render.

import * as React from "react";

export function ViewCounter({ reportId }: { reportId: string }) {
  React.useEffect(() => {
    const key = `viewed:${reportId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: count anyway
    }
    void fetch("/api/reports/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
      keepalive: true,
    }).catch(() => {});
  }, [reportId]);
  return null;
}
