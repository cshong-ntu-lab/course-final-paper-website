"use client";
// react-social-media-embed loads Instagram's official embed script lazily.
// We dynamic-import to keep it out of the server bundle.

import dynamic from "next/dynamic";

const InstagramEmbedLib = dynamic(
  () => import("react-social-media-embed").then((m) => ({ default: m.InstagramEmbed })),
  { ssr: false, loading: () => <Skeleton /> },
);

function Skeleton() {
  return (
    <div className="bg-canvas text-subtle mx-auto h-[480px] w-full max-w-md animate-pulse rounded text-xs flex items-center justify-center">
      載入 Instagram 內容…
    </div>
  );
}

export function InstagramEmbed({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <div className="embed embed-instagram" data-url={url}>
      <InstagramEmbedLib url={url} width={500} captioned={false} />
    </div>
  );
}
