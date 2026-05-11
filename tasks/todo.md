# Implementation Todo — 課程報告網站

> **指南**：對應 `tasks/plan.md` §22 的 Phase 0–11；每個 Phase 是一條垂直切片，結束都有可驗證的 deliverable。
> **法則**：把當前 Phase 走完 + 跑過 Verify 才動下一個 Phase；不要橫向多 Phase 並行。
>
> **策略**：Design-first — 從 Phase 0 起每個 component / page 直接套用 `tasks/design.md` 對應段落的 Tailwind classes + JSX scaffold；**不**先蓋 placeholder UI。每個 Phase 的 task 都會帶 `→ design.md §X.X` 引用。
>
> 進度狀態：`[ ]` 未開始、`[~]` 進行中、`[x]` 完成。

---

## ☐ Checkpoint 0 — Pre-flight

實作開工前，先 ack：

- [ ] 已在 GCP 申請好 billing 帳號（Cloud Run / Firestore 都需要）
- [ ] 已有 admin Google account 並記下 email（之後填入 `ADMIN_EMAILS`）
- [ ] 已有第二個測試 Google account（模擬學生用）
- [ ] 已決定 GCP project ID（建議：`ntu-soci-papers`）

---

## Phase 0 — Project Bootstrapping + Design Foundation

**Goal**：本地能跑 `pnpm dev` 開出帶 Forest accent / Noto Serif TC 的 hello world 頁；container build 成功。

> Design-first：本 Phase 結束時，`globals.css` + `tailwind.config.ts` 已套上 design.md 的 token，shadcn 已 init，字體 next/font 載入。後續 Phase 蓋 component 時直接吃這些 token。

### Step A — Scaffold

- [ ] 在 repo 根目錄跑 `pnpm create next-app@latest .`（TypeScript / App Router / Tailwind / ESLint / `src/` dir / import alias `@/*`）
- [ ] `pnpm add -D prettier eslint-config-prettier eslint-plugin-react-hooks husky lint-staged`
- [ ] 設 `.prettierrc`（單引號、有分號）+ ESLint extends `next/core-web-vitals` + `prettier`
- [ ] husky + lint-staged：commit 前跑 `eslint --fix` + `prettier --write`
- [ ] `tsconfig.json` strict + `noUncheckedIndexedAccess: true`
- [ ] `next.config.mjs`：`output: 'standalone'` + image remote pattern 允許 `firebasestorage.googleapis.com`

### Step B — Design Foundation（→ design.md §1, §6.1–6.4）

- [ ] 用 next/font 載入 Inter / Noto Sans TC / Noto Serif TC / JetBrains Mono（design.md §1.3）
- [ ] `src/app/globals.css` 完整替換為 design.md §6.4 的版本（含 `:root` HSL tokens、`@layer base`）
- [ ] `tailwind.config.ts` 套用 design.md §1.1 + §6.3 的 colors / radii extension
- [ ] 安裝 `tailwindcss-animate` + `@tailwindcss/typography`
- [ ] `npx shadcn@latest init` — 採用我們的 token 而非 default
- [ ] 依 design.md §6.1 跑 `npx shadcn add button input textarea card select checkbox radio-group switch dialog tooltip popover tabs toast badge avatar skeleton separator`
- [ ] sonner 套件安裝（toast）

### Step C — Boilerplate files

- [ ] `.env.example` — 列 `APP_MODE`、`NEXT_PUBLIC_FIREBASE_*`、`FIREBASE_ADMIN_PRIVATE_KEY_JSON`、`ADMIN_EMAILS`、`SENTRY_DSN`、`BACKUP_BUCKET`
- [ ] `Dockerfile` — multi-stage Node 22 alpine + Next.js standalone
- [ ] `.dockerignore`
- [ ] 建空殼 `firestore.rules`、`storage.rules`、`firestore.indexes.json`、`firebase.json`
- [ ] `src/app/page.tsx` 寫一個 hello-world，展示 Forest accent button + Noto Serif TC heading（用 design.md §1.3 的 Display style）

