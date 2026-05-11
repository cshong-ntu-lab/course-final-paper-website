# 課程報告網站 — Design Specification

> **狀態**：✅ Approved 2026-05-12（等待 Phase 0 啟動指令）
> **作者**：Jun-Wei Liu + Claude（共同推導）
> **目標讀者**：你自己（實作前的 source of truth）、未來的協作者、reviewers
> **配套檔案**：`tasks/todo.md` — Phase 0–11 可勾選的 todo list

---

## 0. Context

台大社會所研究所課程的「期末報告網站」。**目的**：

1. 提供一個給研究生**寫＋發表**期末報告的平台，類似 HackMD + 老師審核機制
2. 學生用熟悉的 Markdown 寫作，能在 UI 上看到最終公開頁面的長相（preview = 真實渲染）
3. 老師有審核 / 發布權，未發布的內容只在 staging 站可見
4. 已發布的報告以網頁形式公開可被 Google 搜尋（學術成果展示）
5. 整套系統部署在 GCP / Cloud Run，前後端用 Next.js，資料層用 Firebase

**範圍**：MVP 目標是先讓**單一一位老師（你自己）+ 多堂研究所課**運作起來。架構保留多老師 / 多課程的擴充空間，但 admin 認定先以 env var hardcoded 為主。

---

## 1. Decisions Snapshot

| #   | 議題                          | 決策                                                                                                          |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Auth                          | Firebase Auth (client) + HttpOnly session cookie (Admin SDK)                                                  |
| 2   | Prod / Staging                | 兩個 Cloud Run service、**同一份 Firebase project**、**單一 Next.js codebase + `APP_MODE` env var**           |
| 3   | Tenancy                       | 1 位老師、多堂課程、學生可加入多堂；admin 認定以 `ADMIN_EMAILS` env var 列表                                  |
| 4   | CI/CD 環境                    | `main` → prod、PR → preview Cloud Run revision（traffic tag = `pr-{n}`）                                      |
| 5   | Markdown editor               | `@uiw/react-md-editor` + 自寫 `<MarkdownRenderer>` 注入 preview slot                                          |
| 6   | File upload                   | `image/*` only、單檔 10MB、單份報告總額 200MB                                                                 |
| 7   | 版本模型                      | `reports/{id}` = latest draft；`reports/{id}/publishSnapshots/{vid}` = 發布快照                               |
| 8   | Course code                   | 系統自動產 6 碼英數（去除 0/O/1/I/L 易混字元）+ `enrollmentOpen: boolean`                                     |
| 9   | 公開首頁                      | 上方 tab nav 列課程；下方橫列列出該課程已發布報告（標題 + 摘要 + 作者 + 縮圖）                                |
| 10  | Report metadata               | `title` / `author` (free-text) / `summary` / `coverImageUrl`                                                  |
| 11  | 學生身分顯示                  | 公開頁顯示 free-text `author`，**不顯示 Google account 名稱 / 照片**；SEO 允許                                |
| 12  | 應用結構                      | 單一 Next.js app；環境差異由 `APP_MODE` env var 決定                                                          |
| 13  | Region / Domain               | `asia-east1` + Cloud Run `*.a.run.app`（MVP）；之後可隨時加 custom domain                                     |
| 14  | Post-login landing            | 學生 → `/workspace`、老師 → `/admin`                                                                          |
| 15  | First-time student onboarding | Google OAuth → 輸入課程代碼 → 設定 profile display name → 建立 user doc + enrollment + template 報告          |
| 16  | Autosave                      | 每 30 秒 debounced 寫入 Firestore；右上角顯示 `Saving... / Saved {n}s ago / Offline`                          |
| 17  | Image upload UX               | drag-drop / clipboard paste / sidebar 三者皆支援                                                              |
| 18  | Course metadata               | `name` / `year` / `semester` / `description` (markdown) / `coverImageUrl`                                     |
| 19  | Report template               | Hardcoded 預設 template（在 code 內定義）                                                                     |
| 20  | Notifications                 | MVP **不做**通知；老師 admin 頁 tag 提示更新狀態                                                              |
| 21  | Course closed 語意            | 關閉註冊（新生不能加入）；既有學生繼續可編輯、老師繼續可發布                                                  |
| 22  | Diff UI                       | Side-by-side source diff（`react-diff-viewer-continued`）+ `Rendered preview` tab                             |
| 23  | Markdown features             | GFM + `rehype-shiki` + `remark-math` + `rehype-katex` + footnotes + URL embeds（YouTube / IG / FB / Threads） |
| 24  | Rendering 策略                | SSR + HTTP cache：`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`                            |
| 25  | Admin 識別                    | `ADMIN_EMAILS` env var (CSV) → 登入時 set Firebase custom claim `isAdmin: true`                               |
| 26  | CI/CD 平台                    | GitHub Actions（CI: lint / typecheck / test）+ Cloud Build（build image + deploy）                            |
| 27  | Sidebar files                 | List + Upload + Delete + Insert into editor（flat，無資料夾）                                                 |
| 28  | Monitoring                    | Sentry（前+後端）+ Cloud Logging + Cloud Run Metrics                                                          |
| 29  | Testing                       | Vitest unit（utils + API + Firestore rules）+ Playwright E2E（關鍵路徑）                                      |
| 30  | Privacy/TOS                   | 提供 `/privacy` + `/tos` 靜態頁；**不提供自助刪帳**（聯絡老師）                                               |
| 31  | Analytics                     | MVP **不裝**                                                                                                  |
| 32  | Backup                        | Cloud Scheduler 每日觸發 Firestore export → GCS bucket，lifecycle 30 天後自動刪                               |
| 33  | Image 處理                    | next/image 客戶端動態 resize；Storage 存原始檔                                                                |
| 34  | API 風格                      | Server Actions（mutation 主力）+ Route Handlers（signed upload URL、webhook 等）                              |
| 35  | Public 搜尋                   | MVP **不做**                                                                                                  |

---

## 2. Personas & User Stories

### 2.1 訪客（未登入）

- 想看老師指定公開的研究生期末報告
- US-V1: 進首頁能切換到不同課程，看到該課程已發布的報告列表
- US-V2: 點報告能讀到 markdown 渲染後的內容
- US-V3: 報告被 Google 搜尋得到（標題、作者、摘要、首段）

### 2.2 學生（已登入、enroll 一堂以上課程）

