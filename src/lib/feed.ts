// Home feed filtering — docs/design-v2.md §4.2. Several tags can be selected:
// within a group any selected value matches (OR), across groups all groups
// must match (AND). The selection lives in the URL (?topic=a&topic=b&semester=
// 114-1) so tag links elsewhere on the site can point at a filtered home page.

export type FeedFilterKind = "topic" | "course" | "semester";
export type FeedSelection = Record<FeedFilterKind, string[]>;

export const FEED_FILTER_KINDS: readonly FeedFilterKind[] = ["topic", "course", "semester"];

export const EMPTY_SELECTION: FeedSelection = { topic: [], course: [], semester: [] };

type SearchParams = Record<string, string | string[] | undefined>;

/** Reads repeated ?topic= / ?course= / ?semester= params (trimmed, deduped). */
export function parseFeedSelection(params: SearchParams): FeedSelection {
  const read = (kind: FeedFilterKind) => {
    const raw = params[kind];
    const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((v) => v.trim());
    return [...new Set(values.filter(Boolean))];
  };
  return { topic: read("topic"), course: read("course"), semester: read("semester") };
}

export function selectionCount(sel: FeedSelection): number {
  return sel.topic.length + sel.course.length + sel.semester.length;
}

/** Adds the value if absent, removes it if present. */
export function toggleSelection(
  sel: FeedSelection,
  kind: FeedFilterKind,
  value: string,
): FeedSelection {
  const has = sel[kind].includes(value);
  return { ...sel, [kind]: has ? sel[kind].filter((v) => v !== value) : [...sel[kind], value] };
}

/** `/` with the selection as a query string, e.g. `/?topic=a&topic=b`. */
export function feedSelectionHref(sel: FeedSelection, home = "/"): string {
  const qs = new URLSearchParams();
  for (const kind of FEED_FILTER_KINDS) for (const v of sel[kind]) qs.append(kind, v);
  const s = qs.toString();
  return s ? `${home}?${s}` : home;
}

/** Link to the feed filtered to one tag (tag pills on the reader / author page). */
export function feedFilterHref(filter: { kind: FeedFilterKind; value: string }, home = "/") {
  return feedSelectionHref({ ...EMPTY_SELECTION, [filter.kind]: [filter.value] }, home);
}

interface FeedEntry {
  tags?: string[];
  courseName?: string;
  semesterTag?: string;
}

export function matchesFeedSelection(entry: FeedEntry, sel: FeedSelection): boolean {
  const anyOf = (selected: string[], values: (string | undefined)[]) =>
    selected.length === 0 || values.some((v) => v !== undefined && selected.includes(v));
  return (
    anyOf(sel.topic, entry.tags ?? []) &&
    anyOf(sel.course, [entry.courseName]) &&
    anyOf(sel.semester, [entry.semesterTag])
  );
}

/** Chip groups for the filter panel: topics by frequency (ties keep feed
 *  order), courses in feed order, semesters newest first. */
export function feedFacets(entries: FeedEntry[]): FeedSelection {
  const topicCount = new Map<string, number>();
  for (const e of entries)
    for (const t of e.tags ?? []) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
  const topics = [...topicCount.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const unique = (values: (string | undefined)[]) => [
    ...new Set(values.filter((v): v is string => !!v)),
  ];
  return {
    topic: topics,
    course: unique(entries.map((e) => e.courseName)),
    semester: unique(entries.map((e) => e.semesterTag)).sort((a, b) => b.localeCompare(a)),
  };
}
