# Design Brief — 課程報告網站

> 把這份檔案的內容貼進 Claude Design 的 context chat 作為開場。
> 目標是讓 Claude Design 在了解全貌的前提下、迭代產出一份可被工程端直接消費的 `tasks/design.md`。

---

## 0. 給 Claude Design 的工作流程說明

你（Claude Design）的任務是為一個已經完成 spec 的網站做 visual design。實作端會根據你的最終輸出 `tasks/design.md` 直接套到 Next.js + Tailwind codebase 上。

**請依下列流程進行：**

1. **First：** 讀完這份 brief，跟我 confirm 你掌握了 context（例如：tone、技術約束、頁面清單）。如果有「不確定 / 想多了解」的部分，現在就問。
2. **Iterate per page：** 每次討論**一個頁面**。順序我會在第 6 節指定。每頁你要：
   - 提出 2–3 個設計方向（用 React Artifact render 給我看）
   - 我選一個方向後，做細節迭代（間距、字級、色彩、互動）
   - 我說「鎖定」後，記錄該頁面的最終設計到我們累積的 spec 草稿裡
3. **Synthesize at end：** 全部頁面討論完之後，請把所有決策合併成單一一份結構化的 `tasks/design.md`（schema 見第 8 節）。這份檔案是工程端唯一會讀的交付物，所以**它必須 self-contained**。
4. **Output constraints：** 全程請用 **Tailwind class names** 來描述 styling，**不要**用 inline style 或 styled-components 或自訂 CSS（除非該效果 Tailwind 真的做不到）。

---

## 1. Project Context

### 是什麼

「課程報告網站」— 台大社會所研究所課程的期末報告平台。**單一一位老師（我）+ 多堂研究所課**運作。

### 角色

- **訪客**：未登入。瀏覽老師已發布的學生報告
- **學生**：登入後寫自己的期末報告（一堂課一份），用 Markdown 編輯、看 live preview
- **老師（我）**：審核 + 發布學生報告、建立課程

### 功能精華（你不用設計這些邏輯，但要懂 context）

- 學生用 Google 帳號登入，第一次要輸入課程代碼 + 設定一個自己的公開作者名稱（可與 Google 帳號名稱不同）
- 學生在 HackMD 風格的 markdown 編輯器寫報告（左 source、右 live preview）
- 學生可上傳圖片（僅圖片，10MB / 檔），sidebar 列出已上傳檔案
- 老師可以審核 latest draft、看 diff（latest vs 上一次發布版本）、決定發布
- 已發布的報告才會出現在公開首頁
- 此外有一個 staging 站，所有登入者都能看到所有學生未發布的草稿

---

## 2. Design 約束 / 期待

### 視覺基調（vibe）

**Editorial / 學術期刊 tone。** 想像 Substack + Notion 公開頁 + 學術期刊網站的混合。

- 嚴肅但**不死板**；學術但**不老氣**
- 學生作品是主角 → 設計要襯托內容，不能搶戲
- 公開頁面要適合被 Google 搜尋到、被學者引用、被同學分享
- **不要**像企業 SaaS landing page、不要像 bootstrap admin、不要 gamification（沒有等級、沒有徽章、沒有「進度條」之類元素）

### 推薦的視覺參考

可參考但不必照抄：

- **Substack 個人 publication 頁**：editorial、字體優先、留白多
- **Notion public pages**：clean、文檔感、可讀性高
- **The New York Times Opinion**：嚴肅 editorial
- **Are.na**：低調、neutral palette、emphasis on content
- **Stripe Press / Plough Quarterly**：學術但現代

請**避免**參考：Material Design admin template、Cluely 風格的 web3、Linear app（太過 product-y）。

### 顏色方向

- Neutral foundation（建議：warm greys 或 cool greys，二選一定下來）
- **一個** accent color（用得很節制，主要在 CTA、links、focus ring）
- Semantic colors 只在必要時出現（success / warning / error / info）
- 建議從這幾個方向選一個 accent：深藍灰、暗綠、酒紅、深橘——避免螢光、avoid pink/purple/cyan
- **Dark mode**：請設計 light mode 為主，dark mode 為 v2（先給 light 完整 tokens，dark 給對應 mapping 即可）

### 字體

- **中文為主**（90%+ 內容都會是中文，但偶爾有英文 / 程式碼 / 數學公式）
- 中文：Noto Sans TC（UI）+ Noto Serif TC（如果採用 mixed serif/sans 方向，body content 用 serif）
- 英文：與中文匹配的 sans-serif（Inter / system-ui 都可）
- 程式碼：JetBrains Mono / Fira Code
- 請決定整站採用：(A) 全 sans-serif、(B) UI sans + body serif、(C) 其他建議。我傾向 (B)，但你可以說服我換

