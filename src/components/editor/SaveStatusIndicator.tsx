"use client";
// design.md §2.2 + §4.1 — three states: saving / saved (with time-since) / offline.

import { CloudOff, Loader2 } from "lucide-react";
import * as React from "react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";

export interface SaveStatusIndicatorProps {
  state: SaveState;
  /** When `state === "saved"`, the time of the last successful save. */
  since?: Date | null;
  className?: string;
}

function secsAgo(d: Date) {
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
}

function formatAgo(seconds: number): string {
  if (seconds < 5) return "剛剛";
  if (seconds < 60) return `${seconds} 秒前`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  return `${h} 小時前`;
}

export function SaveStatusIndicator({ state, since, className }: SaveStatusIndicatorProps) {
  // useSyncExternalStore: server snapshot = false, client snapshot = true.
  // This is the React-blessed way to suppress SSR/hydration mismatches without
  // calling setState inside an effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (state !== "saved" || !since) return;
    const id = setInterval(force, 10_000);
    return () => clearInterval(id);
  }, [state, since]);

  const base = "inline-flex items-center gap-1.5 text-xs font-sans";

  if (state === "saving") {
    return (
      <span className={cn(base, "text-muted", className)} aria-live="polite">
        <Loader2 className="text-accent h-3 w-3 animate-spin" />
        儲存中…
      </span>
    );
  }
  if (state === "offline") {
    return (
      <span
        className={cn(base, "text-warning-fg", className)}
        title="網路斷線，最新草稿暫存於瀏覽器"
        aria-live="polite"
      >
        <CloudOff className="h-3 w-3" />
        離線（已暫存本機）
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className={cn(base, "text-destructive-fg", className)} aria-live="polite">
        儲存失敗 · 將自動重試
      </span>
    );
  }
  if (state === "saved" && since) {
    return (
      <span className={cn(base, "text-muted", className)} aria-live="polite">
        <span className="bg-success animate-saving h-1.5 w-1.5 rounded-full" />
        已儲存{mounted ? ` · ${formatAgo(secsAgo(since))}` : ""}
      </span>
    );
  }
  // idle (no save yet this session) — render nothing to keep the top bar quiet
  return null;
}
