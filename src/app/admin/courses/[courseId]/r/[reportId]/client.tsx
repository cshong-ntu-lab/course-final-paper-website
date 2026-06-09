"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { publishReportAction, withdrawReportAction } from "@/actions/publish";
import { MarkdownRenderer } from "@/lib/markdown/Renderer";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/StatusTag";
import type { ReportStatus } from "@/lib/types";
import { diffViewerStyles } from "@/lib/diff-viewer-theme";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer-continued"), { ssr: false });

type Tab = "latest" | "diff" | "history";
type DiffMode = "source" | "rendered";

interface SnapshotSummary {
  id: string;
  type?: "publish" | "withdraw";
  title: string;
  author: string;
  contentMd: string;
  publishedAtMs: number;
  publishedBy: string;
}

interface Props {
  reportId: string;
  report: {
    title: string;
    author: string;
    contentMd: string;
    updatedAtMs: number;
    publishedAtMs: number | null;
    hasNewChanges: boolean;
    status: ReportStatus;
  };
  latestSnapshotContentMd: string | null;
  snapshots: SnapshotSummary[];
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function relativeTime(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "剛剛";
  if (secs < 3600) return `${Math.floor(secs / 60)} 分鐘前`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} 小時前`;
  return `${Math.floor(secs / 86400)} 天前`;
}

export function ReportReviewClient({
  reportId,
  report,
  latestSnapshotContentMd,
  snapshots,
}: Props) {
  const [snapshotMd, setSnapshotMd] = React.useState(latestSnapshotContentMd);
  const [hasNewChanges, setHasNewChanges] = React.useState(report.hasNewChanges);
  const hasPreviousPublish = snapshotMd !== null;
  const defaultTab: Tab = hasPreviousPublish && report.hasNewChanges ? "diff" : "latest";

  const [tab, setTab] = React.useState<Tab>(defaultTab);
  const [diffMode, setDiffMode] = React.useState<DiffMode>("source");
  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState<string | null>(null);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState(report.status);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handlePublish() {
    setPending(true);
    const result = await publishReportAction(reportId);
    setPending(false);
    setPublishOpen(false);
    if (result.ok) {
      setCurrentStatus("published");
      setHasNewChanges(false);
      setSnapshotMd(report.contentMd);
      showToast("已發布");
    } else {
      showToast("發布失敗，請稍後再試。");
    }
  }

  async function handleWithdraw() {
    setPending(true);
    const result = await withdrawReportAction(reportId);
    setPending(false);
    setWithdrawOpen(false);
    if (result.ok) {
      setCurrentStatus("admin-withdrawn");
      showToast("已撤下報告");
    } else {
      showToast("操作失敗，請稍後再試。");
    }
  }

  const tabCls = (t: Tab) =>
    `py-2.5 px-0 text-sm font-medium border-b-2 rounded-none transition-colors cursor-pointer ${
      tab === t
        ? "text-foreground border-accent"
        : "text-muted border-transparent hover:text-foreground"
    }`;

  const isWithdrawn =
    currentStatus === "admin-withdrawn" || currentStatus === "admin-withdrawn-new";
  const isPublished = currentStatus === "published" || currentStatus === "published-new";

  return (
    <>
      {/* Title + actions */}
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <StatusTag kind={currentStatus} />
            {report.publishedAtMs && (
              <span className="text-xs text-subtle">
                · 上次發布 {formatDate(report.publishedAtMs)}
              </span>
            )}
            <span className="text-xs text-subtle">· {relativeTime(report.updatedAtMs)} 更新</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
            {report.title || "（未命名報告）"}
          </h1>
          <div className="mt-1.5 text-sm text-muted">作者　{report.author}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          {(isPublished || isWithdrawn) && (
            <Button
              variant="destructive"
              onClick={() => setWithdrawOpen(true)}
              type="button"
              disabled={isWithdrawn}
            >
              {isWithdrawn ? "已撤下" : "撤下報告"}
            </Button>
          )}
          <Button onClick={() => setPublishOpen(true)} type="button">
            發布新版本
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-7 border-b border-border">
        <button className={tabCls("latest")} onClick={() => setTab("latest")} type="button">
          Latest
        </button>
        <button className={tabCls("diff")} onClick={() => setTab("diff")} type="button">
          Diff
          {hasNewChanges && (
            <span className="ml-1.5 inline-flex rounded border border-warning/40 bg-warning-soft px-1.5 py-0.5 font-mono text-2xs text-warning-fg">
              新
            </span>
          )}
        </button>
        <button className={tabCls("history")} onClick={() => setTab("history")} type="button">
          History
        </button>
      </div>

      <div className="pt-5">
        {tab === "latest" && (
          <div className="rounded-md border border-border bg-surface p-6">
            <MarkdownRenderer content={report.contentMd} />
          </div>
        )}

        {tab === "diff" && (
          <>
            {!hasPreviousPublish ? (
              <p className="text-sm text-muted">此報告尚未發布過，無法顯示 Diff。</p>
            ) : (
              <>
                {/* Source/Rendered toggle */}
                <div className="mb-4 flex gap-1">
                  {(["source", "rendered"] as DiffMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDiffMode(m)}
                      className={`h-7 rounded border px-3 text-xs transition-colors ${
                        diffMode === m
                          ? "border-border-strong bg-canvas text-foreground"
                          : "border-transparent text-muted hover:text-foreground"
                      }`}
                    >
                      {m === "source" ? "Source" : "Rendered"}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-md border border-border">
                  <ReactDiffViewer
                    oldValue={snapshotMd ?? ""}
                    newValue={report.contentMd}
                    splitView={false}
                    useDarkTheme={false}
                    styles={diffViewerStyles}
                    hideLineNumbers={false}
                    renderContent={
                      diffMode === "rendered"
                        ? (src) => <MarkdownRenderer content={src} />
                        : undefined
                    }
                  />
                </div>
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {snapshots.length === 0 ? (
              <p className="text-sm text-muted">尚無任何發布紀錄。</p>
            ) : (
              <>
                <div className="overflow-hidden rounded-md border border-border bg-surface">
                  <div className="grid grid-cols-[1fr_160px_24px] border-b border-border bg-canvas px-5 py-2.5 font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
                    <div>版本</div>
                    <div className="text-right">時間</div>
                    <div />
                  </div>
                  {snapshots.map((s, i) => {
                    const selected = selectedSnapshotId === s.id;
                    const isWithdrawEntry = s.type === "withdraw";
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          !isWithdrawEntry && setSelectedSnapshotId(selected ? null : s.id)
                        }
                        className={[
                          "grid w-full grid-cols-[1fr_160px_24px] items-center border-b border-border px-5 py-3.5 text-left last:border-b-0 transition-colors",
                          isWithdrawEntry
                            ? "cursor-default opacity-70"
                            : selected
                              ? "bg-accent/5"
                              : "hover:bg-canvas",
                        ].join(" ")}
                      >
                        <div>
                          {isWithdrawEntry ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-2xs text-destructive">
                                撤下
                              </span>
                              <span className="text-xs text-subtle">管理員撤下報告</span>
                            </div>
                          ) : (
                            <>
                              <div className="font-serif text-sm font-medium">
                                {s.title || "（未命名）"}
                                {i === 0 && snapshots[0]?.type !== "withdraw" && (
                                  <span className="ml-2 font-mono text-2xs text-subtle">
                                    （最新）
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-subtle">{s.author}</div>
                            </>
                          )}
                        </div>
                        <div className="text-right text-xs text-subtle">
                          {formatDate(s.publishedAtMs)}
                        </div>
                        <div className="flex justify-end">
                          {!isWithdrawEntry && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`text-subtle transition-transform ${selected ? "rotate-180" : ""}`}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const sel = snapshots.find((s) => s.id === selectedSnapshotId);
                  if (!sel) return null;
                  return (
                    <div className="mt-4 rounded-md border border-border bg-surface">
                      <div className="flex items-baseline justify-between border-b border-border px-5 py-3">
                        <div className="font-serif text-sm font-semibold">
                          {sel.title || "（未命名）"}
                        </div>
                        <div className="text-xs text-subtle">
                          {sel.author} · 發布於 {formatDate(sel.publishedAtMs)}
                        </div>
                      </div>
                      <div className="p-6">
                        <MarkdownRenderer content={sel.contentMd} />
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>

      {/* Publish confirmation dialog */}
      {publishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="font-serif text-xl font-semibold">發布新版本？</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              學生最新的草稿將取代目前的公開版本。已發布的舊版會保留在 History 中，可隨時參閱。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPublishOpen(false)} type="button">
                取消
              </Button>
              <Button onClick={handlePublish} disabled={pending} type="button">
                {pending ? "發布中…" : "確認發布"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw confirmation dialog */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="font-serif text-xl font-semibold text-destructive">撤下報告？</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              此報告將從公開首頁下架，並標記為「已撤下」。學生看到的狀態為「未發布」。撤下紀錄會保存在
              History 中，可重新發布。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setWithdrawOpen(false)} type="button">
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleWithdraw}
                disabled={pending}
                type="button"
              >
                {pending ? "處理中…" : "確認撤下"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
