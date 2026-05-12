// design.md §4.2 — three states.
import { cn } from "@/lib/utils";

export type StatusTagKind = "unpublished" | "published" | "published-new";

const MAP: Record<StatusTagKind, { label: string; cls: string; dot: string }> = {
  unpublished: {
    label: "未發布",
    cls: "bg-canvas text-muted border-border-strong",
    dot: "bg-subtle",
  },
  published: {
    label: "已發布",
    cls: "bg-success-soft text-success-fg border-success/40",
    dot: "bg-success",
  },
  "published-new": {
    label: "已發布 · 有新版",
    cls: "bg-warning-soft text-warning-fg border-warning/40",
    dot: "bg-warning",
  },
};

export function StatusTag({ kind }: { kind: StatusTagKind }) {
  const m = MAP[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-sans text-xs font-medium whitespace-nowrap",
        m.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
