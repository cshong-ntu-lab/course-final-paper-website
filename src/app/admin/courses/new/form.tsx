"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { createCourseAction } from "@/actions/course";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  user: { displayName: string; email: string };
}

// ROC (民國) year of the current calendar year.
function currentRocYear(): number {
  return new Date().getFullYear() - 1911;
}

export function NewCourseForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState(String(currentRocYear()));
  const [semester, setSemester] = React.useState<"1" | "2">("1");
  const [description, setDescription] = React.useState("");
  const [courseNo, setCourseNo] = React.useState("");
  const [teacher, setTeacher] = React.useState("");
  const [termRange, setTermRange] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedYear = parseInt(year, 10);
    if (!name.trim()) {
      setError("請輸入課程名稱。");
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 100 || parsedYear > 200) {
      setError("學年度請輸入民國年（例：113）。");
      return;
    }
    setPending(true);
    const result = await createCourseAction({
      name: name.trim(),
      year: parsedYear,
      semester,
      description,
      coverImageUrl: null,
      ...(courseNo.trim() && { courseNo: courseNo.trim() }),
      ...(teacher.trim() && { teacher: teacher.trim() }),
      ...(termRange.trim() && { termRange: termRange.trim() }),
    });
    setPending(false);
    if (!result.ok) {
      setError(
        result.error === "invalid_input"
          ? "輸入格式有誤，請確認。"
          : result.error === "code_conflict"
            ? "系統暫時無法產生代碼，請再試一次。"
            : "發生未預期錯誤，請稍後再試。",
      );
      return;
    }
    router.push(`/admin/courses/${result.courseId}`);
  }

  return (
    <>
      <AppHeader
        context="admin"
        user={user}
        breadcrumb={[{ label: "我的課程", href: "/admin" }, { label: "建立新課程" }]}
      />

      <main id="main" className="mx-auto max-w-2xl px-7 py-10">
        <div className="mb-8">
          <div className="text-2xs text-subtle mb-1.5 font-mono uppercase tracking-[0.12em]">
            管理後台
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">建立新課程</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              課程名稱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：質性研究方法"
              maxLength={120}
              required
              autoFocus
            />
          </div>

          {/* Year + semester row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="year">
                學年度（民國）<span className="text-destructive">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={100}
                max={200}
                placeholder="113"
                required
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="semester">學期</Label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value as "1" | "2")}
                className="h-9 w-full rounded border border-border-strong bg-surface px-3 text-sm
                           focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft"
              >
                <option value="1">第一學期（上）</option>
                <option value="2">第二學期（下）</option>
              </select>
            </div>
          </div>

          {/* Course number + teacher row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="courseNo">課號</Label>
              <Input
                id="courseNo"
                value={courseNo}
                onChange={(e) => setCourseNo(e.target.value)}
                placeholder="如：SOC7821"
                maxLength={30}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="teacher">授課教師</Label>
              <Input
                id="teacher"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="如：王大明"
                maxLength={60}
              />
            </div>
          </div>

          {/* Term range */}
          <div className="space-y-1.5">
            <Label htmlFor="termRange">學期時間</Label>
            <Input
              id="termRange"
              value={termRange}
              onChange={(e) => setTermRange(e.target.value)}
              placeholder="如：2026/02–2026/06"
              maxLength={60}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">課程介紹（顯示於公開頁面副標題）</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={10000}
              placeholder="一句話描述課程定位，顯示為斜體副標題"
              className="w-full resize-y rounded border border-border-strong bg-surface px-3 py-2 text-sm font-mono
                         placeholder:text-subtle leading-relaxed
                         focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft"
            />
          </div>

          {error && (
            <p className="text-destructive-fg bg-destructive-soft rounded border border-destructive/30 px-3.5 py-2.5 text-sm">
              {error}
            </p>
          )}

          {/* Footer action bar */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" asChild>
              <Link href="/admin">取消</Link>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "建立中…" : "建立課程"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
