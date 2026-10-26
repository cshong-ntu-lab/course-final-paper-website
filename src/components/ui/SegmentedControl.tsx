"use client";
// docs/design-v2.md §5.2 #6 — segmented switch with one thumb that slides to the
// active option. Until the thumb is measured (SSR, first paint) the active
// button paints its own background via `.seg:not([data-ready])` in globals.css.

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** Moves the thumb under the active option; `animate: false` jumps instead of sliding. */
function placeThumb(group: HTMLElement | null, thumb: HTMLElement | null, animate: boolean) {
  const active = group?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
  if (!group || !thumb || !active) return;
  if (!animate) thumb.style.transition = "none";
  thumb.style.width = `${active.offsetWidth}px`;
  thumb.style.transform = `translateX(${active.offsetLeft}px)`;
  if (!animate) {
    void thumb.offsetWidth; // commit the jump before re-enabling the transition
    thumb.style.transition = "";
  }
  group.dataset.ready = "1";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group, e.g. "顯示方式". */
  label: string;
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  // value changes slide (the very first placement jumps)
  useLayoutEffect(() => {
    const group = groupRef.current;
    placeThumb(group, thumbRef.current, group?.dataset.ready === "1");
  }, [value]);

  // widths change when web fonts arrive or the window resizes: jump, don't slide
  useLayoutEffect(() => {
    const jump = () => placeThumb(groupRef.current, thumbRef.current, false);
    window.addEventListener("resize", jump);
    void document.fonts?.ready.then(jump);
    return () => window.removeEventListener("resize", jump);
  }, []);

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={label}
      className={cn(
        "seg bg-canvas border-border rounded-control relative inline-flex gap-[3px] border p-[3px]",
        className,
      )}
    >
      <span
        ref={thumbRef}
        aria-hidden="true"
        className="bg-surface shadow-soft ease-enter absolute top-[3px] bottom-[3px] left-0 rounded-[7px] transition-[transform,width] duration-200"
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 h-7 rounded-[7px] px-3.5 text-xs font-semibold transition-colors",
            o.value === value ? "text-foreground" : "text-subtle hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
