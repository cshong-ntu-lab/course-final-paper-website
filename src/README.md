# src — Technical Reference

Source layout and conventions for the application.

---

## Directory Map

```
src/
├── actions/            Server Actions (mutations called from client components)
├── app/                Next.js App Router — pages, layouts, API routes
│   ├── (public)/       Unauthenticated public routes (login, privacy, tos)
│   ├── admin/          Teacher-only admin pages
│   ├── api/            Route Handlers (healthz)
│   ├── preview/        Login-gated preview of all drafts
│   └── workspace/      Student workspace (editor, onboarding, settings)
├── components/         Shared React components
│   ├── admin/          Admin-specific components (ReportRow, CourseCodeDisplay)
│   ├── auth/           GoogleSignInButton
│   ├── editor/         FilesSidebar, SaveStatusIndicator
│   ├── public/         ReportListItem
│   └── ui/             Primitive UI: Button, Input, Label, Skeleton, StatusTag
├── lib/                Non-React logic
│   ├── client/         Browser-only hooks (useImageUpload)
│   ├── firebase/       SDK initialisation — client.ts (Web SDK), admin.ts (Admin SDK)
│   ├── firestore/      Typed Firestore converters
│   ├── markdown/       MarkdownRenderer + remarkEmbed plugin + embed components
│   ├── server/         Server-only modules (auth, drive, firestore queries, storage)
│   ├── courseCode.ts   6-char enrollment code generator
│   ├── env.ts          Zod-validated env vars (client + server schemas)
│   ├── reportTemplate.ts  Default Markdown template for new reports
│   ├── slug.ts         URL slug helpers
│   └── types.ts        Shared TypeScript interfaces (Course, Report, User, …)
└── proxy.ts            Next.js Edge middleware — auth gate for /workspace, /admin, /preview
```

---

## Key Modules

### `lib/env.ts`

All env vars go through Zod schemas here. Two schemas:

- `serverSchema` — server-only vars (`ADMIN_EMAILS`, Firebase Admin, Drive credentials, Sentry)
- `clientSchema` — `NEXT_PUBLIC_*` vars safe to expose to the browser

Access via `env.server.SOME_VAR` or `env.client.NEXT_PUBLIC_*`. Throws at startup if required vars are missing.

### `lib/types.ts`

Canonical TypeScript interfaces for Firestore documents: `Course`, `Report`, `User`, `Enrollment`, `PublishSnapshot`, `Upload`. All converters and server functions derive from these.

### `lib/firestore/converters.ts`

Typed Firestore `withConverter` implementations for `Course` and `Report`. Converts Firestore `Timestamp` fields and provides `fromFirestore` / `toFirestore`. Use these whenever reading collections — they ensure type safety and normalise optional fields.

### `lib/server/auth.ts`

- `getCurrentUser()` — reads the `session` HttpOnly cookie, verifies it with Firebase Admin SDK, returns a `User` with role, or `null`
- `isAdminEmail(email)` — checks against `ADMIN_EMAILS` env var

Session cookie is set by `/api/auth/session` route after the client exchanges a Google ID token. Validity: 5 days.

### `lib/server/firestore.ts`

High-level query helpers used by Server Components and Server Actions:

- `getAllCourses()` — all courses ordered by `createdAt desc`
- `getCoursesWithPublishedReports()` — courses that have at least one published report (used by public pages)
- `getPublishedReportsForCourse(courseId)` — reports with `publishedAt != null`

### `lib/server/drive.ts`

Google Drive sync. Exports three public functions:

| Function                                           | When called                                               |
| -------------------------------------------------- | --------------------------------------------------------- |
| `syncReportToDrive(reportId)`                      | After every `saveReportDraftAction` and publish/unpublish |
| `renameCourseFolder(courseId)`                     | After `updateCourseAction` changes `name`                 |
| `renameStudentFolders(uid, email, newDisplayName)` | After `setProfileNameAction`                              |

All are fire-and-forget (`void fn().catch(console.error)`). Returns early (no-op) if `GOOGLE_DRIVE_ROOT_FOLDER_ID` is not set.

Drive folder structure: `<Root>/<year>-<semester> <course name>/<email> - <displayName>/`  
Files written: `report.md` (raw Markdown) and `metadata.json` (all report fields except `contentMd`).

Auth: OAuth2 user credentials (`CLIENT_ID` + `CLIENT_SECRET` + `REFRESH_TOKEN`), which work with personal My Drive. SA key / ADC is a fallback for Shared Drives only.

### `lib/markdown/`

