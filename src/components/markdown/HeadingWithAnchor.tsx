"use client";

import { Link } from "lucide-react";
import * as React from "react";

const TAGS = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export function HeadingWithAnchor({
  id,
  level,
  children,
}: {
  id?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const Tag = TAGS[level];

  const handleCopy = () => {
    if (!id) return;
    void navigator.clipboard
      .writeText(window.location.origin + window.location.pathname + "#" + id)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <Tag id={id} className="group relative flex items-baseline gap-2">
      <span>{children}</span>
      {id && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="複製連結"
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-accent"
        >
          {copied ? (
            <span className="font-sans text-[11px] font-normal text-accent">已複製</span>
          ) : (
            <Link className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </Tag>
  );
}
