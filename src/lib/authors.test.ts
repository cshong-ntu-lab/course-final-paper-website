import { describe, expect, it } from "vitest";

import {
  authorLine,
  authorName,
  authorStats,
  isCohort,
  isDegree,
  isReportByAuthor,
} from "@/lib/authors";

describe("authorName", () => {
  it("prefers the current profile name over the one stored on the report", () => {
    expect(authorName({ profileDisplayName: "曾于瀞" }, "曾于")).toBe("曾于瀞");
  });

  it("falls back to the stored name without a usable profile name", () => {
    expect(authorName(undefined, "王小明")).toBe("王小明");
    expect(authorName({ profileDisplayName: "  " }, "王小明")).toBe("王小明");
  });
});

describe("authorLine", () => {
  it("joins degree and cohort", () => {
    expect(authorLine("碩士班", 112)).toBe("社會系碩士班 · 112級");
  });

  it("drops whatever is missing", () => {
    expect(authorLine("博士班", null)).toBe("社會系博士班");
    expect(authorLine(null, 113)).toBe("社會系 · 113級");
    expect(authorLine(undefined, undefined)).toBe("社會系");
  });
});

describe("isDegree / isCohort", () => {
  it("accepts only the three programmes", () => {
    expect(isDegree("學士班")).toBe(true);
    expect(isDegree("空間社會學組")).toBe(false);
    expect(isDegree(null)).toBe(false);
  });

  it("accepts integer ROC years in range", () => {
    expect(isCohort(112)).toBe(true);
    expect(isCohort(112.5)).toBe(false);
    expect(isCohort(2023)).toBe(false);
    expect(isCohort("112")).toBe(false);
  });
});

describe("isReportByAuthor", () => {
  const base = { uid: "owner", courseId: "c1" };

  it("matches the owner when no authorUid is set", () => {
    expect(isReportByAuthor(base, "owner")).toBe(true);
  });

  it("prefers authorUid over the owner", () => {
    expect(isReportByAuthor({ ...base, authorUid: "other" }, "owner")).toBe(false);
    expect(isReportByAuthor({ ...base, authorUid: "other" }, "other")).toBe(true);
  });

  it("includes co-authored reports", () => {
    expect(isReportByAuthor({ ...base, coAuthors: [{ uid: "co" }] }, "co")).toBe(true);
  });
});

describe("authorStats", () => {
  it("counts works, distinct topics and distinct courses", () => {
    expect(
      authorStats([
        { uid: "a", courseId: "c1", tags: ["住宅研究", "空間不平等"] },
        { uid: "a", courseId: "c2", tags: ["住宅研究"] },
        { uid: "a", courseId: "c1" },
      ]),
    ).toEqual({ works: 3, topics: ["住宅研究", "空間不平等"], courses: 2 });
  });
});
