"use client";

import dynamic from "next/dynamic";

const FacebookEmbedLib = dynamic(
  () => import("react-social-media-embed").then((m) => ({ default: m.FacebookEmbed })),
  { ssr: false, loading: () => <Skeleton /> },
);

function Skeleton() {
  return (
    <div className="bg-canvas text-subtle mx-auto h-[420px] w-full max-w-md animate-pulse rounded text-xs flex items-center justify-center">
      載入 Facebook 內容…
    </div>
  );
}

export function FacebookEmbed({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <div className="embed embed-facebook" data-url={url}>
      <FacebookEmbedLib url={url} width={500} />
    </div>
  );
}
