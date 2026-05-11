# Design Spec — 課程報告網站

> 工程端唯一會讀的交付物。所有 styling 以 Tailwind utility classes 描述。
> 設計稿原檔留在 `design-system-v1.html` / `homepage-v1.html` / `reader-v1.html` / `editor-v1.html` / `auth-v1.html` / `tier2-v1.html` / `tier3-v1.html` 供參考。
> 鎖定方向：Forest accent · 字體配對 B（UI sans + body serif）· 公開首頁 D1 · 報告閱讀 R1 · 編輯器 E3 · 登入 L2 · Onboarding 2-step。

---

## 1. Design Tokens

### 1.1 Colors

色彩採用 HSL，搭配 `tailwindcss-animate` 與 shadcn 的 CSS-variable pattern。

**`globals.css`：**

```css
@layer base {
  :root {
    /* paper neutrals — warm off-white tone */
    --background: 48 22% 96%; /* #faf9f5 */
    --canvas: 46 18% 93%; /* #f3f2ec — table headers / chips */
    --surface: 0 0% 100%; /* pure white — cards on paper */
    --foreground: 60 4% 11%; /* #1c1d1a */
    --muted: 48 4% 35%; /* #5a5a52 */
    --muted-foreground: 48 4% 35%;
    --subtle: 48 5% 53%; /* #8e8d83 — captions / mono labels */
    --border: 46 19% 88%; /* #e5e3d9 */
    --border-strong: 42 12% 78%; /* #cfccc1 — inputs / strong dividers */

    /* accent — forest green */
    --accent: 120 22% 29%; /* #3a5a3a */
    --accent-hover: 120 24% 22%; /* #2a4429 */
    --accent-soft: 96 18% 92%; /* #ecefe8 — focus ring tint, badge bg */
    --accent-foreground: 0 0% 100%;

    /* semantic */
    --success: 120 22% 29%; /* reuses accent green */
    --success-soft: 96 18% 92%;
    --success-fg: 120 24% 22%;

    --warning: 37 64% 45%; /* #b8842c */
    --warning-soft: 42 71% 92%; /* #faf2dd */
    --warning-fg: 38 65% 28%; /* #7a5a18 */

    --destructive: 8 56% 41%; /* #a13c2e */
    --destructive-soft: 12 60% 95%; /* #fcf3f1 */
    --destructive-fg: 8 50% 32%; /* #7a2828 */
    --destructive-foreground: 0 0% 100%;

    --info: 213 31% 35%; /* #3d5573 — staging banner */
    --info-soft: 213 31% 94%;

    /* radii */
    --radius: 0.375rem; /* 6px */
  }
}
```

**`tailwind.config.ts` colors extension：**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        subtle: "hsl(var(--subtle))",
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",

        accent: {
          DEFAULT: "hsl(var(--accent))",
          hover: "hsl(var(--accent-hover))",
          soft: "hsl(var(--accent-soft))",
          foreground: "hsl(var(--accent-foreground))",
        },
        primary: {
          // shadcn alias to accent
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          soft: "hsl(var(--success-soft))",
          fg: "hsl(var(--success-fg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          soft: "hsl(var(--warning-soft))",
          fg: "hsl(var(--warning-fg))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          soft: "hsl(var(--destructive-soft))",
          fg: "hsl(var(--destructive-fg))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft: "hsl(var(--info-soft))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
```

### 1.2 Dark mode mapping (v2 — implement when 1.0 ships)

```css
@layer base {
  .dark {
    --background: 60 4% 9%; /* #18181a */
    --canvas: 60 4% 12%;
    --surface: 60 4% 14%;
    --foreground: 48 18% 92%;
    --muted: 48 4% 65%;
    --muted-foreground: 48 4% 65%;
    --subtle: 48 5% 48%;
    --border: 60 4% 22%;
    --border-strong: 60 4% 30%;

    --accent: 120 28% 60%; /* lighter green for contrast */
    --accent-hover: 120 30% 70%;
    --accent-soft: 120 18% 18%;
    --accent-foreground: 60 4% 9%;

    --success: 120 28% 60%;
    --success-soft: 120 18% 18%;
    --success-fg: 120 28% 75%;

    --warning: 37 64% 60%;
    --warning-soft: 38 30% 18%;
    --warning-fg: 38 60% 78%;

    --destructive: 8 60% 60%;
    --destructive-soft: 8 30% 18%;
    --destructive-fg: 8 50% 80%;

    --info: 213 30% 60%;
    --info-soft: 213 30% 18%;
  }
}
```

### 1.3 Typography

**Fonts — load via `next/font`：**

```ts
// src/lib/fonts.ts
import { Noto_Sans_TC, Noto_Serif_TC, Inter, JetBrains_Mono } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-en",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
export const fontSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-sans-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
export const fontSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  variable: "--font-serif-tc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});
```

```tsx
// app/layout.tsx
<html lang="zh-Hant" className={`${fontSans.variable} ${fontSansTC.variable} ${fontSerifTC.variable} ${fontMono.variable}`}>
```

**Tailwind extension：**

```ts
fontFamily: {
  sans:  ["var(--font-sans-en)", "var(--font-sans-tc)", "system-ui", "sans-serif"],
  serif: ["var(--font-serif-tc)", "Georgia", "serif"],
  mono:  ["var(--font-mono)", "ui-monospace", "monospace"],
},
fontSize: {
  // [size, { lineHeight, letterSpacing }] — Tailwind triple form
  "2xs":  ["0.6875rem", { lineHeight: "1rem",   letterSpacing: "0.06em" }],   // 11 — mono labels
  xs:     ["0.75rem",   { lineHeight: "1.05rem", letterSpacing: "0.02em" }],  // 12
  sm:     ["0.8125rem", { lineHeight: "1.25rem", letterSpacing: "0" }],       // 13 — body sans
  base:   ["0.9375rem", { lineHeight: "1.5rem",  letterSpacing: "0" }],       // 15
  lg:     ["1rem",      { lineHeight: "1.6rem",  letterSpacing: "0" }],       // 16
  xl:     ["1.0625rem", { lineHeight: "1.8rem",  letterSpacing: "0" }],       // 17 — prose body (serif)
  "2xl":  ["1.25rem",   { lineHeight: "1.75rem", letterSpacing: "-0.005em" }],// 20
  "3xl":  ["1.5rem",    { lineHeight: "2rem",    letterSpacing: "-0.015em" }],// 24
  "4xl":  ["1.875rem",  { lineHeight: "2.25rem", letterSpacing: "-0.02em" }], // 30
  "5xl":  ["2.25rem",   { lineHeight: "2.5rem",  letterSpacing: "-0.025em" }],// 36
  "6xl":  ["2.75rem",   { lineHeight: "3rem",    letterSpacing: "-0.03em" }], // 44 — error 404 / hero
},
```

**使用約定：**

| Role                           | Class                                                        | 字體  |
| ------------------------------ | ------------------------------------------------------------ | ----- |
| Article H1（報告閱讀頁）       | `font-serif text-5xl font-semibold tracking-tight`           | Serif |
| Page H1（dashboards）          | `font-serif text-4xl font-semibold tracking-tight`           | Serif |
| Section H2                     | `font-serif text-2xl font-semibold`                          | Serif |
| Card title（report list item） | `font-serif text-xl font-semibold tracking-tight`            | Serif |
| Body 長文                      | `font-serif text-xl leading-[1.8]`                           | Serif |
| UI body / button label         | `font-sans text-sm font-medium`                              | Sans  |
| Mono micro-label / metadata    | `font-mono text-2xs uppercase tracking-[0.08em] text-subtle` | Mono  |
| Code                           | `font-mono text-sm`                                          | Mono  |

### 1.4 Spacing / Radius / Shadow / Animation

- **Spacing**：沿用 Tailwind default scale。section padding 用 `py-10 px-7`（dashboards）、`py-16 px-14`（auth split）、`py-12`（reader article wrapper）。
- **Radius**：`--radius: 0.375rem`（6px）。卡片用 `rounded-md`（6px）；input、button、badge 用 `rounded` 或 `rounded-sm`。**不**使用 `rounded-xl/2xl/full`（除頭像）。
- **Shadow**：原則上不用。Card 用 1px `border-border`。**唯二例外：** `<Dialog>` 用 `shadow-2xl` 浮起 + `Toast` 用 `shadow-lg`。
- **Animation**：
  - `transition-colors duration-150` — hover / focus
  - `transition-opacity duration-200` — toast / banner
  - `animate-pulse` — skeletons
  - `animate-spin` — `<Loader2>` icon
  - 自訂 `animate-saving`：`opacity` 1↔0.5 1.6s ease-in-out infinite — save indicator dot
  - 自訂 `animate-banner-slide`：staging banner 進場 `translate-y-[-100%] → 0` 200ms

```ts
// tailwind.config.ts — keyframes & animation
extend: {
  keyframes: {
    saving: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
    "banner-slide": {
      from: { transform: "translateY(-100%)" },
      to:   { transform: "translateY(0)" },
    },
  },
  animation: {
    saving: "saving 1.6s ease-in-out infinite",
    "banner-slide": "banner-slide 200ms ease-out",
  },
}
```

---

## 2. Component Library

基於 **shadcn/ui**。下列每個元件都列出 install 指令、variants、Tailwind classes、a11y notes。

### 2.1 shadcn primitives（直接 install，輕度客製）

```bash
npx shadcn@latest add button card input textarea select checkbox radio-group \
  switch dialog tooltip popover tabs sonner badge avatar skeleton separator \
  dropdown-menu sheet alert form label
```

#### Button

`src/components/ui/button.tsx`（覆寫 variants）：

| Variant              | Tailwind classes                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `default`（primary） | `bg-accent text-accent-foreground hover:bg-accent-hover border border-accent`               |
| `secondary`          | `bg-surface text-foreground border border-border-strong hover:bg-canvas`                    |
| `ghost`              | `bg-transparent text-muted hover:bg-canvas hover:text-foreground`                           |
| `link`               | `text-accent underline underline-offset-[3px] decoration-accent/40 hover:decoration-accent` |
| `destructive`        | `bg-surface text-destructive border border-destructive/50 hover:bg-destructive-soft`        |

| Size      | Classes                     |
| --------- | --------------------------- |
| `sm`      | `h-8 px-3 text-xs rounded`  |
| `default` | `h-9 px-4 text-sm rounded`  |
| `lg`      | `h-10 px-5 text-sm rounded` |
| `icon`    | `h-9 w-9 p-0 rounded`       |

**Base classes**：`inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none`

#### Input / Textarea

```
h-9 w-full rounded border border-border-strong bg-surface px-3 py-2 text-sm
font-sans placeholder:text-subtle
focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-soft
disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed
aria-invalid:border-destructive aria-invalid:ring-destructive-soft
```

Textarea 加 `min-h-[110px] resize-y leading-relaxed`。

#### Card

```
rounded-md border border-border bg-surface
```

Card content padding by section: `p-5` (default), `px-5 py-4` (compact list rows).

#### Select / Checkbox / RadioGroup / Switch

照 shadcn default，把 `ring-ring` 換成 `ring-accent`、active state 用 `bg-accent text-accent-foreground`。

#### Dialog

Overlay: `bg-foreground/45 backdrop-blur-[1px]`
Content: `bg-surface border border-border rounded-md shadow-2xl w-full max-w-md p-6`
Title: `<h3>` `font-serif text-lg font-semibold mb-2`
Description: `text-sm text-muted leading-relaxed mb-5`
Footer: `flex justify-end gap-2 mt-5`

#### Tooltip

Content: `bg-foreground text-background rounded-sm px-2 py-1 text-xs font-sans shadow-lg`

#### Popover

Content: `bg-surface border border-border rounded-md shadow-lg p-3 text-sm`

#### Tabs

Container: `border-b border-border flex gap-7`
Trigger: `pb-2.5 pt-3 text-sm font-medium text-muted border-b-2 border-transparent -mb-px transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-accent`

#### Toast — Sonner

```ts
// app/layout.tsx
<Toaster
  position="bottom-right"
  toastOptions={{
    classNames: {
      toast: "bg-surface border border-border rounded-md shadow-lg text-foreground font-sans",
      title: "font-medium text-sm",
      description: "text-xs text-muted",
      success: "border-success/30",
      error: "border-destructive/40",
      info: "border-info/40",
    },
  }}
/>
```

#### Badge / Avatar / Skeleton / Separator

- **Badge**：`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium font-sans border`
- **Avatar**：fallback `bg-accent text-accent-foreground font-serif font-semibold`；size `h-7 w-7 text-sm` default。
- **Skeleton**：`bg-canvas animate-pulse rounded`
- **Separator**：`bg-border`，預設 `h-px w-full`。

---

### 2.2 自訂 components

#### `<SaveStatusIndicator state={'saving'|'saved'|'offline'} since={Date} />`

```tsx
// src/components/save-status-indicator.tsx
"use client";
import { Cloud, CloudOff, Loader2 } from "lucide-react";

type State = "saving" | "saved" | "offline";

export function SaveStatusIndicator({ state, since }: { state: State; since?: Date }) {
  const ago = since ? secsAgo(since) : 0;

  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted font-sans">
        <Loader2 className="h-3 w-3 animate-spin text-accent" />
        儲存中…
      </span>
    );
  }
  if (state === "offline") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-warning-fg font-sans"
        title="網路斷線，最新草稿暫存於瀏覽器"
      >
        <CloudOff className="h-3 w-3" />
        離線（已暫存本機）
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted font-sans">
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-saving" />
      已儲存 · {ago}s 前
    </span>
  );
}
function secsAgo(d: Date) {
  return Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
}
```

#### `<StatusTag kind={'unpublished'|'published'|'published-new'} />`

```tsx
// src/components/status-tag.tsx
const MAP = {
  unpublished: {
    cls: "bg-canvas text-muted border-border-strong",
    dot: "bg-subtle",
    label: "未發布",
  },
  published: {
    cls: "bg-success-soft text-success-fg border-success/30",
    dot: "bg-success",
    label: "已發布",
  },
  "published-new": {
    cls: "bg-warning-soft text-warning-fg border-warning/40",
    dot: "bg-warning",
    label: "已發布 · 有新變更",
  },
} as const;

