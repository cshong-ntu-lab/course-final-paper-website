/** Splits a free-text tags field into individual tags. Accepts ASCII comma,
 *  fullwidth comma (，), and ideographic comma (、) as separators, since
 *  students commonly type with a Chinese IME that inserts fullwidth commas. */
export function parseTags(input: string): string[] {
  return input
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Splits every stored tag with parseTags and drops duplicates. Tags saved
 *  before parseTags learned the fullwidth comma can hold several keywords in
 *  one string (「n8n，AI自動化，財劃法」); reads and writes both go through this. */
export function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return tags;
  return [...new Set(tags.flatMap(parseTags))];
}

/** Pills a card shows at most — docs/design-v2.md §2.2. */
export const CARD_TAG_MAX = 3;

/** Splits a card's topic keywords into shown and folded ("+N"). The course and
 *  semester pills (`fixedCount`) are always shown, so only topics fold, and at
 *  least one topic stays visible. */
export function foldCardTags(
  topics: string[],
  fixedCount: number,
  max: number = CARD_TAG_MAX,
): { shown: string[]; hidden: string[] } {
  const slots = Math.max(1, max - fixedCount);
  return { shown: topics.slice(0, slots), hidden: topics.slice(slots) };
}

/** Keywords one report can carry; the save action enforces the same limits. */
export const TAGS_MAX_COUNT = 5;
export const TAG_MAX_LEN = 30;

/** Adds the keywords typed or pasted into the tag picker. A paste such as
 *  「勞動、性別」 becomes two tags; duplicates (case-insensitive), over-long
 *  keywords and anything past the limit are dropped. */
export function addTags(current: string[], raw: string, max = TAGS_MAX_COUNT): string[] {
  const next = [...current];
  const seen = new Set(current.map((t) => t.toLowerCase()));
  for (const tag of parseTags(raw)) {
    if (next.length >= max) break;
    if (tag.length > TAG_MAX_LEN || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    next.push(tag);
  }
  return next;
}

/** Every keyword used across reports, most-used first (ties in first-seen order) —
 *  the picker's list of existing tags. */
export function rankTags(tagLists: (string[] | undefined)[]): string[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) {
    for (const tag of normalizeTags(tags) ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([, ca], [, cb]) => cb - ca).map(([tag]) => tag);
}

/** Existing tags that match what's being typed, minus the ones already picked. */
export function matchTagSuggestions(
  query: string,
  suggestions: string[],
  selected: string[],
  limit = 8,
): string[] {
  const q = query.trim().toLowerCase();
  const picked = new Set(selected.map((t) => t.toLowerCase()));
  return suggestions
    .filter((t) => !picked.has(t.toLowerCase()) && t.toLowerCase().includes(q))
    .slice(0, limit);
}
