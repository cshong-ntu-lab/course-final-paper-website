# Public pages v4 · 套用指引

> 鎖定方向：L2 trimmed（masthead → lead → epigraph → 3-col）+ R1 trimmed（content + right rail）。
> 純 className 差異照原本 `FILE / ELEMENT / OLD / NEW` 格式；新元素以 `INSERT:` 標記並附最小 JSX。

---

## 0 · Setup（一次性）

### `globals.css` — 加入動畫 token

```css
@theme {
  --animate-pulse-dot: pulse-dot 2.4s ease-in-out infinite;
  --animate-draw-line: draw-line 900ms ease-out 200ms both;
  --animate-fade-up: fade-up 600ms ease-out both;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.18);
  }
}
@keyframes draw-line {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

之後就能直接寫 `animate-pulse-dot` / `animate-draw-line` / `animate-fade-up`。

### Report frontmatter / type 需要新增（optional）

```ts
type Report = {
  // ...existing
  subtitle?: string; // italic 副題、reader masthead 用
  pullQuote?: string; // ReportListItem variant="text-only" 用
  authorBio?: string; // reader 文末 bio 卡用
  authorAffiliation?: string; // ex: "社會學系碩二"
  coverCaption?: string; // reader cover figure 下方 caption
};
```

---

## 1 · FILE: `src/components/Footer.tsx`

```
ELEMENT: <footer>
OLD: "border-border border-t px-6 py-10 text-center text-xs text-subtle mt-20"
NEW: "border-border border-t mt-20"
```

**REPLACE inner content** with 3-col block：

```tsx
<div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-6 pt-11 pb-7 sm:grid-cols-[2fr_1fr_1fr]">
  <div>
    <div className="inline-flex items-baseline gap-2">
      <span className="font-serif text-lg font-semibold tracking-tight text-foreground">台大社會系</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-subtle">NTU SOC · Research Notes</span>
    </div>
    <p className="mt-2.5 max-w-[480px] text-[13px] leading-relaxed text-muted">
      國立臺灣大學社會學系研究生課程之期末報告公開站。報告內容由作者保留著作權，引用請註明出處。
    </p>
  </div>
  <div>
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">關於</p>
    <ul className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
      <li><Link href="/about" className="text-muted hover:text-foreground transition-colors">編輯方針</Link></li>
      <li><Link href="/cite"  className="text-muted hover:text-foreground transition-colors">引用規範</Link></li>
      <li><Link href="/rss"   className="text-muted hover:text-foreground transition-colors">RSS</Link></li>
    </ul>
  </div>
  <div>
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">條款</p>
    <ul className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
      <li><Link href="/privacy" className="text-muted hover:text-foreground transition-colors">隱私</Link></li>
      <li><Link href="/tos"     className="text-muted hover:text-foreground transition-colors">使用條款</Link></li>
      <li><Link href="/contact" className="text-muted hover:text-foreground transition-colors">聯絡</Link></li>
    </ul>
  </div>
</div>
<div className="border-border mx-auto flex max-w-[1180px] items-center justify-between border-t px-6 py-4 font-mono text-[10.5px] tracking-[0.08em] text-subtle">
  <span>© 2026 NTU SOCIOLOGY</span>
  <span>VOL. III · ISSUE OF SPRING 2026</span>
</div>
```

---

## 2 · FILE: `src/components/public/ReportListItem.tsx`

這個元件 v4 需要 **三個 variants**（`lead` / `default` / `text-only`），結構差異大，純 className diff 沒辦法表達。下面是**整支 component 的新 JSX**：

```tsx
import Link from "next/link";

type Variant = "lead" | "default" | "text-only";