### Step D — Verify + commit

- [ ] `pnpm lint` 0 errors
- [ ] `pnpm typecheck`（即 `tsc --noEmit`）0 errors
- [ ] `pnpm dev` → 開 localhost:3000，看到 Forest 配色的 hello-world
- [ ] commit + push 到 GitHub repo

**✅ Verify**

- 本地頁面看得到：背景是 `#faf9f5` (paper)、accent 按鈕是 `#3a5a3a` (forest)、heading 是 Noto Serif TC
- Docker build 之後再做（Docker Desktop WSL 整合需開）

---

## Phase 1 — Firebase + GCP Setup

**Goal**：本地能連到真實 Firebase project，client/admin SDK 都 init 成功。

> 本 Phase 雙軌進行 — **你** 處理 GCP/Firebase console 設定（不能由我代勞），**我** 寫 SDK init code（可在 console 設好前就先寫完，等你填 `.env.local` 就能跑）。

### Code-side（由 Claude Code 處理）

- [ ] 寫 `src/lib/env.ts`：zod schema 驗證所有 env var、export typed `env` object
- [ ] 寫 `src/lib/firebase/client.ts`：Web SDK singleton（initializeApp / getAuth / getFirestore）
- [ ] 寫 `src/lib/firebase/admin.ts`：Admin SDK singleton（base64 decode service account；防 re-init）

### Console-side（由你處理）

- [ ] `gcloud projects create ntu-soci-papers --name="NTU Sociology Papers"`
- [ ] Link Firebase: console.firebase.google.com → Add project → 選現有 GCP project
- [ ] `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com firebasestorage.googleapis.com identitytoolkit.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com`
- [ ] Firebase Console → Authentication → Sign-in method → enable Google
- [ ] Firebase Console → Firestore → Create database（Native mode、asia-east1）
- [ ] Firebase Console → Storage → Get started（asia-east1）
- [ ] `gcloud artifacts repositories create course-papers --location=asia-east1 --repository-format=docker`
- [ ] Firebase Console → Project Settings → 加 web app → 把 config 抄到 `.env.local`
- [ ] 下載 service account JSON → `base64 -w0 < service-account.json` 存 `FIREBASE_ADMIN_PRIVATE_KEY_JSON`

**✅ Verify**

- `pnpm dev` 後 server console log 沒有 Firebase init error
- 在 `src/app/page.tsx` 暫加 `await adminDb.collection('courses').limit(1).get()` 不 throw
- Browser console 看得到 `firebase initialized`（暫加 log）

---

## Phase 2 — Auth & Onboarding（垂直切片 1）

**Goal**：用 Google 帳號登入 → 第一次走完 onboarding → 看到自己加入的課程。

> Design references：login = `design.md §3.4 (L2 Editorial Split)` · onboarding = `§3.5 (2-step wizard)` · workspace 列表 = `§3.6` · admin 列表 = `§3.7`

- [ ] 寫 `src/app/(public)/login/page.tsx`：Google sign-in button、未登入版面
- [ ] 寫 `src/components/LoginButton.tsx`：呼叫 `signInWithPopup`、拿 ID token、POST 到 `/api/auth/session`
- [ ] 寫 `src/app/api/auth/session/route.ts`：
  - [ ] POST：verify ID token、檢查 ADMIN_EMAILS、`setCustomUserClaims({isAdmin})`、`createSessionCookie`、`ensureUserDoc` upsert
  - [ ] DELETE：clear cookie
- [ ] 寫 `src/lib/server/auth.ts`：`getCurrentUser`、`requireAdmin`、`requireStudent`
- [ ] 寫 `src/middleware.ts`：
  - [ ] 從 cookie 拿 session
  - [ ] 過期前 < 1 天時 re-mint
  - [ ] `/workspace`、`/admin` 路徑未登入 → redirect `/login?from=...`
  - [ ] `APP_MODE=staging` 時所有路徑強制登入