- **`Renderer.tsx`** — the single `<MarkdownRenderer>` component used everywhere (public pages, editor preview, admin diff viewer). Plugins: `remark-gfm`, `remark-math`, `remark-breaks`, `remarkEmbed`; rehype: `rehype-katex`, `@shikijs/rehype`, `rehype-sanitize`.
- **`remarkEmbed.ts`** — remark plugin that converts lone URL paragraphs into custom embed AST nodes for YouTube, Instagram, Facebook, and Threads.
- **`embedSchema.ts`** — `rehype-sanitize` allowlist that permits embed-specific attributes while blocking raw `<script>` and arbitrary `<iframe>`.
- **`embeds/`** — four embed components (`YouTubeEmbed`, `InstagramEmbed`, `FacebookEmbed`, `ThreadsEmbed`).

### `proxy.ts` (Edge Middleware)

Runs on every request. Checks for a `session` cookie (presence only — full verification happens in Server Components). Redirects unauthenticated users away from `/workspace`, `/admin`, and `/preview`.

---

## Server Actions (`actions/`)

All mutations go through Server Actions. Each file handles one domain:

| File            | Actions                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`       | `loginAction`, `logoutAction`                                                                                                      |
| `enrollment.ts` | `enrollWithCodeAction`                                                                                                             |
| `profile.ts`    | `setProfileNameAction`                                                                                                             |
| `report.ts`     | `saveReportDraftAction`                                                                                                            |
| `course.ts`     | `createCourseAction`, `updateCourseAction`, `toggleEnrollmentAction`, `regenerateCourseCodeAction`, `deleteCourseEnrollmentAction` |
| `publish.ts`    | `publishReportAction`, `unpublishReportAction`                                                                                     |

All actions verify the caller's role via `getCurrentUser()` before writing to Firestore.

---

## Data Model (Firestore)

```
users/{uid}
  email, displayNameGoogle, photoURLGoogle
  profileDisplayName   — public author name (student-set)
  role                 — 'student' | 'admin'

courses/{courseId}
  name, year, semester, description, coverImageUrl
  code                 — 6-char enrollment code
  enrollmentOpen       — bool
  driveFolderId        — Drive folder ID (written by drive.ts)

enrollments/{courseId}_{uid}
  courseId, uid, enrolledAt

reports/{reportId}    — id = {courseId}_{uid}
  courseId, uid
  title, author, summary, coverImageUrl
  contentMd            — latest draft
  publishedAt          — null if never published
  hasNewChanges        — draft differs from last publish
  driveFolderId        — Drive folder ID (written by drive.ts)

reports/{reportId}/publishSnapshots/{snapshotId}
  contentMd, title, author, summary, coverImageUrl
  publishedAt, publishedBy

reports/{reportId}/uploads/{uploadId}
  filename, storagePath, downloadURL, sizeBytes, contentType, uploadedAt
```

---

## Routing

| Route                                    | Auth    | Description                                   |
| ---------------------------------------- | ------- | --------------------------------------------- |
| `/`                                      | Public  | Course tab nav + published report list        |
| `/c/[courseSlug]`                        | Public  | Same as `/`, direct course URL                |
| `/c/[courseSlug]/r/[reportSlug]`         | Public  | Read a published report                       |
| `/login`                                 | Public  | Google sign-in                                |
| `/privacy`, `/tos`                       | Public  | Static legal pages                            |
| `/preview`                               | Login   | All drafts (published + unpublished)          |
| `/workspace`                             | Student | Enrolled courses list                         |
| `/workspace/onboarding`                  | Student | First-time setup (course code + display name) |
| `/workspace/settings`                    | Student | Change profile display name                   |
| `/workspace/c/[courseId]`                | Student | Markdown editor for one report                |
| `/admin`                                 | Admin   | Course list                                   |
| `/admin/courses/new`                     | Admin   | Create course                                 |
| `/admin/courses/[courseId]`              | Admin   | Course detail + student report list           |
| `/admin/courses/[courseId]/r/[reportId]` | Admin   | Report review (Latest / Diff / History)       |

---

## Testing

Unit tests live alongside their modules (`*.test.ts`). Run with `pnpm test`.

Test files:

- `lib/courseCode.test.ts` — code generator, character exclusion, uniqueness retry
- `lib/markdown/embedSchema.test.ts` — URL pattern matching for embed detection
- `lib/server/auth.test.ts` — `isAdminEmail` logic
- `lib/server/drive.test.ts` — `buildMetadata`, `buildStudentFolderName` pure helpers

Server-only modules require `vi.mock("server-only", () => ({}))`. Firebase Admin mocks are in `__mocks__/` or inline per test file.
