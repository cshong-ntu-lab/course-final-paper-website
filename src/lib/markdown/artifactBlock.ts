// ```artifact fenced blocks — a student-uploaded single-file HTML page embedded
// as a sandboxed window. See docs/html-artifact-embed.md.
//
// Block body: first non-empty line is the Storage download URL; the rest are
// optional `key: value` lines (title, ratio). Unknown keys are ignored.

export const ARTIFACT_RATIOS = ["16:9", "4:3", "1:1", "9:16"] as const;
export type ArtifactRatio = (typeof ARTIFACT_RATIOS)[number];

export const DEFAULT_ARTIFACT_TITLE = "互動網頁";

/** Same as storage.rules / UPLOAD_MAX_BYTES. */
export const ARTIFACT_MAX_BYTES = 10 * 1024 * 1024;

export interface ArtifactBlock {
  url: string;
  title: string;
  ratio: ArtifactRatio;
}

function isRatio(s: string): s is ArtifactRatio {
  return (ARTIFACT_RATIOS as readonly string[]).includes(s);
}

export function parseArtifactBlock(body: string): ArtifactBlock | null {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const url = lines[0];
  if (!url || !/^https?:\/\/\S+$/.test(url)) return null;

  let title = DEFAULT_ARTIFACT_TITLE;
  let ratio: ArtifactRatio = "16:9";
  for (const line of lines.slice(1)) {
    const m = /^([a-z]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === "title" && value) title = value;
    if (key === "ratio" && isRatio(value)) ratio = value;
  }
  return { url, title, ratio };
}

/** Markdown snippet inserted into the editor after an HTML upload. */
export function artifactMarkdown(opts: { url: string; title?: string; ratio?: ArtifactRatio }) {
  // Titles are single-line; collapse anything that would break the block.
  const title = (opts.title ?? "").replace(/\s+/g, " ").replace(/`/g, "'").trim();
  return [
    "```artifact",
    opts.url,
    `title: ${title || DEFAULT_ARTIFACT_TITLE}`,
    `ratio: ${opts.ratio ?? "16:9"}`,
    "```",
  ].join("\n");
}

/** Remove every ```artifact block that points at `url` (used after deleting
 *  the uploaded file). */
export function removeArtifactBlocks(md: string, url: string): string {
  return md.replace(/^```artifact[ \t]*\n([\s\S]*?)^```[ \t]*$\n?/gm, (whole, body: string) =>
    parseArtifactBlock(body)?.url === url ? "" : whole,
  );
}

const STORAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "127.0.0.1:9199",
  "localhost:9199",
]);

/** Only HTML files uploaded to this site's bucket under `reports/` may be
 *  embedded — never arbitrary third-party pages. */
export function isAllowedArtifactUrl(url: string, bucket: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (!STORAGE_HOSTS.has(u.host)) return false;
  if (u.host === "firebasestorage.googleapis.com" && u.protocol !== "https:") return false;
  const prefix = `/v0/b/${bucket}/o/`;
  if (!u.pathname.startsWith(prefix)) return false;
  let objectPath: string;
  try {
    objectPath = decodeURIComponent(u.pathname.slice(prefix.length));
  } catch {
    return false;
  }
  if (objectPath.includes("..")) return false;
  return objectPath.startsWith("reports/") && /\.html?$/i.test(objectPath);
}

export function isHtmlFile(file: { name: string; type: string }): boolean {
  return file.type === "text/html" || /\.html?$/i.test(file.name);
}

/** The document's <title>, if any — used as the default window title. */
export function extractHtmlTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const t = m?.[1]?.replace(/\s+/g, " ").trim();
  return t ? t : null;
}

const ABSOLUTE_REF = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Relative asset references (src / href / CSS url()) that won't resolve
 *  once the file is uploaded on its own. Returned de-duplicated, in order. */
export function findRelativeAssetRefs(html: string): string[] {
  const found = new Set<string>();
  const add = (raw: string | undefined) => {
    const ref = raw?.trim();
    if (!ref || ABSOLUTE_REF.test(ref) || ref.startsWith("{") || ref.startsWith("$")) return;
    found.add(ref);
  };
  for (const m of html.matchAll(/\s(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) add(m[2]);
  for (const m of html.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) add(m[2]);
  return [...found];
}
