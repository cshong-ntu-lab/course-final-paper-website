"use client";
// Notion-style keyword picker for the editor sidebar: picked tags show as
// removable pills; typing filters the keywords other published reports use,
// and anything new can be added with Enter (or a comma, the old habit).

import { X } from "lucide-react";
import * as React from "react";

import { addTags, matchTagSuggestions, TAGS_MAX_COUNT } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Option = { kind: "existing" | "create"; tag: string };

const SEPARATOR = /[,，、]/;

export function TagPicker({
  id,
  value,
  onChange,
  suggestions,
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Keywords already used on the site, most-used first. */
  suggestions: string[];
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const full = value.length >= TAGS_MAX_COUNT;
  const q = query.trim();

  const options = React.useMemo<Option[]>(() => {
    const lower = q.toLowerCase();
    const matches = matchTagSuggestions(q, suggestions, value)
      // an exact match goes first so Enter picks it
      .sort((a, b) => Number(b.toLowerCase() === lower) - Number(a.toLowerCase() === lower));
    const exists =
      matches.some((t) => t.toLowerCase() === lower) ||
      value.some((t) => t.toLowerCase() === lower);
    return [
      ...matches.map((tag) => ({ kind: "existing" as const, tag })),
      ...(q && !exists ? [{ kind: "create" as const, tag: q }] : []),
    ];
  }, [q, suggestions, value]);

  const commit = (raw: string) => {
    const next = addTags(value, raw);
    if (next.length !== value.length) onChange(next);
    setQuery("");
    setActive(0);
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Chinese IME: Enter confirms the composition, not the tag
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = options[active];
      if (picked) commit(picked.tag);
      else if (q) commit(q);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        // keep what was typed rather than silently dropping it
        if (q) commit(q);
        setOpen(false);
      }}
    >
      <div
        className={cn(
          "border-border-strong bg-surface flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded border px-1.5 py-1",
          "focus-within:border-accent focus-within:ring-accent-soft focus-within:ring-2",
        )}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="border-border-strong text-foreground inline-flex max-w-full items-center gap-0.5 rounded-full border py-0.5 pr-1 pl-2 text-xs"
          >
            <span className="truncate">#{tag}</span>
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-subtle hover:text-foreground rounded-full p-0.5"
              aria-label={`移除關鍵字 ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {full ? (
          <span className="text-subtle px-1 text-xs">已達 {TAGS_MAX_COUNT} 個上限</span>
        ) : (
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
            value={query}
            placeholder={value.length === 0 ? "選擇或輸入新關鍵字" : ""}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              const v = e.target.value;
              if (SEPARATOR.test(v)) {
                commit(v);
              } else {
                setQuery(v);
                setActive(0);
                setOpen(true);
              }
            }}
            onKeyDown={onKeyDown}
            className="placeholder:text-subtle h-6 min-w-[6rem] flex-1 bg-transparent px-1 font-sans text-sm outline-none"
          />
        )}
      </div>

      {open && !full && (
        <div className="border-border bg-surface absolute right-0 left-0 z-20 mt-1 rounded border shadow-[var(--shadow-soft)]">
          <p className="text-subtle border-border border-b px-2.5 py-1.5 text-[11px]">
            選擇現有關鍵字，或輸入後按 Enter 新增
          </p>
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="text-subtle px-2.5 py-1.5 text-xs">
                {suggestions.length === 0 ? "網站上還沒有其他關鍵字" : "沒有其他相符的關鍵字"}
              </li>
            ) : (
              options.map((o, i) => (
                <li
                  key={`${o.kind}:${o.tag}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(o.tag)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-[13px]",
                    i === active && "bg-accent/10",
                  )}
                >
                  {o.kind === "create" ? (
                    <>
                      <span className="text-subtle text-xs">新增</span>
                      <span className="border-border-strong truncate rounded-full border px-2 py-0.5 text-xs">
                        #{o.tag}
                      </span>
                    </>
                  ) : (
                    <span className="truncate">#{o.tag}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
