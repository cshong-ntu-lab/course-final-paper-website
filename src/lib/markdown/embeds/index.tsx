import type { ComponentType } from "react";

import { FacebookEmbed } from "@/lib/markdown/embeds/FacebookEmbed";
import { InstagramEmbed } from "@/lib/markdown/embeds/InstagramEmbed";
import { ThreadsEmbed } from "@/lib/markdown/embeds/ThreadsEmbed";
import { YouTubeEmbed } from "@/lib/markdown/embeds/YouTubeEmbed";
import type { EmbedKind } from "@/lib/markdown/embedSchema";

export const embedComponents: Record<EmbedKind, ComponentType<EmbedComponentProps>> = {
  youtube: YouTubeEmbed,
  instagram: InstagramEmbed,
  facebook: FacebookEmbed,
  threads: ThreadsEmbed,
};

export interface EmbedComponentProps {
  url?: string;
  videoId?: string;
}

interface BridgeProps {
  kind: EmbedKind;
  Comp: ComponentType<EmbedComponentProps>;
  url?: string;
  videoid?: string; // hast lower-cases attribute names
  videoId?: string;
  children?: React.ReactNode;
}

// react-markdown calls custom-tag components with hast-style props (lowercased
// attribute names). This bridge normalises them before forwarding.
export function EmbedNodeFromHast({ Comp, url, videoid, videoId }: BridgeProps) {
  return <Comp url={url} videoId={videoId ?? videoid} />;
}
