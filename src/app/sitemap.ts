import type { MetadataRoute } from "next";

import { getAllCourses, getPublishedReportsByCourse } from "@/lib/server/firestore";
import { courseSlug, reportSlug } from "@/lib/slug";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const courses = await getAllCourses();

  const entries: MetadataRoute.Sitemap = [{ url: base, lastModified: new Date() }];

  for (const course of courses) {
    const cSlug = courseSlug(course);
    entries.push({ url: `${base}/c/${cSlug}`, lastModified: course.updatedAt.toDate() });

    const reports = await getPublishedReportsByCourse(course.id);
    for (const r of reports) {
      entries.push({
        url: `${base}/c/${cSlug}/r/${reportSlug(r.uid)}`,
        lastModified: r.publishedAt!.toDate(),
      });
    }
  }

  return entries;
}
