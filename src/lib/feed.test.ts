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
  visibleTopics,
  weightedSample,
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

describe("visibleTopics", () => {
  const topics = ["a", "b", "c", "d", "e"];

  it("shows the first `max` and counts the rest", () => {
    expect(visibleTopics(topics, [], 3)).toEqual({ shown: ["a", "b", "c"], hiddenCount: 2 });
  });

  it("keeps a selected topic past the cut, in its usual order", () => {
    expect(visibleTopics(topics, ["e"], 2)).toEqual({ shown: ["a", "b", "e"], hiddenCount: 2 });
  });

  it("hides nothing when there are few topics", () => {
    expect(visibleTopics(["a"], [], 6)).toEqual({ shown: ["a"], hiddenCount: 0 });
  });
});

describe("weightedSample", () => {
  // deterministic stream of "random" numbers
  const seq = (...xs: number[]) => {
    let i = 0;
    return () => xs[i++ % xs.length]!;
  };

  it("returns k distinct items", () => {
    const out = weightedSample([1, 2, 3, 4, 5, 6], () => 1, 5, seq(0.3, 0.9, 0.1, 0.5, 0.7, 0.2));
    expect(out).toHaveLength(5);
    expect(new Set(out).size).toBe(5);
  });

  it("returns everything when there are fewer than k items", () => {
    expect(weightedSample(["x", "y"], () => 1, 5).sort()).toEqual(["x", "y"]);
  });

  it("with equal draws, the heavier item wins", () => {
    expect(
      weightedSample(["light", "heavy"], (s) => (s === "heavy" ? 10 : 1), 1, seq(0.5)),
    ).toEqual(["heavy"]);
  });

  it("favours heavy items over many draws without excluding light ones", () => {
    const hits = { heavy: 0, light: 0 };
    for (let i = 0; i < 4000; i++) {
      const [pick] = weightedSample(["heavy", "light"] as const, (s) => (s === "heavy" ? 3 : 1), 1);
      hits[pick!]++;
    }
    // P(heavy) = 3/4
    expect(hits.heavy / 4000).toBeGreaterThan(0.7);
    expect(hits.heavy / 4000).toBeLessThan(0.8);
    expect(hits.light).toBeGreaterThan(0);
  });
});
