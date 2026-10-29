import { describe, expect, it } from "vitest";

import { activeHeading } from "@/lib/scrollSpy";

const VH = 900;

/** Document-relative heading positions → viewport tops at a given scrollY. */
function topsAt(docTops: number[], scrollY: number) {
  return docTops.map((t) => t - scrollY);
}

describe("activeHeading", () => {
  it("returns -1 without headings", () => {
    expect(activeHeading([], VH, 1000)).toBe(-1);
  });

  it("uses the 30% line away from the page bottom", () => {
    // line = 270; heading 1 at 260 is past it, heading 2 at 300 is not
    expect(activeHeading([-500, 260, 300], VH, 5000)).toBe(1);
  });

  it("defaults to the first heading before any heading crosses the line", () => {
    expect(activeHeading([400, 1200], VH, 5000)).toBe(0);
  });

  it("gives every short final section a turn while scrolling to the bottom", () => {
    // long first section, then four short ones crammed near the end
    const docTops = [0, 3000, 3200, 3350, 3450];
    const pageHeight = 3700;
    const maxScroll = pageHeight - VH;
    const seen: number[] = [];
    for (let y = 0; y <= maxScroll; y += 10) {
      const current = activeHeading(topsAt(docTops, y), VH, maxScroll - y);
      if (seen[seen.length - 1] !== current) seen.push(current);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4]);
  });

  it("marks the last heading at the very bottom", () => {
    const docTops = [0, 3000, 3200];
    const maxScroll = 3500 - VH;
    expect(activeHeading(topsAt(docTops, maxScroll), VH, 0)).toBe(2);
  });
});