- [ ] 寫 `src/lib/courseCode.ts`：6 碼產生器（排除 0/O/1/I/L）+ `validateCode` + `findCourseByCode`
- [ ] 寫 `src/lib/reportTemplate.ts`：hardcoded 預設 markdown
- [ ] 寫 `src/actions/enrollment.ts` 的 `enrollWithCode(code)`：
  - [ ] 找 course by code，檢查 `enrollmentOpen`
  - [ ] 若已 enrolled 則 idempotent return
  - [ ] 建 `enrollments/{courseId}_{uid}` + `reports/{courseId}_{uid}`（用 template、profileDisplayName 當 author）
- [ ] 寫 `src/actions/profile.ts` 的 `setProfileName(name)`：更新 `users/{uid}.profileDisplayName`
- [ ] 寫 `src/app/workspace/onboarding/page.tsx`：form（profile name + course code）
- [ ] 寫 `src/app/workspace/page.tsx`：列出我的課程卡片
- [ ] 寫 `src/app/workspace/layout.tsx`：sidebar nav + logout button
- [ ] 寫 `src/app/admin/page.tsx`：列出老師建立的課程（先空白也 OK，下一階段填）
- [ ] Login flow 完成後依 role redirect：admin→/admin、student→/workspace（若 onboarding 未完成→/workspace/onboarding）

**✅ Verify (Manual E2E)**

- 在 Firebase console 手動建一筆 course doc（code: `TEST01`、enrollmentOpen: true、ownerUid: 任意）
- 用學生 Google 帳號訪 `/login` → 登入 → 自動進 onboarding
- 輸 `TEST01` + display name "測試學生" → 進 `/workspace`
- 看到剛加入的課
- 用 admin Google 帳號訪 `/login` → 自動進 `/admin`
- Logout → cookie 被清

---

## Phase 3 — Editor + Sidebar + Autosave（垂直切片 2）

**Goal**：學生能在編輯頁寫 markdown、看 preview、上傳圖、autosave 30 秒。

> Design references：editor = `design.md §3.3 (E3 Focus Mode)` · SaveStatusIndicator = `§2.2 + §4.1` · FileUploadButton = `§2.2` · prose-research = `§4.4`

- [ ] `pnpm add @uiw/react-md-editor react-markdown remark-gfm remark-math remark-breaks rehype-katex rehype-sanitize @shikijs/rehype react-social-media-embed browser-image-compression`
- [ ] 寫 `src/lib/markdown/Renderer.tsx`（單一渲染元件，§8.1 spec）
- [ ] 寫 `src/lib/markdown/remarkEmbed.ts`：偵測單行 URL → 4 種 embed AST node
- [ ] 寫 `src/lib/markdown/embedSchema.ts`：rehype-sanitize 白名單 schema
- [ ] 寫 `src/lib/markdown/embeds/YouTubeEmbed.tsx`（youtube-nocookie iframe）
- [ ] 寫 `src/lib/markdown/embeds/InstagramEmbed.tsx`（react-social-media-embed wrapper）
- [ ] 寫 `src/lib/markdown/embeds/FacebookEmbed.tsx`（同上）
- [ ] 寫 `src/lib/markdown/embeds/ThreadsEmbed.tsx`（dynamic import Threads embed script）
- [ ] 寫 unit test：remarkEmbed 對 4 種 URL pattern 都能轉成正確 AST
- [ ] 寫 `src/components/editor/ReportEditor.tsx`：
  - [ ] `dynamic(() => import('@uiw/react-md-editor'), { ssr: false })`
  - [ ] 用 `components.preview = (src) => <MarkdownRenderer content={src} />` 覆蓋 preview slot
