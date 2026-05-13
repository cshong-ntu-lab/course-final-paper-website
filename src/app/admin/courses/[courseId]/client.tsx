"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  deleteCourseAction,
  deleteStudentFromCourseAction,
  regenerateCourseCodeAction,
  toggleEnrollmentAction,
} from "@/actions/course";
import { CourseCodeDisplay } from "@/components/admin/CourseCodeDisplay";
import { ReportRow } from "@/components/admin/ReportRow";
import type { AdminReport } from "@/components/admin/ReportRow";

interface Props {
  courseId: string;
  courseName: string;
  code: string;
  enrollmentOpen: boolean;
  reports: AdminReport[];
  studentCount: number;
  publishedCount: number;
  pendingCount: number;
}

export function CourseDetailClient({
  courseId,
  courseName,
  code: initialCode,
  enrollmentOpen: initialOpen,
  reports: initialReports,
  studentCount,
  publishedCount,
  pendingCount,
}: Props) {
  const router = useRouter();
  const [code, setCode] = React.useState(initialCode);
  const [enrollmentOpen, setEnrollmentOpen] = React.useState(initialOpen);
  const [regenerating, setRegenerating] = React.useState(false);
  const [reports, setReports] = React.useState(initialReports);
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

  async function handleDeleteCourse() {
    if (
      !confirm(
        `確定要刪除課程「${courseName}」嗎？\n\n所有學生報告、上傳檔案與註冊記錄都將永久移除，此操作無法復原。\nGoogle Drive 中的備份檔案不受影響。`,
      )
    )
      return;

    const result = await deleteCourseAction(courseId);
    if (result.ok) {
      router.push("/admin");
    } else {
      showToast("刪除失敗，請稍後再試。");
    }
  }

  async function handleDeleteStudent(report: AdminReport) {
    if (
      !confirm(
        `確定要從此課程移除學生「${report.author}」嗎？\n\n該學生的報告與上傳檔案都將永久移除，此操作無法復原。\nGoogle Drive 中的備份檔案不受影響。`,
      )
    )
      return;

    const result = await deleteStudentFromCourseAction(courseId, report.uid);
    if (result.ok) {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      showToast(`已移除 ${report.author}`);
    } else {
      showToast("移除失敗，請稍後再試。");
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
          <div className="grid grid-cols-[120px_1fr_180px_120px_44px] border-b border-border bg-canvas px-5 py-2.5 font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
            <div>作者</div>
            <div>報告</div>
            <div>狀態</div>
            <div className="text-right">最近更新</div>
            <div />
          </div>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} onDelete={() => handleDeleteStudent(r)} />
          ))}
        </div>
      )}

      {/* Delete course — bottom of page, clearly separated */}
      <div className="mt-16 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">刪除課程</p>
            <p className="mt-0.5 text-xs text-subtle">
              永久移除此課程的所有報告與學生資料。Google Drive 備份不受影響。
            </p>
          </div>
          <button
            onClick={handleDeleteCourse}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-400"
          >
            刪除課程
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
