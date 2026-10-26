import { describe, expect, it } from "vitest";

import { foldCardTags, parseTags } from "@/lib/tags";

describe("foldCardTags", () => {
  it("keeps course + semester and folds extra topics", () => {
    expect(foldCardTags(["勞動研究", "平台經濟", "演算法治理"], 2)).toEqual({
      shown: ["勞動研究"],
      hidden: ["平台經濟", "演算法治理"],
    });
  });

  it("folds nothing when everything fits", () => {
    expect(foldCardTags(["照顧研究"], 2)).toEqual({ shown: ["照顧研究"], hidden: [] });
  });

  it("gives topics all slots when there are no fixed pills", () => {
    expect(foldCardTags(["a", "b", "c", "d"], 0)).toEqual({
      shown: ["a", "b", "c"],
      hidden: ["d"],
    });
  });

  it("always shows at least one topic", () => {
    expect(foldCardTags(["a", "b"], 3)).toEqual({ shown: ["a"], hidden: ["b"] });
  });

  it("handles no topics", () => {
    expect(foldCardTags([], 2)).toEqual({ shown: [], hidden: [] });
  });
});

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