- [ ] 寫 `src/components/editor/MetadataPanel.tsx`：title / author / summary / coverImage 表單
- [ ] 寫 `src/components/editor/SaveStatusIndicator.tsx`：`Saving / Saved {n}s ago / Offline`
- [ ] 寫 `src/app/api/uploads/sign/route.ts`：拿 reportId + filename + size，回 signed upload URL
- [ ] 寫 `src/lib/server/storage.ts`：generate signed URL（Admin SDK）
- [ ] 寫 `src/components/editor/FilesSidebar.tsx`：
  - [ ] 列出 `reports/{rid}/uploads` 集合的圖
  - [ ] 上傳按鈕（觸發 image compression → /api/uploads/sign → PUT to Firebase Storage → 寫 Firestore doc）
  - [ ] 每個 file row：Insert / Delete 按鈕
- [ ] 寫 drag-drop handler + paste handler（同樣走上傳流程）
- [ ] 寫 `src/actions/report.ts` 的 `saveReportDraft(reportId, patch)`：驗 owner → patch + set `hasNewChanges`
- [ ] 寫 `src/actions/report.ts` 的 `deleteUpload(reportId, uploadId)`：刪 Storage object + Firestore doc
- [ ] 寫 `src/app/workspace/c/[courseId]/page.tsx`：
  - [ ] Server component 抓 report、verify owner
  - [ ] 把 report 傳給 client `<ReportEditor>`
  - [ ] Client 內：30 秒 debounce + Ctrl+S 立即 save + localStorage 鏡像 + recovery prompt

**✅ Verify**

- 編輯器頁面正常開
- 寫 markdown，preview 即時更新（含 GFM、code highlight、KaTeX、footnote）
- 貼 YouTube URL 在獨立一行 → 看到 iframe embed
- 貼 IG / FB / Threads URL → 各看到對應 embed
- 拖一張圖進編輯區 → 自動上傳 + 插入 markdown ref
- Ctrl+V 貼上 clipboard 圖 → 同上
- Sidebar 看到剛上傳的圖 → 點 Insert 插入 cursor → 點 Delete 移除
- 改 title → 等 30 秒 → refresh → 改動還在
- `pnpm test` 包括 remarkEmbed 測試都通過

---

## Phase 4 — Public Pages（垂直切片 3）

**Goal**：訪客（無痕視窗）能看到首頁、切課程 tab、進報告閱讀頁。

> Design references：homepage = `design.md §3.1 (D1 Editorial Index)` · 報告閱讀 = `§3.2 (R1 Classical)` · ReportListItem = `§2.2` · prose-research = `§4.4`

- [ ] 寫 `src/lib/slug.ts`：`courseSlug` / `reportSlug` 函式
- [ ] 寫 `src/lib/server/firestore.ts`：query helpers
  - [ ] `getPublishedReportsByCourse(courseId)`
  - [ ] `getAllCourses()`
  - [ ] `getLatestSnapshot(reportId)`
- [ ] 寫 `src/app/(public)/page.tsx`：
  - [ ] Server-render：抓所有 courses（已有發布報告者）
  - [ ] 預設選最新 course；`?course={id}` 切換
- [ ] 寫 `src/components/public/CourseTabs.tsx`（client component，淺 URL 切換）
- [ ] 寫 `src/components/public/ReportListItem.tsx`：縮圖 + 標題 + 作者 + 摘要 + 發布日
- [ ] 寫 `src/app/(public)/c/[courseSlug]/page.tsx`：等價於 `/?course={id}`，URL 友善版
- [ ] 寫 `src/app/(public)/c/[courseSlug]/r/[reportSlug]/page.tsx`：
  - [ ] 抓 latest publish snapshot
  - [ ] 用 `<MarkdownRenderer>` 渲染
  - [ ] 動態 `<meta>` for SEO（title、description=summary、og:image）
