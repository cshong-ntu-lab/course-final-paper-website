"use client";
// Student editor client wrapper — design.md §3.3 (E3 Focus Mode).
// - Three-pane shell (sidebar / source / preview), mode switcher in top bar
// - 30s-debounced autosave + Ctrl-S manual save + localStorage mirror
// - File upload UX is added in task F (this file leaves the slot open)

import { ArrowLeft, PanelRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { saveReportDraftAction, type SaveReportPatch } from "@/actions/report";
import { FilesSidebar, type UploadedFile } from "@/components/editor/FilesSidebar";
import { SaveStatusIndicator, type SaveState } from "@/components/editor/SaveStatusIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageMarkdown, useImageUpload } from "@/lib/client/useImageUpload";
import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { cn } from "@/lib/utils";

// MDEditor is client-only + heavy → dynamic import keeps it out of the server bundle.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="bg-canvas text-subtle flex h-full items-center justify-center text-sm">
      載入編輯器…
    </div>
  ),
});

export interface EditorReport {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  contentMd: string;
  publishedAt: string | null;
  hasNewChanges: boolean;
  updatedAtIso: string;
}

type Mode = "write" | "both" | "preview";

const AUTOSAVE_DEBOUNCE_MS = 30_000;
const AUTOSAVE_MAX_WAIT_MS = 120_000;

interface LocalDraft {
  contentMd: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  savedAt: number; // epoch ms
}

function lsKey(reportId: string) {
  return `draft:${reportId}`;
}

function readLocalDraft(reportId: string): LocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lsKey(reportId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraft;
  } catch {
    return null;
  }
}

function writeLocalDraft(reportId: string, draft: LocalDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lsKey(reportId), JSON.stringify(draft));
  } catch {
    /* quota / private mode — ignore */
  }
}

function clearLocalDraft(reportId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(lsKey(reportId));
  } catch {
    /* ignore */
  }
}

