// design.md §2.2 — ReportRow in admin course detail table.
import Link from "next/link";

import { StatusTag } from "@/components/ui/StatusTag";
import type { ReportStatus } from "@/lib/types";

export interface AdminReport {
  id: string;
  courseId: string;
  uid: string;
  title: string;
  author: string;
  status: ReportStatus;
  updatedRelative: string;
}

interface Props {
  report: AdminReport;
  onDelete?: () => void;
}

export function ReportRow({ report, onDelete }: Props) {
  return (
    <div className="group grid grid-cols-[120px_1fr_180px_120px_44px] items-center border-b border-border last:border-b-0 transition-colors hover:bg-canvas">
      <Link
        href={`/admin/courses/${report.courseId}/r/${report.id}`}
        className="col-span-4 grid grid-cols-subgrid items-center px-5 py-3.5"
      >
        <div className="font-serif text-sm font-medium">{report.author}</div>
        <div
          className={`font-serif text-[0.9375rem] leading-snug ${
            report.title ? "text-foreground" : "text-subtle italic"
          }`}
        >
          {report.title || "（尚未開始）"}
        </div>
        <div>
          <StatusTag kind={report.status} />
        </div>
        <div className="text-right text-xs text-subtle">{report.updatedRelative}</div>
      </Link>

      <div className="flex items-center justify-center">
        {onDelete && (
          <button
            onClick={onDelete}
            title={`刪除 ${report.author} 的資料`}
            className="flex h-7 w-7 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          >
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
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
