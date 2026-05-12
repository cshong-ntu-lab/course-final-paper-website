// URL pattern detection for the 4 supported embed platforms + rehype-sanitize
// schema extension whitelisting our custom embed elements + KaTeX MathML + hljs classes.

import { defaultSchema } from "rehype-sanitize";

export type EmbedKind = "youtube" | "instagram" | "facebook" | "threads";

export interface EmbedMatch {
  kind: EmbedKind;
  /** YouTube only — the video ID extracted for direct iframe embedding. */
  id?: string;
}

const YOUTUBE_WATCH = /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/;
const YOUTUBE_SHORT = /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})/;
const YOUTUBE_EMBED_URL = /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})/;
const INSTAGRAM = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?/;
const FACEBOOK =
  /^https?:\/\/(?:www\.)?facebook\.com\/(?:[^/]+\/(?:posts|videos|photos)\/|share\/[pv]\/|watch\/?\?v=)/;
const THREADS = /^https?:\/\/(?:www\.)?threads\.(?:net|com)\/@[^/]+\/post\/[A-Za-z0-9_-]+/;

export function detectEmbed(url: string): EmbedMatch | null {
  const m1 = YOUTUBE_WATCH.exec(url) ?? YOUTUBE_SHORT.exec(url) ?? YOUTUBE_EMBED_URL.exec(url);
  if (m1) return { kind: "youtube", id: m1[1] };
  if (INSTAGRAM.test(url)) return { kind: "instagram" };
  if (FACEBOOK.test(url)) return { kind: "facebook" };
  if (THREADS.test(url)) return { kind: "threads" };
  return null;
}

const baseAttrs = defaultSchema.attributes ?? {};

// Classes are not a security vector — XSS risk is in scripts, iframes, and
// event handlers, all of which the default sanitize schema blocks. So
// allowing arbitrary classes on span/div/code/pre is safe and keeps KaTeX
// (50+ class prefixes) + hljs (~30+) + any future renderer working without
// constant schema updates.
const ANY_CLASS = /.*/;

export const embedSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // Our embeds
    "youtube-embed",
    "instagram-embed",
    "facebook-embed",
    "threads-embed",
    // KaTeX MathML output
    "math",
    "annotation",
    "semantics",
    "mrow",
    "mi",
    "mn",
    "mo",
    "msup",
    "msub",
    "msubsup",
    "mfrac",
    "msqrt",
    "mroot",
    "mstyle",
    "mtext",
    "mspace",
  ],
  attributes: {
    ...baseAttrs,
    code: [...(baseAttrs.code ?? []), ["className", ANY_CLASS]],
    span: [...(baseAttrs.span ?? []), ["className", ANY_CLASS], "style"],
    pre: [...(baseAttrs.pre ?? []), ["className", ANY_CLASS]],
    div: [...(baseAttrs.div ?? []), ["className", ANY_CLASS]],
    // Preserve `title` on <img> so single-image paragraphs can surface it
    // as <figcaption>. defaultSchema strips it.
    img: [...(baseAttrs.img ?? []), "title"],
    // KaTeX MathML elements — pass through any class + math-specific attrs.
    math: [["className", /.*/], "xmlns", "display"],
    annotation: [["className", /.*/], "encoding"],
    semantics: [["className", /.*/]],
    mrow: [["className", /.*/]],
    mi: [["className", /.*/], "mathvariant"],
    mn: [["className", /.*/]],
    mo: [["className", /.*/]],
    msup: [["className", /.*/]],
    msub: [["className", /.*/]],
    msubsup: [["className", /.*/]],
    mfrac: [["className", /.*/]],
    msqrt: [["className", /.*/]],
    mroot: [["className", /.*/]],
    mstyle: [["className", /.*/], "mathvariant"],
    mtext: [["className", /.*/]],
    mspace: [["className", /.*/], "width"],
    "youtube-embed": ["url", "videoId", "videoid"],
    "instagram-embed": ["url"],
    "facebook-embed": ["url"],
    "threads-embed": ["url"],
  },
};
