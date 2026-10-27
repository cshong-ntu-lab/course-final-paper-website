// docs/design-v2.md §4.0 — data for the public site header: the 文章分類 topics
// and who is signed in. Fetched by SiteHeader on mount so the public pages can
// stay static / ISR (reading the session cookie in the page would make them
// dynamic, and `next build` has no Firestore access).

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { feedFacets } from "@/lib/feed";
import { getCurrentUser } from "@/lib/server/auth";
import {
  getCoursesWithPublishedReports,
  getPublishedReportsByCourse,
} from "@/lib/server/firestore";

export const dynamic = "force-dynamic";

export interface SiteNavData {
  /** Topic tags of published reports, most used first. */
  topics: string[];
  user: {
    name: string;
    avatarUrl: string | null;
    role: "student" | "admin";
  } | null;
}

const getNavTopics = unstable_cache(
  async () => {
    const courses = await getCoursesWithPublishedReports();
    const reports = await Promise.all(courses.map((c) => getPublishedReportsByCourse(c.id)));
    return feedFacets(reports.flat().map((r) => ({ tags: r.tags }))).topic;
  },
  ["site-nav-topics"],
  { revalidate: 300 },
);

export async function GET() {
  const [topics, user] = await Promise.all([getNavTopics(), getCurrentUser()]);
  const body: SiteNavData = {
    topics,
    user: user && {
      name: user.profileDisplayName || user.displayName || user.email,
      avatarUrl: user.avatarUrl ?? user.photoURL,
      role: user.role,
    },
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