export function ReportListItem({
  report,
  courseSlug,
  variant = "default",
}: {
  report: Report;
  courseSlug: string;
  variant?: Variant;
}) {
  // ─── Lead · full-width side-by-side ─────────────────
  if (variant === "lead") {
    return (
      <Link
        href={`/c/${courseSlug}/r/${report.slug}`}
        className="card-link group animate-fade-up grid grid-cols-1 items-center gap-12 border-b border-border py-10 md:grid-cols-[1.1fr_1fr]"
      >
        <div className="overflow-hidden bg-border ring-1 ring-border-strong">
          {report.cover ? (
            <img
              src={report.cover}
              alt=""
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0_6px,transparent_6px_12px)]" />
          )}
        </div>
        <div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {report.tags?.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <h3 className="font-serif text-[40px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground transition-colors group-hover:text-accent text-pretty">
            {report.title}
          </h3>
          <p className="mt-4 font-serif text-[16.5px] leading-[1.75] text-muted text-pretty">
            {report.summary}
          </p>
          <div className="mt-5 flex items-center gap-3 text-[13px] text-subtle">
            <Avatar name={report.author} size={28} />
            <span className="font-serif text-[14px] font-semibold text-foreground">
              {report.author}
            </span>
            <span>·</span>
            <time>{report.date}</time>
            <span>·</span>
            <span>{report.reading}</span>
          </div>
        </div>
      </Link>
    );
  }

  // ─── Text-only · pull-quote replaces cover ──────────
  if (variant === "text-only") {
    return (
      <Link
        href={`/c/${courseSlug}/r/${report.slug}`}
        className="card-link group flex animate-fade-up flex-col"
      >
        <div className="flex aspect-[3/2] items-center justify-center border border-border bg-surface px-6 py-5">
          <p className="m-0 text-center font-serif italic text-[17px] leading-[1.55] text-foreground text-balance">
            「{report.pullQuote}」
          </p>
        </div>
        <CardBody report={report} />
      </Link>
    );
  }

  // ─── Default · cover-on-top, 3-col grid ─────────────
  return (
    <Link
      href={`/c/${courseSlug}/r/${report.slug}`}
      className="card-link group flex animate-fade-up flex-col"
    >
      <div className="overflow-hidden bg-border ring-1 ring-border-strong">
        {report.cover ? (
          <img
            src={report.cover}
            alt=""
            className="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="aspect-[3/2] w-full bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0_6px,transparent_6px_12px)]" />
        )}
      </div>
      <CardBody report={report} />
    </Link>
  );
}

function CardBody({ report }: { report: Report }) {
  return (
    <>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {report.tags?.slice(0, 2).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <h3 className="mt-2.5 font-serif text-[21px] font-semibold leading-[1.3] tracking-[-0.005em] text-foreground transition-colors group-hover:text-accent text-pretty">
        {report.title}
      </h3>
      <p className="mt-2 font-serif text-[14.5px] leading-[1.7] text-muted line-clamp-3 text-pretty">
        {report.summary}
      </p>
      <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-3.5 text-[12.5px] text-subtle">
        <Avatar name={report.author} size={22} />
        <span className="font-serif text-[13px] font-semibold text-foreground">
          {report.author}
        </span>
        <span className="ml-auto font-mono text-[11px]">{report.date}</span>
      </div>
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[2px] border border-border bg-background px-2 py-[2px] text-[11px] tracking-[0.02em] text-muted transition-colors hover:border-accent hover:bg-accent hover:text-background">
      {children}
    </span>
  );
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full bg-accent font-serif font-semibold text-background"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {name[0]}
    </span>
  );
}
```

---

## 3 · FILE: `src/app/(public)/c/[courseSlug]/page.tsx`

### Site header / Tab nav

不變。

### Main

```
ELEMENT: <main>
OLD: "max-w-[1024px] mx-auto px-6 py-10"
NEW: "mx-auto max-w-[1180px] px-6 pt-[72px]"
```

### Course header — 整段重排

```
ELEMENT: <section> course header
OLD: "mb-10"
NEW: "animate-fade-up border-b-2 border-foreground pb-9 text-center"
```

**REPLACE course header children** with：

```tsx
<div className="mb-[18px] inline-flex flex-wrap items-center justify-center gap-3.5 font-mono text-[11px] uppercase tracking-[0.28em] text-subtle">
  <span>Vol. III</span>
  <span className="inline-block h-[5px] w-[5px] rounded-full bg-accent animate-pulse-dot" />
  <span>{course.code} · 113-2</span>
  <span className="inline-block h-[5px] w-[5px] rounded-full bg-accent animate-pulse-dot" />
  <span>{reports.length} ARTICLES</span>
</div>

<h1 className="m-0 font-serif text-[72px] font-semibold leading-[1.02] tracking-[-0.035em]">{course.name}</h1>

<div className="mt-3 flex justify-center">
  <span className="inline-block h-[2px] w-16 origin-left bg-accent animate-draw-line" />
</div>

<p className="mx-auto mt-[22px] max-w-[44ch] font-serif italic text-[19px] leading-[1.55] text-muted text-pretty">
  {course.subtitle ?? "研究生在學期末撰寫的田野觀察、訪談筆記與個案分析，署名公開、可供引用。"}