- [ ] 寫 `src/app/robots.ts`：條件式（prod allow、staging disallow）
- [ ] 寫 `src/app/sitemap.ts`：動態列出所有已發布報告 URL
- [ ] 在每個 public page 加 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- [ ] 暫時用 Firebase console 手動 set `report.publishedAt` + 建 `publishSnapshots/{n}` doc 來驗

**✅ Verify**

- 無痕視窗開 `/` → 看到 tab + 報告列表
- 點 tab 切換 → 內容變
- 點報告 → 進閱讀頁，渲染正常（含 embed）
- View page source → `<meta name="description">` 內容是 summary
- `/robots.txt`、`/sitemap.xml` 都正確
- 重複 reload 同一個 URL → 第二次 < 100ms（cache hit）

---

## Phase 5 — Admin & Publish（垂直切片 4）

**Goal**：完整 end-to-end — 老師建課 → 學生加入寫報告 → 老師發布 → 訪客看到。

> Design references：admin 課程頁 = `design.md §3.8` · 報告審核 = `§3.9` · ReportRow = `§2.2` · StatusTag = `§2.2 + §4.2` · CourseCodeDisplay = `§2.2` · ConfirmDialog（destructive variant for unpublish）= `§4.8`

- [ ] `pnpm add react-diff-viewer-continued`
- [ ] 寫 `src/actions/course.ts`：
  - [ ] `createCourse(input)` — 含 code 衝突重試（最多 5 次）
  - [ ] `updateCourse(courseId, patch)`
  - [ ] `toggleEnrollment(courseId, open)`
  - [ ] `regenerateCourseCode(courseId)`
- [ ] 寫 `src/actions/publish.ts`：
  - [ ] `publishReport(reportId)`：transaction 內把 latest draft snapshot 到 subcollection + set publishedAt + hasNewChanges=false
  - [ ] `unpublishReport(reportId)`：set publishedAt=null（snapshots 保留）
- [ ] 寫 `src/app/admin/courses/new/page.tsx`：表單（name / year / semester / description / cover image）
- [ ] 寫 `src/app/admin/page.tsx`：課程卡片列表
- [ ] 寫 `src/components/admin/CourseCard.tsx`
- [ ] 寫 `src/app/admin/courses/[courseId]/page.tsx`：學生報告列表 + status tags + course settings panel
- [ ] 寫 `src/components/admin/ReportRow.tsx`：status tag 邏輯（Unpublished / Published / Published+New）
- [ ] 寫 `src/app/admin/courses/[courseId]/r/[reportId]/page.tsx`：Latest / Diff / History tabs
- [ ] 寫 `src/components/admin/DiffViewer.tsx`：`react-diff-viewer-continued` 包裝 + sub-tab 切換 source vs rendered preview
- [ ] 寫 `src/components/admin/PublishControls.tsx`：Publish / Unpublish 按鈕（含 confirmation）
- [ ] 補 unit test：`courseCode.ts`（產生器邏輯、衝突字元排除）、`publishReport` action（mock Firestore，驗 transaction shape）

**✅ Verify (End-to-end manual)**

- 用 admin 帳號建一堂課 → 拿到 code
- 用學生帳號登入 → 用 code 加入 → 寫一段內容並儲存
- admin 進該課的學生報告列表 → 看到 tag `Unpublished`
- 點報告 → 看 Latest → 按 Publish
- 訪客（無痕）開 `/` → 看到該報告
- 學生改內容 → admin 看到 tag 變 `Published + New Changes`
- 點 Diff tab → 看到差異
- 按 Publish → tag 變 `Published`
- admin Unpublish → 訪客頁看不到、staging 仍能看
- 關閉註冊 → 用第三個 Google 帳號試加入該 code → 被拒
- Regenerate code → 舊 code 立刻失效

---

## Phase 6 — Staging Mode（垂直切片 5）

**Goal**：`APP_MODE=staging` 時整站行為切換到 staging 模式。

