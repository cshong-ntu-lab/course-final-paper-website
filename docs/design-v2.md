# design-v2 — 社群感改版：移植規格

> **用途**：把 `ntusoc-prototype/index.html`（v2 原型）的視覺與互動移植到本 repo。章節依 repo 的實際檔案排，每節寫「現在是什麼 → 要改成什麼」。
> **狀態**：設計已定案（決定紀錄見 §9），尚未移植。
> **來源**：改版提案簡報「提案 B 社群感」→ 原型逐頁定稿（2026-10-26）。原型的工作紀錄在 `ntusoc-prototype/tasks/design-v2.md`，數值以本文件為準。
> **對照版本**：repo main `ae99df5`（2026-09-26）。repo 已於 `cfe6f88` 移除 `tasks/design.md`，本文件不依賴它。

---

## 0. 範圍

**本次改**：設計 token、頭像、標籤、文章卡、無封面封面圖、文章頁（`ReaderShell`）、首頁卡片、作者頁（新路由）、個人設定欄位、報告範本。

**本次不改**：編輯器的流程與版面（只換色與圓角，§4.5）、管理後台、登入流程、Drive 同步、留言（範圍外）、深色模式（`.dark` 區塊保留不動，不跟著調）、站內圖片裁切、全文搜尋。

**原則**

- 只用提案 B 的語彙：柔和三色標籤、圓形頭像、卡片、系徽枝條。不引入期刊式實色徽章、編號目錄。
- 裝飾一律平面（無擬物陰影），幾何元素只用「系徽切片」（§2.3）。
- 版面參考報導者（twreporter.org）的文章頁與作者頁。
- 不用裝飾性 emoji。

---

## 1. Token — `src/app/globals.css`

repo 的 token 是 HSL 通道寫法（`--x: H S% L%`，`@theme` 裡再包 `hsl()`），新增的也照這個格式。

### 1.1 顏色

| v2 名稱                                         | 值                                | repo 現況                                            | 動作                                                                                  |
| ----------------------------------------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `--background`                                  | `#faf9f5`                         | 同                                                   | 不動                                                                                  |
| `--canvas`                                      | `#f3f2ec`                         | 同                                                   | 不動                                                                                  |
| `--surface`                                     | `#ffffff`                         | 同                                                   | 不動                                                                                  |
| `--foreground`                                  | `#1c1d1a`                         | 同                                                   | 不動                                                                                  |
| `--ink-read`                                    | `#3b3b35`（`60 5% 22%`）          | 無                                                   | **新增**。文章內文色，比 foreground 柔和（報導者內文 `#404040`）                      |
| `--muted`                                       | `#5a5a52`                         | 同                                                   | 不動                                                                                  |
| `--subtle`                                      | **`#6e6d64`（`54 5% 41%`）**      | `#8e8d83`                                            | **改值**。舊值在底色上只有 3.2:1，而它都用在 ≤ 12px 小字，未達 WCAG AA；新值 4.9:1    |
| `--border` / `--border-strong`                  | `#e5e3d9` / `#cfccc1`             | 同                                                   | 不動                                                                                  |
| `--accent` / `--accent-hover` / `--accent-soft` | `#3a5a3a` / `#2a4429` / `#ecefe8` | 同                                                   | 不動                                                                                  |
| `--gold` / `--gold-soft` / `--gold-ink`         | `#b8842c` / `#faf2dd` / `#7a5a18` | 值同 `--warning` / `--warning-soft` / `--warning-fg` | **新增別名**，指向相同值。課程標籤、欄目名稱用 gold；草稿等提醒仍用 warning，語意分開 |
| `--stone`                                       | `#5e6975`（`211 11% 41%`）        | 無                                                   | **新增**。學期標籤字色、系徽灰                                                        |
| `--stone-soft`                                  | `#e9edf1`（`210 22% 93%`）        | 無                                                   | **新增**。學期標籤底                                                                  |

`--gold` 不可當白字底色（白字對比 3.3:1）；需要實底白字時用 `--gold-ink`（6.4:1）。

**系徽切片色面**（只給 §2.3 用，`@theme` 裡直接定義）：

```css
--color-tint-green: color-mix(in srgb, hsl(var(--accent)) 22%, white);
--color-tint-khaki: color-mix(in srgb, hsl(var(--warning)) 30%, white);
--color-tint-grey: color-mix(in srgb, #5e6975 22%, white);
/* 墊在文字後面時（摘要卡）用更淡的 16% / 22% / 18%，內文對比約 8.8:1 */
```

### 1.2 字體 — `src/lib/fonts.ts`

不變：Noto Sans TC（UI 與**內文**）、Noto Serif TC（標題）、JetBrains Mono（mono 標記）。

- **內文改用無襯線**：`prose-research` 目前 `font-family: var(--font-serif)`，v2 的文章內文是 Noto Sans TC（同報導者）。標題維持 serif。
- Inter：v2 版面沒有刻意用到，但它是 `--font-sans` 的英數字第一順位。**待決 D7**，保留現狀即可。

### 1.3 字級

repo 已有一套 Tailwind 字級（`text-2xs` … `text-6xl`），**名稱照用，不改值**。v2 原型的字級對應如下；只新增兩個 repo 沒有的。

