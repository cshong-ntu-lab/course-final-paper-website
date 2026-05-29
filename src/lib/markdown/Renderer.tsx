// Single source of truth for markdown rendering.
// Used in:
//   1. /workspace/c/[id] editor preview slot (Phase 3)
//   2. /c/{slug}/r/{slug} public report reader (Phase 4)
//   3. Staging report view (Phase 6)
//
// Changes here propagate everywhere. See design.md §4.4 for the prose-research
// type customization that wraps this component's output.

import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import ReactMarkdown, { type Components } from "react-markdown";

import { embedComponents, EmbedNodeFromHast } from "@/lib/markdown/embeds";
import { embedSanitizeSchema } from "@/lib/markdown/embedSchema";
import { remarkEmbed } from "@/lib/markdown/remarkEmbed";
import { cn } from "@/lib/utils";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/** True if the paragraph contains only images (plus <br> and whitespace). */
function isImageOnlyParagraph(node: { children?: unknown[] } | undefined): boolean {
  if (!node?.children) return false;
  let hasImg = false;
  for (const c of node.children) {
    if (typeof c !== "object" || c === null || !("type" in c)) continue;
    const typed = c as { type: string; value?: string; tagName?: string };
    if (typed.type === "text") {
      if ((typed.value ?? "").trim() !== "") return false;
      continue;
    }
    if (typed.type === "element") {
      if (typed.tagName === "br") continue;
      if (typed.tagName === "img") {
        hasImg = true;
        continue;
      }
      return false;
    }
  }
  return hasImg;
}

// Map our custom embed tag names → React components.
const components: Components = {
  // Image-only paragraphs (single or multiple images, possibly remark-breaks
  // separated by <br>) are stripped of the outer <p> so the <figure> elements
  // (rendered by the img override below) sit at block level without nesting.
  // Mixed paragraphs fall through to a normal <p> — the img override handles
  // captioning inline.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ node, children, ...rest }: any) => {
    if (isImageOnlyParagraph(node)) return <>{children}</>;
    return <p {...rest}>{children}</p>;
  },
  // Every <img> with a markdown title becomes a <figure> + <figcaption>.
  // Using <figure> here is safe because either (a) the parent <p> was already
  // stripped by the override above, or (b) the image is in a mixed paragraph
  // — browsers auto-promote block elements out of <p>, and React SSR + client
  // both do this consistently so there is no hydration mismatch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  img: ({ src, alt, title }: any) => {
    if (title) {
      return (
        <figure style={{ width: "85%", margin: "0 auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src ?? ""} alt={alt ?? ""} title={title} style={{ width: "100%" }} />
          <figcaption>{title}</figcaption>
        </figure>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src ?? ""}
        alt={alt ?? ""}
        style={{ width: "85%", margin: "0 auto", display: "block" }}
      />
    );
  },
  // @ts-expect-error react-markdown's Components map doesn't know our custom tags
  "youtube-embed": (props) => (
    <EmbedNodeFromHast {...props} kind="youtube" Comp={embedComponents.youtube} />
  ),
  // @ts-expect-error see above
  "instagram-embed": (props) => (
    <EmbedNodeFromHast {...props} kind="instagram" Comp={embedComponents.instagram} />
  ),
  // @ts-expect-error see above
  "facebook-embed": (props) => (
    <EmbedNodeFromHast {...props} kind="facebook" Comp={embedComponents.facebook} />
  ),
  // @ts-expect-error see above
  "threads-embed": (props) => (
    <EmbedNodeFromHast {...props} kind="threads" Comp={embedComponents.threads} />
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <article
      className={cn(
        "prose prose-research max-w-none",
        // shiki injects CSS variables for both light + dark themes; switch via .dark
        "prose-pre:bg-canvas prose-pre:border prose-pre:border-border",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks, remarkEmbed]}
        rehypePlugins={[
          rehypeSlug,
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          [rehypeSanitize, embedSanitizeSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
