// docs/design-v2.md §2.2 — course and semester are plain text (bold / regular),
// topics are outlined hashtag pills. Order is always course → semester → topic.
import Link from "next/link";

import { foldCardTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

export type TagKind = "topic" | "course" | "semester";

const HASHTAG =
  "inline-flex items-center rounded-full border border-border-strong px-2.5 py-0.5 text-xs text-subtle";

const KIND_CLASSES: Record<TagKind, string> = {
  topic: HASHTAG,
  course: "text-xs font-bold text-gold-ink",
  semester: "text-xs font-normal text-gold-ink",
};

const KIND_HOVER: Record<TagKind, string> = {
  topic: "transition-colors hover:border-accent hover:text-accent",
  course: "hover:underline underline-offset-4",
  semester: "hover:underline underline-offset-4",
};

export function TagPill({
  kind,
  children,
  href,
  className,
}: {
  kind: TagKind;
  children: React.ReactNode;
  /** Filter link; omit inside an element that is already a link (e.g. a card). */
  href?: string;
  className?: string;
}) {
  const cls = cn(KIND_CLASSES[kind], href && KIND_HOVER[kind], className);
  const label = kind === "topic" ? <>#{children}</> : children;
  return href ? (
    <Link href={href} className={cls}>
      {label}
    </Link>
  ) : (
    <span className={cls}>{label}</span>
  );
}

/** Card tag row: course and semester always, then at most one topic hashtag —
 *  extra topics fold into "+N" (its tooltip lists them). The full set is shown
 *  on the article page instead. */
export function CardTags({
  topics,
  course,
  semester,
  className,
}: {
  topics: string[];
  course?: string;
  semester?: string;
  className?: string;
}) {
  const fixed = [course, semester].filter(Boolean).length;
  const { shown, hidden } = foldCardTags(topics, fixed);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}>
      {(course || semester) && (
        <span className="inline-flex items-baseline gap-2.5">
          {course && <TagPill kind="course">{course}</TagPill>}
          {semester && <TagPill kind="semester">{semester}</TagPill>}
        </span>
      )}
      {(shown.length > 0 || hidden.length > 0) && (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {shown.map((t) => (
            <TagPill key={t} kind="topic">
              {t}
            </TagPill>
          ))}
          {hidden.length > 0 && (
            <span className={HASHTAG} title={hidden.join("、")}>
              +{hidden.length}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
