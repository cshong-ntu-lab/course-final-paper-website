// design.md §2.2 — ReportRow in admin course detail table.
import Link from "next/link";

import { StatusTag } from "@/components/ui/StatusTag";
import type { ReportStatus } from "@/lib/types";

export interface AdminReport {
  id: string;
  courseId: string;
  title: string;
  author: string;
  status: ReportStatus;
  updatedRelative: string;
}

export function ReportRow({ report }: { report: AdminReport }) {
  return (
    <Link
      href={`/admin/courses/${report.courseId}/r/${report.id}`}
      className="grid grid-cols-[120px_1fr_180px_120px] items-center border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-canvas"
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
  );
}