| 原型          | 值                           | 用 repo 的                          | 用途                            |
| ------------- | ---------------------------- | ----------------------------------- | ------------------------------- |
| `--text-2xs`  | .68rem                       | `text-2xs`（.6875）                 | 區塊小標、狀態徽章              |
| `--text-xs`   | .75rem                       | `text-xs`                           | 作者列、標籤 pill、TOC 項目     |
| `--text-sm`   | .82rem                       | `text-sm`（.8125）                  | 按鈕、卡片摘要、工具列          |
| `--text-base` | .9rem                        | `text-base`（.9375）                | UI 一般文字、摘要卡、作者頁簡介 |
| `--text-lg`   | 1.08rem                      | `text-[1.08rem]`                    | 卡片標題、文章 h2               |
| `--text-xl`   | 1.4rem                       | `text-3xl`（1.5）或 `text-[1.4rem]` | 精選標題、統計數字              |
| `--text-read` | 1.0625rem（17px）            | **新增 `--text-read`**              | 文章內文                        |
| `--text-2xl`  | `clamp(1.6rem, 3vw, 2.1rem)` | **新增 `--text-title`**             | 文章標題、作者頁姓名、首頁 h1   |

> 注意：repo 的 `text-2xl` 是 1.25rem，跟原型的 `--text-2xl` 同名不同值。移植時看到原型寫 `--text-2xl` 一律換成 `text-title`。

### 1.4 圓角

repo 的 `rounded` / `--radius-sm|md|lg` 已被 `ui/button`、`ui/input`、`ui/select` 使用，**不改**，以免連動所有表單元件。v2 的圓角用新名稱：

| 新 token               | 值   | 用途                                |
| ---------------------- | ---- | ----------------------------------- |
| `--radius-field`       | 6px  | 輸入框、編輯器欄位                  |
| `--radius-control`     | 9px  | 按鈕、切換器                        |
| `--radius-thumb`       | 12px | 列表縮圖、作者卡（block）、下拉選單 |
| `--radius-card`        | 16px | 卡片、列表列、摘要卡                |
| `--radius-feature`     | 20px | 精選區塊                            |
| （內建）`rounded-full` | —    | 標籤 pill、chip、頭像               |

repo 現有的 `rounded-[2px]` 方框標籤、`rounded-[5px]` 卡片，移植後都換掉。

### 1.5 陰影、版心

- `--shadow-soft`：`0 1px 2px rgba(28,29,26,.04), 0 8px 24px -8px rgba(28,29,26,.12)`（卡片靜止）。
- `--shadow-hover`：`0 2px 4px rgba(28,29,26,.05), 0 14px 30px -10px rgba(28,29,26,.18)`（卡片 / 列表列 hover，搭配上移 2px）。
- 版心最大寬 1180px（同 repo），左右留白 `clamp(16px, 4vw, 64px)`。

---

## 2. 共用元件與邏輯（新增）

每個純函式都要有 Vitest 測試（repo 慣例：`src/**/*.test.ts`）。

### 2.1 `src/components/Avatar.tsx`（新）

取代 `ReportListItem.tsx` 裡的 `Avatar` 和 `ReaderShell.tsx` 裡三處手寫頭像。

| size | px  | 用在                                       |
| ---- | --- | ------------------------------------------ |
| `sm` | 28  | 卡片 / 列表 / 精選作者列、`AppHeader` 帳號 |
| `md` | 40  | 文章頁作者卡、編輯頁預覽                   |
| `lg` | 80  | `/workspace/settings` 照片欄               |
| `xl` | 120 | 作者頁                                     |

- 照片來源順序：`User.avatarUrl` → `photoURLGoogle` → fallback。
- 有照片：`object-fit: cover`；上面用 `::after` 疊一圈 1px `rgba(28,29,26,.12)` 內框（內陰影會被 `<img>` 蓋住，要用偽元素）。
- fallback：`bg-accent`、白字、姓名第一個字，字級 = 尺寸 × .38，**sans-serif**（repo 現在是 serif × .46，改掉）。同姓不分色（D1）。
- 旁邊一定印出姓名 → `<img alt="">`、fallback 文字 `aria-hidden`。

### 2.2 標籤 — `src/components/TagPill.tsx`（新）＋ `src/lib/tags.ts`

三類三色，膠囊形（`rounded-full`），`text-xs`，padding 4×10：

| 類型          | 資料來源                                  | 底            | 字         |
| ------------- | ----------------------------------------- | ------------- | ---------- |
| topic 主題    | `Report.tags[]`                           | `accent-soft` | `accent`   |
| course 課程   | `Course.name`                             | `gold-soft`   | `gold-ink` |
| semester 學期 | `` `${Course.year}-${Course.semester}` `` | `stone-soft`  | `stone`    |

- 顯示順序固定 topic → course → semester。點任一標籤 → 首頁並套用該標籤篩選。
- **卡片收合規則**（加到 `src/lib/tags.ts`，純函式 + 測試）：卡片最多 3 個 pill；**課程與學期一定顯示**，只收起多的主題標籤（至少留 1 個主題），收起的變成 `+N`（`canvas` 底、`subtle` 字，`title` 列出被收的標籤）。文章頁顯示全部。

  ```ts
  export function foldCardTags(topics: string[], fixedCount: number, max = 3) {
    const slots = Math.max(1, max - fixedCount);
    return { shown: topics.slice(0, slots), hidden: topics.slice(slots) };
  }
  ```

- 學期標籤取代 repo 現在的合併字串 `courseTag = "114-2 計算社會學"`，拆成課程、學期兩顆。

