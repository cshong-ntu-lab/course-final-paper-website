// design.md §3.7 — admin course list.
// Phase 5 will add the per-course pending counts; for now we render a stub
// table with student/report counts and "—" for pending.

import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, enrollmentConverter, reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import type { Course } from "@/lib/types";

interface AdminCourseRow {
  id: string;
  code: string;
  name: string;
  term: string;
  students: number;
  reports: number;
  pending: number;
}

function termLabel(c: Course): string {
  return `${c.year} 學年第 ${c.semester} 學期`;
}

async function loadMyCourses(uid: string): Promise<AdminCourseRow[]> {
  const { db } = getFirebaseAdmin();
  const snap = await db
    .collection("courses")
    .withConverter(courseConverter)
    .where("ownerUid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  return Promise.all(
    snap.docs.map(async (s) => {
      const c = s.data();
      // Cheap counts; Phase 5 will optimise with aggregation queries.
      const [enrollmentsCount, reportsSnap] = await Promise.all([
        db
          .collection("enrollments")
          .withConverter(enrollmentConverter)
          .where("courseId", "==", s.id)
          .count()
          .get()
          .then((r) => r.data().count),
        db.collection("reports").withConverter(reportConverter).where("courseId", "==", s.id).get(),
      ]);
      const publishedCount = reportsSnap.docs.filter((d) => d.data().publishedAt).length;
      const pendingCount = reportsSnap.docs.filter(
        (d) => !d.data().publishedAt || d.data().hasNewChanges,
      ).length;
      return {
        id: s.id,
        code: c.code,
        name: c.name,
        term: termLabel(c),
        students: enrollmentsCount,
        reports: publishedCount,
        pending: pendingCount,
      };
    }),
  );
}

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  const courses = user ? await loadMyCourses(user.uid) : [];

  return (
    <>
      <AppHeader
        context="admin"
        user={{
          displayName: user?.profileDisplayName || user?.displayName || "",
          email: user?.email || "",
        }}
      />
      <main id="main" className="mx-auto max-w-5xl px-7 py-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="text-2xs text-subtle mb-1.5 font-mono uppercase tracking-[0.12em]">
              管理後台
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">我的課程</h1>
            <p className="text-muted mt-1.5 text-sm">
              從這裡{" "}
              <Link href="/workspace" className="text-accent underline underline-offset-[3px]">
                查看學生頁面
              </Link>
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">＋ 建立新課程</Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-md border-border bg-surface flex flex-col items-center gap-4 border px-8 py-16 text-center">
            <h2 className="font-serif text-xl font-semibold">尚未建立任何課程</h2>
            <p className="text-muted max-w-sm text-sm leading-relaxed">
              點「建立新課程」開始第一堂課，系統會自動生成 6 碼註冊代碼給學生使用。
            </p>
          </div>
        ) : (
          <div className="rounded-md border-border bg-surface overflow-hidden border">
            <div className="bg-canvas border-border text-2xs text-subtle grid grid-cols-[120px_1fr_90px_110px_110px] border-b px-5 py-2.5 font-mono uppercase tracking-[0.08em]">
              <div>課程代碼</div>
              <div>課程名稱</div>
              <div className="text-right">學生</div>
              <div className="text-right">已發布</div>
              <div className="text-right">待審核</div>
            </div>
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/admin/courses/${c.id}`}
                className="border-border hover:bg-canvas grid grid-cols-[120px_1fr_90px_110px_110px] items-center border-b px-5 py-4 transition-colors last:border-b-0"
              >
                <div className="font-mono text-sm font-medium">{c.code}</div>
                <div>
                  <div className="font-serif text-base leading-tight font-semibold">{c.name}</div>
                  <div className="text-subtle mt-0.5 text-xs">{c.term}</div>
                </div>
                <div className="text-right font-mono text-sm">{c.students}</div>
                <div className="text-muted text-right font-mono text-sm">{c.reports}</div>
                <div className="text-right">
                  {c.pending > 0 ? (
                    <span className="bg-warning-soft text-warning-fg border-warning/40 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                      <span className="bg-warning h-1.5 w-1.5 rounded-full" />
                      {c.pending} 待審
                    </span>
                  ) : (
                    <span className="text-subtle text-xs">—</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
