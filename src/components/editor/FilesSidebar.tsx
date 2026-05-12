"use client";
// design.md §3.3 + §2.2 — list student's uploaded images, allow insert / delete / upload.

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import * as React from "react";

import { deleteUploadAction } from "@/actions/report";
import {
  imageMarkdown,
  useImageUpload,
  type UploadResult,
  type UploadState,
} from "@/lib/client/useImageUpload";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  filename: string;
  downloadURL: string;
  sizeBytes: number;
  contentType: string;
}

export interface FilesSidebarProps {
  reportId: string;
  files: UploadedFile[];
  /** Called by the parent to refresh the list after upload/delete. */
  onRefresh: () => void;
  /** Called when the user clicks "Insert" so the parent can insert markdown
   *  into the editor textarea at the current cursor position. */
  onInsert: (markdown: string) => void;
  /** Called after a successful delete so the parent can scrub the URL out
   *  of the markdown content. */
  onAfterDelete?: (downloadURL: string) => void;
}

function bytesToKb(n: number): string {
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

function progressLine(state: UploadState): string | null {
  switch (state.phase) {
    case "compressing":
      return `${state.filename} · 壓縮中…`;
    case "uploading":
      return `${state.filename} · 上傳 ${state.percent}%`;
    case "finalizing":
      return `${state.filename} · 處理中…`;
    case "error":
      return `上傳失敗：${state.error}`;
    default:
      return null;
  }
}

export function FilesSidebar({
  reportId,
  files,
  onRefresh,
  onInsert,
  onAfterDelete,
}: FilesSidebarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { state, upload, reset } = useImageUpload({ reportId });
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so picking the same file again triggers onChange
    for (const f of list) {
      const result = await upload(f);
      if (result) {
        // After each successful upload, refresh list so it shows up immediately.
        onRefresh();
      }
    }
    // After a small delay, clear the progress line so the sidebar quiets.
    setTimeout(reset, 1500);
  };

  const handleInsert = (f: UploadedFile) => {
    onInsert(imageMarkdown({ filename: f.filename, downloadUrl: f.downloadURL }));
  };

  const handleDelete = async (f: UploadedFile) => {
    if (!window.confirm(`確定要刪除「${f.filename}」？此動作不可復原。`)) return;
    setDeletingId(f.id);
    const res = await deleteUploadAction(reportId, f.id);
    setDeletingId(null);
    if (res.ok) {
      onAfterDelete?.(f.downloadURL);
      onRefresh();
    } else {
      window.alert("刪除失敗，請稍後再試。");
    }
  };

  const progress = progressLine(state);

  return (
    <section className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xs text-subtle font-mono uppercase tracking-[0.08em]">
          圖片資源 · {files.length}
        </div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="text-accent hover:text-accent-hover focus-visible:ring-accent inline-flex items-center gap-1 text-xs font-medium transition-colors focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          disabled={state.phase !== "idle" && state.phase !== "done" && state.phase !== "error"}
        >
          <ImagePlus className="h-3.5 w-3.5" /> 上傳
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {progress && (
        <p
          className={cn(
            "flex items-center gap-1.5 font-mono text-xs",
            state.phase === "error" ? "text-destructive-fg" : "text-subtle",
          )}
        >
          {state.phase !== "error" && state.phase !== "done" && (
            <Loader2 className="text-accent h-3 w-3 animate-spin" />
          )}
          {progress}
        </p>
      )}

      {files.length === 0 ? (
        <p className="text-subtle py-2 text-xs italic">尚未上傳任何圖片</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="group hover:bg-surface flex items-center gap-2 rounded px-2 py-1.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.downloadURL}
                alt=""
                className="bg-canvas h-7 w-7 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs">{f.filename}</div>
                <div className="text-2xs text-subtle font-mono">{bytesToKb(f.sizeBytes)}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleInsert(f)}
                  className="text-accent hover:underline text-2xs"
                  aria-label={`插入 ${f.filename}`}
                >
                  插入
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(f)}
                  className="text-muted hover:text-destructive-fg ml-1 text-2xs"
                  aria-label={`刪除 ${f.filename}`}
                  disabled={deletingId === f.id}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Helper so callers don't need to import the type from upload result.
export type { UploadResult };
