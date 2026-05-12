// design.md §2.2 — student variant. Public + admin variants come in Phase 4/5.
import Link from "next/link";

import { StatusTag, type StatusTagKind } from "@/components/ui/StatusTag";

export interface StudentCourseCardData {
  id: string;
  code: string;
  name: string;
  term: string;
  teacher: string;
  mine: {
    title: string | null;
    status: StatusTagKind;
    updated: string;
  } | null;
}

export function CourseCard({ course }: { course: StudentCourseCardData }) {
  return (
    <Link
      href={`/workspace/c/${course.id}`}
      className="group border-border bg-surface hover:border-border-strong block rounded-md border px-5 py-5 transition-colors"
    >
      <div className="text-2xs text-subtle font-mono uppercase tracking-[0.08em]">
        {course.code} · {course.term}
      </div>
      <h3 className="group-hover:text-accent mt-1 font-serif text-xl font-semibold leading-tight tracking-tight">
        {course.name}
      </h3>
      <p className="text-muted mt-1 text-xs">{course.teacher}</p>

      {course.mine && (
        <div className="border-border mt-4 border-t pt-3.5">
          <div className="text-2xs text-subtle mb-1.5 font-mono uppercase tracking-[0.08em]">
            我的報告
          </div>
          {course.mine.title ? (
            <>
              <div className="mb-2 font-serif text-sm font-medium leading-snug">
                {course.mine.title}
              </div>
              <div className="flex items-center justify-between">
                <StatusTag kind={course.mine.status} />
                <span className="text-2xs text-subtle">更新於 {course.mine.updated}</span>
              </div>
            </>
          ) : (
            <p className="text-subtle text-sm italic">尚未開始 · 點此建立報告</p>
          )}
        </div>
      )}
    </Link>
  );
}
