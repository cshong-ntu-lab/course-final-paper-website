"use client";
// Small circled "i" beside a field label; hover, focus or tap shows how the
// field is used. The bubble is position: fixed so the editor sidebar's
// scroll container can't clip it.

import { Info } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const WIDTH = 248;
const GAP = 6;
const EDGE = 8;

export function InfoTip({
  label,
  children,
  className,
}: {
  /** What the tip explains, for screen readers: 「關鍵字」 → 「關鍵字說明」. */
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const tipId = React.useId();
  const [pos, setPos] = React.useState<React.CSSProperties | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(
      Math.max(EDGE, r.left + r.width / 2 - WIDTH / 2),
      window.innerWidth - WIDTH - EDGE,
    );
    // flip above the icon in the lower part of the screen
    const below = r.top < window.innerHeight * 0.6;
    setPos(
      below
        ? { left, top: r.bottom + GAP, width: WIDTH }
        : { left, bottom: window.innerHeight - r.top + GAP, width: WIDTH },
    );
  };
  const hide = () => setPos(null);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`${label}說明`}
        aria-describedby={pos ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (pos ? hide() : show())}
        onKeyDown={(e) => e.key === "Escape" && hide()}
        className={cn(
          "text-subtle hover:text-accent focus-visible:text-accent focus-visible:ring-accent inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {pos && (
        <div
          id={tipId}
          role="tooltip"
          style={pos}
          className="bg-foreground text-background pointer-events-none fixed z-[60] rounded-md px-3 py-2 font-sans text-xs leading-relaxed normal-case tracking-normal shadow-[var(--shadow-soft)]"
        >
          {children}
        </div>
      )}
    </>
  );
}
