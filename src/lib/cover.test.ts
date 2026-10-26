import { describe, expect, it } from "vitest";

import { coverVariant } from "@/lib/cover";

describe("coverVariant", () => {
  it("is stable for the same id", () => {
    expect(coverVariant("abc_uid123")).toEqual(coverVariant("abc_uid123"));
  });

  it("matches the prototype's hash", () => {
    // h = 31*h + codePoint, kept unsigned 32-bit; "ab" → 31*97 + 98 = 3105
    expect(coverVariant("ab")).toEqual({ mirror: true, palette: Math.floor(3105 / 2) % 3 });
  });

  it("handles non-ASCII ids", () => {
    const v = coverVariant("課程_報告");
    expect(typeof v.mirror).toBe("boolean");
    expect([0, 1, 2]).toContain(v.palette);
  });

  it("reaches all six variants across ids", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const v = coverVariant(`course_${i}`);
      seen.add(`${v.mirror}-${v.palette}`);
    }
    expect(seen.size).toBe(6);
  });

  it("returns a valid variant for an empty id", () => {
    expect(coverVariant("")).toEqual({ mirror: false, palette: 0 });
  });
});
