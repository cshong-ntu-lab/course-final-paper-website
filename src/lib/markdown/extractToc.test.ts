import { describe, expect, it } from "vitest";

import { extractToc } from "@/lib/markdown/extractToc";

const titles = (md: string) => extractToc(md).map((h) => h.title);

describe("extractToc", () => {
  it("lists the other h1s when the body opens with an h1 title", () => {
    const md = [
      "# 畢業歌的情緒變遷",
      "# 1. 動機與問題",
      "## 1.1 背景",
      "# 2. 資料來源",
      "### 爬蟲",
    ].join("\n");
    expect(titles(md)).toEqual(["1. 動機與問題", "2. 資料來源"]);
  });

  it("lists the h2s when the h1 is only the title", () => {
    const md = ["# 前車之鑑", "", "## 總覽", "### 細節", "#### 更細", "## 資料蒐集"].join("\n");
    expect(titles(md)).toEqual(["總覽", "資料蒐集"]);
  });

  it("keeps an h1 that comes after body text", () => {
    const md = ["前言一段。", "# 第一章", "## 小節", "# 第二章"].join("\n");
    expect(titles(md)).toEqual(["第一章", "第二章"]);
  });

  it("uses the top level present when there is no h1", () => {
    const md = ["## 研究動機", "### 背景", "## 結論"].join("\n");
    expect(titles(md)).toEqual(["研究動機", "結論"]);
  });

  it("ignores headings inside fenced code", () => {
    const md = ["# 標題", "## 方法", "```python", "# 讀取資料", "```", "## 結果"].join("\n");
    expect(titles(md)).toEqual(["方法", "結果"]);
  });

  it("drops closing hashes and returns nothing without headings", () => {
    expect(titles("## 結論 ##")).toEqual(["結論"]);
    expect(extractToc("只有內文")).toEqual([]);
  });
});