### 2.3 系徽切片 — `src/components/MarkSlice.tsx`（新）＋ `src/lib/cover.ts`

全站唯一的裝飾元素，取自系徽：綠 / 卡其 / 灰三塊色面，被白色粗莖線切開，莖線像植物一樣分岔。兩種用法：

**(a) 無封面的封面圖**（取代 repo 的斜線紋 `repeating-linear-gradient`）— 16:9，`viewBox="0 0 320 180"`、`preserveAspectRatio="xMidYMid slice"`：

```svg
<rect class="fa" x="-20" y="-20" width="380" height="220"/>
<path class="fb" d="M70 200 C 120 120, 200 72, 345 44 L345 200 Z"/>
<path class="fc" d="M70 200 C 89 169.6, 112.3 143.8, 141.9 122 C 170 116, 250 120, 345 160 L345 200 Z"/>
<path class="stem" d="M70 200 C 120 120, 200 72, 345 44"/>            <!-- 主幹 -->
<path class="stem" d="M141.9 122 C 170 116, 250 120, 345 160"/>        <!-- 側枝，起點 = 主幹 t=.38 -->
<path class="stem" d="M237.7 72.5 C 246 52, 252 26, 248 -20"/>         <!-- 小枝，起點 = 主幹 t=.72 -->
```

- 每篇依 id 雜湊選 6 種變化之一：左右翻轉（`translate(320 0) scale(-1 1)`）× 3 種配色輪替（fa/fb/fc 在 tint-green / tint-khaki / tint-grey 間輪轉）。雜湊放 `src/lib/cover.ts`（`h = h*31 + codePoint >>> 0`；`mirror = h%2`、`palette = floor(h/2)%3`），要測試同一 id 永遠同一變化。

**(b) 摘要卡右下角**（§4.1）— `viewBox="0 0 220 150"`、`xMaxYMax meet`，220×150（手機 150×102），用更淡的色面：

```svg
<path class="f-green" d="M-6 174 L10 150 C 48 92, 128 34, 220 14 L252 9 L264 190 L-6 190 Z"/>
<path class="f-khaki" d="M84 178 C 110 124, 156 84, 262 58 L264 190 L84 190 Z"/>
<path class="f-grey"  d="M84 178 C 94.4 156.4, 108 137, 127.4 119.9 C 152 116, 205 114, 264 130 L264 190 L84 190 Z"/>
<path class="stem" d="M84 178 C 110 124, 156 84, 262 58"/>
<path class="stem" d="M127.4 119.9 C 152 116, 205 114, 264 130"/>     <!-- 起點 = 主幹 t=.4 -->
<path class="stem" d="M181.7 85.2 C 188 66, 196 44, 192 -12"/>         <!-- 起點 = 主幹 t=.7 -->
```

**繪製規則**（使用者逐條確認過，改圖時不能破壞）

- 莖線全部一樣粗：9px、`stroke: surface`、`stroke-linecap: round`、`vector-effect: non-scaling-stroke`（圖放大縮小粗細不變）。
- 莖線一律延伸到圖框外，由邊緣裁掉；不能在框內露出圓頭（會像斷掉）。
- 分枝起點必須**正好落在主幹的貝茲曲線上**（用 de Casteljau 算 t 點），否則分岔處會露出一條縫。
- 線條要分岔、不能平行（平行弧線像彩虹，已被否決）。
- 不用擬物陰影、不用圓形 / 三角 / 方形等通用幾何圖形（都試過、被否決）。

### 2.4 學期與引用年份 — `src/lib/semester.ts`（新）

- 學期寫法 `學年度-學期`：114-1 = 2025 下半年，114-2 = 2026 上半年。
- 西元年 = 學年度 + 1911，下學期再 +1。純函式 + 測試（114-1→2025、114-2→2026、115-1→2026）。
- 引用年份改用這個（`ReaderShell` 現在用 `publishedAt` 的年份）。正式引用格式仍待系上確認（D4）。

### 2.5 目前章節判斷 — `src/lib/scrollSpy.ts`（新）

取代 `ReaderShell` 的 IntersectionObserver（`rootMargin: -20% 0 -70% 0`）。舊做法在文章最後幾節很短時，那幾節永遠不會被判定為目前章節。

```ts
/** headingTops: 各標題相對視窗頂端的 top；回傳目前章節 index */
export function activeHeading(headingTops: number[], vh: number, remainingScroll: number) {
  // 判斷線平常在 30% 高度；最後一個畫面高度內隨剩餘捲動距離下移到底部，
  // 每個標題都會依序越過它
  const line = Math.max(vh * 0.3, vh - remainingScroll - 8);
  let current = 0;
  headingTops.forEach((top, i) => {
    if (top <= line) current = i;
  });
  return current;
}
```

- 標題的實際 DOM id 有 `user-content-` 前綴（`rehype-sanitize` 防 DOM clobbering 的預設），目錄連結與判斷要用加了前綴的 id；修改前正式站的目錄連結因此一直點不到。
- 在 scroll 事件（passive）裡算；測試要涵蓋「最後兩節都很短」的情況，捲到底前每一節都要輪到。
- 點目錄項目後該項**釘住**為目前章節，直到使用者自己捲動（`wheel` / `touchstart` / `keydown` 解除）。

### 2.6 系徽 — `src/components/Crest.tsx`（新）＋ `public/ntu-soc-crest.svg`

