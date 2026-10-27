// docs/design-v2.md §4.3 — author page, modelled on twreporter's author page:
// one centred 720px column; avatar beside name, line, bio, topics and counts;
// then the author's published works (written or co-written).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { Footer } from "@/components/Footer";
import { AuthorWorks, type AuthorWork } from "@/components/public/AuthorWorks";
import { SiteHeader } from "@/components/public/SiteHeader";
import { TagPill } from "@/components/TagPill";
import { authorLine, authorStats } from "@/lib/authors";
import { feedFilterHref } from "@/lib/feed";
import { semesterLabel } from "@/lib/semester";
import { getAllCourses, getPublishedReportsByAuthor, getUsersByUids } from "@/lib/server/firestore";
import { courseSlug, estimateReadingMinutes, reportSlug } from "@/lib/slug";

export const revalidate = 60;

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const [user] = await getUsersByUids([uid]);
  if (!user) return {};
  return { title: user.profileDisplayName || user.displayNameGoogle };
}

export default async function AuthorPage({ params }: Props) {
  const { uid } = await params;
  const [user] = await getUsersByUids([uid]);
  if (!user) notFound();

  const [reports, courses] = await Promise.all([getPublishedReportsByAuthor(uid), getAllCourses()]);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const name = user.profileDisplayName || user.displayNameGoogle || "（未署名）";
  const avatarUrl = user.avatarUrl ?? user.photoURLGoogle ?? null;
  // "社會系碩士班 · 112級" once filled in; until then the free-text title
  const line =
    user.degree || user.cohort ? authorLine(user.degree, user.cohort) : user.title || authorLine();
  const stats = authorStats(reports);

  const works: AuthorWork[] = reports.flatMap((r) => {
    const course = courseById.get(r.courseId);
    if (!course || !r.publishedAt) return [];
    return [
      {
        slug: reportSlug(r.uid),
        courseSlug: courseSlug(course),
        title: r.title || "（無標題）",
        author: r.author,
        summary: r.summary,
        coverImageUrl: r.coverImageUrl,
        publishedAt: r.publishedAt.toDate().toISOString(),
        readingMinutes: estimateReadingMinutes(r.contentMd),
        tags: r.tags,
        courseName: course.name,
        semesterTag: semesterLabel(course.year, course.semester),
      },
    ];
  });

  return (
    <div className="bg-background min-h-screen">
      <SiteHeader container="max-w-[720px] px-6" />
      <main id="main" className="mx-auto max-w-[720px] px-6 py-14">
        <Link
          href="/"
          className="text-muted hover:text-foreground mb-10 inline-flex items-center gap-1 text-sm transition-colors"
        >
          ← 返回首頁
        </Link>

        <section className="mb-14 grid grid-cols-[120px_minmax(0,1fr)] items-start gap-8 max-sm:grid-cols-1 max-sm:justify-items-center max-sm:gap-4 max-sm:text-center">
          <Avatar name={name} src={avatarUrl} size="xl" />
          <div className="min-w-0">
            <h1 className="text-title text-foreground m-0 mt-1 mb-1.5 font-serif font-bold">
              {name}
            </h1>
            <p className="text-subtle m-0 text-base">{line}</p>
            {user.bio && (
              <p className="text-ink-read m-0 mt-4 text-base leading-[1.9] text-pretty">
                {user.bio}
              </p>
            )}
            {stats.topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 max-sm:justify-center">
                {stats.topics.map((t) => (
                  <TagPill key={t} kind="topic" href={feedFilterHref({ kind: "topic", value: t })}>
                    {t}
                  </TagPill>
                ))}
              </div>
            )}
            <dl className="border-border m-0 mt-5 flex gap-8 border-t pt-[18px] max-sm:justify-center">
              {[
                ["發表篇數", stats.works],
                ["研究主題", stats.topics.length],
                ["修習課程", stats.courses],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col-reverse gap-0.5">
                  <dt className="text-subtle text-xs">{label}</dt>
                  <dd className="m-0 font-serif text-3xl leading-tight font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <AuthorWorks works={works} />
      </main>
      <Footer />
    </div>
  );
}
