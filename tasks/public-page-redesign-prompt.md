# Prompt for Claude.ai — Redesign NTU Public Pages

Paste the entire block below (including the HTML) into Claude.ai:

---

I'm redesigning two public pages for a graduate course final-paper publishing platform at NTU (National Taiwan University). The site is built with **Next.js 16 App Router + Tailwind CSS 4 + TypeScript**. I've attached an HTML snapshot of the current design.

## What I need

Redesign both pages in the snapshot — the **course listing page** and the **report reader page** — with a more refined editorial feel. The site publishes academic papers written by graduate students, so it should feel scholarly and trustworthy, not startup-ish.

## Hard constraints (don't change these)

- **Tech stack**: Next.js 16, Tailwind CSS 4, TypeScript. All styling is Tailwind utility classes — no custom CSS files.
- **Color palette** (locked — these are design tokens in globals.css):
  - `bg-background` = paper #f5f2ec (page background)
  - `bg-surface` = slightly off-white #faf9f7 (card background)
  - `bg-white` = pure white (tab nav background)
  - `text-accent` / `border-accent` = forest green #3a5a3a (primary interactive color)
  - `text-foreground` = #1a1a1a
  - `text-muted` = #6b6561
  - `text-subtle` = #9b958f
  - `border-border` = #e8e3db (default border)
  - `border-border-strong` = #cdc6bc (hover border)
- **Typography**:
  - `font-serif` = Noto Serif TC (headings, titles, article body)
  - `font-mono` = JetBrains Mono (labels, codes, eyebrows)
  - `font-sans` = Noto Sans TC (default)
- **Language**: Traditional Chinese (zh-TW). Keep all existing Chinese strings as-is.
- **No dark mode** — light mode only for now.
- **Accessible** — preserve heading hierarchy (h1 → h2 → h3), keep `aria-label` on nav.
- **Keep sticky header** on both pages.
- The **tab nav** (course switcher) must stay functional — active tab gets a bottom border in `border-accent`.

## What you can change

- Layout proportions, spacing, padding, margins
- Visual hierarchy within sections
- Typography scale and weight choices
- Card design (the report list items)
- The article masthead layout (author, date, reading time)
- Course description section (could collapse, show differently)
- Footer
- Any visual embellishments that fit the scholarly editorial feel

## Output format (IMPORTANT)

For each change, give me **the exact Tailwind className string** to replace in the corresponding file. Use this format:

```
FILE: src/app/(public)/c/[courseSlug]/page.tsx
ELEMENT: site header <header>
OLD: "border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur"
NEW: "border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur"
```

Do NOT rewrite entire files or give me full React/JSX. Only diff the className strings that change. I'll apply them myself. Group changes by file.

Files to modify:

- `src/app/(public)/c/[courseSlug]/page.tsx` — course listing page
- `src/components/public/ReportListItem.tsx` — report card component
- `src/app/(public)/c/[courseSlug]/r/[reportSlug]/page.tsx` — report reader page
- `src/components/Footer.tsx` — shared footer

---

[PASTE THE HTML FILE CONTENT HERE — open tasks/public-page-snapshot.html in a text editor and paste the full content]
