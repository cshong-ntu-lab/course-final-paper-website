// docs/design-v2.md §2.2 — three tag kinds, three soft colours, pill-shaped.
// Order is always topic → course → semester.
import Link from "next/link";

import { foldCardTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

export type TagKind = "topic" | "course" | "semester";

const KIND_CLASSES: Record<TagKind, string> = {
  topic: "bg-accent-soft text-accent",
  course: "bg-gold-soft text-gold-ink",
  semester: "bg-stone-soft text-stone",
};

const PILL = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

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
  const cls = cn(PILL, KIND_CLASSES[kind], href && "hover:brightness-95", className);
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

/** Card tag row: at most three pills — course and semester always, extra
 *  topics folded into "+N" (its tooltip lists them). The full set is shown on
 *  the article page instead. */
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
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((t) => (
        <TagPill key={t} kind="topic">
          {t}
        </TagPill>
      ))}
      {course && <TagPill kind="course">{course}</TagPill>}
      {semester && <TagPill kind="semester">{semester}</TagPill>}
      {hidden.length > 0 && (
        <span className={cn(PILL, "bg-canvas text-subtle")} title={hidden.join("、")}>
          +{hidden.length}
        </span>
      )}
    </div>
  );
}