- US-S1: 第一次登入時，輸入課程代碼加入課程
- US-S2: 第一次登入時設定一個「公開作者名稱」（可與 Google 帳號名稱不同），會作為新報告的預設作者
- US-S3: 進 `/workspace` 看到我加入的所有課程，點進某堂課進入該課的報告編輯頁
- US-S4: 在編輯頁左半寫 markdown，右半即時看到最終公開時的長相（用同一個 renderer）
- US-S5: 編輯時每 30 秒自動儲存；也能手動 `Ctrl+S` 立即儲存
- US-S6: 在 sidebar 看到我已上傳的圖片，可以拖拉到 markdown 區、或在文中貼上、或從 sidebar 點「插入」
- US-S7: 可以設定報告的 title / author / summary / 封面縮圖
- US-S8: 不能自己刪除或下架報告（只有老師能 unpublish）
- US-S9: 進 staging 站時可以看到所有同學的草稿 render 起來的樣子

### 2.3 老師（admin）

- US-T1: 登入後預設進 `/admin`，看到我建立的所有課程
- US-T2: 建立新課程：填 name / year-semester / description / 封面圖；系統自動產生 6 碼課程代碼
- US-T3: 進入課程後看到該課所有學生報告列表（每列：標題 + 摘要 + 作者 + 狀態 tag）
- US-T4: 狀態 tag 有三種：`Unpublished`、`Published`、`Published + New Changes`
- US-T5: 點報告 → 看「最新 draft」內容；若已發布過，可切到「Diff」tab 看 latest draft vs 最近一次發布的對比
- US-T6: 按「發布」→ 把 latest draft 寫入 `publishSnapshots`，更新 `publishedAt`
- US-T7: 可選擇 unpublish 某個報告（公開頁就看不到了，staging 仍可見）
- US-T8: 隨時可關閉課程註冊（避免被外人加入）
- US-T9: 隨時可 regenerate 課程代碼（舊代碼立刻失效）

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Visitor / Student / Teacher Browser     │
└──────────────────────────────────────────────────────────────────┘
       │                          │                          │
       │  HTTPS                   │  HTTPS                   │
       ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Cloud Run        │      │ Cloud Run        │      │ Firebase         │
│ course-prod-xxx  │      │ course-staging-..│      │ Storage          │
│ .a.run.app       │      │ .a.run.app       │      │ (圖片 direct DL) │
│ APP_MODE=prod    │      │ APP_MODE=staging │      └──────────────────┘
│ Next.js (SSR)    │      │ Next.js (SSR)    │
└──────────────────┘      └──────────────────┘
       │                          │
       │ Firebase Admin SDK       │
       ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Firebase Project                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Auth         │  │ Firestore    │  │ Storage      │            │
│  │ (Google IdP) │  │ (NoSQL DB)   │  │ (image blob) │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
       │ daily 03:00
       ▼
┌──────────────────┐
│ GCS backup       │
│ bucket (30 d)    │
└──────────────────┘
```

**重點**：

- 兩個 Cloud Run service 共用同一份 codebase / image / Firebase project
- 差異只在 `APP_MODE` env var 控制的 runtime 邏輯（contents filter、強制登入、UI banner）
- 共用 Firebase 表示「同一份學生資料」，prod = 看到已發布，staging = 看到所有

---

## 4. Data Model (Firestore)

### 4.1 Collections

```
users/{uid}
  email: string                  // 從 Google
  displayNameGoogle: string      // 從 Google
  photoURLGoogle: string         // 從 Google
  profileDisplayName: string     // 學生自己設的公開作者名（預設值，可被報告層覆寫）
  role: 'student' | 'admin'      // 由 ADMIN_EMAILS 在登入時計算寫入
  createdAt: Timestamp
  updatedAt: Timestamp

courses/{courseId}
  name: string                   // 「質性研究方法」
  year: number                   // 113
  semester: '1' | '2'            // 上學期 / 下學期
  description: string            // markdown
  coverImageUrl: string | null
  code: string                   // 'A3K9P2'（unique 索引）
  enrollmentOpen: boolean        // 學生能否用 code 加入
  ownerUid: string               // 老師 uid（未來多老師時用）
  createdAt: Timestamp
  updatedAt: Timestamp

enrollments/{enrollmentId}       // id = `${courseId}_${uid}`
  courseId: string
  uid: string
  enrolledAt: Timestamp

reports/{reportId}               // id = `${courseId}_${uid}` (1:1 mapping per student per course)
  courseId: string
  uid: string                    // 作者學生
  title: string                  // 預設 '標題'
  author: string                 // 預設 user.profileDisplayName，可改
  summary: string                // 預設 '摘要'
  coverImageUrl: string | null
  contentMd: string              // 最新 markdown 草稿
  publishedAt: Timestamp | null  // 最近一次發布時間；null = 從未發布
  hasNewChanges: boolean         // contentMd 在 publishedAt 之後有沒有變動
  createdAt: Timestamp
  updatedAt: Timestamp

reports/{reportId}/publishSnapshots/{snapshotId}
  contentMd: string              // 該時刻的 markdown 快照
  title: string                  // 快照當下的 metadata
  author: string
  summary: string
  coverImageUrl: string | null
  publishedAt: Timestamp
  publishedBy: string            // 老師 uid

reports/{reportId}/uploads/{uploadId}
  filename: string               // 原始檔名（用於 sidebar 顯示）
  storagePath: string            // `reports/{courseId}/{uid}/{uploadId}_{filename}`
  downloadURL: string            // Firebase Storage download URL
  sizeBytes: number
  contentType: string            // image/png 等
  uploadedAt: Timestamp
```

### 4.2 Storage layout

```
reports/{courseId}/{uid}/{uploadId}_{filename}    // 學生上傳的圖
covers/courses/{courseId}                          // 課程封面
covers/reports/{reportId}                          // 報告封面
```

### 4.3 Indexes（Firestore）

- `enrollments` where `uid == ?` + orderBy `enrolledAt desc`（學生 workspace 列出加入的課）
- `reports` where `courseId == ?` + orderBy `updatedAt desc`（老師 admin 頁列出該課所有報告）
- `reports` where `publishedAt != null` + orderBy `publishedAt desc`（公開首頁列已發布）
- `courses` orderBy `createdAt desc`（公開首頁 tab 排序）

### 4.4 Security Rules（高層摘要）

```
match /users/{uid} {
  allow read: if request.auth.uid == uid || isAdmin();
  allow write: if request.auth.uid == uid && !willChangeRole();
  // role 只能由 server-side Admin SDK 寫
}

match /courses/{courseId} {
  allow read: if true;                             // 公開（首頁需要）
  allow write: if isAdmin();
}

