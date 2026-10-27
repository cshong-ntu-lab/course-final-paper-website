import { describe, expect, it } from "vitest";

import {
  EMPTY_SELECTION,
  feedFacets,
  feedFilterHref,
  feedSelectionHref,
  matchesFeedSelection,
  parseFeedSelection,
  selectionCount,
  toggleSelection,
} from "@/lib/feed";

describe("parseFeedSelection", () => {
  it("reads repeated params per group", () => {
    expect(parseFeedSelection({ topic: ["住宅研究", "勞動研究"], semester: "114-1" })).toEqual({
      topic: ["住宅研究", "勞動研究"],
      course: [],
      semester: ["114-1"],
    });
  });

  it("trims, drops blanks and dedupes", () => {
    expect(parseFeedSelection({ topic: [" a ", "", "a"] })).toEqual({
      ...EMPTY_SELECTION,
      topic: ["a"],
    });
    expect(parseFeedSelection({})).toEqual(EMPTY_SELECTION);
  });
});

describe("toggleSelection / selectionCount", () => {
  it("adds and removes a value", () => {
    const one = toggleSelection(EMPTY_SELECTION, "topic", "a");
    expect(one.topic).toEqual(["a"]);
    expect(toggleSelection(one, "topic", "a").topic).toEqual([]);
  });

  it("counts every selected value", () => {
    expect(selectionCount({ topic: ["a", "b"], course: ["X"], semester: [] })).toBe(3);
  });
});

describe("feedSelectionHref / feedFilterHref", () => {
  it("repeats params in group order", () => {
    const sel = { topic: ["a", "b"], course: [], semester: ["114-1"] };
    expect(feedSelectionHref(sel)).toBe("/?topic=a&topic=b&semester=114-1");
    expect(feedSelectionHref(sel, "/preview")).toBe("/preview?topic=a&topic=b&semester=114-1");
  });

  it("returns home for an empty selection", () => {
    expect(feedSelectionHref(EMPTY_SELECTION)).toBe("/");
  });

  it("links a single tag", () => {
    expect(feedFilterHref({ kind: "topic", value: "住宅研究" })).toBe(
      `/?topic=${encodeURIComponent("住宅研究")}`,
    );
  });

  it("round-trips through parseFeedSelection", () => {
    const sel = { topic: ["住宅研究"], course: ["AI工作坊 - 測試"], semester: ["114-1"] };
    const qs = new URLSearchParams(feedSelectionHref(sel).split("?")[1]);
    const params = Object.fromEntries(
      ["topic", "course", "semester"].map((k) => [k, qs.getAll(k)]),
    );
    expect(parseFeedSelection(params)).toEqual(sel);
  });
});

describe("matchesFeedSelection", () => {
  const entry = {
    tags: ["住宅研究", "空間不平等"],
    courseName: "社會統計方法",
    semesterTag: "114-1",
  };

  it("matches everything with an empty selection", () => {
    expect(matchesFeedSelection({}, EMPTY_SELECTION)).toBe(true);
  });

  it("ORs values within a group", () => {
    expect(
      matchesFeedSelection(entry, { ...EMPTY_SELECTION, topic: ["勞動研究", "住宅研究"] }),
    ).toBe(true);
    expect(matchesFeedSelection(entry, { ...EMPTY_SELECTION, topic: ["勞動研究"] })).toBe(false);
  });

  it("ANDs across groups", () => {
    expect(
      matchesFeedSelection(entry, { topic: ["住宅研究"], course: [], semester: ["114-1"] }),
    ).toBe(true);
    expect(
      matchesFeedSelection(entry, { topic: ["住宅研究"], course: [], semester: ["114-2"] }),
    ).toBe(false);
  });

  it("does not match a topic against the course name", () => {
    expect(matchesFeedSelection(entry, { ...EMPTY_SELECTION, topic: ["社會統計方法"] })).toBe(
      false,
    );
  });
});

describe("feedFacets", () => {
  it("orders topics by frequency, courses by appearance, semesters newest first", () => {
    expect(
      feedFacets([
        { tags: ["b"], courseName: "X", semesterTag: "114-1" },
        { tags: ["a", "b"], courseName: "Y", semesterTag: "115-1" },
        { tags: ["a"], courseName: "X", semesterTag: "114-2" },
        { tags: ["c"] },
      ]),
    ).toEqual({
      topic: ["b", "a", "c"],
      course: ["X", "Y"],
      semester: ["115-1", "114-2", "114-1"],
    });
  });
});
