// Preview-mode banner shown at the top of all /preview pages. Sticky and exactly
// h-8 tall: the site and reader headers stick at top-8 right beneath it.
import { Eye } from "lucide-react";

export function PreviewBanner() {
  return (
    <div className="border-warning/40 bg-warning-soft text-warning-fg sticky top-0 z-50 h-8 w-full border-b">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-2 px-5 font-sans text-xs">
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          <strong className="font-semibold">預覽模式</strong> — 草稿只有作者本人與管理員看得到。
        </span>
      </div>
    </div>
  );
}
