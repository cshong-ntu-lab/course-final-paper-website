// docs/design-v2.md §3.3 (D9) — the abstract lives only in Report.summary.
// Reports written from the old template also carry it as a "## 摘要" section in
// the body; the reader and TOC skip that section (up to the next h1/h2).

const ABSTRACT_HEADING = /^##\s+摘要\s*#*\s*$/;
const SECTION_END = /^#{1,2}\s/;

export function stripAbstractSection(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let skipping = false;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && ABSTRACT_HEADING.test(line.trimEnd())) {
      skipping = true;
      continue;
    }
    if (skipping && !inFence && SECTION_END.test(line)) skipping = false;
    if (!skipping) out.push(line);
  }
  return out.join("\n").replace(/^\n+/, "");
}
