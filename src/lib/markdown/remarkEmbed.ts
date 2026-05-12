// Custom remark plugin: detects standalone URLs on their own line/paragraph
// and replaces them with custom embed nodes (youtube-embed, instagram-embed,
// facebook-embed, threads-embed) that MarkdownRenderer maps to React
// components. HackMD / Notion pattern.
//
// Only paragraphs whose *only* content is one link/text URL get transformed.
// In-line URLs and links embedded in sentences are left untouched.

import type { Link, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { detectEmbed, type EmbedKind } from "@/lib/markdown/embedSchema";

interface EmbedNode {
  type: "embed";
  data: { hName: string; hProperties: Record<string, string> };
  children: never[];
}

function extractParagraphUrl(p: Paragraph): { url: string } | null {
  if (p.children.length !== 1) return null;
  const only = p.children[0];
  if (!only) return null;
  if (only.type === "link" && (only as Link).url) {
    const link = only as Link;
    // Link node must contain just a text node showing the same URL (auto-link form)
    const inner = link.children?.[0];
    if (
      link.children.length === 1 &&
      inner &&
      inner.type === "text" &&
      (inner as Text).value === link.url
    ) {
      return { url: link.url };
    }
  }
  if (only.type === "text") {
    const value = (only as Text).value.trim();
    if (/^https?:\/\/\S+$/.test(value)) return { url: value };
  }
  return null;
}

function buildEmbedNode(kind: EmbedKind, url: string, id?: string): EmbedNode {
  const hName = `${kind}-embed`;
  const hProperties: Record<string, string> = { url };
  if (kind === "youtube" && id) hProperties.videoId = id;
  return {
    type: "embed",
    data: { hName, hProperties },
    children: [],
  };
}

export const remarkEmbed: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const p = node as Paragraph;
      const got = extractParagraphUrl(p);
      if (!got) return;
      const match = detectEmbed(got.url);
      if (!match) return;
      const embedNode = buildEmbedNode(match.kind, got.url, match.id);
      // Replace paragraph with embed node — react-markdown bridges via hName.
      parent.children.splice(index, 1, embedNode as unknown as Paragraph);
    });
  };
};
