// design.md §2.2 — CourseCodeDisplay with copy + regen actions.
"use client";

import { Copy, RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

interface Props {
  code: string;
  enrollmentOpen: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onToggleEnrollment: (open: boolean) => void;
  regenerating?: boolean;
}

export function CourseCodeDisplay({
  code,
  enrollmentOpen,
  onCopy,
  onRegenerate,
  onToggleEnrollment,
  regenerating = false,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-5 py-4">
      <div>
        <div className="font-mono text-2xs mb-1 uppercase tracking-[0.08em] text-subtle">
          邀請學生用此代碼加入
          {!enrollmentOpen && <span className="ml-2 text-warning-fg">(已關閉)</span>}
        </div>
        <div className="font-mono text-[1.625rem] font-semibold tracking-[0.12em] text-accent select-all">
          {code}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCopy} type="button">
          <Copy className="h-3.5 w-3.5" />
          複製
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          disabled={regenerating}
          type="button"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
          重新產生
        </Button>
        <Button
          variant={enrollmentOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onToggleEnrollment(!enrollmentOpen)}
          type="button"
        >
          {enrollmentOpen ? "關閉開放加入" : "開放加入"}
        </Button>
      </div>
    </div>
  );
}
