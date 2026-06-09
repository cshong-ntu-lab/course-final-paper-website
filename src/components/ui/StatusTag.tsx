// design.md §4.2 — three states. published-new renders as two chips.
import { cn } from "@/lib/utils";

export type StatusTagKind =
  | "unpublished"
  | "unpublished-review"
  | "published"
  | "published-new"
  | "published-new-review"
  | "admin-withdrawn"
  | "admin-withdrawn-new"
  | "admin-withdrawn-new-review";

type ChipConfig = { label: string; cls: string; dot: string };

const CHIPS = {
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
  "has-new": {
    label: "有更新",
    cls: "bg-warning-soft text-warning-fg border-warning/40",
    dot: "bg-warning",
  },
  "has-new-review": {
    label: "有更新待審核",
    cls: "bg-warning-soft text-warning-fg border-warning/40",
    dot: "bg-warning",
  },
  "pending-review": {
    label: "待審核",
    cls: "bg-warning-soft text-warning-fg border-warning/40",
    dot: "bg-warning",
  },
  "admin-withdrawn": {
    label: "已撤下",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
} satisfies Record<string, ChipConfig>;

function Chip({ cfg }: { cfg: ChipConfig }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-sans text-xs font-medium whitespace-nowrap",
        cfg.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function StatusTag({ kind }: { kind: StatusTagKind }) {
  if (kind === "unpublished-review") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Chip cfg={CHIPS.unpublished} />
        <Chip cfg={CHIPS["pending-review"]} />
      </span>
    );
  }
  if (kind === "published-new") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Chip cfg={CHIPS.published} />
        <Chip cfg={CHIPS["has-new"]} />
      </span>
    );
  }
  if (kind === "published-new-review") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Chip cfg={CHIPS.published} />
        <Chip cfg={CHIPS["has-new-review"]} />
      </span>
    );
  }
  if (kind === "admin-withdrawn-new") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Chip cfg={CHIPS["admin-withdrawn"]} />
        <Chip cfg={CHIPS["has-new"]} />
      </span>
    );
  }
  if (kind === "admin-withdrawn-new-review") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Chip cfg={CHIPS["admin-withdrawn"]} />
        <Chip cfg={CHIPS["has-new-review"]} />
      </span>
    );
  }
  if (kind === "admin-withdrawn") {
    return <Chip cfg={CHIPS["admin-withdrawn"]} />;
  }
  return <Chip cfg={CHIPS[kind]} />;
}