### Mobile-first

- 最小 viewport：375px（iPhone SE 寬）
- 所有 layout 必須給 mobile 變體
- 編輯器頁面在 mobile 上是棘手點：左 source、右 preview 兩欄在窄螢幕怎麼摺？三欄（含 sidebar）怎麼變？請特別處理

### Accessibility

- WCAG **AA** compliance（不是 AAA，務實）
- 所有 interactive element 需 visible focus ring
- 所有 text/background 對比 ≥ 4.5:1
- 所有 image 需 alt text 規範
- Keyboard navigation 友善

---

## 3. 技術約束（影響你的設計）

工程端的 lock-in，請務必尊重：

| 項目              | 約束                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework         | Next.js 14+ App Router、Server Components 為主                                                                                                               |
| Styling           | **Tailwind CSS only**（請用 utility classes 描述所有 styling）                                                                                               |
| Component library | shadcn/ui（建議的基底）；若你想用其他基底請說明                                                                                                              |
| Markdown 渲染器   | 自寫 `<MarkdownRenderer>`，用 Tailwind `prose` plugin（`@tailwindcss/typography`）                                                                           |
| Markdown 編輯器   | `@uiw/react-md-editor`（**這個套件的編輯器主體**請維持其預設外觀，**preview 區**會被替換為我們自己的 `<MarkdownRenderer>`，所以 preview 那邊的視覺由你設計） |
| Diff viewer       | `react-diff-viewer-continued`（套件 default 樣式可調，請設計暗 / 亮兩主題的 syntax theme）                                                                   |
| Icon              | Lucide React（shadcn 預設）                                                                                                                                  |
| Embeds            | YouTube iframe、`react-social-media-embed`（IG/FB）、自製 Threads embed — 它們的視覺基本由各平台控制，請設計**它們在文章中的 wrapper / 邊框 / 間距**         |
| Fonts             | 由 next/font 載入（不能用 @import）                                                                                                                          |

---

## 4. Personas 細節

### Persona V — 訪客

- 名字 / 來源不固定（可能是其他教授、可能是學弟妹、可能是被 Google 搜到的研究者）
- 動機：找研究參考、引用、好奇
- 設備：50% 桌機 / 50% 手機
- 期望：能快速找到主題相近的報告、容易閱讀長文、可以分享 link

### Persona S — 學生

- 台大社會所研究生，22–35 歲
- 寫過 Word / Google Docs，**部分**人寫過 markdown（HackMD 經驗）
- 動機：完成期末報告，希望作品被看見
- 設備：90% 桌機（寫作）+ 10% 手機（讀其他人的）
- 痛點：寫到一半閃退、改一改不知道哪個版本是最終的、想插圖很麻煩

### Persona T — 老師

- 就是我
- 同時帶多堂研究所課
- 動機：高效審核、看清楚學生改了什麼、不要 click 太多次
- 設備：100% 桌機（admin 介面不需要 polished mobile）

---

## 5. 頁面清單（請按優先級設計）

### Tier 1 — 必須設計（用戶最常見的頁面）

1. **`/` 公開首頁 + `/c/{courseSlug}`** — 課程 tab nav + 該課程已發布報告列表
2. **`/c/{courseSlug}/r/{reportSlug}`** — 單份報告閱讀頁
3. **`/workspace/c/{courseId}`** — 學生編輯器（三欄：sidebar / editor / preview）
4. **`/login`** — Google 登入頁
5. **`/workspace/onboarding`** — 第一次登入：輸課程代碼 + 設定 profile 名稱

### Tier 2 — 重要但較簡單

6. **`/workspace`** — 學生課程列表卡片
7. **`/admin`** — 老師看自己建的課程
8. **`/admin/courses/{id}`** — 課程設定 + 學生報告列表（含 status tags）
9. **`/admin/courses/{id}/r/{rid}`** — 報告審核頁（Latest / Diff / History tabs）
10. **`/workspace/settings`** — 個人設定

### Tier 3 — boilerplate

11. **`/privacy`** + **`/tos`** — 靜態文件頁
12. **`error.tsx` / `not-found.tsx`** — 錯誤頁
13. **`/admin/courses/new`** — 建立課程表單

---

## 6. 工程端已經畫好的 ASCII 線框（你的起點，請改進）

### 6.1 公開首頁 `/`