</p>

<div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-[12.5px] text-muted">
  <span>
    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">授課教師</span>
    <span className="ml-2.5 font-serif font-semibold text-foreground">{course.teacher}</span>
  </span>
  <span>
    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">學期</span>
    <span className="ml-2.5 font-mono text-[12px]">{course.termRange}</span>
  </span>
</div>
```

### Reports section

```
ELEMENT: <section> reports container
OLD: (none specific)
NEW: "pt-[52px]"
```

```
ELEMENT: reports header wrapper
OLD: "flex items-baseline justify-between mb-4"
NEW: "flex items-baseline justify-between border-b border-border pb-[18px]"
```

```
ELEMENT: reports title <h2>
OLD: "font-serif text-2xl font-semibold text-foreground"
NEW: "m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]"
```

```
ELEMENT: reports count <span>
OLD: "text-xs text-subtle"
NEW: "font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle"
```

> 文案：建議 `<h2>本期報告</h2>` + `<span>{n} 篇</span>`；若必須留「已發布報告」字串可保留。

```
ELEMENT: reports grid <div>
OLD: "grid gap-3"
NEW: (delete the wrapping div — children are now layered sections)
```

**REPLACE reports children** with：

```tsx
{
  /* Lead card */
}
<ReportListItem report={reports[0]} courseSlug={courseSlug} variant="lead" />;

{
  /* Epigraph */
}
<figure className="m-0 animate-fade-up border-b border-border py-16 text-center">
  <blockquote className="m-0 mx-auto max-w-[760px] font-serif italic text-[28px] font-medium leading-[1.45] tracking-[-0.015em] text-foreground text-balance">
    <span className="mr-1 inline-block font-serif text-[1.1em] leading-none text-accent/45">“</span>
    The future of AI research will require training models to better understand the science of
    social relationships.
    <span className="ml-1 inline-block font-serif text-[1.1em] leading-none text-accent/45">”</span>
  </blockquote>
  <figcaption className="mx-auto mt-[22px] max-w-[720px] font-sans text-[12.5px] leading-[1.7] text-muted text-pretty">
    C.A. Bail, <em className="italic">Can Generative AI improve social science?</em>,{" "}
    <span className="font-serif">Proc. Natl. Acad. Sci. U.S.A.</span>{" "}
    <strong className="font-semibold text-foreground">121</strong> (21) e2314021121 (2024).
    <br />
    <a
      href="https://doi.org/10.1073/pnas.2314021121"
      className="mt-1 inline-block border-b border-accent/35 pb-[1px] font-mono text-[11.5px] text-accent"
    >
      doi.org/10.1073/pnas.2314021121
    </a>
  </figcaption>
</figure>;

{
  /* 3-col remaining · 中間 text-only-with-pullquote 增加韻律 */
}
<div className="grid grid-cols-1 gap-9 pt-11 md:grid-cols-3">
  <ReportListItem report={reports[1]} courseSlug={courseSlug} variant="text-only" />
  <ReportListItem report={reports[2]} courseSlug={courseSlug} variant="default" />
  <ReportListItem report={reports[3]} courseSlug={courseSlug} variant="text-only" />
</div>;
```

---

## 4 · FILE: `src/app/(public)/c/[courseSlug]/r/[reportSlug]/page.tsx`

### Reader header — 加 progress sliver

```
ELEMENT: <header> reader-header
OLD: "border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur"
NEW: "border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur"
```

```
ELEMENT: reader-header inner
OLD: "mx-auto max-w-[768px] px-6 h-14 flex items-center justify-between"
NEW: "mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6"
```

**INSERT** 在 reader-header inner `</div>` 之後（still inside `<header>`）：

```tsx
<div className="h-[2px] bg-border-strong/30">
  <div
    className="h-full bg-accent transition-[width] duration-150"
    style={{ width: `${progressPct}%` }}
  />
