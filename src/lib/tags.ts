/** Splits a free-text tags field into individual tags. Accepts ASCII comma,
 *  fullwidth comma (，), and ideographic comma (、) as separators, since
 *  students commonly type with a Chinese IME that inserts fullwidth commas. */
export function parseTags(input: string): string[] {
  return input
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean);
}
