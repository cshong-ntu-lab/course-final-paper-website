// Root `/` — redirects to the first (newest) course page.
// If no courses exist yet, shows a simple placeholder.

import { redirect } from "next/navigation";

import { getAllCourses } from "@/lib/server/firestore";
import { courseSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const courses = await getAllCourses();
  if (courses.length > 0) {
    redirect(`/c/${courseSlug(courses[0]!)}`);
  }
  // No courses yet — simple placeholder so the site isn't blank.
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">課程報告 · 台大社會所</h1>
      <p className="text-muted mt-4 text-sm">尚無已建立的課程。</p>
    </main>
  );
}