> Design references：StagingBanner = `design.md §2.2 + §4.3`（sticky top、info color、明確文案）

- [ ] 補 `src/lib/env.ts`：`APP_MODE` / `isStaging` / `isProduction`
- [ ] 改 `src/middleware.ts`：staging 模式下任何路徑未登入都 redirect `/login`
- [ ] 寫 `src/components/StagingBanner.tsx`：黃條，固定頂端
- [ ] 改 `src/app/layout.tsx`：staging 模式下 mount `<StagingBanner>`
- [ ] 改 `src/app/(public)/page.tsx`：staging 模式抓所有 reports（不論發布），跨課程 mix
- [ ] 改 `src/app/(public)/c/[courseSlug]/r/[reportSlug]/page.tsx`：staging 模式抓 latest draft 而非 snapshot
- [ ] 改 `src/app/robots.ts`：staging 模式 disallow all
- [ ] Sentry init：staging 模式設 environment = `staging`

**✅ Verify**

- 本地：`APP_MODE=staging pnpm dev` → 開 `/` 強制跳 `/login`
- 登入後 → 看到黃條 banner + 所有同學的草稿（即使從未發布）
- `/robots.txt` 是 disallow all
- 切回 `APP_MODE=production pnpm dev` → 行為恢復 prod

---

## Phase 7 — Privacy / TOS / Settings（垂直切片 6）

**Goal**：補齊 housekeeping 頁面。

> Design references：privacy/tos = `design.md §3.11` · settings = `§3.10`

- [ ] 寫 `src/app/(public)/privacy/page.tsx`（placeholder 內容；之後填）
- [ ] 寫 `src/app/(public)/tos/page.tsx`（同上）
- [ ] 寫 `src/app/workspace/settings/page.tsx`：修改 profileDisplayName 表單
- [ ] 寫 `src/components/Footer.tsx`：links to /privacy /tos
- [ ] 把 Footer mount 到 public layout 與 workspace layout

**✅ Verify**

- 5 個 route（/privacy、/tos、/workspace/settings、footer link from / & /workspace）都能正確開
- 改 profile name → 之後新建報告的 author 預設為新名（既有報告不受影響）

---

## ☐ Checkpoint 1 — Local feature freeze

實作流程：

- [ ] 上述 Phase 0–7 都在本地可以 end-to-end 跑過一遍
- [ ] 整個 `pnpm dev` 跑無未捕獲 error
- [ ] `pnpm lint` + `pnpm typecheck` 0 issue
- [ ] 找一個朋友（或自己用第二個瀏覽器 profile）跑過 verification checklist

→ 通過後才動 CI/CD。

---

## Phase 8 — CI/CD

**Goal**：開 PR 自動拿 preview URL；merge 自動更新 prod + staging。

- [ ] 寫 `.github/workflows/ci.yml`：lint / typecheck / vitest / playwright（用 Firebase emulator）
- [ ] 設定 GitHub repo branch protection on `main`：require status checks + 1 review
- [ ] 寫 `cloudbuild.yaml`：steps for build / push / deploy
- [ ] GCP Console → Cloud Build → Triggers：
  - [ ] PR trigger：deploy `course-preview` service with tag `pr-${PR_NUMBER}`
  - [ ] Main trigger：deploy `course-prod` + `course-staging` services
- [ ] 設 Workload Identity Federation（不要用 service account JSON 存 GH secrets）
- [ ] 在 GCP Secret Manager 存：`FIREBASE_ADMIN_PRIVATE_KEY_JSON`、`SENTRY_DSN`
- [ ] Cloud Build 用 `--update-secrets` 注入到 Cloud Run env
- [ ] 設 Cloud Run service：
  - [ ] `course-prod`：min=1, max=10, APP_MODE=production
  - [ ] `course-staging`：min=0, max=5, APP_MODE=staging
  - [ ] `course-preview`：min=0, max=3, APP_MODE=staging（IAM 限白名單 email）
