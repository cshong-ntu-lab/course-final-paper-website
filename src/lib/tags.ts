/** Splits a free-text tags field into individual tags. Accepts ASCII comma,
 *  fullwidth comma (，), and ideographic comma (、) as separators, since
 *  students commonly type with a Chinese IME that inserts fullwidth commas. */
export function parseTags(input: string): string[] {
  return input
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean);
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