match /enrollments/{eid} {
  allow read: if request.auth.uid == resource.data.uid || isAdmin();
  allow create: if validatedByServer();            // 透過 Server Action / signed
  allow delete: if isAdmin();
}

match /reports/{rid} {
  allow read: if isAdmin() || request.auth.uid == resource.data.uid || isPublishedAndProd();
  allow update: if request.auth.uid == resource.data.uid && onlyChangesAllowedFields();
  allow create: if validatedByServer();            // 透過 Server Action 建立
  allow delete: if isAdmin();
}

match /reports/{rid}/publishSnapshots/{sid} {
  allow read: if isAdmin() || authedAndPublishedCheck();
  allow write: if isAdmin();
}

match /reports/{rid}/uploads/{uid} {
  allow read: if true;                             // 圖檔 referenced from public page
  allow write: if request.auth.uid == get(/databases/$(database)/documents/reports/$(rid)).data.uid;
}
```

Storage Rules：學生只能寫到 `reports/{courseId}/{ownUid}/...`，10MB 限制、`image/*` content-type 檢查。

---

## 5. Routing & Pages

### 5.1 Public（prod）

| Route                            | 內容                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `/`                              | Course tab nav + 該課程已發布報告橫列；預設選最新課程；`?course={id}` 切換 |
| `/c/{courseSlug}`                | 同 `/?course={id}`，URL 友善版（可分享）                                   |
| `/c/{courseSlug}/r/{reportSlug}` | 單份報告閱讀頁                                                             |
| `/login`                         | Google 登入頁                                                              |
| `/privacy`                       | 隱私權聲明                                                                 |
| `/tos`                           | 服務條款                                                                   |

> `courseSlug` = `${year}-${semester}-${slugify(name)}`；`reportSlug` = `${slugify(author)}` 或 reportId 後 8 碼

### 5.2 學生工作區（須登入）

| Route                     | 內容                                                        |
| ------------------------- | ----------------------------------------------------------- |
| `/workspace`              | 我加入的課程列表（卡片：course name / 上次編輯 / 發布狀態） |
| `/workspace/c/{courseId}` | 我在這堂課的報告編輯器                                      |
| `/workspace/settings`     | 個人設定（改 profile display name）                         |
| `/workspace/onboarding`   | 第一次登入：輸課程代碼 + 設定 profile name                  |

### 5.3 老師後台（須登入、isAdmin）

| Route                                    | 內容                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `/admin`                                 | 課程列表（卡片：name / status / 學生數） + 「+ 建立課程」按鈕                      |
| `/admin/courses/new`                     | 建立課程表單                                                                       |
| `/admin/courses/{courseId}`              | 課程設定 + 學生報告列表（with status tags）                                        |
| `/admin/courses/{courseId}/r/{reportId}` | 看某學生 latest draft；tabs: `Latest` / `Diff (vs published)` / `Rendered preview` |

### 5.4 Staging 站專屬

當 `APP_MODE=staging` 時，整站行為改變：

- 全站 middleware 強制 redirect 未登入到 `/login`
- 頁頂顯示黃底 banner：`STAGING — 含未發布內容、僅授權人員可見`
- `/` 改為列出 ALL 學生的 latest draft（不論是否發布、不論是否同課程）
- `/c/.../r/...` 渲染 latest draft 而非 latest publish snapshot
- 其餘 routes（workspace、admin、login）與 prod 同步存在

---

## 6. API Surface

### 6.1 Server Actions（src/actions/\*.ts）

| Action                                   | Auth            | 描述                                                                                |
| ---------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `loginWithGoogle()`                      | Public          | 客戶端拿 Google ID token → server exchange → set HttpOnly session cookie            |
| `logout()`                               | Authed          | Clear session cookie                                                                |
| `enrollWithCode(code: string)`           | Student         | 驗證 code + course.enrollmentOpen → create enrollment + create report from template |
| `setProfileName(name: string)`           | Student         | 更新 `users/{uid}.profileDisplayName`                                               |
| `saveReportDraft(reportId, patch)`       | Student (owner) | Update report.contentMd / metadata；set hasNewChanges if applicable                 |
| `createCourse(input)`                    | Admin           | 建課程 + 產生 code                                                                  |
| `updateCourse(courseId, patch)`          | Admin           | 改 metadata                                                                         |
| `toggleEnrollment(courseId, open: bool)` | Admin           | 開/關註冊                                                                           |
| `regenerateCourseCode(courseId)`         | Admin           | 重新產 code                                                                         |
| `publishReport(reportId)`                | Admin           | snapshot 寫入 publishSnapshots + update publishedAt + hasNewChanges=false           |
| `unpublishReport(reportId)`              | Admin           | 清 publishedAt（snapshots 保留）                                                    |
| `deleteUpload(reportId, uploadId)`       | Student (owner) | 刪 Storage object + Firestore doc                                                   |

### 6.2 Route Handlers（src/app/api/\*/route.ts）

| Route               | Method | 用途                                                                      |
| ------------------- | ------ | ------------------------------------------------------------------------- |
| `/api/uploads/sign` | POST   | 學生傳檔前向後端要 signed upload URL（Firebase Storage resumable upload） |
| `/api/auth/session` | POST   | Login flow 內部使用；驗 Firebase ID token、set HttpOnly cookie            |
| `/api/auth/session` | DELETE | Logout                                                                    |
| `/api/healthz`      | GET    | Cloud Run liveness probe                                                  |
| `/api/revalidate`   | POST   | 預留；目前 SSR 不用                                                       |

### 6.3 Server-side helpers（src/lib/server/\*.ts）

- `getCurrentUser()` — 從 cookie 拿 session，verify with Firebase Admin SDK
- `requireAdmin()` — getCurrentUser + 檢查 custom claim `isAdmin`
- `requireStudentOwnerOfReport(reportId)` — 驗報告擁有權
- `getCourseAndAssertVisible(courseId)` — 抓 course + 視 `APP_MODE` 決定可見性

---

## 7. Authentication & Authorization Flow

### 7.1 Login flow

