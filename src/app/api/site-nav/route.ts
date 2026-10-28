// docs/design-v2.md §4.0 — data for the public site header: the 文章分類
// courses and topics, and who is signed in. Fetched by SiteHeader on mount so the public pages can
// stay static / ISR (reading the session cookie in the page would make them
// dynamic, and `next build` has no Firestore access).

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { feedFacets, navCourses, type NavCourse } from "@/lib/feed";
import { getCurrentUser } from "@/lib/server/auth";
import {
  getCoursesWithPublishedReports,
  getPublishedReportsByCourse,
} from "@/lib/server/firestore";
import { semesterLabel } from "@/lib/semester";

export const dynamic = "force-dynamic";

export interface SiteNavData {
  /** Course offerings with published reports, newest semester first. */
  courses: NavCourse[];
  /** Topic tags of published reports, most used first. */
  topics: string[];
  user: {
    name: string;
    avatarUrl: string | null;
    role: "student" | "admin";
  } | null;
}

const getNavCategories = unstable_cache(
  async () => {
    const courses = await getCoursesWithPublishedReports();
    const reports = await Promise.all(courses.map((c) => getPublishedReportsByCourse(c.id)));
    return {
      courses: navCourses(
        courses.map((c) => ({ name: c.name, semester: semesterLabel(c.year, c.semester) })),
      ),
      topics: feedFacets(reports.flat().map((r) => ({ tags: r.tags }))).topic,
    };
  },
  ["site-nav-categories"],
  { revalidate: 300 },
);

export async function GET() {
  const [{ courses, topics }, user] = await Promise.all([getNavCategories(), getCurrentUser()]);
  const body: SiteNavData = {
    courses,
    topics,
    user: user && {
      name: user.profileDisplayName || user.displayName || user.email,
      avatarUrl: user.avatarUrl ?? user.photoURL,
      role: user.role,
    },
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
