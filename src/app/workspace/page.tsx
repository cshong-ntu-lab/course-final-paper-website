// design.md §3.6 — student course list.
// Queries: enrollments where uid == me + load each course + my report status.

import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { CourseCard, type StudentCourseCardData } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { courseConverter, enrollmentConverter, reportConverter } from "@/lib/firestore/converters";
import { getCurrentUser } from "@/lib/server/auth";
import { reportId, type Course, type Report } from "@/lib/types";

function termLabel(c: Course): string {
  return `${c.year} 學年第 ${c.semester} 學期`;
}

function relativeDays(updatedAt: Report["updatedAt"] | undefined | null): string {
  if (!updatedAt) return "—";
  const ts = updatedAt as unknown as { toDate?: () => Date };
  if (typeof ts.toDate !== "function") return "—";
  const d = ts.toDate();
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 週前`;
  return d.toISOString().slice(0, 10);
}

async function loadMyCourses(uid: string): Promise<StudentCourseCardData[]> {
  const { db } = getFirebaseAdmin();

  const enrollments = await db
    .collection("enrollments")
    .withConverter(enrollmentConverter)
    .where("uid", "==", uid)
    .orderBy("enrolledAt", "desc")
    .get();

  const rows = await Promise.all(
    enrollments.docs.map(async (eSnap) => {
      const e = eSnap.data();
      const [courseSnap, reportSnap] = await Promise.all([
        db.collection("courses").withConverter(courseConverter).doc(e.courseId).get(),
        db
          .collection("reports")
          .withConverter(reportConverter)
          .doc(reportId(e.courseId, uid))
          .get(),
      ]);
      const course = courseSnap.data();
      if (!course) return null;
      const report = reportSnap.data();
      const status: StudentCourseCardData["mine"] = report
        ? {
            title: report.title || null,
            status: !report.publishedAt
              ? "unpublished"
              : report.hasNewChanges
                ? "published-new"
                : "published",
            updated: relativeDays(report.updatedAt),
          }
        : null;
      return {
        id: courseSnap.id,
        code: course.code,
        name: course.name,
        term: termLabel(course),
        teacher: "老師", // placeholder; teacher.displayName lookup in Phase 5
        mine: status,
      } satisfies StudentCourseCardData;
    }),
  );

  return rows.filter((r): r is StudentCourseCardData => r !== null);
}

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/workspace");
  if (user.role === "admin") redirect("/admin");
  if (!user.isOnboarded) redirect("/workspace/onboarding");

  const courses = await loadMyCourses(user.uid);

  return (
    <div className="bg-background min-h-screen">
      <AppHeader
        context="student"
        user={{ displayName: user.profileDisplayName || user.displayName, email: user.email }}
      />
      <Workspace courses={courses} />
      <Footer />
    </div>
  );
}

function Workspace({ courses }: { courses: StudentCourseCardData[] }) {
  return (
    <main id="main" className="mx-auto max-w-4xl px-7 py-12">
      <div className="mb-8">
        <div className="text-2xs text-subtle mb-2 font-mono uppercase tracking-[0.12em]">
          我的工作區
        </div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {courses.length > 0
            ? `${courses.length} 門課，${courses.length} 份報告`
            : "尚未加入任何課程"}
        </h1>
        <p className="text-muted mt-2 font-serif text-base">
          選擇要繼續寫的課程，或{" "}
          <Link
            href="/workspace/onboarding"
            className="text-accent underline underline-offset-[3px]"
          >
            加入新課程
          </Link>
          。
        </p>
        {courses.length > 0 && (
          <p className="text-muted mt-1 font-serif text-base">
            到{" "}
            <Link href="/preview" className="text-accent underline underline-offset-[3px]">
              預覽頁
            </Link>
            看看你的報告草稿在正式網站上的樣子！
          </p>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-md border-border bg-surface flex flex-col items-center gap-4 border px-8 py-12 text-center">
          <h2 className="font-serif text-xl font-semibold">輸入課程代碼開始撰寫</h2>
          <p className="text-muted max-w-sm text-sm leading-relaxed">
            從老師那裡拿到 6 碼課程代碼，加入後即可開始撰寫期末報告。
          </p>
          <Button asChild className="mt-2">
            <Link href="/workspace/onboarding">輸入課程代碼</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
          <Link
            href="/workspace/onboarding"
            className="border-border-strong text-muted hover:border-accent hover:text-accent flex min-h-[196px] items-center justify-center gap-2.5 rounded-md border border-dashed px-5 transition-colors"
          >
            <span className="text-sm">＋ 加入新課程</span>
          </Link>
        </div>
      )}
    </main>
  );
}