```
┌─────────────────────────────────────────────────┐
│  Site Header / Logo / Login button (right)      │
├─────────────────────────────────────────────────┤
│  [Course A] [Course B] [Course C]  ← tab nav    │
│  ──────                                          │
├─────────────────────────────────────────────────┤
│  Course description (markdown, collapsible)     │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │ [thumb] Title / Author                    │  │
│  │         Summary text                      │  │
│  │         Last published 2026-04-15         │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ ...                                       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**請改進的點**：tab nav 在 10+ 堂課時怎麼處理？scroll？dropdown？要不要側邊欄替代？

### 6.2 報告閱讀頁 `/c/.../r/...`

```
┌──────────────────────────────────────────────────┐
│  ← Back to Course A                              │
│                                                  │
│  # Title (中文 + serif?)                         │
│  Author · 發布於 2026-04-15                      │
│                                                  │
│  <MarkdownRenderer content={published} />        │
│  ...（可能很長：含圖、KaTeX、code、4 種 embed）  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**請改進的點**：長文閱讀的 typography、行高、寬度（理想 measure 65–75 字元）、anchor 連結、目錄（TOC）side panel 要不要？

### 6.3 學生編輯器 `/workspace/c/{id}`

```
┌─────────────────────────────────────────────────────────────┐
│ Top bar: course | save status | manual save Ctrl+S | help   │
├──────────────┬──────────────────────────────────────────────┤
│              │                       │                       │
│  Sidebar     │   Markdown editor     │   Preview             │
│  (300px)     │   (textarea)          │   (rendered)          │
│              │                       │                       │
│  Metadata:   │   ## Section          │   Section             │
│  - title     │   text...             │   text...             │
│  - author    │                       │                       │
│  - summary   │                       │                       │
│  - cover img │                       │                       │
│              │                       │                       │
│  Files:      │                       │                       │
│  [+ Upload]  │                       │                       │
│  - img1.png  │                       │                       │
│  - img2.jpg  │                       │                       │
│  ...         │                       │                       │
└──────────────┴───────────────────────┴───────────────────────┘
```

**請改進的點**：

- Mobile 三欄怎麼摺？sidebar → drawer？preview → tab switch？
- Save status 在 top bar 的位置 / 三態（Saving / Saved Xs ago / Offline）視覺
- Sidebar 的 Metadata 區跟 Files 區如何視覺分離
- Files 在 sidebar 太多時怎麼處理

### 6.4 老師審核頁 `/admin/courses/{id}/r/{rid}`

```
┌──────────────────────────────────────────────────┐
│  ← Course A · 學生報告                            │
│                                                  │
│  Title (學生報告標題)                            │
│  Author: xxx · Status: [Published+New]           │
│                                                  │
│  [ Latest ] [ Diff ] [ History ]   ← tabs       │
│                                                  │
│  ⌄ Diff sub-tabs: [ Source ] [ Rendered ]       │
│                                                  │
│  <react-diff-viewer ... />                       │
│  - removed text                                  │
│  + added text                                    │
│                                                  │
│                          [ Publish ] [ Unpublish ]│
└──────────────────────────────────────────────────┘
```

**請改進的點**：tabs 切換的 UX、Publish 按鈕的 confirmation 對話框設計、status tag 的 3 種顏色

---

## 7. 特定 UI Patterns（請務必設計）

| Pattern                   | 描述                                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty states              | 沒課程 / 沒報告 / 沒上傳檔案 — illustration 或 wording 引導                                                                                                          |
| Loading skeletons         | 公開首頁、編輯器、admin 報告列表                                                                                                                                     |
| **Save status indicator** | 三態：`Saving... (動畫)` / `Saved {n}s ago` / `Offline (cached)`                                                                                                     |
| **Status tags**           | 3 種：`Unpublished`（neutral）/ `Published`（success）/ `Published + New Changes`（warning）                                                                         |
| **Staging banner**        | 黃條置頂，文字「STAGING — 含未發布內容、僅授權人員可見」                                                                                                             |
| Cover image upload        | 預覽 + crop 提示（不一定要 in-app crop，但要說明建議比例）                                                                                                           |
| File upload progress      | 圖片上傳中的進度條                                                                                                                                                   |
| Course code display       | 6 碼大寫英數，老師頁要醒目（可一鍵複製、可 regenerate）                                                                                                              |
| Toast / Notification      | error / success / info 的 toast 樣式（用 sonner 或 shadcn 內建）                                                                                                     |
| Confirmation dialogs      | Publish、Unpublish、Delete file、Regenerate code、Delete account 等需要 confirm 的操作                                                                               |
| Form validation messages  | inline 顯示在 input 下方                                                                                                                                             |
| Markdown content styling  | `prose` plugin 的 customization：headings, paragraphs, blockquote, code blocks, lists, tables, footnotes, KaTeX math, image captions, **以及 4 種 embed 的 wrapper** |

---

## 8. 最終輸出格式（請嚴格遵守）

全部頁面討論完後，請合併成單一一份 markdown 檔，**完全照下面的 schema**：

````markdown
# Design Spec — 課程報告網站

## 1. Design Tokens

### 1.1 Colors

Tailwind config 格式（直接可以 paste into `tailwind.config.ts`）：