- [ ] 跑一個 dummy PR 走過全流程

**✅ Verify**

- 開 PR → GH Actions 跑 lint/test all green
- Cloud Build trigger 跑完 → PR 上有 comment 含 preview URL
- 點 preview URL → 看到改動（IAM 擋外人）
- Merge → main → prod 在幾分鐘內更新

---

## Phase 9 — Monitoring & Backup

**Goal**：錯誤被收集、每日資料庫備份運作中。

- [ ] `pnpm add @sentry/nextjs`
- [ ] 跑 `npx @sentry/wizard@latest -i nextjs`
- [ ] 在 `cloudbuild.yaml` 加 source map upload step
- [ ] 寫 `src/instrumentation.ts`：Sentry init（環境分流：prod / staging / preview）
- [ ] 在 Cloud Monitoring 設 alert policy：
  - [ ] Cloud Run 5xx rate > 1% for 5 min → email
  - [ ] Cloud Run p95 latency > 3s for 5 min → email
- [ ] 寫 Firestore export script（Cloud Run job 或 Cloud Function）
- [ ] Cloud Scheduler job：每日 03:00 (Asia/Taipei) 觸發
- [ ] 建 GCS bucket `${PROJECT_ID}-firestore-backups`，設 lifecycle rule 30 天 → delete
- [ ] 寫 `src/app/api/healthz/route.ts`：return `{ ok: true, version: process.env.K_REVISION }`

**✅ Verify**

- 在 prod 故意 throw 一個 server error → Sentry 看到，含 source map
- 手動 trigger Cloud Scheduler job → 看 GCS bucket 出現新檔案
- `curl prod-url/api/healthz` → 200 with body

---

## Phase 10 — Testing Hardening

**Goal**：CI 上 unit + E2E 全綠，critical path coverage > 60%。

- [ ] `pnpm add -D vitest @vitest/coverage-v8 @firebase/rules-unit-testing playwright @playwright/test`
- [ ] 寫 Vitest 設定 + script
- [ ] 寫 unit tests:
  - [ ] `lib/courseCode.test.ts`
  - [ ] `lib/markdown/remarkEmbed.test.ts`
  - [ ] `lib/server/auth.test.ts`（mock Admin SDK）
  - [ ] `actions/enrollment.test.ts`、`actions/report.test.ts`、`actions/publish.test.ts`
  - [ ] `firestore.rules.test.ts`（用 emulator）
- [ ] 寫 Playwright 設定 + script
- [ ] 寫 E2E tests（跑在 Firebase emulator 上）:
  - [ ] `tests/e2e/auth.spec.ts`：first-time onboarding
  - [ ] `tests/e2e/editor.spec.ts`：寫 + autosave + 圖片
  - [ ] `tests/e2e/publish.spec.ts`：學生→老師→公開頁
  - [ ] `tests/e2e/staging.spec.ts`：staging 強制登入 + cross-course drafts
- [ ] 把測試加進 `.github/workflows/ci.yml`
- [ ] coverage 上傳 artifact（不需要外部服務）

**✅ Verify**

- 本地 `pnpm test` + `pnpm test:e2e` 全綠
- CI 上 PR 跑測試全綠
- Coverage report 顯示 critical files > 60%

---

## Phase 11 — Structural Polish (pre-design)

**Goal**：把 Claude Design 還沒進來前該處理的「結構性」polish 做完，避免設計進來後還在處理基礎 affordances。

> ⚠️ **此 Phase 不處理整體 visual design**（顏色、字體、版型）— 那是 Phase 11.5。
> 此 Phase 只做：結構、a11y 骨架、錯誤頁面、breakpoint 響應行為。

