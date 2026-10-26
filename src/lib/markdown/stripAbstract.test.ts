import { describe, expect, it } from "vitest";

import { stripAbstractSection } from "@/lib/markdown/stripAbstract";

describe("stripAbstractSection", () => {
  it("drops the old template's abstract section up to the next h2", () => {
    const md = "## 摘要\n\n這是摘要。\n\n## 一、研究動機\n\n內文";
    expect(stripAbstractSection(md)).toBe("## 一、研究動機\n\n內文");
  });

  it("keeps h3s inside other sections", () => {
    const md = "## 一、方法\n\n### 摘要\n\n小節";
    expect(stripAbstractSection(md)).toBe(md);
  });

  it("drops a final abstract section through the end", () => {
    expect(stripAbstractSection("## 一\n\n文\n\n## 摘要\n\n尾")).toBe("## 一\n\n文\n");
  });

  it("does not touch a '## 摘要' line inside a code fence", () => {
    const md = "## 一\n\n```md\n## 摘要\n```\n\n文";
    expect(stripAbstractSection(md)).toBe(md);
  });

  it("only matches a heading that is exactly 摘要", () => {
    const md = "## 摘要與研究問題\n\n文";
    expect(stripAbstractSection(md)).toBe(md);
  });

  it("returns the input unchanged without an abstract section", () => {
    expect(stripAbstractSection("## 一\n\n文")).toBe("## 一\n\n文");
  });
});