系上正式系徽（向量檔，取自逐字稿轉錄系統，svgo 壓縮後 2.3 KB），**保持原色**：綠 `#67a333`、卡其 `#dacf8b`、灰 `#c2c1c1`。這三色只屬於系徽本身，不進 token；站台主色仍是 `--accent`（`#67a333` 配白字對比不足），系徽切片的色面也不跟著改。

- `sm`（寬 30px）：頁首左側、站名前面，連到系網（新視窗，`aria-label="前往臺灣大學社會學系官網（新視窗）"`，圖片 `alt=""`）。用在 `SiteHomeShell`、`ReaderShell`、`AppHeader`。
- `lg`（寬 74px）：登入頁標題上方，不加連結，`alt="臺灣大學社會學系系徽"`。
- 高度依 viewBox 187 × 127 等比算出。
- 站名一律「臺灣大學社會學系」，黑體 600（`font-sans font-semibold`；700 太粗），不加英文縮寫。
- 系徽左緣對齊頁面內容左緣：公開頁頁首與內容同寬（1180px、左右 24px）；`AppHeader` 由各頁傳入 `container`（與該頁 `<main>` 相同的 `max-w-* px-*`）。
- 文章頁頁首只放系徽與站名（預覽時右側加「草稿」）；「← 返回」移到內容區最上方，與系徽同一條左緣。

---

## 3. 資料與後端

| #   | 項目                | 檔案                                                                                             | 說明                                                                                                                                                                                                                                                                                                   |
| --- | ------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3.1 | 作者身分欄位（D10） | `src/lib/types.ts` `User`、`PublishSnapshot`；`src/actions/profile.ts`；`src/actions/publish.ts` | `User` 加選填 `degree?: "學士班" \| "碩士班" \| "博士班"`、`cohort?: number`（入學屆數，如 112）。發布時跟 `authorBio` 一樣寫進 snapshot。顯示為「社會系碩士班 · 112級」，沒填時只顯示「社會系」。台大社會系不分組。                                                                                   |
| 3.2 | 報告範本（D9）      | `src/lib/reportTemplate.ts`                                                                      | 拿掉 `## 摘要` 一節；摘要只寫在 `summary` 欄位。                                                                                                                                                                                                                                                       |
| 3.3 | 舊文章的摘要節      | `src/lib/markdown/extractToc.ts`、`Renderer.tsx`                                                 | 渲染與目錄都跳過 `## 摘要`（到下一個 h2 為止）。寫成純函式 `stripAbstractSection(md)` + 測試。                                                                                                                                                                                                         |
| 3.4 | 作者頁查詢（D11）   | `src/lib/server/firestore.ts`、`src/lib/authors.ts`                                              | `getPublishedReportsByAuthor(uid)`：讀全部已發布報告（單欄位不等式，不需複合索引），在程式裡用 `isReportByAuthor` 篩出主要作者（`authorUid ?? uid`）**或共同作者**是此人的文章。`coAuthors` 存 `{uid, name}` 物件，Firestore 無法以 uid 篩選，所以不建索引；報告量變大時再加 `coAuthorUids` 陣列欄位。 |
| 3.5 | 摘要欄位（D6）      | —                                                                                                | 沿用 `Report.summary`，不新增欄位。                                                                                                                                                                                                                                                                    |
| 3.6 | 英文版 L2（D5）     | `types.ts`                                                                                       | 之後另開：`titleEn?`、`summaryEn?`。本次不做；「中 / EN」切換先不放。                                                                                                                                                                                                                                  |

---

## 4. 頁面

### 4.1 文章頁 — `src/components/ReaderShell.tsx`

**版面**（仿報導者）：三欄，內文欄在頁面正中線。