```
Browser                   Next.js Server                Firebase
   │                            │                          │
   ├─ 1. 訪問 /login            │                          │
   ├─ 2. Click "Sign in"        │                          │
   ├─ 3. signInWithPopup ───────┼──────────────────────────► Google IdP
   ◄─────────── ID token ──────┼───────────────────────────┤
   ├─ 4. POST /api/auth/session ►                          │
   │                            ├─ verifyIdToken ──────────►
   │                            ◄─── decoded ──────────────┤
   │                            ├─ 檢查 ADMIN_EMAILS       │
   │                            ├─ setCustomClaim(isAdmin) ►
   │                            ├─ createSessionCookie ────►
   │                            ◄────── session cookie ────┤
   │                            ├─ ensureUserDoc (Firestore upsert)
   ◄──── Set-Cookie HttpOnly ───┤                          │
   ├─ 5. Redirect by role:                                 │
   │   - first-time → /workspace/onboarding                │
   │   - student → /workspace                              │
   │   - admin → /admin                                    │
```

### 7.2 Session cookie

- HttpOnly、Secure、SameSite=Lax
- 5 天有效期（Firebase session cookie max）
- 自動 refresh via middleware（剩 < 1 天就 re-mint）

### 7.3 Authorization matrix

| Resource                | Visitor           | Student (any) | Student (owner) | Admin            |
| ----------------------- | ----------------- | ------------- | --------------- | ---------------- |
| GET `/` (prod)          | ✓                 | ✓             | ✓               | ✓                |
| GET `/` (staging)       | redirect → /login | ✓             | ✓               | ✓                |
| GET `/workspace`        | redirect          | ✓             | ✓               | ✓                |
| GET own report editor   | redirect          | ✗             | ✓               | ✓                |
| GET other report editor | ✗                 | ✗             | ✗               | ✓                |
| POST `saveReportDraft`  | ✗                 | ✗             | ✓               | ✗ (不應該手動改) |
| POST `publishReport`    | ✗                 | ✗             | ✗               | ✓                |
| POST `createCourse`     | ✗                 | ✗             | ✗               | ✓                |

---

## 8. Markdown Rendering

### 8.1 `<MarkdownRenderer />` (single source of truth)