</div>
```

> `progressPct` 由 client 用 `useEffect + scroll listener` 計算（看 article wrapper 的 boundingRect 與 viewport），或更簡單：用 `useScrollProgress` hook 包 `window.scrollY / (document.body.scrollHeight - innerHeight)`。

### Article wrapper — 改 grid 三欄

```
ELEMENT: <article>
OLD: "mx-auto max-w-[680px] px-6 py-14"
NEW: "mx-auto grid max-w-[1180px] gap-x-16 px-6 py-14 lg:grid-cols-[minmax(0,720px)_200px] lg:justify-center"
```

### Article header — 重排

```
ELEMENT: article-header <header>
OLD: "mb-12"
NEW: "mb-10 animate-fade-up"
```

```
ELEMENT: article-eyebrow <div>
OLD: "font-mono text-[10.4px] tracking-[0.12em] uppercase text-subtle mb-3"
NEW: "mb-4 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle"
```

**REPLACE article-eyebrow children** with：

```tsx
<span>{course.code}</span>
<span className="inline-block h-[5px] w-[5px] rounded-full bg-accent animate-pulse-dot" />
<span>113-2 · 期末報告</span>
```

```
ELEMENT: article-title <h1>
OLD: "font-serif text-[44px] font-semibold leading-[1.15] tracking-tight text-foreground"
NEW: "m-0 font-serif text-[58px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground text-balance"
```

**INSERT** italic subtitle after `<h1>`（若 `report.subtitle` 存在）：

```tsx
{
  report.subtitle && (
    <p className="m-0 mt-[22px] max-w-[32em] font-serif italic text-[21px] leading-[1.5] text-muted text-pretty">
      {report.subtitle}
    </p>
  );
}
```

**INSERT** tag chips after subtitle：

```tsx
{
  report.tags && report.tags.length > 0 && (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {report.tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-[2px] border border-accent/30 bg-accent/[0.08] px-2 py-[2px] text-[11px] tracking-[0.02em] text-accent transition-colors hover:bg-accent hover:text-background"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
```

### Article meta — 改 3-cell

```
ELEMENT: article-meta wrapper
OLD: "mt-7 flex flex-wrap items-center gap-3 text-sm text-muted"
NEW: "mt-8 flex flex-wrap items-center gap-[18px] text-sm"
```

**REPLACE article-meta children** with：

```tsx
<div className="flex items-center gap-3">
  <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-serif text-[18px] font-semibold text-background">
    {report.author[0]}
  </span>
  <div>
    <div className="font-serif text-[15px] font-semibold text-foreground">{report.author}</div>
    {report.authorAffiliation && (
      <div className="text-[12px] text-subtle">{report.authorAffiliation}</div>
    )}
  </div>
</div>
<div className="h-[30px] w-px bg-border" />
<div>
  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">發布</div>
  <div className="mt-1 text-[13.5px] text-foreground">{report.date}</div>
</div>
<div>
  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">閱讀</div>
  <div className="mt-1 text-[13.5px] text-foreground">{report.reading}</div>
</div>
```

```
ELEMENT: article-hr <hr>
OLD: "mt-7 border-t border-border"
NEW: "mt-8 border-t border-border-strong"
```

### INSERT · Cover figure + caption（hr 之後、prose 之前）

```tsx
{
  report.cover && (
    <figure className="m-0 mb-9">
      <div className="overflow-hidden bg-border ring-1 ring-border-strong">
        <img src={report.cover} alt="" className="aspect-video w-full object-cover" />
      </div>
      {report.coverCaption && (
        <figcaption className="mt-2.5 text-center font-sans text-[12px] text-subtle">
          {report.coverCaption}
        </figcaption>
      )}
    </figure>
  );
}
```

### INSERT · Author bio card（prose 之後）

```tsx
<section className="mt-14 flex gap-[18px] rounded-[5px] border border-border bg-surface px-6 py-[22px]">
  <span className="inline-grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-accent font-serif text-[24px] font-semibold text-background">
    {report.author[0]}
  </span>
  <div>
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">關於作者</p>
    <p className="m-0 mt-1.5 font-serif text-[18px] font-semibold">{report.author}</p>
    {report.authorAffiliation && (
      <p className="m-0 mt-0.5 text-[12.5px] text-subtle">{report.authorAffiliation}</p>
    )}
    {report.authorBio && (
      <p className="m-0 mt-2.5 font-serif text-[14.5px] leading-[1.7] text-muted text-pretty">
        {report.authorBio}
      </p>
    )}
  </div>
</section>
```

### INSERT · Citation card

```tsx
<section className="mt-6 rounded-[5px] border border-border bg-surface px-6 py-[22px]">
  <div className="mb-3 flex items-baseline justify-between">
    <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">
      引用格式 · APA
    </p>
    <button
      onClick={copyCitation}
      className="border-0 bg-transparent text-[13px] text-accent underline underline-offset-[3px]"
    >
      複製
    </button>
  </div>
  <p className="m-0 font-serif text-[15px] leading-[1.75] text-pretty">
    {report.author} ({year}). 〈{report.title}〉. 《台大社會系研究筆記》, Vol. III, {course.code}.
  </p>
</section>
```

### INSERT · Prev / Next nav

```tsx
<nav className="mt-7 grid grid-cols-1 gap-3.5 md:grid-cols-2">
  {prev && (
    <Link
      href={`/c/${courseSlug}/r/${prev.slug}`}
      className="block rounded-[5px] border border-border px-[22px] py-[18px] transition-colors hover:border-accent"
    >
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">
        ← 較早一篇
      </p>
      <p className="m-0 mt-2 font-serif text-[16px] font-semibold leading-[1.35] text-pretty">
        {prev.title}
      </p>
      <p className="m-0 mt-1.5 text-[12px] text-subtle">{prev.author}</p>
    </Link>
  )}
  {next && (
    <Link
      href={`/c/${courseSlug}/r/${next.slug}`}
      className="block rounded-[5px] border border-border px-[22px] py-[18px] text-right transition-colors hover:border-accent"
    >
      <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">
        較新一篇 →
      </p>
      <p className="m-0 mt-2 font-serif text-[16px] font-semibold leading-[1.35] text-pretty">
        {next.title}
      </p>
      <p className="m-0 mt-1.5 text-[12px] text-subtle">{next.author}</p>
    </Link>
  )}
</nav>
```

### INSERT · Right rail `<aside>`（與 `<article>` 平行、grid col 2）

```tsx
<aside className="sticky top-20 mt-20 hidden h-fit flex-col gap-6 lg:flex">
  <nav aria-label="目錄">
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">本文目錄</p>
    <ol className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
      {toc.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className={cn(
              "-ml-px block border-l-2 leading-[1.4]",
              h.level === 3 ? "pl-4 text-[12.5px]" : "pl-2.5 text-[13.5px]",
              h.active
                ? "border-accent font-semibold text-accent"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {h.title}
          </a>
        </li>
      ))}
    </ol>
  </nav>

  <div className="border-t border-border pt-3.5">
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">閱讀進度</p>
    <div className="mt-2 flex items-baseline justify-between">
      <span className="font-serif text-[24px] font-semibold text-accent">
        {progressPct}
        <span className="text-[14px] font-normal text-subtle">%</span>
      </span>
      <span className="text-[11px] text-subtle">還 {remainMin} 分鐘</span>
    </div>
  </div>

  <div className="flex flex-col gap-2 border-t border-border pt-3.5">
    <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">工具</p>
    <button
      onClick={copyLink}
      className="mt-1 text-left text-[13px] text-muted transition-colors hover:text-accent"
    >
      複製連結
    </button>
    <button
      onClick={copyCitation}
      className="text-left text-[13px] text-muted transition-colors hover:text-accent"
    >
      複製引用
    </button>
    <button
      onClick={print}
      className="text-left text-[13px] text-muted transition-colors hover:text-accent"
    >
      列印 / PDF
    </button>
  </div>
</aside>
```

> aside 在 grid 第 2 欄；article 在第 1 欄。`hidden lg:flex` 讓 mobile 不顯示。

### 拿掉原本 article-footer 那段返回連結

`article-back-link` 與外層 `<footer className="article-footer">` 可整段刪掉——已被新的 Prev/Next + Citation card 取代。若要保留「← 返回所有報告」，加在 prev/next 之後：

```tsx
<Link
  href={`/c/${courseSlug}`}
  className="mt-7 inline-flex items-center gap-1.5 border-b border-accent/40 pb-[1px] text-[14px] text-accent hover:border-accent"
>
  ← 返回 {course.name} 所有報告
</Link>
```

---

## 5 · 應用順序建議

1. 先把 `globals.css` 三個 keyframes 與 `@theme` 加上、跑一次 build 確認 `animate-pulse-dot` / `animate-fade-up` 可用
2. 改 `Footer.tsx`（最小、可獨立驗證）
3. 改 `ReportListItem.tsx`（變成 variant 機制；listing page 還沒 import 也不會壞）
4. 改 `(public)/c/[courseSlug]/page.tsx`（會用到上面所有的新 variant）
5. 改 `(public)/c/[courseSlug]/r/[reportSlug]/page.tsx`
6. 加 `useScrollProgress` client hook 給 reader header 的 progress sliver 用（或先 stub 成 `38`）

跑起來如果哪個 className 走樣或 layout 沒對齊，回我我快速 patch。
