// Preview-mode banner shown at the top of all /preview pages.
import { Eye } from "lucide-react";

export function PreviewBanner() {
  return (
    <div className="animate-banner-slide w-full border-b border-warning/40 bg-warning-soft text-warning-fg">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2 font-sans text-xs">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">預覽模式</strong> — 包含未發布草稿，僅授權成員可見。
        </span>
      </div>
    </div>
  );
}
