import { describe, expect, it } from "vitest";

import {
  addTags,
  foldCardTags,
  matchTagSuggestions,
  normalizeTags,
  parseTags,
  rankTags,
} from "@/lib/tags";

describe("normalizeTags", () => {
  it("splits a tag that holds several comma-joined keywords", () => {
    expect(normalizeTags(["n8n，AI自動化，財劃法，文字分析", "BERT"])).toEqual([
      "n8n",
      "AI自動化",
      "財劃法",
      "文字分析",
      "BERT",
    ]);
  });

  it("trims, drops empties and duplicates", () => {
    expect(normalizeTags([" 勞動 ", "勞動、 ", "", "性別,勞動"])).toEqual(["勞動", "性別"]);
  });

  it("keeps undefined and leaves clean tags alone", () => {
    expect(normalizeTags(undefined)).toBeUndefined();
    expect(normalizeTags(["Machine Learning"])).toEqual(["Machine Learning"]);
  });
});

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

describe("addTags", () => {
  it("adds one keyword, or several from a pasted list", () => {
    expect(addTags(["勞動"], "性別")).toEqual(["勞動", "性別"]);
    expect(addTags([], "勞動、性別，AI")).toEqual(["勞動", "性別", "AI"]);
  });

  it("skips duplicates regardless of case, and blanks", () => {
    expect(addTags(["AI"], "ai, 勞動 ,  ")).toEqual(["AI", "勞動"]);
  });

  it("stops at the limit and drops over-long keywords", () => {
    expect(addTags(["a", "b", "c", "d"], "e, f")).toEqual(["a", "b", "c", "d", "e"]);
    expect(addTags([], "x".repeat(31))).toEqual([]);
  });
});

describe("rankTags", () => {
  it("orders keywords by how many reports use them, ties in first-seen order", () => {
    expect(rankTags([["性別", "勞動"], ["勞動"], undefined, ["AI，勞動"]])).toEqual([
      "勞動",
      "性別",
      "AI",
    ]);
  });
});

describe("matchTagSuggestions", () => {
  const all = ["勞動研究", "平台經濟", "AI", "勞動"];

  it("matches substrings case-insensitively and hides picked tags", () => {
    expect(matchTagSuggestions("勞動", all, ["勞動"])).toEqual(["勞動研究"]);
    expect(matchTagSuggestions("ai", all, [])).toEqual(["AI"]);
  });

  it("lists everything not picked for an empty query, up to the limit", () => {
    expect(matchTagSuggestions("", all, ["AI"], 2)).toEqual(["勞動研究", "平台經濟"]);
  });
});
