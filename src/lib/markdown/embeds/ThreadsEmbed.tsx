"use client";
// Threads doesn't have a first-class lib component yet; we use the official
// blockquote markup + load Threads' embed script lazily once per page.

import * as React from "react";

const SCRIPT_SRC = "https://www.threads.net/embed.js";

function useThreadsScript() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __threadsScriptLoading?: boolean };
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      // Already loaded — call rescan if Threads exposed it.
      const threadsLib = (window as unknown as { threads?: { embed?: { process?: () => void } } })
        .threads;
      threadsLib?.embed?.process?.();
      return;
    }
    if (w.__threadsScriptLoading) return;
    w.__threadsScriptLoading = true;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);
}

export function ThreadsEmbed({ url }: { url?: string }) {
  useThreadsScript();
  if (!url) return null;
  return (
    <div className="embed embed-threads" data-url={url}>
      <blockquote
        className="text-post-media"
        data-text-post-permalink={url}
        data-text-post-version="0"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-subtle font-mono text-xs"
        >
          在 Threads 上查看
        </a>
      </blockquote>
    </div>
  );
}
