// Cover fallback variants — docs/design-v2.md §2.3a. Reports without a cover image
// show a slice of the department mark; each report gets one of six variants
// (mirrored or not × three colour rotations), derived from its id so it never
// changes between visits.

export type CoverPalette = 0 | 1 | 2;

export interface CoverVariant {
  mirror: boolean;
  palette: CoverPalette;
}

export function coverVariant(id: string): CoverVariant {
  let h = 0;
  for (const ch of id) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return { mirror: h % 2 === 1, palette: (Math.floor(h / 2) % 3) as CoverPalette };
}
