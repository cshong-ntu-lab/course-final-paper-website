"use client";

import * as React from "react";

import { regenerateCourseCodeAction, toggleEnrollmentAction } from "@/actions/course";
import { CourseCodeDisplay } from "@/components/admin/CourseCodeDisplay";
import { ReportRow } from "@/components/admin/ReportRow";
import type { AdminReport } from "@/components/admin/ReportRow";

interface Props {
  courseId: string;
  code: string;
  enrollmentOpen: boolean;
  reports: AdminReport[];
  studentCount: number;
  publishedCount: number;
  pendingCount: number;
}

export function CourseDetailClient({
  courseId,
  code: initialCode,
  enrollmentOpen: initialOpen,
  reports,
  studentCount,
  publishedCount,
  pendingCount,
}: Props) {
  const [code, setCode] = React.useState(initialCode);
  const [enrollmentOpen, setEnrollmentOpen] = React.useState(initialOpen);
  const [regenerating, setRegenerating] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    showToast("已複製代碼");
  }

  async function handleRegenerate() {
    if (!confirm("確定要重新產生代碼嗎？舊代碼將立即失效。")) return;
    setRegenerating(true);
    const result = await regenerateCourseCodeAction(courseId);
    setRegenerating(false);
    if (result.ok) {
      setCode(result.code);
      showToast("代碼已更新");
    } else {
      showToast("無法產生代碼，請稍後再試。");
    }
  }

  async function handleToggleEnrollment(open: boolean) {
    const result = await toggleEnrollmentAction(courseId, open);
    if (result.ok) {
      setEnrollmentOpen(result.open);
      showToast(open ? "已開放學生加入" : "已關閉加入");
    }
  }

  return (
    <>
      <CourseCodeDisplay
        code={code}
        enrollmentOpen={enrollmentOpen}
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
        onToggleEnrollment={handleToggleEnrollment}
        regenerating={regenerating}
      />

      <div className="mt-8 mb-3.5 flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold">學生報告</h2>
        <div className="text-xs text-subtle">
          共 {studentCount} 位學生 · {publishedCount} 份已發布 · {pendingCount} 份待審核
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-surface px-8 py-14 text-center">
          <p className="font-serif text-base text-muted">此課程尚無任何報告。</p>
          <p className="text-sm text-subtle">學生加入課程後，他們的報告草稿會出現在這裡。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="grid grid-cols-[120px_1fr_180px_120px] border-b border-border bg-canvas px-5 py-2.5 font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
            <div>作者</div>
            <div>報告</div>
            <div>狀態</div>
            <div className="text-right">最近更新</div>
          </div>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
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