`packages/markdown/Renderer.tsx`：

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import remarkEmbed from "./remarkEmbed"; // 自寫 plugin
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeShiki from "@shikijs/rehype";
import { embedSanitizeSchema } from "./embedSchema";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks, remarkEmbed]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" } }],
          [rehypeSanitize, embedSanitizeSchema],
        ]}
        components={{
          "youtube-embed": YouTubeEmbed,
          "instagram-embed": InstagramEmbed,
          "facebook-embed": FacebookEmbed,
          "threads-embed": ThreadsEmbed,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
```

### 8.2 `remarkEmbed` plugin

掃 paragraph nodes：若該段落只含**單一一行 URL**，且 URL 符合下表 regex，就把該 node 換成 custom embed AST node：

| Platform  | URL pattern                          | AST node                          |
| --------- | ------------------------------------ | --------------------------------- |
| YouTube   | `youtube.com/watch?v=` / `youtu.be/` | `<youtube-embed videoId="..." />` |
| Instagram | `instagram.com/p/` / `/reel/`        | `<instagram-embed url="..." />`   |
| Facebook  | `facebook.com/.../posts/` etc.       | `<facebook-embed url="..." />`    |
| Threads   | `threads.net/@.../post/`             | `<threads-embed url="..." />`     |

### 8.3 Embed components

- `<YouTubeEmbed>`：直接 `<iframe src="https://www.youtube-nocookie.com/embed/{id}" ... allowfullscreen />`，無 SDK
- `<InstagramEmbed>` / `<FacebookEmbed>`：使用 `react-social-media-embed` 套件
- `<ThreadsEmbed>`：自寫；用 `<blockquote>` + Threads embed script（client-only dynamic import）

### 8.4 `rehype-sanitize` schema

繼承 `defaultSchema`，**白名單** 上述四種 custom element 的 attributes，**禁止** 一般 `<script>` / `<style>` / `<iframe>` 之外的 raw HTML。

### 8.5 三處共用

1. 編輯器 preview slot（透過 `MDEditor.components.preview = (src) => <MarkdownRenderer content={src} />`）
2. Public 報告閱讀頁 `/c/.../r/...`
3. Staging 站閱讀頁

→ 任何 markdown 渲染變動只需改 `MarkdownRenderer`。

---

## 9. Editor & Sidebar

### 9.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Top bar: course name | save status | manual save | publish? │
├──────────────┬──────────────────────────────────────────────┤
│              │                       │                       │
│  Sidebar     │   Markdown editor     │   Preview             │
│  (300px)     │   (textarea)          │   (rendered)          │
│              │                       │                       │
│  Metadata:   │                       │                       │
│  - title     │   ## 摘要             │   摘要                │
│  - author    │   xxx                 │   xxx                 │
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

### 9.2 Autosave 細節

- 任何編輯區（contentMd、metadata、files 操作）的變動觸發 debounced save
- Debounce 30 秒；同時設 max-wait 2 分鐘（避免持續輸入永不存檔）
- 同時把 contentMd 寫入 `localStorage` (key = `draft-${reportId}`)；下次載入時若 server timestamp 比 localStorage 舊，prompt 還原
- 右上角狀態：`Saving... (圈轉) → Saved 2s ago → Offline (cached locally)`
- 手動 `Ctrl+S` / `Cmd+S` 立刻 flush（取消 debounce）

### 9.3 圖片插入流程

任一觸發點（drag, paste, sidebar button）：

```
1. 客戶端拿到 File 物件
2. 客戶端壓縮預檢（不要超過 2MB 上傳，next/image 不需要原始 10MB）
   - 用 browser-image-compression（client-side）reduce to max 2000px / 2MB
   - 保留原始 contentType
3. POST /api/uploads/sign → 拿 signed Firebase Storage URL
4. 直接 PUT 該 URL（resumable upload）→ 100% → 拿到 downloadURL
5. 寫入 reports/{rid}/uploads/{newId}
6. 編輯區游標位置插入 `![${filename}](${downloadURL})`
7. Sidebar 自動 refresh
```

### 9.4 Sidebar 檔案列表

- 每個 file 顯示 thumbnail（64x64）+ filename + size
- Hover 顯示「Insert」+「Delete」按鈕
- Delete 確認對話框（不可復原；刪 Storage object + Firestore doc）

---

## 10. Public Pages

### 10.1 `/` & `/c/{slug}`

```
┌──────────────────────────────────────────────────┐
│  [Course A] [Course B] [Course C]                │   ← tab nav (sticky)
│  ──────                                          │
├──────────────────────────────────────────────────┤
│  課程描述（markdown render；可摺疊）              │
├──────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐ │
│  │ [縮圖] 標題 / 作者                          │ │
│  │        摘要文字（兩三行截斷）                │ │
│  │        最近發布於 2026-04-15                 │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ [縮圖] ...                                  │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- 列表用 `reports where courseId == ? and publishedAt != null orderBy publishedAt desc`
- 摘要 = `report.summary`（學生自填）
- 縮圖 = `report.coverImageUrl` 或 fallback 預設圖
- 點 row → `/c/{slug}/r/{reportSlug}`

### 10.2 `/c/{slug}/r/{reportSlug}`

```
┌──────────────────────────────────────────────────┐
│  ← 返回 課程 A                                    │
│                                                  │
│  # 標題                                          │
│  作者：xxx · 發布於 2026-04-15                   │
│                                                  │
│  <MarkdownRenderer content={publishedContent} /> │
│                                                  │
│  ── 沒有留言區 ──                                │
└──────────────────────────────────────────────────┘
```

- prod：抓 `reports/{id}.publishSnapshots` 的最新一筆 → 顯示其 contentMd / title / author / summary
- staging：抓 `reports/{id}.contentMd` (latest draft) → 顯示 latest 內容、加 banner「Draft preview」

### 10.3 SEO

- 動態 `<meta>`：title、description（report.summary）、og:image（report.coverImageUrl）
- `sitemap.xml` 由 Next.js 動態產生（列出所有已發布報告）
- `robots.txt` allow all（prod）/ disallow all（staging）

---

## 11. Admin Pages

### 11.1 `/admin`

課程卡片列表 + 「建立課程」按鈕。每張卡片顯示：

- 課程名 / 學期 / 學生數 / 「Enrollment Open」chip
- 點卡片進 `/admin/courses/{id}`

### 11.2 `/admin/courses/new`

表單欄位：name / year / semester (select) / description (markdown editor) / cover image upload。送出後 redirect 到該課程頁。

### 11.3 `/admin/courses/{id}`

```
┌──────────────────────────────────────────────────┐
│  ← 課程列表                                      │
│  課程設定（可展開） · Code: A3K9P2 [regen] [關閉]│
├──────────────────────────────────────────────────┤
│  學生報告（${n} 份）                              │
│  ┌────────────────────────────────────────────┐  │
│  │ 標題 · 作者 · 摘要(1行) · [Published+New]  │  │
│  └────────────────────────────────────────────┘  │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

Status tag：

- `Unpublished` — `publishedAt == null`
- `Published` — `publishedAt != null && !hasNewChanges`
- `Published + New Changes` — `publishedAt != null && hasNewChanges`

### 11.4 `/admin/courses/{id}/r/{rid}`

頁頂 Tabs：

- **Latest** — 顯示 `<MarkdownRenderer content={report.contentMd} />`
- **Diff** — `<DiffViewer left={lastSnapshot.contentMd} right={report.contentMd} />`（only if has previous publish）；底下 sub-tab 切「Source diff / Rendered preview」
- **History** — list of `publishSnapshots`，可點開看每個歷史版本

頁頂按鈕：

- `Publish` — 把 latest draft snapshot 化
- `Unpublish` — clear `publishedAt`

---

## 12. Staging Deployment

| 行為                   | Production             | Staging                                 |
| ---------------------- | ---------------------- | --------------------------------------- |
| 未登入訪問 `/`         | 看公開首頁             | redirect `/login`                       |
| `/` 內容               | 列已發布報告 by course | 列所有學生 latest draft（cross-course） |
| `/c/.../r/...` 內容    | 抓 latest snapshot     | 抓 latest draft                         |
| Banner                 | 無                     | 黃底「STAGING」                         |
| `robots.txt`           | allow                  | disallow                                |
| Sentry env             | `production`           | `staging`                               |
| `/workspace`、`/admin` | 同                     | 同                                      |

實作：所有 contents filter / banner / robots 都讀 `process.env.APP_MODE`，封裝成 `lib/env.ts`：

```ts
export const APP_MODE = process.env.APP_MODE === "staging" ? "staging" : "production";
export const isStaging = APP_MODE === "staging";
export const isProduction = APP_MODE === "production";
```

---

## 13. CI/CD Pipeline

### 13.1 GitHub Actions (`.github/workflows/ci.yml`)

Triggers: PR + push to any branch

```yaml
jobs:
  lint-type-test:
    - checkout
    - setup node 22
    - pnpm install
    - pnpm lint
    - pnpm typecheck
    - pnpm test (Vitest)
    - pnpm test:e2e (Playwright + Firebase emulator)
    - upload coverage to artifact
```

### 13.2 Cloud Build (`cloudbuild.yaml`)

Triggered by Cloud Build GitHub trigger（在 GCP console 設）：

- **PR trigger** → build image → push to Artifact Registry as `pr-${PR_NUMBER}` → deploy `course-preview` Cloud Run service with traffic tag `pr-${PR_NUMBER}` → comment URL on PR
- **Merge to main trigger** → build image → push as `main-${SHORT_SHA}` and tag `latest` → deploy `course-prod` (replace 100% traffic) → deploy `course-staging` (replace 100% traffic)

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "${_REGISTRY}/${_IMAGE}:${_TAG}", "."]
  - name: gcr.io/cloud-builders/docker
    args: ["push", "${_REGISTRY}/${_IMAGE}:${_TAG}"]
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - ${_SERVICE}
      - --image=${_REGISTRY}/${_IMAGE}:${_TAG}
      - --region=asia-east1
      - --update-env-vars=APP_MODE=${_APP_MODE},ADMIN_EMAILS=${_ADMIN_EMAILS},...
```

### 13.3 Required GitHub PR checks

- `lint-type-test`（GitHub Actions）
- `cloudbuild-preview-deploy`（Cloud Build）
- branch protection on `main`: require these checks + 1 code review

### 13.4 Secrets management

- GH Actions: 不存任何 GCP secret（CI 不部署，只測）
- Cloud Build: 用 Workload Identity；env var 透過 Secret Manager 注入

---

## 14. Infrastructure

### 14.1 GCP project

- 一個 GCP project：`course-papers-${random}`（建議命名 `ntu-soci-papers`）
- Enable APIs: Cloud Run, Cloud Build, Artifact Registry, Firestore, Firebase Auth, Cloud Storage, Secret Manager, Cloud Scheduler

### 14.2 Cloud Run services

| Service          | APP_MODE   | Min instances                 | Max | CPU | Memory |
| ---------------- | ---------- | ----------------------------- | --- | --- | ------ |
| `course-prod`    | production | 1 (always-on 避免 cold start) | 10  | 1   | 1Gi    |
| `course-staging` | staging    | 0 (允許 cold)                 | 5   | 1   | 1Gi    |
| `course-preview` | staging    | 0                             | 3   | 1   | 512Mi  |

- Concurrency: 80
- Authentication: allUsers（程式自己 enforce auth）

### 14.3 Firebase

- 同一個 Firebase project（綁定上述 GCP project）
- Auth providers: Google only
- Firestore: Native mode, region `asia-east1`
- Storage: default bucket, region `asia-east1`

### 14.4 Secrets

- `SESSION_COOKIE_SECRET` — session cookie 簽章（雖然 Firebase session cookie 已含簽章，留作 future-proof）
- `FIREBASE_ADMIN_PRIVATE_KEY_JSON` — Firebase Admin SDK service account JSON
- `SENTRY_DSN`
- `ADMIN_EMAILS`（也可放普通 env var）

---

## 15. Security

- **CSP**：`default-src 'self'; script-src 'self' 'unsafe-inline' https://www.instagram.com https://connect.facebook.net https://www.threads.net; frame-src https://www.youtube-nocookie.com https://www.instagram.com https://www.facebook.com https://www.threads.net; img-src 'self' https://firebasestorage.googleapis.com data:; ...`（細節在 next.config.js）
- **CSRF**：Server Actions 內建 token；Route Handlers 檢查 `Origin` header
- **XSS**：rehype-sanitize 嚴格 schema；只白名單上述 4 種 embed
- **Rate limiting**：未在 MVP；之後可用 Firebase App Check 或 Cloud Armor
- **Firestore rules**：見 §4.4
- **Storage rules**：path-based ownership，content-type whitelist
- **HttpOnly + Secure + SameSite=Lax** cookies
- **PR preview environments**：使用 staging Firebase（同一份資料）；preview Cloud Run service 設 IAM 只開白名單 email 可訪問（避免外人撞到開發中 URL）

---

## 16. Monitoring & Logging

- **Sentry**：`@sentry/nextjs` integration；source map upload via `sentry-cli` in Cloud Build；environments `production` / `staging` / `preview`
- **Cloud Logging**：Cloud Run 自動收 stdout/stderr；server actions 內部用 `console.info` 結構化 log (JSON)
- **Cloud Run Metrics**：在 GCP console 設 alert
  - 5xx rate > 1% for 5 min → email alert
  - p95 latency > 3s for 5 min → email alert
- **Healthcheck endpoint**：`/api/healthz` 回 `{ ok: true }`，給 Cloud Run liveness probe + 之後加 UptimeRobot

---

## 17. Testing

### 17.1 Vitest unit

`src/**/*.test.ts` —目標：

- `lib/courseCode.ts`（產生器 / 驗證器，去除混淆字元邏輯）
- `lib/markdown/remarkEmbed.ts`（URL pattern matching）
- `lib/server/auth.ts`（role 判斷邏輯，mock Firebase Admin）
- `actions/*.ts`（mock Firestore；驗證 input validation + 寫入 shape）
- Firestore Rules（用 `@firebase/rules-unit-testing` 跑 emulator-based 測試）

### 17.2 Playwright E2E

`tests/e2e/*.spec.ts` — 跑在 CI（GH Actions）的 Firebase emulator：

- `auth.spec.ts`：first-time onboarding flow
- `editor.spec.ts`：寫 markdown + 上傳圖 + autosave verification
- `publish.spec.ts`：學生存草稿 → 老師 publish → public page 看到內容
- `staging.spec.ts`：staging URL 強制登入 + 列所有 drafts

### 17.3 Manual smoke checklist（在 spec 外維護）

每次 prod deploy 後手動 5 分鐘：

- 訪客首頁載入
- Google 登入
- workspace 編輯 + 儲存
- admin 發布
- staging 強制登入 banner

---

## 18. Performance & Caching

- **Public pages**：SSR + `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
  - 老師發布後最多 60 秒生效（可接受）
  - 客戶端 navigation 用 prefetch
- **next/image**：所有圖片走 `next/image`，自動轉 WebP/AVIF + responsive sizes
- **Code splitting**：Markdown editor 用 `dynamic(() => import('@uiw/react-md-editor'), { ssr: false })`
- **Embeds**：IG / FB / Threads embed component 用 client-only dynamic import + intersection observer lazy load
- **Bundle budget**：homepage initial JS < 200KB gzipped；editor page < 500KB（含編輯器）

---

## 19. Privacy, TOS, Compliance

- `/privacy` 條款內容由你提供（spec 內預留 placeholder）
- `/tos` 條款內容由你提供
- 個人資料（email / Google name）只在系統內部使用；公開頁面只顯示 `report.author`（free-text）+ `report.coverImageUrl`
- 學生帳號刪除：**不提供自助 UI**；學生需 email 老師；老師有手動 admin script 可執行
- No cookies for tracking（沒裝 analytics）；session cookie 是 functional cookie，根據 GDPR 不需 banner

---

## 20. Backup & Disaster Recovery

- **Cloud Scheduler job** 每日 03:00 觸發 Cloud Run job（或 Cloud Function）執行 `gcloud firestore export gs://${BACKUP_BUCKET}/$(date +%Y-%m-%d)`
- GCS bucket lifecycle: 物件存活 30 天後自動刪除
- 預估成本：< $1 / 月
- 復原流程：`gcloud firestore import gs://...` to a **new** Firestore database first；驗證後再做 cutover

---

## 21. Project File Structure

```
.
├── README.md
├── package.json
├── pnpm-workspace.yaml          ← 預留（單一 app 暫不需）
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example                 ← 列所有 env var 名稱
├── Dockerfile                   ← multi-stage Next.js standalone build
├── cloudbuild.yaml
├── firebase.json                ← emulator 設定
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
│
├── .github/workflows/
│   └── ci.yml                   ← lint + typecheck + test
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                          ← /
│   │   │   ├── c/[courseSlug]/page.tsx
│   │   │   ├── c/[courseSlug]/r/[reportSlug]/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── tos/page.tsx
│   │   │   └── login/page.tsx
│   │   ├── workspace/
│   │   │   ├── page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── c/[courseId]/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── courses/new/page.tsx
│   │   │   └── courses/[courseId]/
│   │   │       ├── page.tsx
│   │   │       └── r/[reportId]/page.tsx
│   │   ├── api/
│   │   │   ├── auth/session/route.ts
│   │   │   ├── uploads/sign/route.ts
│   │   │   └── healthz/route.ts
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   │
│   ├── actions/                 ← Server Actions
│   │   ├── auth.ts
│   │   ├── enrollment.ts
│   │   ├── profile.ts
│   │   ├── report.ts
│   │   ├── course.ts
│   │   └── publish.ts
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── ReportEditor.tsx
│   │   │   ├── MetadataPanel.tsx
│   │   │   ├── FilesSidebar.tsx
│   │   │   └── SaveStatusIndicator.tsx
│   │   ├── public/
│   │   │   ├── CourseTabs.tsx
│   │   │   ├── ReportListItem.tsx
│   │   │   └── ReportReader.tsx
│   │   ├── admin/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── ReportRow.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   └── PublishControls.tsx
│   │   ├── ui/                  ← shadcn/ui or similar
│   │   └── LoginButton.tsx
│   │
│   ├── lib/
│   │   ├── env.ts               ← APP_MODE / ADMIN_EMAILS / Firebase config
│   │   ├── firebase/
│   │   │   ├── client.ts        ← Firebase JS SDK (browser)
│   │   │   └── admin.ts         ← Firebase Admin SDK (server)
│   │   ├── server/
│   │   │   ├── auth.ts          ← getCurrentUser, requireAdmin, ...
│   │   │   ├── firestore.ts     ← typed converters + query helpers
│   │   │   └── storage.ts       ← signed URL generator
│   │   ├── markdown/
│   │   │   ├── Renderer.tsx     ← THE MarkdownRenderer
│   │   │   ├── remarkEmbed.ts
│   │   │   ├── embedSchema.ts   ← rehype-sanitize schema
│   │   │   └── embeds/
│   │   │       ├── YouTubeEmbed.tsx
│   │   │       ├── InstagramEmbed.tsx
│   │   │       ├── FacebookEmbed.tsx
│   │   │       └── ThreadsEmbed.tsx
│   │   ├── courseCode.ts        ← generator + 驗證
│   │   ├── reportTemplate.ts    ← hardcoded template markdown
│   │   ├── slug.ts
│   │   └── types.ts             ← shared TypeScript types
│   │
│   ├── middleware.ts            ← session cookie refresh + staging-mode auth redirect
│   └── instrumentation.ts       ← Sentry init
│
└── tests/
    ├── unit/                    ← Vitest
    └── e2e/                     ← Playwright
```

---

## 22. Implementation Phases & Todo List

> 切片原則：vertical slice — 每個 phase 結束都有「可看 / 可手測」的東西。

### Phase 0 — Project Bootstrapping（~半天）

- [ ] `pnpm create next-app` (TypeScript, App Router, Tailwind, ESLint)
- [ ] 加 `prettier`, `eslint-config-prettier`, `eslint-plugin-react-hooks`, `husky` + `lint-staged`
- [ ] 建 `.env.example` 列出所有 env var
- [ ] 建 `Dockerfile`（Next.js standalone build, multi-stage）
- [ ] 設 `tsconfig.json` strict mode、path alias `@/*` → `src/*`
- [ ] commit + push 到 GitHub

**Verify**：`pnpm dev` 啟得起來，預設首頁 OK。

### Phase 1 — Firebase + GCP Setup（~半天，手動為主）

- [ ] 建 GCP project + enable APIs
- [ ] 建 Firebase project（綁同一 GCP project）
- [ ] 啟用 Firebase Auth Google provider
- [ ] 啟用 Firestore (Native mode, asia-east1)
- [ ] 啟用 Cloud Storage (asia-east1)
- [ ] 建 Artifact Registry repo
- [ ] 把 Firebase config 寫進 `.env.local`
- [ ] 設 `lib/firebase/client.ts` + `lib/firebase/admin.ts`

**Verify**：`pnpm dev` → 載入頁面後 console 看得到 Firebase initialized。

### Phase 2 — Auth & Onboarding（垂直切片 1：login → user doc → enroll → template report）

- [ ] `/login` 頁面 + Google sign-in button
- [ ] `/api/auth/session` route handler（verify ID token, set HttpOnly cookie, ensure user doc, compute role）
- [ ] `middleware.ts`：refresh session, redirect unauthed away from /workspace + /admin
- [ ] `/workspace/onboarding`：表單（課程代碼 + profile display name）
- [ ] `enrollWithCode` server action（檢 code → 建 enrollment + report from template）
- [ ] `reportTemplate.ts`（hardcoded）
- [ ] `logout` action

**Verify (E2E)**：用 Google 帳號登入 → 輸入測試課程代碼（手動先在 Firestore console 建一個）→ 看到 `/workspace` 列出已加入的課程。

### Phase 3 — Editor + Sidebar + Autosave（垂直切片 2）

- [ ] `/workspace/c/[courseId]` 頁面
- [ ] `<MarkdownRenderer>` 完整版（GFM, code highlight, KaTeX, footnotes, embeds 都接好）
- [ ] `<remarkEmbed>` plugin 寫完 + 4 個 embed component
- [ ] `@uiw/react-md-editor` dynamic import + preview slot 替換為 `<MarkdownRenderer>`
- [ ] Metadata panel（title/author/summary/coverImage）
- [ ] `/api/uploads/sign` route handler
- [ ] FilesSidebar：list/upload/delete/insert
- [ ] Image paste & drag-drop handler
- [ ] `saveReportDraft` server action + 30s debounce + localStorage 鏡像
- [ ] SaveStatusIndicator

**Verify**：手動 — 進編輯器，寫 markdown、貼 YouTube URL、拖一張圖、改 title、等 30 秒、refresh 看資料還在。

### Phase 4 — Public Pages（垂直切片 3）

- [ ] `/` + `/c/[courseSlug]` 頁面（CourseTabs + ReportList）
- [ ] `/c/[courseSlug]/r/[reportSlug]` 閱讀頁
- [ ] SEO `<meta>` + sitemap + robots.txt
- [ ] HTTP cache headers
- [ ] 暫時用 Firebase console 手動 set `report.publishedAt` 來測試「已發布」狀態

**Verify**：訪客（無痕視窗）能看到首頁、切 tab、進報告。

### Phase 5 — Admin & Publish（垂直切片 4）

- [ ] `/admin` 列課程
- [ ] `createCourse` + `/admin/courses/new`
- [ ] `/admin/courses/[id]` 列學生報告 + status tag
- [ ] `/admin/courses/[id]/r/[rid]`：Latest / Diff / History tabs
- [ ] `react-diff-viewer-continued` 整合
- [ ] `publishReport` / `unpublishReport` server actions
- [ ] `toggleEnrollment` / `regenerateCourseCode`

**Verify**：完整流程 — 老師建課 → 拿 code → 用另一個 Google 帳號學生登入加入 → 寫報告 → 老師發布 → 訪客在 / 看到。

### Phase 6 — Staging Mode（垂直切片 5）

- [ ] `lib/env.ts` 的 `APP_MODE` 邏輯
- [ ] Staging middleware（強制登入）
- [ ] Staging banner（黃條）
- [ ] Staging 版 `/` 抓所有 draft（跨課程）
- [ ] Staging 版 `/c/.../r/...` 抓 latest draft
- [ ] `robots.txt` 條件式

**Verify**：本地用 `APP_MODE=staging pnpm dev`，驗行為。

### Phase 7 — Privacy / TOS / Settings（垂直切片 6）

- [ ] `/privacy` + `/tos` 靜態頁（內容 placeholder）
- [ ] `/workspace/settings`：profile display name 修改
- [ ] Footer with links

**Verify**：手動瀏覽 5 個 route 都顯示正確。

### Phase 8 — CI/CD（垂直切片 7）

- [ ] `.github/workflows/ci.yml`（lint + typecheck + unit）
- [ ] `cloudbuild.yaml` for PR preview deploy
- [ ] `cloudbuild.yaml` for main → prod + staging deploy
- [ ] 設 Cloud Build GitHub trigger
- [ ] 設 branch protection on `main`
- [ ] 跑一個 PR 走完全流程

**Verify**：開 PR → 看到 preview URL → merge → prod 自動更新。

### Phase 9 — Monitoring & Backup（垂直切片 8）

- [ ] `@sentry/nextjs` 整合 + source map upload
- [ ] Cloud Logging structured logs in server actions
- [ ] Cloud Monitoring alert（5xx, p95 latency）
- [ ] Cloud Scheduler + 寫 Firestore export job
- [ ] GCS backup bucket + lifecycle rule

**Verify**：手動 throw 一個 error → Sentry 看到；手動 trigger backup job → GCS 看到檔案。

### Phase 10 — Testing Hardening（垂直切片 9）

- [ ] Vitest unit tests（最重要：courseCode, remarkEmbed, auth helpers, report.contentMd 邏輯）
- [ ] Firestore Rules unit tests
- [ ] Playwright E2E：auth / editor / publish / staging
- [ ] CI 跑全部測試

**Verify**：CI green、coverage > 60% on critical paths。

### Phase 11 — Polish & Pre-launch

- [ ] 真實 OG image + favicon
- [ ] 全站 a11y 檢查（keyboard nav, color contrast, alt text）
- [ ] Loading skeletons
- [ ] Error boundaries (`error.tsx`, `not-found.tsx`)
- [ ] Mobile RWD 檢查（最低 375px）
- [ ] 樣式統一（這階段你會接 Claude Design）
- [ ] Pre-launch checklist：DNS、env vars、Sentry projects、backup job 都 ready

**Verify**：拿 iPhone / Android / Desktop 都過一遍。

---

## 23. Open Items / Followups (post-MVP)

| Item                       | 描述                                |
| -------------------------- | ----------------------------------- |
| Custom domain              | 之後接 `reports.your-domain`        |
| Notification               | 加 Firebase Trigger Email 或 in-app |
| TA (助教) role             | 第三種角色                          |
| Multi-template             | per-course template                 |
| Search                     | Algolia 或 client-side Fuse.js      |
| Full version history       | 中間自動 snapshots                  |
| Mermaid embed              | 加 mermaid renderer                 |
| Public RSS feed            | 已發布報告 RSS                      |
| Cookie consent / analytics | 之後加 Plausible                    |

---

## 24. Verification (end-to-end after implementation)

完整一輪測試 checklist（implementation 完後手動跑）：

1. **訪客**：無痕視窗開 prod URL → 看到首頁 tab → 切課程 → 點報告 → 閱讀
2. **第一次學生**：用第二個 Google 帳號 → `/login` → 走 onboarding → workspace
3. **學生寫報告**：編輯 markdown、貼 YouTube URL、拖圖、改 metadata、等 autosave、refresh 驗 persistence
4. **老師建課**：用 admin Google 帳號 → 建課 → 拿 code → 給學生
5. **老師審核**：看 draft → 看 diff → 發布
6. **訪客驗發布**：再開無痕 → 看到剛發布的報告
7. **Staging**：開 staging URL（強制登入）→ 看到所有 drafts（含未發布）
8. **下架**：老師 unpublish → 訪客頁不見、staging 仍見
9. **資料異常測試**：故意亂打課程代碼、上傳 PDF（應被拒）、上傳 15MB 圖（應被拒）、刪除自己的圖
10. **CI/CD**：開個小 PR → 看到 preview URL 自動部署 + 測試通過
11. **監控**：故意 throw 一個 error → 過 5 分鐘看 Sentry / Cloud Logging 有沒有
12. **備份**：手動觸發 Firestore export → GCS bucket 看得到檔案

---

## 25. Critical Files to Create (Reference for Implementation)

| 檔案                              | 重點內容                                              |
| --------------------------------- | ----------------------------------------------------- |
| `src/lib/env.ts`                  | APP_MODE / ADMIN_EMAILS / Firebase config 集中管理    |
| `src/lib/firebase/admin.ts`       | Firebase Admin SDK 初始化（singleton）                |
| `src/lib/server/auth.ts`          | `getCurrentUser`, `requireAdmin`, session cookie 驗證 |
| `src/lib/markdown/Renderer.tsx`   | 唯一的 markdown 渲染元件，**改這裡 = 全站變**         |
| `src/lib/markdown/remarkEmbed.ts` | URL → embed AST 轉換                                  |
| `src/lib/courseCode.ts`           | 6 碼產生器 + 衝突重試                                 |
| `src/lib/reportTemplate.ts`       | 預設 template markdown                                |
| `src/middleware.ts`               | session refresh + staging redirect + APP_MODE 判斷    |
| `firestore.rules`                 | §4.4 的規則                                           |
| `storage.rules`                   | path-based ownership + image content-type 限制        |
| `Dockerfile`                      | Next.js standalone build                              |
| `cloudbuild.yaml`                 | PR preview + main deploy                              |
| `.github/workflows/ci.yml`        | lint + typecheck + test                               |

---

**End of spec.**

實作將依 `tasks/todo.md` 之 Phase 0 → 11 順序進行。每個 Phase 結束都有可驗證的 deliverable。