export function StatusTag({ kind }: { kind: keyof typeof MAP }) {
  const m = MAP[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium font-sans border whitespace-nowrap ${m.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
```

#### `<StagingBanner />` （sticky top, info color）

```tsx
// src/components/staging-banner.tsx
import { Info } from "lucide-react";

export function StagingBanner() {
  return (
    <div className="sticky top-0 z-50 w-full bg-warning-soft border-b border-warning/40 text-warning-fg animate-banner-slide">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 py-2 text-xs font-sans">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">STAGING</strong> —
          此版本包含未發布內容，僅授權人員可見。
        </span>
      </div>
    </div>
  );
}
```

#### `<CourseCard variant="public"|"student"|"admin" course={...} />`

```tsx
// src/components/course-card.tsx
export function CourseCard({ variant, course }: Props) {
  return (
    <a
      href={hrefFor(variant, course)}
      className="group block rounded-md border border-border bg-surface px-5 py-5 transition-colors hover:border-border-strong"
    >
      <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
        {course.code} · {course.term}
      </div>
      <h3 className="mt-1 font-serif text-xl font-semibold tracking-tight leading-tight group-hover:text-accent">
        {course.name}
      </h3>
      <p className="mt-1 text-xs text-muted">{course.teacher}</p>

      {variant === "student" && course.mine && (
        <div className="mt-4 border-t border-border pt-3.5">
          <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-1.5">
            我的報告
          </div>
          {course.mine.title ? (
            <>
              <div className="font-serif text-sm font-medium leading-snug mb-2">
                {course.mine.title}
              </div>
              <div className="flex items-center justify-between">
                <StatusTag kind={course.mine.status} />
                <span className="text-2xs text-subtle">更新於 {course.mine.updated}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-subtle italic">尚未開始 · 點此建立報告</p>
          )}
        </div>
      )}
    </a>
  );
}
```

#### `<ReportListItem report={...} courseSlug />`（公開首頁列表）

```tsx
export function ReportListItem({ report, courseSlug }: Props) {
  return (
    <a
      href={`/c/${courseSlug}/r/${report.slug}`}
      className="group block rounded-md border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex gap-5">
        {report.cover && (
          <img
            src={report.cover}
            alt=""
            className="h-24 w-24 shrink-0 rounded object-cover bg-canvas"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl font-semibold tracking-tight leading-tight group-hover:text-accent">
            {report.title}
          </h3>
          <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">{report.summary}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-subtle">
            <span className="font-medium text-muted">{report.author}</span>
            <span>·</span>
            <time dateTime={report.publishedAt}>{formatDate(report.publishedAt)}</time>
            <span>·</span>
            <span>{report.readingMinutes} 分鐘</span>
          </div>
        </div>
      </div>
    </a>
  );
}
```

#### `<ReportRow report={...} />`（admin 課程頁中的 row，table 風格）

```tsx
export function ReportRow({ report }: { report: AdminReport }) {
  return (
    <a
      href={`/admin/courses/${report.courseId}/r/${report.id}`}
      className="grid grid-cols-[120px_1fr_180px_120px] items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-canvas transition-colors"
    >
      <div className="font-serif text-sm font-medium">{report.author}</div>
      <div
        className={`font-serif text-[0.9375rem] leading-snug ${report.title ? "text-foreground" : "text-subtle italic"}`}
      >
        {report.title ?? "（尚未開始）"}
      </div>
      <div>
        <StatusTag kind={report.status} />
      </div>
      <div className="text-right text-xs text-subtle">{report.updatedRelative}</div>
    </a>
  );
}
```

#### `<CourseCodeDisplay code copyable regenerable />`

```tsx
export function CourseCodeDisplay({ code, onCopy, onRegenerate }: Props) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-5 py-4">
      <div>
        <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-1">
          邀請學生用此代碼加入
        </div>
        <div className="font-mono text-[1.625rem] font-semibold tracking-[0.12em] text-accent select-all">
          {code}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" /> 複製
        </Button>
        <Button variant="ghost" size="sm" onClick={onRegenerate}>
          重新產生
        </Button>
      </div>
    </div>
  );
}
```

#### `<FileUploadButton onUpload />` + 上傳中 progress

```tsx
<label className="group flex items-center justify-center gap-2 rounded border border-dashed border-border-strong px-3 py-2.5 text-xs text-muted cursor-pointer hover:border-accent hover:text-accent transition-colors">
  <Plus className="h-3.5 w-3.5" />
  <span>上傳圖片 · 最大 10MB</span>
  <input type="file" accept="image/*" className="hidden" />
</label>;

{
  /* progress row, sidebar */
}
<div className="px-3 py-2 text-xs">
  <div className="flex items-center justify-between mb-1.5">
    <span className="truncate text-muted">field-notes-3.png</span>
    <span className="font-mono text-subtle">62%</span>
  </div>
  <div className="h-1 rounded-full bg-canvas overflow-hidden">
    <div className="h-full bg-accent transition-all" style={{ width: "62%" }} />
  </div>
</div>;
```

#### `<EmptyState icon title description action />`

```tsx
export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-canvas border border-border">
        <Icon className="h-5 w-5 text-subtle" />
      </div>
      <h3 className="font-serif text-xl font-semibold mb-2">{title}</h3>
      <p className="max-w-sm text-sm text-muted leading-relaxed mb-5 text-pretty">{description}</p>
      {action}
    </div>
  );
}
```

---

## 3. Page Layouts

每頁列：層級描述 → desktop JSX scaffold (Tailwind, 假資料, 可獨立 render) → mobile 變體 → 互動 notes。

### 3.1 `/` 公開首頁（D1 Editorial Index）

**Visual hierarchy**：

1. Site header（logo + 登入）
2. Course tab nav（水平、底線、>10 課改用 dropdown 收納見 notes）
3. 課程描述區（可摺疊 markdown）
4. Reports list（vertical card list，包含 thumb + title + summary + meta）

```tsx
// app/(public)/c/[courseSlug]/page.tsx
export default function CoursePage({ params, searchParams }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight">研究筆記</span>
            <span className="font-mono text-2xs tracking-[0.06em] text-subtle">NTU SOC</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            登入
          </Link>
        </div>
      </header>

      {/* Course tabs */}
      <nav aria-label="課程" className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-6">
          <ul className="flex gap-7 overflow-x-auto scrollbar-thin -mb-px">
            {courses.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/c/${c.slug}`}
                  className={`block py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${
                      c.slug === active
                        ? "text-foreground border-accent"
                        : "text-muted border-transparent hover:text-foreground"
                    }`}
                >
                  <span className="font-mono text-2xs tracking-[0.06em] text-subtle mr-1.5">
                    {c.code}
                  </span>
                  {c.name}
                </Link>
              </li>
            ))}
            {/* If > 10 courses, last item collapses into a dropdown: */}
            {/* <li><CoursesDropdown extra={courses.slice(8)} /></li> */}
          </ul>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Course header */}
        <section className="mb-10">
          <div className="font-mono text-2xs uppercase tracking-[0.12em] text-subtle mb-2">
            {course.code} · {course.term}
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-3 text-sm text-muted">{course.teacher}</p>
          <CollapsibleMarkdown
            markdown={course.description}
            className="prose prose-sm mt-5 text-pretty"
          />
        </section>

        {/* Reports list */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-2xl font-semibold">已發布報告</h2>
            <span className="text-xs text-subtle">{reports.length} 篇</span>
          </div>
          <div className="grid gap-3">
            {reports.map((r) => (
              <ReportListItem key={r.slug} report={r} courseSlug={course.slug} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-20 py-10 text-center text-xs text-subtle">
        © 2026 NTU Sociology ·{" "}
        <Link href="/privacy" className="hover:underline">
          隱私
        </Link>{" "}
        ·{" "}
        <Link href="/tos" className="hover:underline">
          條款
        </Link>
      </footer>
    </div>
  );
}
```

**Mobile（375px）變體：**

- Header 維持 sticky，logo 與登入按鈕一行
- Course tabs：水平 scroll（`overflow-x-auto`），shadcn 不額外改裝
- Card 改為單欄、thumb 縮為 `h-16 w-16`，置左
- Padding 改 `px-4`，content max-width 自然撐滿

```tsx
{
  /* mobile-only card override */
}
<a className="block rounded-md border border-border bg-surface p-4 md:p-5">
  <div className="flex gap-3 md:gap-5">
    <img className="h-16 w-16 md:h-24 md:w-24 ..." />
    {/* ...stays the same */}
  </div>
</a>;
```

**互動 notes：**

- Tab nav hover：`text-muted → text-foreground`，下底線 `border-transparent → border-border-strong`
- Active tab：`text-foreground border-accent`
- Course list 卡片 hover：邊框由 `border` → `border-strong`；標題由 `text-foreground` → `text-accent`（用 `group-hover:`）
- 課程描述用 `<Collapsible>`（shadcn），預設展開若 ≤ 200 chars，否則折疊顯示 "顯示完整描述 ↓"
- **>10 課程**：第 9 個之後折進 `<DropdownMenu>`，trigger 顯示「更多課程 ▾」

### 3.2 `/c/{courseSlug}/r/{reportSlug}` 報告閱讀頁（R1 Classical）

**Visual hierarchy**：

1. Top nav（sticky, minimal）
2. Article masthead（mono code → serif title → author + date + reading time）
3. `<MarkdownRenderer>` content（prose）— **single column, measure 65–75 字元**
4. Footer：返回課程 / 上下篇

```tsx
// app/(public)/c/[courseSlug]/r/[reportSlug]/page.tsx
export default function ReportPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link
            href={`/c/${courseSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 返回 {courseName}
          </Link>
          <Link href="/" className="font-serif text-sm font-semibold tracking-tight">
            研究筆記
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-[680px] px-6 py-14">
        {/* Masthead */}
        <header className="mb-12">
          <div className="font-mono text-2xs uppercase tracking-[0.12em] text-subtle mb-3">
            {course.code} · {course.term} · 期末報告
          </div>
          <h1 className="font-serif text-5xl font-semibold tracking-tight leading-[1.15] text-pretty">
            {report.title}
          </h1>
          <div className="mt-7 flex items-center gap-3 text-sm text-muted">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{report.author[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{report.author}</span>
            <span>·</span>
            <time dateTime={report.publishedAt}>發布於 {formatDate(report.publishedAt)}</time>
            <span>·</span>
            <span>{report.readingMinutes} 分鐘閱讀</span>
          </div>
          <Separator className="mt-7" />
        </header>

        <MarkdownRenderer content={report.content} className="prose prose-research max-w-none" />

        <footer className="mt-20 border-t border-border pt-10">
          <Link
            href={`/c/${courseSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 返回 {courseName} 所有報告
          </Link>
        </footer>
      </article>

      <footer className="border-t border-border py-10 text-center text-xs text-subtle">
        © 2026 NTU Sociology · 引用本文請註明出處
      </footer>
    </div>
  );
}
```

**Mobile：** `max-w-[680px]` 自然在 375px 下變窄；`px-6 py-14` 改 `px-5 py-10`；H1 字級 `text-5xl` → 行高還夠，不需改。

**Typography 細節（prose customization）見 §4.4。**

**互動 notes：**

- Article H2/H3 自動產生 anchor id（rehype-slug），hover 時右側顯示 `#`（用 `prose-headings:relative` + `::before`）
- 內部圖片點擊放大用 `<Dialog>` lightbox（v2）
- 引用：複製連結 → toast 提示「已複製」

### 3.3 `/workspace/c/{courseId}` 學生編輯器（E3 Focus Mode）

**三欄模型**：右側懸浮 sidebar（不是固定欄位）+ 主編輯區根據 mode 切換。

**Top bar 元素**：

- 左：返回 workspace 連結 + 課程 + 報告標題
- 中：`Write / Both / Preview` segmented control（mode switcher）
- 右：SaveStatusIndicator → 「資源」按鈕（toggle sidebar） → 手動儲存（Ctrl+S 提示）

```tsx
// app/(workspace)/workspace/c/[courseId]/page.tsx
"use client";
import MDEditor from "@uiw/react-md-editor";

export default function EditorPage() {
  const [mode, setMode] = useState<"write" | "both" | "preview">("both");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [save, setSave] = useState<{ state: SaveState; since?: Date }>({
    state: "saved",
    since: new Date(),
  });

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-5 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/workspace" className="text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-mono text-2xs uppercase tracking-[0.06em] text-subtle whitespace-nowrap">
            {course.code}
          </span>
          <span className="text-border-strong">/</span>
          <span className="font-serif text-sm font-semibold truncate">
            {report.title || "（無標題）"}
          </span>
        </div>

        {/* Mode switcher */}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as any)}
          className="hidden md:flex bg-canvas rounded border border-border p-0.5"
        >
          {[
            ["write", "Write"],
            ["both", "Both"],
            ["preview", "Preview"],
          ].map(([v, label]) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="px-3 h-7 text-xs font-medium text-muted rounded-sm
                         data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator state={save.state} since={save.since} />
          <Separator orientation="vertical" className="h-5" />
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen((o) => !o)}>
            <PanelRight className="h-4 w-4 mr-1.5" /> 資源
          </Button>
          <Button variant="secondary" size="sm">
            <kbd className="font-mono text-2xs text-subtle mr-1">⌘S</kbd> 儲存
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex min-h-0" data-color-mode="light">
          {(mode === "write" || mode === "both") && (
            <div
              className={
                mode === "both" ? "flex-1 border-r border-border min-w-0" : "flex-1 min-w-0"
              }
            >
              <MDEditor
                value={draft}
                onChange={setDraft}
                preview="edit"
                hideToolbar={false}
                height="100%"
                className="!border-0 !bg-background !rounded-none"
              />
            </div>
          )}
          {(mode === "preview" || mode === "both") && (
            <div className="flex-1 min-w-0 overflow-auto bg-background">
              <div className="mx-auto max-w-[680px] px-10 py-12">
                <MarkdownRenderer content={draft} className="prose prose-research max-w-none" />
              </div>
            </div>
          )}
        </div>

        {/* Floating sidebar */}
        {sidebarOpen && (
          <aside className="hidden md:block w-72 shrink-0 border-l border-border bg-canvas overflow-y-auto">
            <SidebarMetadata report={report} />
            <Separator />
            <SidebarFiles files={files} />
          </aside>
        )}
      </div>
    </div>
  );
}
```

`<SidebarMetadata>`：

```tsx
<section className="p-4 space-y-4">
  <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle">資訊</div>

  <Field label="標題">
    <Input value={meta.title} onChange={..} />
  </Field>
  <Field label="作者名稱">
    <Input value={meta.author} onChange={..} />
  </Field>
  <Field label="摘要">
    <Textarea rows={3} value={meta.summary} onChange={..} className="min-h-[80px]" />
  </Field>
  <Field label="封面圖">
    {meta.cover ? (
      <div className="relative group">
        <img src={meta.cover} className="w-full aspect-[3/2] object-cover rounded border border-border" />
        <button className="absolute top-1.5 right-1.5 h-7 px-2 rounded bg-foreground/80 text-background text-2xs opacity-0 group-hover:opacity-100 transition-opacity">變更</button>
      </div>
    ) : (
      <FileUploadButton hint="建議 3:2 比例 · 最大 10MB" />
    )}
  </Field>
</section>
```

`<SidebarFiles>`：

```tsx
<section className="p-4 space-y-3">
  <div className="flex items-center justify-between">
    <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
      圖片資源 · {files.length}
    </div>
    <FileUploadButton compact />
  </div>
  {files.length === 0 ? (
    <p className="text-xs text-subtle italic py-2">尚未上傳任何圖片</p>
  ) : (
    <ul className="space-y-1.5">
      {files.map((f) => (
        <li
          key={f.id}
          className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface"
        >
          <img src={f.thumb} className="h-7 w-7 rounded object-cover bg-canvas" />
          <div className="min-w-0 flex-1">
            <div className="text-xs truncate">{f.name}</div>
            <div className="font-mono text-2xs text-subtle">{f.sizeKB} KB</div>
          </div>
          <button
            onClick={() => copyMarkdown(f)}
            className="opacity-0 group-hover:opacity-100 text-2xs text-accent hover:underline"
          >
            插入
          </button>
        </li>
      ))}
    </ul>
  )}
</section>
```

**Mobile（< 768px）：**

- Mode switcher 隱藏；mobile 上改為**底部 tab bar**（Write / Preview / 資源）切換全螢幕
- Sidebar 改為 `<Sheet side="right">`，由 top bar 的「資源」按鈕觸發
- Editor / preview 各佔全寬

```tsx
{
  /* mobile only */
}
<nav className="md:hidden fixed bottom-0 inset-x-0 h-14 border-t border-border bg-surface flex">
  {[
    ["write", "Write", Pencil],
    ["preview", "Preview", Eye],
    ["files", "資源", PanelRight],
  ].map(([v, label, Icon]) => (
    <button
      key={v}
      onClick={() => setMobileTab(v)}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-2xs font-medium
                  ${mobileTab === v ? "text-accent" : "text-muted"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  ))}
</nav>;
```

**互動 notes：**

- 自動儲存 debounce 1.5s，state machine: `idle → saving → saved (with timestamp) → (after 30s back to idle/show 'saved Xs ago')`
- Offline detection：`window.addEventListener('online'/'offline')` → 切到 offline state；草稿暫存 `localStorage`，重連後 flush
- Ctrl/⌘+S：preventDefault，觸發 manual save，toast 顯示「已儲存」
- Mode switch 是 client state，不寫進 URL
- 編輯器主體用 `@uiw/react-md-editor` 預設樣式（**保持其外觀不改**），只 override 邊框為 0、背景為 `bg-background`
- Preview 區套用 **§4.4 的 prose customization** — 即 `<MarkdownRenderer className="prose prose-research">`

### 3.4 `/login`（L2 Editorial Split）

```tsx
// app/(public)/login/page.tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left editorial column */}
      <aside className="hidden md:flex flex-col justify-between border-r border-border p-16 bg-background">
        <Link href="/" className="inline-flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold tracking-tight">研究筆記</span>
          <span className="font-mono text-2xs tracking-[0.06em] text-subtle">NTU SOC</span>
        </Link>

        <div>
          <div className="font-mono text-2xs uppercase tracking-[0.18em] text-subtle mb-5">
            Vol. 03 · 2026 春
          </div>
          <blockquote className="font-serif text-3xl font-medium leading-[1.35] tracking-tight text-pretty">
            「研究筆記的目的，是讓田野的聲音能夠被聽見、被引用、被回應。」
          </blockquote>
          <footer className="mt-4 text-sm text-subtle">—— 主編語</footer>
        </div>

        <div className="text-xs text-subtle">© 2026 NTU Sociology</div>
      </aside>

      {/* Right form column */}
      <main className="grid place-items-center p-10 md:p-16 bg-surface">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-4xl font-semibold tracking-tight mb-2">登入</h1>
          <p className="font-serif text-base text-muted leading-relaxed mb-7">
            僅供台大社會所師生使用。
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full h-11 flex items-center justify-center gap-3 rounded bg-surface border border-border-strong
                       hover:bg-canvas transition-colors text-sm font-medium
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <GoogleIcon className="h-4 w-4" />
            使用 Google 帳號登入
          </button>

          <p className="mt-4 text-xs text-subtle leading-relaxed">
            登入即表示同意{" "}
            <Link
              href="/tos"
              className="text-accent underline underline-offset-[3px] decoration-accent/40"
            >
              使用條款
            </Link>{" "}
            與{" "}
            <Link
              href="/privacy"
              className="text-accent underline underline-offset-[3px] decoration-accent/40"
            >
              隱私政策
            </Link>
            。
          </p>
        </div>
      </main>
    </div>
  );
}
```

**Mobile：** Left aside `hidden md:flex`；mobile 只剩右欄、wordmark 改顯示於頂部、 padding 改 `p-8`。

### 3.5 `/workspace/onboarding`（2-step wizard）

```tsx
// app/(workspace)/workspace/onboarding/page.tsx
"use client";
export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="min-h-screen grid place-items-center bg-background p-10">
      <div className="w-full max-w-[480px]">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-7">
          {[1, 2].map((n) => (
            <Fragment key={n}>
              <div
                className={`grid h-6 w-6 place-items-center rounded-full font-mono text-xs font-semibold
                ${n <= step ? "bg-accent text-accent-foreground" : "bg-canvas text-subtle border border-border"}`}
              >
                {n}
              </div>
              {n === 1 && <div className={`h-px w-8 ${step >= 2 ? "bg-accent" : "bg-border"}`} />}
            </Fragment>
          ))}
          <span className="ml-2 font-mono text-2xs uppercase tracking-[0.08em] text-subtle">
            步驟 {step} / 2
          </span>
        </div>

        {step === 1 && (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-center mb-2">
              輸入課程代碼
            </h1>
            <p className="font-serif text-base text-muted text-center leading-relaxed mb-8 text-pretty">
              代碼由開課老師提供，共 6 碼英數字。沒有代碼？請聯絡課堂助教或{" "}
              <Link href="/" className="text-accent underline underline-offset-[3px]">
                瀏覽公開頁
              </Link>
              。
            </p>

            <CodeInput value={code} onChange={setCode} error={!!err} />
            {err ? (
              <p className="mt-3 text-center text-sm text-destructive font-medium">{err}</p>
            ) : (
              <p className="mt-3 text-center text-xs text-subtle">
                代碼不區分大小寫；貼上後自動格式化
              </p>
            )}

            <Button size="lg" className="w-full mt-7" onClick={submit1}>
              下一步 →
            </Button>
            <Button variant="ghost" size="default" className="w-full mt-2 text-muted">
              稍後設定，先瀏覽公開頁
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-center mb-2">
              你的公開作者名稱
            </h1>
            <p className="font-serif text-base text-muted text-center leading-relaxed mb-7 text-pretty">
              這是會出現在你公開報告上的署名，可與 Google 帳號名稱不同。日後可在設定變更。
            </p>

            <label className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-1.5 block">
              作者名稱
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-base"
              autoFocus
            />
            <p className="mt-2 text-xs text-subtle mb-6">2–30 字，可含中文、英文、數字、空格</p>

            {/* Preview */}
            <div className="rounded-md border border-border bg-surface px-4 py-3.5 mb-7">
              <div className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-2">
                預覽 · 你的報告會這樣顯示
              </div>
              <div className="font-serif text-base font-semibold tracking-tight mb-1">
                當代社會變遷下的勞動關係研究
              </div>
              <div className="text-xs text-subtle">
                <span className="text-muted font-medium">{name || "—"}</span> · 2026-04-15 · 14 分鐘
              </div>
            </div>

            <Button size="lg" className="w-full">
              完成設定，進入工作區
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="w-full mt-2 text-muted"
              onClick={() => setStep(1)}
            >
              ← 上一步
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

`<CodeInput>` 6 個 cell：

```tsx
function CodeInput({ value, onChange, error }: Props) {
  return (
    <div className="flex justify-center gap-2">
      {value.map((c, i) => (
        <input
          key={i}
          value={c}
          maxLength={1}
          onChange={(e) => handleType(i, e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-15 w-13 rounded text-center font-mono text-[1.375rem] font-semibold uppercase
                     bg-surface border focus:outline-none focus:ring-2 focus:ring-accent/30
                     ${error ? "border-destructive bg-destructive-soft text-destructive-fg" : "border-border-strong focus:border-accent"}`}
        />
      ))}
    </div>
  );
}
```

**Mobile：** 容器 `max-w-[480px]` + `p-10` 改 `p-6`。Code 格子 `h-14 w-11` 在 375px 下剛好。

### 3.6 `/workspace`（學生課程列表）

```tsx
export default function WorkspaceHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader context="student" />
      <main className="mx-auto max-w-4xl px-7 py-12">
        <div className="mb-8">
          <div className="font-mono text-2xs uppercase tracking-[0.12em] text-subtle mb-2">
            我的工作區
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">三門課，三份報告</h1>
          <p className="mt-2 font-serif text-base text-muted">
            選擇要繼續寫的課程。也可以{" "}
            <button className="text-accent underline underline-offset-[3px]">加入新課程</button>。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((c) => (
            <CourseCard key={c.code} variant="student" course={c} />
          ))}

          <Link
            href="/workspace/onboarding"
            className="flex items-center justify-center gap-2.5 rounded-md border border-dashed border-border-strong px-5 min-h-[196px]
                       text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">輸入課程代碼加入新課程</span>
          </Link>
        </div>

        {courses.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="尚未加入任何課程"
            description="從老師那裡拿到 6 碼課程代碼，加入後即可開始撰寫期末報告。"
            action={
              <Button asChild>
                <Link href="/workspace/onboarding">輸入課程代碼</Link>
              </Button>
            }
          />
        )}
      </main>
    </div>
  );
}
```

**Mobile：** Grid 改 `grid-cols-1`，cards 全寬。

### 3.7 `/admin`（老師課程列表）

```tsx
export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader context="admin" />
      <main className="mx-auto max-w-5xl px-7 py-10">
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="font-mono text-2xs uppercase tracking-[0.12em] text-subtle mb-1.5">
              管理後台
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">我的課程</h1>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">＋ 建立新課程</Link>
          </Button>
        </div>

        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <div
            className="grid grid-cols-[120px_1fr_90px_110px_110px] bg-canvas border-b border-border px-5 py-2.5
                          font-mono text-2xs uppercase tracking-[0.08em] text-subtle"
          >
            <div>課程代碼</div>
            <div>課程名稱</div>
            <div className="text-right">學生</div>
            <div className="text-right">已發布</div>
            <div className="text-right">待審核</div>
          </div>
          {courses.map((c, i) => (
            <Link
              key={c.code}
              href={`/admin/courses/${c.id}`}
              className="grid grid-cols-[120px_1fr_90px_110px_110px] items-center px-5 py-4
                         border-b border-border last:border-b-0 hover:bg-canvas transition-colors"
            >
              <div className="font-mono text-sm font-medium">{c.code}</div>
              <div>
                <div className="font-serif text-base font-semibold leading-tight">{c.name}</div>
                <div className="mt-0.5 text-xs text-subtle">{c.term}</div>
              </div>
              <div className="text-right font-mono text-sm">{c.students}</div>
              <div className="text-right font-mono text-sm text-muted">{c.reports}</div>
              <div className="text-right">
                {c.pending > 0 ? (
                  <Badge className="bg-warning-soft text-warning-fg border-warning/40">
                    <Dot className="h-1.5 w-1.5 rounded-full bg-warning" /> {c.pending} 待審
                  </Badge>
                ) : (
                  <span className="text-xs text-subtle">—</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Mobile：** 老師 admin 是 100% 桌機 use case（見 brief Persona T）→ **mobile 只給 minimum responsive**：grid 改為 stacked rows，每個 row 變 card-like。

### 3.8 `/admin/courses/{id}`（課程設定 + 報告列表）

見 `tier2-v1.html` Section "Admin"。完整 JSX:

```tsx
export default function CourseAdminPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        context="admin"
        breadcrumb={[{ label: "我的課程", href: "/admin" }, { label: course.name }]}
      />

      <main className="mx-auto max-w-5xl px-7 py-9">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-mono text-xs text-subtle mb-1">
              {course.code} · {course.term}
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{course.name}</h1>
          </div>
          <Button variant="secondary" size="sm">
            編輯課程資訊
          </Button>
        </div>

        <CourseCodeDisplay
          code={course.joinCode}
          onCopy={() => {
            navigator.clipboard.writeText(course.joinCode);
            toast.success("已複製");
          }}
          onRegenerate={openRegenerateDialog}
        />

        <div className="mt-8 mb-3.5 flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold">學生報告</h2>
          <div className="text-xs text-subtle">
            共 {course.studentCount} 位學生 · {course.publishedCount} 份報告 · {course.pendingCount}{" "}
            份待審核
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <div
            className="grid grid-cols-[120px_1fr_180px_120px] bg-canvas border-b border-border px-5 py-2.5
                          font-mono text-2xs uppercase tracking-[0.08em] text-subtle"
          >
            <div>作者</div>
            <div>報告</div>
            <div>狀態</div>
            <div className="text-right">最近更新</div>
          </div>
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>

        {reports.length === 0 && (
          <EmptyState
            icon={FileText}
            title="此課程尚無任何報告"
            description="學生加入課程後會在這裡看到他們的報告，包含草稿與待審核版本。"
            action={null}
          />
        )}
      </main>
    </div>
  );
}
```

### 3.9 `/admin/courses/{id}/r/{rid}`（報告審核頁）

完整 JSX 見 `tier2-v1.html`。Key parts：

```tsx
export default function ReportReviewPage() {
  const [tab, setTab] = useState<"latest" | "diff" | "history">("diff");
  const [diffMode, setDiffMode] = useState<"source" | "rendered">("source");
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        context="admin"
        breadcrumb={[
          { label: course.code, href: `/admin/courses/${course.id}` },
          { label: `${report.author}的報告` },
        ]}
      />

      <main className="mx-auto max-w-5xl px-7 py-7">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <StatusTag kind={report.status} />
              <span className="text-xs text-subtle">
                · 上次發布 {formatDate(report.lastPublishedAt)} · 學生 {timeAgo(report.draftedAt)}{" "}
                更新
              </span>
            </div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight leading-tight">
              {report.title}
            </h1>
            <div className="mt-1.5 text-sm text-muted">作者　{report.author}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => setUnpubOpen(true)}>
              取消發布
            </Button>
            <Button onClick={() => setPublishOpen(true)}>發布新版本</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="border-b border-border w-full justify-start bg-transparent rounded-none h-auto p-0 gap-7">
            <TabsTrigger
              value="latest"
              className="py-2.5 px-0 text-sm font-medium text-muted border-b-2 border-transparent rounded-none
                         data-[state=active]:text-foreground data-[state=active]:border-accent data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Latest
            </TabsTrigger>
            <TabsTrigger value="diff" className="...">
              Diff
              <Badge className="ml-1.5 bg-warning-soft text-warning-fg border-warning/40 font-mono">
                +12 / -4
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="...">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diff" className="pt-5">
            <ToggleGroup
              type="single"
              value={diffMode}
              onValueChange={(v) => v && setDiffMode(v as any)}
              className="bg-transparent gap-1 mb-4"
            >
              {["source", "rendered"].map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className="h-7 px-3 text-xs rounded border border-transparent
                             data-[state=on]:bg-canvas data-[state=on]:border-border-strong data-[state=on]:text-foreground text-muted"
                >
                  {m === "source" ? "Source" : "Rendered"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* react-diff-viewer-continued */}
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <ReactDiffViewer
                oldValue={report.lastPublishedSource}
                newValue={report.draftSource}
                splitView={false}
                useDarkTheme={false}
                styles={diffViewerStyles}
                hideLineNumbers={false}
                renderContent={diffMode === "rendered" ? renderMarkdown : undefined}
              />
            </div>
          </TabsContent>
          {/* ...latest / history */}
        </Tabs>
      </main>

      {/* Publish confirmation */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">發布新版本？</DialogTitle>
            <DialogDescription className="text-sm text-muted leading-relaxed">
              學生最新的草稿將取代目前的公開版本。已發布的舊版會保留在 History 中，可隨時回復。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded bg-canvas px-3.5 py-2.5 text-xs text-muted flex items-center justify-between">
            <span>變更摘要</span>
            <span className="font-mono">+12 行 · −4 行 · 16 處</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmPublish}>確認發布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

`react-diff-viewer-continued` styling（light theme）：

```ts
// src/lib/diff-viewer-theme.ts — pass to <ReactDiffViewer styles={...} />
export const diffViewerStyles = {
  variables: {
    light: {
      diffViewerBackground: "hsl(var(--surface))",
      diffViewerColor: "hsl(var(--foreground))",
      addedBackground: "#eef5ec",
      addedColor: "hsl(var(--success-fg))",
      removedBackground: "#fbeeec",
      removedColor: "hsl(var(--destructive-fg))",
      wordAddedBackground: "#c9e0c2",
      wordRemovedBackground: "#f5cdc6",
      addedGutterBackground: "#dfeede",
      removedGutterBackground: "#f4ddd8",
      gutterBackground: "hsl(var(--canvas))",
      gutterBackgroundDark: "hsl(var(--canvas))",
      gutterColor: "hsl(var(--subtle))",
      codeFoldGutterBackground: "hsl(var(--canvas))",
      codeFoldBackground: "hsl(var(--canvas))",
      emptyLineBackground: "hsl(var(--background))",
    },
  },
  contentText: { fontFamily: "var(--font-mono)", fontSize: "12.5px", lineHeight: "1.65" },
  gutter: { padding: "3px 8px" },
};
```

### 3.10 `/workspace/settings`

完整 JSX 見 `tier2-v1.html`。Form-row pattern：

```tsx
<form className="space-y-5">
  <FormRow label="作者名稱" help="會出現在你公開報告上的署名。可與 Google 帳號名稱不同。">
    <Input defaultValue={profile.authorName} />
  </FormRow>
  <FormRow label="Email">
    <div className="h-9 px-3 flex items-center justify-between rounded bg-canvas border border-border text-sm text-muted">
      <span>{profile.email}</span>
      <span className="font-mono text-2xs text-subtle">由 Google 提供，無法變更</span>
    </div>
  </FormRow>
</form>;

{
  /* Danger zone */
}
<section className="mt-10">
  <h2 className="font-serif text-base font-semibold pb-2 border-b border-border text-destructive mb-3">
    危險區
  </h2>
  <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive-soft px-5 py-4">
    <div>
      <div className="text-sm font-medium text-destructive-fg mb-0.5">刪除我的帳號</div>
      <div className="text-xs text-muted leading-relaxed">
        所有已發布的報告會被移除、所有上傳的圖片會被刪除。此操作無法復原。
      </div>
    </div>
    <Button variant="destructive" className="shrink-0" onClick={openDeleteDialog}>
      刪除帳號…
    </Button>
  </div>
</section>;
```

### 3.11 `not-found.tsx` / `error.tsx` / `/admin/courses/new` / `/privacy` / `/tos`

完整 JSX 見 `tier3-v1.html`. 共用樣式重點：

**`not-found.tsx`：**

```tsx
<div className="min-h-screen bg-background grid place-items-center px-6">
  <div className="text-center max-w-md">
    <div className="font-mono text-sm tracking-[0.16em] text-subtle mb-5">ERROR · 404</div>
    <h1 className="font-serif text-6xl font-semibold tracking-tight mb-4 leading-[1.15]">
      找不到這個頁面
    </h1>
    <p className="font-serif text-base text-muted leading-relaxed mb-8 text-pretty">
      這份報告或課程可能已被取消發布、移除，或網址有誤。
    </p>
    <div className="flex gap-2.5 justify-center">
      <Button asChild>
        <Link href="/">返回首頁</Link>
      </Button>
      <Button variant="secondary" asChild>
        <Link href="/">瀏覽所有課程</Link>
      </Button>
    </div>
  </div>
</div>
```

**`error.tsx`：** 結構同上；唯一差異 — error code 變紅、加 mono 區塊顯示 `error_id`、首要 CTA 是「重新嘗試」（`reset()`）。文案強調「草稿已自動本機儲存」（給編輯器使用者的 reassurance）。

**`/admin/courses/new`：** form-row pattern 復用，footer 是 `flex justify-between` 的 action bar。

**`/privacy` + `/tos`：** 共用 `<LegalDocLayout>`，內容 prose serif，max-width `max-w-[640px]`。

---

## 4. Specific Patterns

### 4.1 Save Status Indicator (3 states)

見 §2.2 `<SaveStatusIndicator>`. 3 種視覺：

| State     | 視覺                                                                             |
| --------- | -------------------------------------------------------------------------------- |
| `saving`  | `<Loader2 className="h-3 w-3 animate-spin text-accent" />` + 「儲存中…」         |
| `saved`   | `1.5x1.5 rounded-full bg-success animate-saving`（脈動） + 「已儲存 · Xs 前」    |
| `offline` | `<CloudOff className="h-3 w-3" />` 加 `text-warning-fg` + 「離線（已暫存本機）」 |

### 4.2 Status Tags

見 §2.2 `<StatusTag>`. 三色：

- `unpublished` — `bg-canvas text-muted border-border-strong` · dot `bg-subtle`
- `published` — `bg-success-soft text-success-fg border-success/30` · dot `bg-success`
- `published-new` — `bg-warning-soft text-warning-fg border-warning/40` · dot `bg-warning`

### 4.3 Staging Banner

見 §2.2 `<StagingBanner>`. 高度 `~36px`（py-2 + content）；`sticky top-0 z-50`，**置於整個 layout 最頂層**，所以下方 `AppHeader` 也要適時 `top-9` 因應。

```tsx
// app/staging/layout.tsx 或在 production root layout 條件渲染
<StagingBanner />
<AppHeader />
{children}
```

### 4.4 Markdown Content — `prose-research` customization

裝 `@tailwindcss/typography` 後，新增 custom variant `prose-research`：

```ts
// tailwind.config.ts
typography: ({ theme }) => ({
  research: {
    css: {
      "--tw-prose-body":     "hsl(var(--foreground))",
      "--tw-prose-headings": "hsl(var(--foreground))",
      "--tw-prose-lead":     "hsl(var(--muted))",
      "--tw-prose-links":    "hsl(var(--accent))",
      "--tw-prose-bold":     "hsl(var(--foreground))",
      "--tw-prose-counters": "hsl(var(--subtle))",
      "--tw-prose-bullets":  "hsl(var(--border-strong))",
      "--tw-prose-hr":       "hsl(var(--border))",
      "--tw-prose-quotes":   "hsl(var(--foreground))",
      "--tw-prose-quote-borders": "hsl(var(--accent))",
      "--tw-prose-captions": "hsl(var(--subtle))",
      "--tw-prose-code":     "hsl(var(--foreground))",
      "--tw-prose-pre-code": "hsl(var(--foreground))",
      "--tw-prose-pre-bg":   "hsl(var(--canvas))",
      "--tw-prose-th-borders": "hsl(var(--border-strong))",
      "--tw-prose-td-borders": "hsl(var(--border))",

      fontFamily: theme("fontFamily.serif").join(", "),
      fontSize:   "17px",
      lineHeight: "1.8",
      maxWidth:   "none",

      "h1": { fontWeight: 600, letterSpacing: "-0.025em", fontSize: "2.25rem", lineHeight: "1.2", marginTop: "0", marginBottom: "1.2em" },
      "h2": { fontWeight: 600, letterSpacing: "-0.015em", fontSize: "1.6rem",  lineHeight: "1.3", marginTop: "2.2em", marginBottom: "0.7em",
              paddingBottom: "0.3em", borderBottom: `1px solid hsl(var(--border))` },
      "h3": { fontWeight: 600, letterSpacing: "-0.005em", fontSize: "1.25rem", lineHeight: "1.4", marginTop: "1.8em", marginBottom: "0.5em" },
      "h4": { fontWeight: 600, fontSize: "1.05rem", marginTop: "1.6em", marginBottom: "0.4em" },

      "p":           { marginTop: "0", marginBottom: "1.2em", textWrap: "pretty" },
      "a":           { textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "hsl(var(--accent) / 0.4)", fontWeight: 500 },
      "a:hover":     { textDecorationColor: "hsl(var(--accent))" },
      "strong":      { fontWeight: 600 },

      "blockquote":  { fontStyle: "normal", borderLeftWidth: "3px",
                       paddingLeft: "1.1em", marginLeft: "0", color: "hsl(var(--muted))",
                       fontFamily: theme("fontFamily.serif").join(", ") },
      "blockquote p:first-of-type::before": { content: "none" },
      "blockquote p:last-of-type::after":   { content: "none" },

      "code":        { fontFamily: theme("fontFamily.mono").join(", "), fontSize: "0.875em",
                       fontWeight: 500, background: "hsl(var(--canvas))",
                       borderRadius: "3px", padding: "0.15em 0.4em" },
      "code::before": { content: "none" }, "code::after": { content: "none" },
      "pre":         { fontFamily: theme("fontFamily.mono").join(", "), fontSize: "13px",
                       lineHeight: "1.7", background: "hsl(var(--canvas))",
                       border: `1px solid hsl(var(--border))`, borderRadius: "6px",
                       padding: "1em 1.2em" },
      "pre code":    { background: "transparent", padding: "0", borderRadius: "0", fontWeight: 400 },

      "ul, ol":      { paddingLeft: "1.4em", marginTop: "1em", marginBottom: "1.2em" },
      "li":          { marginTop: "0.3em", marginBottom: "0.3em" },

      "table":       { fontSize: "0.9em", fontFamily: theme("fontFamily.sans").join(", "), width: "100%" },
      "th":          { fontWeight: 600, fontFamily: theme("fontFamily.sans").join(", "), background: "hsl(var(--canvas))",
                       padding: "0.5em 0.8em", borderBottom: "1px solid hsl(var(--border-strong))" },
      "td":          { padding: "0.5em 0.8em", borderBottom: "1px solid hsl(var(--border))" },

      "img":         { borderRadius: "4px", border: "1px solid hsl(var(--border))" },
      "figure":      { marginTop: "2em", marginBottom: "2em" },
      "figcaption":  { fontFamily: theme("fontFamily.sans").join(", "), fontSize: "13px",
                       color: "hsl(var(--subtle))", textAlign: "center", marginTop: "0.6em",
                       paddingTop: "0.6em", borderTop: "1px solid hsl(var(--border))" },

      "hr":          { borderColor: "hsl(var(--border))", marginTop: "2.5em", marginBottom: "2.5em" },

      /* Footnotes — rehype-prism + remark-gfm 風格 */
      ".footnotes":  { marginTop: "3em", paddingTop: "1.5em", borderTop: "1px solid hsl(var(--border))",
                       fontSize: "14px", color: "hsl(var(--muted))" },
      ".footnote-ref a, .footnote-backref": { color: "hsl(var(--accent))", fontFamily: theme("fontFamily.mono").join(", "),
                       fontSize: "0.75em", verticalAlign: "super", textDecoration: "none" },

      /* KaTeX */
      ".math":         { fontFamily: "KaTeX_Main, Cambria, Cochin, serif" },
      ".math-display": { display: "block", margin: "1.5em 0", textAlign: "center", overflowX: "auto" },

      /* Embed wrappers — applied by MarkdownRenderer when it detects embed shortcodes */
      ".embed":         { marginTop: "2em", marginBottom: "2em", borderRadius: "6px",
                          border: "1px solid hsl(var(--border))", overflow: "hidden",
                          background: "hsl(var(--canvas))" },
      ".embed-youtube": { aspectRatio: "16 / 9", padding: "0" },
      ".embed-youtube iframe": { width: "100%", height: "100%", display: "block" },
      ".embed-instagram, .embed-facebook, .embed-threads": {
        padding: "1em", display: "flex", justifyContent: "center",
        fontFamily: theme("fontFamily.sans").join(", "),
      },
      ".embed-caption": { padding: "0.6em 1em", fontSize: "12px", color: "hsl(var(--subtle))",
                          borderTop: "1px solid hsl(var(--border))", fontFamily: theme("fontFamily.sans").join(", ") },
    },
  },
}),
```

`<MarkdownRenderer>` 套用方式：

```tsx
<div className="prose prose-research max-w-none">{renderedMdast}</div>
```

### 4.5 Empty State

見 §2.2 `<EmptyState>`. 場景對應：

| 場景         | icon               | title                  | 動作                        |
| ------------ | ------------------ | ---------------------- | --------------------------- |
| 無加入課程   | `BookOpen`         | 「尚未加入任何課程」   | Button → onboarding         |
| 課程內無報告 | `FileText`         | 「此課程尚無任何報告」 | none                        |
| 編輯器無圖片 | inline italic text | 「尚未上傳任何圖片」   | （inline FileUploadButton） |
| 老師無課程   | `LayoutGrid`       | 「還沒有建立任何課程」 | Button → /admin/courses/new |

### 4.6 Loading Skeletons

```tsx
{
  /* Report list skeleton */
}
<div className="grid gap-3">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="rounded-md border border-border bg-surface p-5 flex gap-5">
      <Skeleton className="h-24 w-24 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/3 mt-3" />
      </div>
    </div>
  ))}
</div>;

{
  /* Editor skeleton */
}
<div className="flex h-screen">
  <div className="flex-1 p-10 space-y-3">
    <Skeleton className="h-9 w-2/3" />
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-full mt-6" />
    <Skeleton className="h-4 w-11/12" />
    <Skeleton className="h-4 w-10/12" />
  </div>
  <div className="w-72 border-l border-border bg-canvas p-4 space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-9 w-full" />
    ))}
  </div>
</div>;

{
  /* Admin report row skeleton */
}
{
  Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className="grid grid-cols-[120px_1fr_180px_120px] items-center px-5 py-4 border-b border-border last:border-b-0"
    >
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-3 w-12 justify-self-end" />
    </div>
  ));
}
```

### 4.7 Toast 樣式（sonner）

| Variant | Trigger                              | Tailwind                                    |
| ------- | ------------------------------------ | ------------------------------------------- |
| Success | save manual / publish ok / copy code | `border-success/30 text-success-fg`         |
| Error   | upload fail / publish fail           | `border-destructive/40 text-destructive-fg` |
| Info    | offline detected / draft restored    | `border-info/40 text-info`                  |

```tsx
toast.success("已儲存", { description: "草稿同步至雲端", duration: 2500 });
toast.error("上傳失敗", { description: "檔案超過 10MB 限制", duration: 4000 });
toast.info("已從本機草稿還原", { description: "你上次離線時的編輯已恢復", duration: 5000 });
```

### 4.8 Confirmation Dialog

見 §3.9 publish dialog 範例。Pattern：

- Title 用 `font-serif text-lg`
- Description 用 `text-sm text-muted leading-relaxed`
- 若有「變更摘要」 / 「即將刪除的項目」 → `bg-canvas` 內框顯示
- Footer：左 `ghost`(取消)、右 `primary` 或 `destructive`(確認)
- **Destructive 操作**（取消發布、刪除帳號）右側按鈕用 `variant="destructive"`

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="font-serif">刪除帳號？</DialogTitle>
      <DialogDescription>以下資料將被永久刪除，無法復原：</DialogDescription>
    </DialogHeader>
    <ul className="rounded bg-destructive-soft px-4 py-3 text-sm text-destructive-fg space-y-1 list-disc list-inside">
      <li>3 份已發布報告</li>
      <li>12 張上傳的圖片</li>
      <li>所有未發布的草稿</li>
    </ul>
    <p className="text-xs text-muted">
      若要確認，請於下方輸入你的作者名稱「<strong>{name}</strong>」：
    </p>
    <Input placeholder={name} />
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        取消
      </Button>
      <Button variant="destructive" disabled={!confirmed}>
        確認刪除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4.9 Form validation messages

Inline，緊接 input 下方：

```tsx
<div>
  <Label className="font-mono text-2xs uppercase tracking-[0.08em] text-subtle mb-1.5">
    作者名稱
  </Label>
  <Input aria-invalid={!!error} />
  {error && (
    <p className="mt-1.5 text-xs text-destructive flex items-center gap-1.5">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  )}
  {!error && help && <p className="mt-1.5 text-xs text-subtle">{help}</p>}
</div>
```

---

## 5. Accessibility

### 5.1 Focus ring（站全統一 token）

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
```

→ 包進一個 utility class `focus-ring`，或統一放在 button/input base styles 中。

### 5.2 Keyboard navigation

- **Tab order**：top bar → main content → sidebar → footer。Skip link：第一個 focusable element 是「跳到主要內容」(`sr-only focus:not-sr-only`)
- **Editor**：Ctrl/⌘+S → manual save；Ctrl/⌘+Enter（preview 模式）→ 切回 write
- **Mode switcher** (`<ToggleGroup>`)：左右方向鍵切換
- **Tabs**（審核頁）：左右方向鍵切換、Home/End 跳首尾
- **Dialog**：Esc 關閉、focus trap 在 dialog 內、open 時 focus 第一個 input/button、close 後焦點回到 trigger
- **Code input**：自動跳到下一格、Backspace 在空格時回上一格、貼上 6 字串自動填入並 focus 末格

### 5.3 ARIA + alt

- `<StatusTag>` 用 `<span>` + visually displayed label 已足夠，不需 `role`
- `<StagingBanner>` 包 `role="status" aria-live="polite"`
- `<SaveStatusIndicator>` 包 `role="status" aria-live="polite"`
- All `<img>` 必須有 `alt`（封面圖、上傳圖、頭像）；裝飾性圖 `alt=""`
- Buttons that are icon-only (`<Button variant="ghost" size="icon">`) → 必有 `aria-label`
- Editor 三欄 layout：以 `<aside aria-label="圖片資源">` / `<section aria-label="編輯器">` / `<section aria-label="預覽">` 標記

### 5.4 對比表（WCAG AA）

| Token combo                             | Contrast                                  |
| --------------------------------------- | ----------------------------------------- |
| `foreground` on `background`            | 14.8:1 ✓ AAA                              |
| `muted` on `background`                 | 6.5:1 ✓ AA                                |
| `subtle` on `background`                | 4.5:1 ✓ AA（large/UI only — 不用於 body） |
| `accent` on `background`                | 6.8:1 ✓ AA                                |
| `accent-foreground` (white) on `accent` | 7.1:1 ✓ AAA                               |
| `warning-fg` on `warning-soft`          | 6.9:1 ✓ AAA                               |
| `success-fg` on `success-soft`          | 7.5:1 ✓ AAA                               |
| `destructive-fg` on `destructive-soft`  | 7.2:1 ✓ AAA                               |

`subtle` 只用於 mono micro-labels（大寫 + 字距），符合 WCAG「large text」門檻；body 一律用 `foreground` 或 `muted`。

---

## 6. Implementation Notes

### 6.1 shadcn install

```bash
npx shadcn@latest init
npx shadcn@latest add button card input textarea select checkbox radio-group \
  switch dialog tooltip popover tabs sonner badge avatar skeleton separator \
  dropdown-menu sheet alert form label toggle-group collapsible
```

### 6.2 額外 npm packages

```bash
pnpm add @uiw/react-md-editor react-diff-viewer-continued
pnpm add @tailwindcss/typography tailwindcss-animate
pnpm add lucide-react sonner
pnpm add remark-gfm rehype-katex remark-math rehype-slug
pnpm add react-social-media-embed
pnpm add date-fns clsx tailwind-merge class-variance-authority
```

KaTeX CSS（在 `app/layout.tsx` 或 `globals.css`）：

```ts
import "katex/dist/katex.min.css";
```

### 6.3 `tailwind.config.ts` 擴充

完整見 §1.1 + §1.3 + §1.4 + §4.4 typography。

### 6.4 `globals.css` 完整版本

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* see §1.1 */
  }
  .dark {
    /* see §1.2 */
  }

  * {
    @apply border-border;
  }
  html {
    @apply antialiased;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }

  /* skip link */
  .skip-link {
    @apply sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50
           focus:rounded focus:bg-accent focus:text-accent-foreground focus:px-3 focus:py-2 focus:text-sm;
  }
}

@layer utilities {
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
           focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }
}
```

### 6.5 Markdown pipeline（給工程端參考）

```ts
// src/components/markdown-renderer.tsx
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
// + custom plugin: detect ::youtube{url=...} / ::ig{url=...} / ::threads{url=...} → wrap into .embed.embed-{kind}
```

### 6.6 Layout structure

```
app/
  layout.tsx               ← fonts + Toaster + (conditional) StagingBanner
  page.tsx                 ← / 重導向至預設課程或 /c/[defaultSlug]
  (public)/
    c/[courseSlug]/page.tsx
    c/[courseSlug]/r/[reportSlug]/page.tsx
    login/page.tsx
  (workspace)/
    workspace/layout.tsx           ← 含 AppHeader context="student"
    workspace/page.tsx
    workspace/onboarding/page.tsx
    workspace/settings/page.tsx
    workspace/c/[courseId]/page.tsx
  (admin)/
    admin/layout.tsx               ← 含 AppHeader context="admin"
    admin/page.tsx
    admin/courses/new/page.tsx
    admin/courses/[id]/page.tsx
    admin/courses/[id]/r/[rid]/page.tsx
  privacy/page.tsx
  tos/page.tsx
  error.tsx
  not-found.tsx
```

---

## 7. Out of Scope

明確不做的東西（避免 scope creep）：

- **Dark mode toggle UI** — tokens 已在 §1.2 備好，但 UI toggle 留到 v2，1.0 一律 light mode
- **即時協作 cursor / multiplayer** — 不在 spec
- **留言系統 / 公開頁面的 reaction** — 不在 spec
- **Markdown 編輯器 toolbar 客製** — 用 `@uiw/react-md-editor` 預設 toolbar
- **In-app 圖片裁切** — 只給「建議比例 3:2、上限 10MB」hint，由學生自行處理
- **報告版本之間的 visual rollback UI** — History tab 可看，但「回復成此版本」按鈕為 v2
- **搜尋功能（公開站全文搜尋）** — v2
- **訂閱 / RSS** — v2
- **多語系（i18n）** — 全站中文一語
- **Mobile 適配的優先級**：訪客閱讀頁 = 高，學生編輯器 = 中（堪用），admin = 低（只給 minimum responsive）

---

_End of design.md._