```
麵包屑
┌ 左 rail 180 ┬──── 中央閱讀欄 max 640 ────┬ 右 rail 180 ┐
│ 作者卡 md    │ 課程名稱（欄目標籤）         │ 目錄 sticky  │
│ 標籤 pill    │ 標題 text-title serif 800    │              │
│ ──────       │ 副標                         │              │
│ 分享 sticky  │ 摘要卡（§2.3b）              │              │
│ 複製引用     │ ─────                        │              │
│ 列印 / PDF   │ 內文                         │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

| 區塊                             | 規格                                                                                                                                                                                                                         | repo 現況 → 改法                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 格線                             | `180px minmax(0,1fr) 180px`，欄距 48px；中欄內容 `max-width: 640px` 置中                                                                                                                                                     | 現在 `minmax(0,720px) 200px` 兩欄 → 改三欄            |
| 課程名稱（D14）                  | 標題上方；`text-sm` 700、字距 .08em、`gold-ink`；連結到首頁的課程篩選                                                                                                                                                        | 現在是 mono 的 `courseCode · 期末報告` → 換成課程名稱 |
| 標題                             | serif、`text-title`、800、行高 1.4                                                                                                                                                                                           | 現在固定 58px → 改 clamp                              |
| 副標                             | serif italic、`muted`、1rem                                                                                                                                                                                                  | 現在 21px                                             |
| 摘要卡                           | `surface` 底、1px `border`、`radius-card`、無陰影；小標「摘要」`text-2xs` 700、字距 .24em、`muted`；內文 `text-base` / 1.9、`ink-read`；右下角 `MarkSlice` (b)                                                               | **新增**（repo 目前沒有顯示 `summary`）               |
| 內文                             | `prose-research`：**sans**、`text-read`（17px）、行高 2.1、字距 .03em、`ink-read`、段距 1.6em                                                                                                                                | 現在 serif / 1.8 / foreground / 1.2em                 |
| 內文 h2                          | `text-[1.08rem]` 700、上距 56px、下距 18px，**無底線**                                                                                                                                                                       | 現在 1.6rem + border-bottom                           |
| 內文 h3                          | `text-base` 700、上距 36px                                                                                                                                                                                                   | 現在 1.25rem                                          |
| 內文清單                         | `text-base`、行高 2、`ink-read`                                                                                                                                                                                              |                                                       |
| 左 rail 作者卡                   | `Avatar md` + 姓名粗體 + 學制屆數（`text-xs` `subtle`，只在「·」前後換行：`word-break: keep-all`）；`canvas` 底、`radius-thumb`；點了到作者頁                                                                                | 現在在標題下方橫排                                    |
| 左 rail 工具                     | 分享（`navigator.share`，不支援時複製連結 + toast）／複製引用／列印；16px 線條圖示 + `text-sm` `muted`，hover `accent`；sticky top 24px                                                                                      | 現在在右 rail，且有「複製連結」→ 換成「分享」         |
| 右 rail 目錄                     | 標題「目錄」`text-2xs`；項目 `text-xs` `subtle`、左側 1px `border` 主幹；h3 縮排 26px、`text-2xs`；**目前章節** `accent` + 700 + 左側 3px accent 短條；主幹從頂端到目前章節塗 `accent`（= 閱讀進度）；不編號、無「已讀」樣式 | 現在 `text-[13.5px]` `muted`                          |
| 閱讀進度 %（D3）                 | **移除**                                                                                                                                                                                                                     | 移除右 rail 的「閱讀進度」區塊；頁首 2px 進度條可保留 |
| 文末「關於作者」、引用卡、上下篇 | 保留，套用 `radius-card`、`Avatar`、`ink-read`                                                                                                                                                                               | 現在 `rounded-[5px]`                                  |

**響應式**

- ≤ 1100px：左 rail 收到標題下方成一橫列（作者卡、標籤、工具），下緣 1px `border`；右目錄縮成 160px。
- ≤ 860px：單欄；右目錄隱藏，改成**手機目錄列**（D12）：
  - 只列 h2；讀到 h3 時亮它所屬的 h2。
  - `position: sticky; top: 0`，底色 `background` 延伸到螢幕兩側（`box-shadow: 0 0 0 100vmax` + `clip-path`），下緣 1px `border`。
  - chip 高 40px（觸控目標）、`text-xs` `subtle`、無框；目前章節 `accent-soft` 底 + `accent` 700。
  - 橫向捲動；左 / 右還有 chip 時該側邊緣淡出 28px（mask）；滑鼠裝置顯示細捲軸；目前章節的 chip 自動捲到列中間。
  - 點 chip 跳轉時扣掉目錄列高度：h2 / h3 `scroll-margin-top: 72px`。
  - 內文 1rem / 2.0。
- 預覽模式（`previewMode`）的 sticky 位移照舊，sticky 目錄列也要加上 `PreviewBanner` 的高度。

### 4.2 首頁 — `SiteHomeShell.tsx`、`ReportFeed.tsx`、`ReportListItem.tsx`

**卡片（`ReportListItem` default）**

- 結構：封面 16:9 → 作者列（`Avatar sm` + `姓名 · 屆數`，`text-xs` `subtle`）→ 標題（serif `text-[1.08rem]` 700）→ 摘要（`text-sm` `muted`，**3 行**截斷）→ 標籤列（貼底，§2.2 收合）。
- 卡片：`surface` 底、1px `border`、`radius-card`、`shadow-soft`；hover 上移 2px + `shadow-hover`。
- 無封面：`MarkSlice` (a)。
- 格線 `repeat(auto-fill, minmax(300px, 1fr))`、gap 22px。

**列表列（新增 `variant="row"`）**：縮圖 130px 4:3、`radius-thumb`；摘要 2 行；其餘同卡片。

**精選（`variant="lead"`）**：`surface` 底、`radius-feature`、padding 26px；縮圖 **16:9**（現在 4:3，太高）；欄寬 `1.15fr 1fr`；小標「最新發表」`gold-soft` 底 `gold-ink` 字膠囊（repo 的 lead 是最新一篇、不是人工挑選，所以不寫「本期精選」）；標題 `text-3xl`；摘要 4 行。

**卡片 / 列表切換**：結果列右側，`canvas` 底的分段切換器。

**待決 — 首頁上半部**：repo 現在是「台大社會系 人工智慧課程成果」大標 + Bail (2024) 引言 + 課程下拉；原型是「課程期末論文」+ 標籤篩選面板（主題 / 課程 / 學期三組 chip）+ 入口頁（粒子場）。卡片部分照本節移植；上半部要不要換、入口頁要不要做，移植前要決定。

### 4.3 作者頁 — `src/app/(public)/u/[uid]/page.tsx`（新）

仿報導者作者頁：整頁一條 720px 置中欄，沒有外框。

```
麵包屑（首頁 / 姓名）
(Avatar xl)  姓名  serif text-title
             社會系碩士班 · 112級
             簡介（text-base / 1.9、ink-read）
             [研究主題 pill …]          ← 點了到首頁篩選
             ───────
             2 發表篇數  2 研究主題  2 修習課程

        所有文章（N）              [列表 | 卡片]
        列表列 / 卡片
