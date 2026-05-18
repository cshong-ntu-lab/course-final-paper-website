"use client";
// design.md §3.5 — 6-cell course code input with paste + arrow nav.
//
// Character input is handled in onKeyDown (with preventDefault) rather than
// onChange to avoid a React 19 controlled-input issue: the browser's
// reconciliation of maxLength/value after a controlled update was stealing
// focus back to the previous cell, making it impossible to type more than one
// character at a time.
//
// IME safety: keydown fires key="Process" during CJK composition and cannot
// extract the character, so we still use onCompositionEnd for that path.

import * as React from "react";

import { cn } from "@/lib/utils";

export interface CodeInputProps {
  value: string[]; // length 6
  onChange: (next: string[]) => void;
  error?: boolean;
  disabled?: boolean;
}

const ALPHA = /^[A-Z0-9]$/;

export function CodeInput({ value, onChange, error, disabled }: CodeInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const composing = React.useRef<boolean[]>(Array(6).fill(false));

  const setAt = React.useCallback(
    (i: number, ch: string) => {
      const next = [...value];
      next[i] = ch;
      onChange(next);
    },
    [onChange, value],
  );

  const focusAt = (i: number) => refs.current[i]?.focus();

  const handleKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Let IME composition proceed without interference.
    if (composing.current[i]) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      setAt(i, "");
      if (i > 0) focusAt(i - 1);
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
      return;
    }
    if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault();
      focusAt(i + 1);
      return;
    }
    // Printable character: prevent the browser from writing to the DOM value
    // (which would trigger React's controlled-input reconciliation and steal
    // focus), then commit the character ourselves.
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
      e.preventDefault();
      const ch = e.key.toUpperCase();
      if (ALPHA.test(ch)) {
        setAt(i, ch);
        if (i < 5) focusAt(i + 1);
      }
    }
  };

  const handleCompositionStart = (i: number) => () => {
    composing.current[i] = true;
  };

  const handleCompositionEnd = (i: number) => (e: React.CompositionEvent<HTMLInputElement>) => {
    composing.current[i] = false;
    const raw = (e.target as HTMLInputElement).value;
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleaned) {
      setAt(i, "");
      return;
    }
    const ch = cleaned[0];
    if (ch && ALPHA.test(ch)) {
      setAt(i, ch);
      if (i < 5) focusAt(i + 1);
    }
  };

  const handlePaste = (i: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6 - i);
    if (!pasted) return;
    const next = [...value];
    for (let k = 0; k < pasted.length; k++) {
      next[i + k] = pasted[k] ?? "";
    }
    onChange(next);
    const targetIdx = Math.min(i + pasted.length, 5);
    focusAt(targetIdx);
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="課程代碼 6 碼">
      {value.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          maxLength={1}
          inputMode="text"
          autoComplete="off"
          disabled={disabled}
          aria-label={`第 ${i + 1} 碼`}
          aria-invalid={error || undefined}
          onChange={() => {
            // No-op: actual input is handled in onKeyDown (for regular keys) and
            // onCompositionEnd (for IME). Required to satisfy React's controlled
            // input contract.
          }}
          onCompositionStart={handleCompositionStart(i)}
          onCompositionEnd={handleCompositionEnd(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
          className={cn(
            "h-14 w-11 sm:h-15 sm:w-13 rounded text-center font-mono text-[1.375rem] font-semibold uppercase",
            "bg-surface border focus:outline-none focus:ring-2",
            error
              ? "border-destructive bg-destructive-soft text-destructive-fg focus:ring-destructive/30"
              : "border-border-strong focus:border-accent focus:ring-accent/30",
          )}
        />
      ))}
    </div>
  );
}