```ts
export const colors = {
  // brand
  primary: { 50: '...', 100: '...', ..., 900: '...' },
  accent: { 50: '...', ..., 900: '...' },

  // neutral foundation
  background: 'hsl(...)',
  foreground: 'hsl(...)',
  muted: 'hsl(...)',
  'muted-foreground': 'hsl(...)',
  border: 'hsl(...)',
  // ...

  // semantic
  success: { ... },
  warning: { ... },
  destructive: { ... },
  info: { ... },
};
```

### 1.2 Dark mode mapping

對應的 dark mode HSL（也直接可 paste）。

### 1.3 Typography

```ts
// next/font 配置（要 import 哪些）
// Tailwind font-family / font-size / line-height tokens
fontFamily: {
  sans: ['var(--font-noto-sans-tc)', 'Inter', ...],
  serif: ['var(--font-noto-serif-tc)', ...],
  mono: ['var(--font-jetbrains-mono)', ...],
}
// 字級 scale：列 text-xs ~ text-5xl 各自的 size + line-height + letter-spacing
```

### 1.4 Spacing / Radius / Shadow / Animation

依需要 override Tailwind default 或全部沿用，明確說明。

---

## 2. Component Library

基於 shadcn/ui（或自選方案，要說明）。每個 component 列：

### Button

- Variants: primary / secondary / ghost / destructive / link
- Sizes: sm / default / lg / icon
- Tailwind classes for each variant + size combination
- a11y: focus ring style, disabled state

### Card / Input / Textarea / Select / Checkbox / Radio / Switch / Dialog / Tooltip / Popover / Tabs / Toast / Badge / Avatar / Skeleton / Separator

- 同上格式

### 自訂 components

- SaveStatusIndicator (三態樣式)
- StatusTag (3 種狀態)
- StagingBanner
- CourseCard (公開首頁 + admin)
- ReportListItem
- ReportRow (admin)
- CourseCodeDisplay
- FileUploadButton + progress
- EmptyState

---

## 3. Page Layouts

每個 Tier 1+2 頁面一節：

### 3.1 `/` 公開首頁

- **Visual hierarchy 描述**
- **完整 JSX scaffold**（含 Tailwind classes，用假資料，**可獨立 render**）
- **Mobile 變體**（375px 寬）的 JSX
- 互動 notes（hover、focus、active）

### 3.2 `/c/{slug}/r/{slug}` 報告閱讀頁

...

### 3.3 `/workspace/c/{id}` 學生編輯器

- 三欄 desktop 完整 JSX
- Mobile 兩種形態（sidebar drawer / preview 切換 tab）
- Top bar 的 save status indicator 詳細視覺

### 3.4 ~ 3.10

每個 Tier 1 + Tier 2 頁面都要有完整 scaffold

### 3.11 Error / Not Found / Privacy / TOS

簡單版

---

## 4. Specific Patterns

### 4.1 Save Status Indicator (三態)

- HTML snippet
- 動畫 (Tailwind animate 或 framer-motion)

### 4.2 Status Tags

- 3 種：Unpublished / Published / Published+New
- 配色、icon、HTML

### 4.3 Staging Banner

- 完整 JSX
- 高度、置頂行為、與下方 content 的間距

### 4.4 Markdown Content (`prose` customization)

- Tailwind Typography plugin override
- 涵蓋：h1-h6、p、blockquote、code (inline + block)、ul/ol、table、img + caption、footnote、KaTeX、4 種 embed wrapper

### 4.5 Empty States、Loading Skeletons、Toast、Confirmation Dialog

- 各列出代表性樣式

---

## 5. Accessibility

- Focus ring style（一個 token，全站統一）
- 各 component 鍵盤導覽說明
- 色彩對比通過 WCAG AA 的 token 對列表

---

## 6. Implementation Notes (給工程端的 hint)

- 應該安裝哪些 shadcn/ui components（提供 `npx shadcn add ...` 指令列表）
- 應該安裝哪些 npm package（除了 spec 已有的之外）
- Tailwind config 該怎麼擴充
- `globals.css` 該加哪些 CSS variables

---

## 7. Out of Scope

明確列出不做的東西：

- e.g. 「dark mode toggle UI」（v2）
- e.g. 「即時協作 cursor」（不在 spec）
- e.g. 「留言系統」（不在 spec）
````

---

## 9. 你（Claude Design）現在的下一步

如果 context 都 OK 了，請：

1. 跟我確認你掌握了 tone（editorial 學術期刊）、技術約束（Tailwind + shadcn/ui）、和 Tier 1 頁面
2. 提出 **整體 design system 方向**（color palette + typography + 1 個 sample component），先讓我選擇基調
3. 確認後我會逐頁討論

開工。
