export interface TocEntry {
  id: string;
  title: string;
  level: 2 | 3;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w一-鿿-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (!m) continue;
    const level = m[1]!.length as 2 | 3;
    const title = m[2]!.trim();
    entries.push({ id: slugify(title), title, level });
  }
  return entries;
}
