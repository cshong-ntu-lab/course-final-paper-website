// /preview — redirects to the first course's preview page, mirroring how / works.

import { redirect } from "next/navigation";

import { getAllCourses } from "@/lib/server/firestore";
import { courseSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function PreviewHomePage() {
  const courses = await getAllCourses();
  if (courses.length > 0) {
    redirect(encodeURI(`/preview/c/${courseSlug(courses[0]!)}`));
  }
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">課程報告 · 台大社會所</h1>
      <p className="text-muted mt-4 text-sm">尚無已建立的課程。</p>
    </main>
  );
}
