import { describe, expect, it } from "vitest";

import { parseTags } from "@/lib/tags";

describe("parseTags", () => {
  it("splits on ASCII commas", () => {
    expect(parseTags("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("splits on fullwidth commas", () => {
    expect(parseTags("n8n，AI自動化，財劃法，文字分析")).toEqual([
      "n8n",
      "AI自動化",
      "財劃法",
      "文字分析",
    ]);
  });

  it("splits on ideographic commas", () => {
    expect(parseTags("一、二、三")).toEqual(["一", "二", "三"]);
  });

  it("splits on a mix of separators", () => {
    expect(parseTags("a,b，c、d")).toEqual(["a", "b", "c", "d"]);
  });

  it("trims whitespace around tags", () => {
    expect(parseTags(" a , b ,c ")).toEqual(["a", "b", "c"]);
  });

  it("drops empty tags from consecutive separators", () => {
    expect(parseTags("a,,b，，c")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });
});