- [ ] 寫 `src/app/error.tsx`、`src/app/not-found.tsx`（結構性錯誤頁）
- [ ] Mobile RWD 結構性確認：每頁在 375px viewport 不橫向 scroll、所有功能 reachable（**樣式不要求漂亮**，那是 Phase 11.5 的工作）
- [ ] 全站 a11y 結構檢查：keyboard navigation 順序、所有 form 有 label、所有 button 有 accessible name、所有 image 有 alt（**focus ring / 對比度的視覺**留給 Phase 11.5）
- [ ] Favicon placeholder（先用一個 16x16 純色方塊；真實 favicon 由 Claude Design 提供）
- [ ] OG image placeholder（同上，純文字 + 純色背景）
- [ ] Loading state hooks：在每個 server component 旁建立 `loading.tsx` 檔（內容先空白或骨架文字；真正 skeleton 樣式 Phase 11.5 補）
- [ ] 把 `/privacy` + `/tos` 內容由 placeholder 換成正式文字（**這跟設計無關**，所以現在做）
- [ ] 第二個 admin email？（如需要就加進 `ADMIN_EMAILS`）

**✅ Verify**

- 進每頁在 375px 都不爆版
- 鍵盤 tab 順序合理（即使視覺尚未統一）
- 故意打不存在的 URL → not-found.tsx 顯示
- 故意 throw 一個 error → error.tsx 顯示

---

## Phase 11.5 — Design Audit & Final Pass

**Goal**：因為 Strategy B 把 design 鋪在每個 Phase，這裡只做最後 audit 確保視覺一致 + 補真實 assets。

> 若 Phase 0–7 每個 page 都按 design.md 對應段落實作，這 Phase 是 **半天工作**。

### A — Visual consistency audit

- [ ] 11 個 routes 逐一對照 design.md §3 spot-check（兩兩比對截圖差異）
- [ ] 9 個 custom components 逐一檢查實作與 design.md §2.2 一致
- [ ] `<MarkdownRenderer>` 用 test fixture（含 headings / blockquote / code / table / footnote / KaTeX / 4 種 embed）逐項驗證 prose-research 樣式對齊 design.md §4.4

### B — Real assets

- [ ] 真實 favicon（若 Claude Design 沒給，我自己用 Forest accent + 字母 logo 出）
- [ ] 真實 OG image（1200x630）
- [ ] empty state / 404 illustration（若 design.md 沒給就維持文字版）

### C — Final a11y / RWD pass

- [ ] axe DevTools 全站掃 — 0 critical / serious issue
- [ ] 375px / 768px / 1280px / 1920px 每個 page 各看一次
- [ ] Lighthouse Accessibility ≥ 95、Performance > 80、SEO > 90
- [ ] 鍵盤從 `/` 走過 login → workspace → editor → publish flow 不卡住

**✅ Verify**

- design.md §3 對 11 個 routes 描述與實作一致
- iPhone Safari / Android Chrome / Desktop Chrome 跑過 verification §24 全綠
- Lighthouse 分數達標

---

## ☐ Checkpoint 2A — Pre-launch verification

實作流程：

- [ ] §24 verification checklist 全部 12 項跑過
- [ ] 已邀請 1–2 個學生內測（用真實課程代碼）
- [ ] DNS（若已決定 custom domain）已生效
- [ ] 所有 env vars in Cloud Run 已正確
- [ ] Sentry projects（prod / staging）都建立、source map 上傳成功
- [ ] Backup job 跑過至少一次、GCS bucket 有檔
- [ ] 開一個無痕視窗、用真實 prod URL 走過訪客 → 學生 → 老師三條完整流程

---

## ☐ Checkpoint 2 — Production launch

- [ ] 寄 onboarding 訊息 + course code 給學生
- [ ] 上線後 24 小時內留意 Sentry / Cloud Monitoring
- [ ] 收第一波 user feedback

---

## 23 — Post-MVP backlog（不在這次實作範圍）

參見 `tasks/plan.md` §23：custom domain、notifications、TA role、multi-template、search、full version history、Mermaid、RSS、analytics。