```

- 頭像 120px 在左、文字在右（格線 `120px 1fr`、gap 32px）。
- 統計數字 serif `text-3xl` 700，說明 `text-xs` `subtle`。研究主題 = 主題標籤去重；修習課程 = 課程去重。
- 文章顯示：**列表**（預設）或**卡片**（兩欄 `minmax(280px, 1fr)`）；切換器在「所有文章（N）」標題列右側，標題置中。
- 作者頁裡的卡片 / 列表不印作者列（都是同一人）。
- ≤ 600px：全部改上下排、置中；「所有文章」靠左、切換器靠右。
- 所有作者卡、頭像、姓名都連到這一頁（`ReportListItem`、`ReaderShell`、文末「關於作者」）。

### 4.4 個人設定 — `src/app/workspace/settings/SettingsForm.tsx`

- 照片欄改用 `Avatar lg`（80px），旁邊提示：「建議上傳正方形照片，JPG / PNG / WebP，5MB 以內。網站不提供裁切。」（格式與大小 = `storage.rules` 現行限制）。
- 新增欄位：學制（下拉：學士班 / 碩士班 / 博士班）、屆數（數字）。
- `<select>` 要套用跟 `<input>` 相同的框線、圓角、底色。

### 4.5 編輯器 — `src/app/workspace/c/[courseId]/editor.tsx`（結構不動，只改視覺）

原型的編輯頁已照 `editor.tsx` 重做（2026-10-26），移植時**不改結構與行為**，只換 v2 視覺：

- 結構照舊：滿版、不疊網站頁首；頂列（← 返回、課程名稱 / 標題｜Write · Both · Preview（預設 Both）｜存檔狀態、資源開關、⌘S 儲存）；左原始碼、右即時預覽；右側 288px 資源欄（審核按鈕 → 標題 → 副標題 → 作者（搜尋使用者，可清除）→ 共同作者 → 摘要 → 關鍵字 → 封面圖 → 檔案資源）。
- 行為照舊：30 秒防抖 + 120 秒上限自動存檔、Ctrl/⌘+S、分頁隱藏時存檔、離線狀態、本機草稿還原、貼上 / 拖曳上傳圖片與插入線、刪除檔案時清掉內文對應圖片。
- 學生**不能**發布；只有「請求教師審核」。編輯器不顯示發布狀態徽章。
- **置中原則（v2 新增）**：
  - 原始碼欄：文字欄最寬 720px，置中於左窗格；工具列左右內距與文字欄對齊（`padding-inline: max(16px, calc((100% - 720px) / 2))`）。CodeMirror 只在右側保留捲軸空間，會讓文字欄偏左約半個捲軸寬，要量測後補回（原型用 `--cm-shift`）。
  - 預覽欄：680px 置中，`scrollbar-gutter: stable both-edges`。
  - Write / Preview 單窗格時同樣置中；原型實測三種模式中心誤差 ≤ 1px。
- **預覽內容（v2 新增）**：預覽區照文章頁中欄排：課程名稱 → 標題 → 副標 → 作者 → 摘要卡（含系徽切片）→ 標籤 → 內文，讓作者看到的就是發表後的樣子（repo 現在只渲染內文）。
- 視覺：§1 token（`subtle` 新色、`radius-field` / `radius-control`）、資源欄 `canvas` 底；`@uiw/react-md-editor` 的框線、工具列改用站台色。
- 窄螢幕（≤ 768px，v2 新增）：只顯示 Write / Preview；資源欄改成可開關的覆蓋層（repo 現在在手機上直接隱藏資源欄，欄位無法編輯）。

---

## 5. 動態

原型已全部實作並逐項實測（2026-10-26）。正式版用 Radix 的 `data-state` + repo 已安裝的 `tw-animate-css`（`animate-in` / `animate-out`），其餘照下表寫 CSS。

### 5.1 原則與 token（`globals.css`）

| token                                          | 值                          | 用途                                    |
| ---------------------------------------------- | --------------------------- | --------------------------------------- |
| `--dur-xs` / `--dur-s` / `--dur-m` / `--dur-l` | 120 / 180 / 240 / 280ms     | 小元件關 / 小元件開 / 面板、頁面 / 進場 |
| `--ease-enter`                                 | `cubic-bezier(.2, 0, 0, 1)` | 進場、展開（減速）                      |
| `--ease-exit`                                  | `cubic-bezier(.4, 0, 1, 1)` | 離場、收合（加速）                      |

> 名稱不用 `--ease-out` / `--ease-in`：那是 Tailwind 內建的 `ease-out` / `ease-in`，覆蓋會改到 repo 現有用法（`ReportListItem` 封面 hover）。原型裡沿用舊名，移植時以本表為準。

- 關閉比開啟快約三成；位移只用 4–8px、縮放 .98→1、透明度；只動 `transform` / `opacity`（高度展開用 `grid-template-rows: 0fr → 1fr`，不量高度）。
- 不用回彈；動畫進行中可直接操作。
- `prefers-reduced-motion: reduce`：所有動畫與過場縮到 0.01ms（等於直接切換）、不跑 View Transition、不做卡片依序進場、枝條直接畫好、連續動畫（呼吸燈、進度條）停止。
- **只在換頁時播進場**（卡片依序、文章標題依序）；切換檢視、重畫局部時不播，避免每次操作都在動。
- 會跟 hover 位移衝突的進場動畫，`animation-fill-mode` 用 `backwards`（不用 `both`），動畫結束後不再佔住 `transform`。

### 5.2 逐項規格

| #   | 位置                                    | 動畫                                                                                                                                           | 時長 / 緩動              | repo 實作                                                                                                                                                                                          |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 頁首「文章分類」選單                    | 淡入 + 下移 4px + .98→1，`transform-origin: top center`；關閉反向                                                                              | 開 180 out / 關 120 in   | Radix DropdownMenu：`data-[state=open]:animate-in fade-in-0 zoom-in-95 slide-in-from-top-1`、`data-[state=closed]:animate-out fade-out-0 zoom-out-95`                                              |
| 2   | 首頁篩選面板                            | 高度 `grid-template-rows 0fr→1fr`；內容延遲 40ms 淡入；收合時 `inert`                                                                          | 開 220 out / 關 160 in   | 同原型 CSS；改成切換狀態，不重畫整頁                                                                                                                                                               |
| 3   | 編輯器作者 / 共同作者搜尋               | 下拉展開：淡入 + 下移 4px + `clip-path` 由上往下展開；取消時反向                                                                               | 180 / 120                | 打字時結果列表不動                                                                                                                                                                                 |
| 4   | 編輯器「資源」側欄                      | 桌機：寬度 288↔0（內容固定 288 寬，不重排）；結束後 `refresh` 編輯器並重新置中。手機：從右滑入 + 28% 遮罩，點遮罩關閉                          | 開 240 out / 關 180 in   | **不要**每次開關重建編輯器                                                                                                                                                                         |
| 5   | 課程下拉（`ReportFeed` Select）         | 同 #1                                                                                                                                          | 180 / 120                | `ui/select.tsx` 的 Content 加 `data-[state]` 動畫 class                                                                                                                                            |
| 6   | 卡片 / 列表切換（首頁、作者頁、工作區） | 白色底塊滑到新選項；舊內容淡出 100ms → 新內容淡入 + 上浮 4px                                                                                   | 底塊 200；內容 100 / 180 | 單一 thumb 元素用 `translateX` + `width`；React 不重掛 thumb 即可自然過渡                                                                                                                          |
| 7   | 編輯器 Write / Both / Preview           | 底塊滑動同 #6；新出現的窗格淡入                                                                                                                | 200 / 150                | 窗格不做滑動                                                                                                                                                                                       |
| 8   | 「請求教師審核」                        | 打開時圓點 .6→1，勾勾描線畫出；底色、框線漸變                                                                                                  | 220                      | 勾勾用 SVG path + `pathLength=1`                                                                                                                                                                   |
| 9   | 篩選 chip                               | 底色、字色、框線漸變；hover 上移 1px                                                                                                           | 150                      |                                                                                                                                                                                                    |
| 10  | 目錄目前章節                            | 左側 3px 短條由中間 `scaleY 0→1`；字色漸變；手機 chip 底色漸變                                                                                 | 150                      |                                                                                                                                                                                                    |
| 11  | 存檔狀態                                | 狀態改變時（儲存中 ↔ 已儲存 ↔ 離線）淡入；每 10 秒更新「N 分鐘前」時**不**動                                                                   | 150                      |                                                                                                                                                                                                    |
| 12  | 分享、複製引用                          | 成功後圖示交叉淡換成打勾，1.6 秒後換回；toast 照舊                                                                                             | 150                      | 同 repo `FilesSidebar` 的 `copiedId` 做法                                                                                                                                                          |
| 13  | 檔案列表新增 / 刪除                     | 新增：高度展開 + 淡入；刪除：淡出 + 收合後才移除                                                                                               | 180 / 140                |                                                                                                                                                                                                    |
| 14  | 上傳中                                  | 「上傳中 · N 個檔案」下方 2px 不確定進度條                                                                                                     | 1.2s 循環                |                                                                                                                                                                                                    |
| 15  | 拖曳插入線                              | 出現時淡入；用 `translateY` 跟著游標滑動                                                                                                       | 100 / 60 linear          |                                                                                                                                                                                                    |
| 16  | 封面、頭像照片                          | 圖片載入完成後淡入（`img.fade-load` → `.loaded`）                                                                                              | 240                      | `next/image` 的 `onLoad`                                                                                                                                                                           |
| 17  | toast                                   | 開 180 out / 關 140 in                                                                                                                         |                          |                                                                                                                                                                                                    |
| 18  | 換頁                                    | View Transitions：舊頁 140ms 淡出、新頁 240ms 淡入 + 上浮 6px；只套在主內容（`view-transition-name: page`），頁首不動。不支援時退回 `.page-in` | 140 / 240                | React 19.2 `<ViewTransition>`（Next.js 16 `experimental.viewTransition`）                                                                                                                          |
| 19  | 卡片格線                                | 換頁時依序淡入上浮，每張間隔 40ms，第 8 張以後同時                                                                                             | 每張 280                 | 首次 render 時加 class，`fill-mode: backwards`                                                                                                                                                     |
| 20  | 文章頁標題區                            | 課程名稱 → 標題 → 副標 → 摘要卡依序，間隔 60ms                                                                                                 | 280                      | 取代 repo 現在 600ms 的 `animate-fade-up`                                                                                                                                                          |
| 21  | 入口頁                                  | 小標 → 大標 → 底線（`scaleX` 描線）→ 引言 → 出處 → 按鈕，間隔 80ms                                                                             | 420；底線 600            | repo 已有 `animate-draw-line`                                                                                                                                                                      |
| 22  | 摘要卡系徽切片                          | 換頁進來時白色枝條「長出來」一次：主幹（延遲 200ms）→ 側枝從分岔點（450ms）→ 小枝（600ms）。三塊色面先出現、枝條再把它們切開                   | 700 / 700 / 500          | 枝條 `pathLength="1"`、`stroke-dasharray: 1 2`、`stroke-dashoffset: 1.001 → 0`。注意 `:nth-of-type` 要算進前面三個色面 path（枝條是第 4–6 個）。**只用在文章頁**；編輯器預覽每次輸入都會重畫，不加 |
| 23  | 卡片封面 hover                          | 封面放大到 103%（卡片、列表列、精選）                                                                                                          | 400 out                  | 同 repo 封面照片的 `group-hover:scale`                                                                                                                                                             |
| 24  | 按鈕、連結                              | 文字色、底色、框線、陰影漸變                                                                                                                   | 150                      | 全域 `button, a` 預設 transition                                                                                                                                                                   |

**刻意不加**：內文、目錄位置、sticky 元素的位移；打字時的搜尋結果與 Markdown 內容；作者頁統計數字跳動；系徽切片的持續動態；原生 `<select>`。

---

## 6. 無障礙檢查表

- 文字對比全部 ≥ 4.5:1：`subtle` 改值（§1.1）、`gold-ink` 實底白字 6.4:1、摘要卡淡色面上的內文約 8.8:1。
- 觸控目標：手機目錄 chip 40px。
- 動態：全部遵守 `prefers-reduced-motion`（§5.1）。
- 頭像 `alt=""` / `aria-hidden`（旁邊有姓名）。
- 系徽切片 `aria-hidden="true"`。
- 目錄項目 `aria-current` 標記目前章節。

---

## 7. 建議的 PR 切法

照 repo 規則：每個 PR 從 main 開分支、最後只留一個 commit、標題 `[main] <type>: <subject>`。

1. `feat/v2-tokens` — §1 token（含 `subtle` 改值、新 token、`prose-research` 改 sans）。
2. `feat/v2-shared-components` — §2 `Avatar`、`TagPill` + `foldCardTags`、`MarkSlice` + `cover.ts`、`semester.ts`、`scrollSpy.ts`，含測試。
3. `feat/v2-reader` — §4.1 文章頁 + §3.2 / 3.3 範本與摘要節。
4. `feat/v2-home-cards` — §4.2 卡片、列表列、精選（上半部待決，先不動）。
5. `feat/v2-author-page` — §3.1 / 3.4 資料欄位 + 索引、§4.3 作者頁、§4.4 設定頁。
6. `feat/v2-editor-visual` — §4.5。

---

## 8. 待決

| #   | 項目                                 | 建議                           |
| --- | ------------------------------------ | ------------------------------ |
| D7  | Inter 字型                           | 保留（英數字較好看），之後再看 |
| —   | 首頁上半部與入口頁（§4.2）           | 移植前決定                     |
| —   | 作者頁是否列入共同作者的文章（§3.4） | 列入                           |
| —   | 正式引用格式（D4）                   | 請系上確認                     |
| —   | 8 種報告狀態的視覺（送審、撤下等）   | 工作區 / 後台移植時補          |

---

## 9. 決定紀錄

| #   | 項目                   | 決定                                                                      |
| --- | ---------------------- | ------------------------------------------------------------------------- |
| D1  | 同姓作者 fallback 頭像 | 不分色，一律綠                                                            |
| D2  | 無封面的卡片           | 系徽切片，6 種變化（§2.3a）                                               |
| D3  | 閱讀進度 %             | 移除；目錄主幹表示進度                                                    |
| D4  | 學期格式 / 引用年份    | 學年度-學期；引用年份由學期推算；格式待系上確認                           |
| D5  | 英文版                 | 做 L1（介面）+ L2（英文標題 / 摘要），之後另開；切換鈕先不放              |
| D6  | 完整摘要欄位           | 沿用 `Report.summary`                                                     |
| D7  | Inter 字型             | 待決                                                                      |
| D8  | 文章頁版面             | 仿報導者三欄，內文置中；目錄右側小字灰色，只有目前章節醒目；動作在左 rail |
| D9  | 範本的「## 摘要」      | 範本拿掉；舊文章渲染時跳過                                                |
| D10 | 作者身分               | 學制（學士班 / 碩士班 / 博士班）+ 屆數，不分組                            |
| D11 | 作者頁                 | 做，以 uid 為鍵                                                           |
| D12 | 手機目錄列             | sticky、chip 40px、可橫向捲動、邊緣淡出                                   |
| D13 | 頁底最後幾節亮不起來   | 改用 §2.5 的判斷線演算法                                                  |
| D14 | 標題上方課程名稱       | 要，金色欄目標籤，可點篩選                                                |
| —   | 裝飾風格               | 平面 + 系徽枝條；擬物、通用幾何圖形、平行弧線皆已否決                     |
| —   | 作者頁版面             | 仿報導者作者頁，720px 置中；文章列表 / 卡片兩種顯示                       |
| —   | 卡片標籤收合           | 課程、學期必顯示，只收主題標籤                                            |
| —   | 系徽                   | 用系上正式檔，保持原色，不改 token（§2.6）                                |
