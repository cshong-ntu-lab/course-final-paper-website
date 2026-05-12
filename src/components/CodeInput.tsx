"use client";
// design.md §3.5 — 6-cell course code input with paste + arrow nav.
//
// IME safety: when a Chinese (or any) IME is active, typing produces a
// composition sequence that fires multiple `input` events for a single
// keystroke. We ignore `onChange` while a composition is in flight and only
// process the finalised value in `onCompositionEnd`. Without this, typing
// Shift+T with a Chinese IME active inserts TT into adjacent cells because
// `onChange` fires once during composition and again on its end, with focus
// shifting between the two events.

import * as React from "react";

import { cn } from "@/lib/utils";

export interface CodeInputProps {
  value: string[]; // length 6
  onChange: (next: string[]) => void;
  error?: boolean;
  disabled?: boolean;
}

// Permissive at the input layer (any uppercase letter or digit). The
// validator + course lookup may reject confusable variants like 0/O/1/I/L
// downstream — that's fine; we'd rather show "找不到課程" than block typing.
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

  // Process a freshly-entered character for cell i. Pulls only the first
  // alphanumeric char of the raw value, writes it, and advances focus.
  const commit = (i: number, rawValue: string) => {
    const cleaned = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.length === 0) {
      setAt(i, "");
      return;
    }
    const ch = cleaned[0];
    if (!ch || !ALPHA.test(ch)) return;
    setAt(i, ch);
    if (i < 5) focusAt(i + 1);
  };

  const handleChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ignore intermediate input events while IME composition is in flight.
    if (composing.current[i]) return;
    commit(i, e.target.value);
  };

  const handleCompositionStart = (i: number) => () => {
    composing.current[i] = true;
  };

  const handleCompositionEnd = (i: number) => (e: React.CompositionEvent<HTMLInputElement>) => {
    composing.current[i] = false;
    commit(i, (e.target as HTMLInputElement).value);
  };

  const handleKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault();
      focusAt(i + 1);
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
          onChange={handleChange(i)}
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