export function ReportEditor({
  initial,
  initialUploads,
}: {
  initial: EditorReport;
  initialUploads: UploadedFile[];
}) {
  const router = useRouter();

  // --- state -------------------------------------------------------------
  const [mode, setMode] = React.useState<Mode>("both");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const [draft, setDraft] = React.useState<string>(initial.contentMd);
  const [title, setTitle] = React.useState(initial.title);
  const [author, setAuthor] = React.useState(initial.author);
  const [summary, setSummary] = React.useState(initial.summary);
  const [optimisticUploadCount, setOptimisticUploadCount] = React.useState(0);

  // After a drag/paste upload, ask the server-rendered list to refresh.
  // initialUploads is re-fetched by the parent server component on refresh.
  const refreshUploads = React.useCallback(() => {
    setOptimisticUploadCount(0);
    router.refresh();
  }, [router]);

  // Initial save state reflects what's on the server: it IS saved, just from a
  // previous session. Showing "已儲存 · N 前" immediately on load is friendlier
  // than a blank indicator.
  const [save, setSave] = React.useState<{ state: SaveState; since: Date | null }>({
    state: "saved",
    since: new Date(initial.updatedAtIso),
  });
  // Always start online=true so SSR matches first client render; sync the real
  // navigator.onLine in an effect on mount. Otherwise hydration mismatches
  // because navigator is undefined on the server.
  const [online, setOnline] = React.useState(true);

  // --- offline detection ------------------------------------------------
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // --- localStorage recovery prompt on mount ----------------------------
  // If the local draft is newer than the server's last-updated timestamp,
  // ask the user whether to restore it. One-shot effect; eslint flags
  // setState-in-effect but this is the legitimate one-time-on-mount case.
  React.useEffect(() => {
    const local = readLocalDraft(initial.id);
    if (!local) return;
    const serverMs = new Date(initial.updatedAtIso).getTime();
    if (local.savedAt <= serverMs) {
      clearLocalDraft(initial.id);
      return;
    }
    const restore = window.confirm(
      "偵測到瀏覽器本地有較新的草稿（可能因為網路斷線未上傳）。要還原嗎？",
    );
    if (restore) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(local.contentMd);
      setTitle(local.title);
      setAuthor(local.author);
      setSummary(local.summary);
    } else {
      clearLocalDraft(initial.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  // --- debounced autosave with max-wait ---------------------------------
  // Tracks the most-recent patch + commits when either:
  //   (a) the debounce timer fires (30s of quiet), or
  //   (b) the max-wait window elapses since the first dirty change.
  // Manual Ctrl/Cmd+S triggers an immediate flush.
  const dirtyRef = React.useRef<SaveReportPatch | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = React.useRef(false);
  const queuedFlushRef = React.useRef(false);
  // Ref-indirection lets `flush` re-invoke itself without TDZ issues.
  const flushRef = React.useRef<() => Promise<void>>(() => Promise.resolve());

  const flush = React.useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    if (!dirtyRef.current) {
      // Nothing to save — flash "已儲存 · 剛剛" so the user gets visible
      // confirmation that the click registered.
      setSave({ state: "saved", since: new Date() });
      return;
    }
    if (inFlightRef.current) {
      queuedFlushRef.current = true;
      return;
    }
    const patch = dirtyRef.current;
    dirtyRef.current = null;
    inFlightRef.current = true;
    setSave({ state: "saving", since: null });
    const res = await saveReportDraftAction(initial.id, patch);
    inFlightRef.current = false;
    if (res.ok) {
      const now = new Date();
      setSave({ state: "saved", since: now });
      clearLocalDraft(initial.id);
    } else {
      setSave({ state: "error", since: null });
    }
    if (queuedFlushRef.current) {
      queuedFlushRef.current = false;
      // Schedule recursive call via the ref to avoid the TDZ + lint warning.
      void flushRef.current();
    }
  }, [initial.id]);

  React.useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const queueAutosave = React.useCallback(
    (patch: SaveReportPatch) => {
      // Merge into the pending patch (last-write-wins per field).
      dirtyRef.current = { ...(dirtyRef.current ?? {}), ...patch };

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => void flush(), AUTOSAVE_MAX_WAIT_MS);
      }
    },
    [flush],
  );

  // --- mirror to localStorage only while there's a pending unsaved change.
  // Once flushed (state === "saved"), the in-flight handler clears the
  // backup; we just keep the latest values mirrored *during* the dirty
  // window so an offline / crash mid-edit can recover.
  React.useEffect(() => {
    if (dirtyRef.current === null) return;
    writeLocalDraft(initial.id, {
      contentMd: draft,
      title,
      author,
      summary,
      coverImageUrl: initial.coverImageUrl,
      savedAt: Date.now(),
    });
  }, [draft, title, author, summary, initial.id, initial.coverImageUrl]);

  // --- Ctrl/Cmd+S keyboard shortcut -------------------------------------
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  // --- flush on visibility hidden / unload ------------------------------
  React.useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [flush]);

  // --- editor area ref for paste / drag-drop / cursor-insert -----------
  const editorContainerRef = React.useRef<HTMLDivElement>(null);

  // Drop indicator state. When the user drags an image over the editor pane,
  // we compute the line they're hovering over and show a horizontal accent
  // line at the bottom of that line. The corresponding char offset is stashed
  // in dropOffsetRef so the drop handler inserts at the right place.
  const [dropIndicatorY, setDropIndicatorY] = React.useState<number | null>(null);
  const dropOffsetRef = React.useRef<number | null>(null);

  function getActiveTextarea(): HTMLTextAreaElement | null {
    return editorContainerRef.current?.querySelector("textarea") ?? null;
  }

  // Map mouse Y → line index → char offset, return both the indicator Y to
  // paint and the offset for insertion.
  function computeDropTarget(clientY: number): { offset: number; indicatorY: number } | null {
    const ta = getActiveTextarea();
    if (!ta) return null;
    const rect = ta.getBoundingClientRect();
    const styles = window.getComputedStyle(ta);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const paddingTop = parseFloat(styles.paddingTop) || 0;

    const relativeY = clientY - rect.top - paddingTop + ta.scrollTop;
    const lineIndex = Math.max(0, Math.floor(relativeY / lineHeight));
    const lines = draft.split("\n");
    const clampedLine = Math.min(lineIndex, lines.length - 1);

    let offset = 0;
    for (let i = 0; i <= clampedLine; i++) {
      offset += lines[i]?.length ?? 0;
      if (i < clampedLine) offset += 1; // newline between lines
    }
    // Insert at end of the hovered line (between its trailing char and the next \n).
    // For the indicator we want the bottom edge of that line, relative to the
    // editor container (NOT the textarea, since the indicator overlay is
    // mounted on the container).
    const containerRect = editorContainerRef.current?.getBoundingClientRect();
    const indicatorY = containerRect
      ? (clampedLine + 1) * lineHeight + paddingTop - ta.scrollTop + (rect.top - containerRect.top)
      : 0;
    return { offset, indicatorY };
  }

  const insertAt = React.useCallback(
    (snippet: string, offset: number) => {
      const before = draft.slice(0, offset);
      const after = draft.slice(offset);
      const lead = before.length === 0 || before.endsWith("\n") ? "" : "\n";
      const trail = after.startsWith("\n") || after.length === 0 ? "" : "\n";
      const next = `${before}${lead}${snippet}${trail}${after}`;
      setDraft(next);
      queueAutosave({ contentMd: next });
      const ta = getActiveTextarea();
      if (ta) {
        requestAnimationFrame(() => {
          const newPos = before.length + lead.length + snippet.length;
          ta.focus();
          ta.setSelectionRange(newPos, newPos);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft],
  );

  const insertAtCursor = React.useCallback(
    (snippet: string) => {
      const ta = getActiveTextarea();
      const offset = ta ? ta.selectionStart : draft.length;
      insertAt(snippet, offset);
    },
    [insertAt, draft],
  );

  // Uploader specifically for paste/drag-drop. The sidebar has its own.
  const inlineUpload = useImageUpload({ reportId: initial.id });

  const uploadFilesAndInsert = React.useCallback(
    async (fileList: FileList | File[], dropOffset?: number) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      setOptimisticUploadCount((n) => n + files.length);
      // For drop-with-offset, accumulate inserts at the drop point — each
      // successive image lands right after the previous one.
      let cursorOffset = dropOffset ?? null;
      for (const f of files) {
        const res = await inlineUpload.upload(f);
        if (res) {
          const snippet = imageMarkdown({ filename: res.filename, downloadUrl: res.downloadUrl });
          if (cursorOffset !== null) {
            insertAt(snippet, cursorOffset);
            cursorOffset += snippet.length + 1; // approximate; ok for ordering
          } else {
            insertAtCursor(snippet);
          }
        }
      }
      refreshUploads();
    },
    [inlineUpload, insertAt, insertAtCursor, refreshUploads],
  );

  // Native capture-phase drop handlers — @uiw/react-md-editor's textarea has
  // its own drop behavior that swallows the FIRST drop. Attaching at the
  // container in capture phase guarantees we intercept the event before any
  // descendant handler can act on it.
  React.useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const onDragOver = (e: DragEvent) => {
      if (!Array.from(e.dataTransfer?.types ?? []).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      const target = computeDropTarget(e.clientY);
      if (target) {
        setDropIndicatorY(target.indicatorY);
        dropOffsetRef.current = target.offset;
      }
    };
    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const offset = dropOffsetRef.current ?? undefined;
      setDropIndicatorY(null);
      dropOffsetRef.current = null;
      void uploadFilesAndInsert(files, offset);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.target === container) {
        setDropIndicatorY(null);
        dropOffsetRef.current = null;
      }
    };
    const onDragEnd = () => {
      setDropIndicatorY(null);
      dropOffsetRef.current = null;
    };

    container.addEventListener("dragover", onDragOver, { capture: true });
    container.addEventListener("drop", onDrop, { capture: true });
    container.addEventListener("dragleave", onDragLeave, { capture: true });
    container.addEventListener("dragend", onDragEnd, { capture: true });
    return () => {
      container.removeEventListener("dragover", onDragOver, { capture: true });
      container.removeEventListener("drop", onDrop, { capture: true });
      container.removeEventListener("dragleave", onDragLeave, { capture: true });
      container.removeEventListener("dragend", onDragEnd, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadFilesAndInsert, draft]);

  // --- field handlers ---------------------------------------------------
  const handleDraftChange = (v: string | undefined) => {
    const value = v ?? "";
    setDraft(value);
    queueAutosave({ contentMd: value });
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    queueAutosave({ title: e.target.value });
  };
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
    queueAutosave({ author: e.target.value });
  };
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
    queueAutosave({ summary: e.target.value });
  };

  // --- render -----------------------------------------------------------
  const effectiveSaveState: SaveState = !online ? "offline" : save.state;

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Top bar */}
      <header className="border-border bg-background flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/workspace"
            className="text-muted hover:text-foreground transition-colors"
            aria-label="返回工作區"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-2xs text-subtle font-mono whitespace-nowrap uppercase tracking-[0.06em]">
            {initial.courseName}
          </span>
          <span className="text-border-strong">/</span>
          <span className="truncate font-serif text-sm font-semibold">{title || "（無標題）"}</span>
        </div>

        {/* Mode switcher (md+) */}
        <div className="bg-canvas border-border hidden rounded border p-0.5 md:flex">
          {(["write", "both", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              className={cn(
                "text-muted h-7 rounded-sm px-3 text-xs font-medium transition-colors",
                mode === v && "bg-surface text-foreground shadow-sm",
              )}
            >
              {v === "write" ? "Write" : v === "both" ? "Both" : "Preview"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator state={effectiveSaveState} since={save.since} />
          <span className="bg-border h-5 w-px" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-pressed={sidebarOpen}
          >
            <PanelRight className="mr-1.5 h-4 w-4" /> 資源
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void flush()}>
            <kbd className="text-2xs text-subtle mr-1 font-mono">⌘S</kbd> 儲存
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1" data-color-mode="light">
          {(mode === "write" || mode === "both") && (
            <div
              ref={editorContainerRef}
              className={cn(
                "relative min-w-0",
                mode === "both" ? "border-border flex-1 border-r" : "flex-1",
              )}
              onPaste={(e) => {
                const imageItems = Array.from(e.clipboardData?.items ?? []).filter((it) =>
                  it.type.startsWith("image/"),
                );
                if (imageItems.length === 0) return;
                e.preventDefault();
                const files = imageItems
                  .map((it) => it.getAsFile())
                  .filter((f): f is File => f !== null);
                void uploadFilesAndInsert(files);
              }}
            >
              <MDEditor
                value={draft}
                onChange={handleDraftChange}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                height="100%"
                className="!bg-background !rounded-none !border-0"
              />
              {dropIndicatorY !== null && (
                <div
                  aria-hidden="true"
                  className="bg-accent pointer-events-none absolute right-0 left-0 z-50 h-0.5 transition-opacity"
                  style={{ top: dropIndicatorY }}
                />
              )}
            </div>
          )}
          {(mode === "preview" || mode === "both") && (
            <div className="bg-background min-w-0 flex-1 overflow-auto">
              <div className="mx-auto max-w-[680px] px-10 py-12">
                <MarkdownRenderer content={draft} />
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <aside className="border-border bg-canvas hidden w-72 shrink-0 overflow-y-auto border-l md:block">
            <section className="space-y-4 p-4">
              <div className="text-2xs text-subtle font-mono uppercase tracking-[0.08em]">資訊</div>

              <div>
                <Label htmlFor="meta-title">標題</Label>
                <Input id="meta-title" value={title} onChange={handleTitleChange} />
              </div>

              <div>
                <Label htmlFor="meta-author">作者名稱</Label>
                <Input id="meta-author" value={author} onChange={handleAuthorChange} />
              </div>

              <div>
                <Label htmlFor="meta-summary">摘要</Label>
                <textarea
                  id="meta-summary"
                  value={summary}
                  onChange={handleSummaryChange}
                  rows={3}
                  className="border-border-strong bg-surface placeholder:text-subtle focus-visible:border-accent focus-visible:ring-accent-soft min-h-[80px] w-full resize-y rounded border px-3 py-2 font-sans text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
                />
              </div>

              <div>
                <Label>封面圖</Label>
                <div className="text-subtle border-border bg-surface flex aspect-[3/2] w-full items-center justify-center rounded border border-dashed text-xs">
                  封面圖（任務 F：上傳支援）
                </div>
              </div>
            </section>

            <div className="border-border border-t">
              <FilesSidebar
                reportId={initial.id}
                files={initialUploads}
                onRefresh={refreshUploads}
                onInsert={insertAtCursor}
                onAfterDelete={(deletedUrl) => {
                  // Remove `![alt](deletedUrl)` and `![alt](deletedUrl "caption")` lines.
                  const escaped = deletedUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  const pattern = new RegExp(
                    `^!\\[[^\\]]*\\]\\(${escaped}(?:\\s+"[^"]*")?\\)\\s*$\\n?`,
                    "gm",
                  );
                  const scrubbed = draft.replace(pattern, "");
                  if (scrubbed !== draft) {
                    setDraft(scrubbed);
                    queueAutosave({ contentMd: scrubbed });
                  }
                }}
              />
              {optimisticUploadCount > 0 && (
                <p className="text-subtle px-4 pb-3 font-mono text-xs">
                  上傳中 · {optimisticUploadCount} 個檔案處理中
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
