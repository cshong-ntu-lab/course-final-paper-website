export interface TocEntry {
  id: string;
  title: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w一-鿿-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * One flat level of headings: the highest level the body uses for its
 * sections, nothing below it. A body that opens with an h1 (the report title
 * written into the Markdown again) skips that heading, so `# 標題` + `## 節`
 * lists the h2s and `# 標題` + `# 1. 節` lists the other h1s. Headings inside
 * fenced code blocks are ignored.
 */
export function extractToc(markdown: string): TocEntry[] {
  const headings: TocEntry[] = [];
  let fence: string | null = null;
  let seenContent = false;
  for (const line of markdown.split("\n")) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) {
      const mark = f[1]!;
      if (fence === null) fence = mark;
      else if (mark[0] === fence[0] && mark.length >= fence.length) fence = null;
      seenContent = true;
      continue;
    }
    if (fence !== null) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
    if (!m) {
      if (line.trim()) seenContent = true;
      continue;
    }
    const level = m[1]!.length;
    const title = m[2]!.trim();
    const isDocTitle = level === 1 && !seenContent;
    seenContent = true;
    if (isDocTitle) continue; // already shown in the page header
    headings.push({ id: slugify(title), title, level });
  }
  const top = Math.min(...headings.map((h) => h.level));
  return headings.filter((h) => h.level === top);
}
