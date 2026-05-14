# Course Final Paper Website

A publishing platform for NTU graduate course final papers. Students write in Markdown, teachers review and publish — published reports become publicly accessible, SEO-indexed pages.

**Live site**: https://course-final-paper-website-1092980609324.asia-east1.run.app  
[![Cloud Build](https://storage.googleapis.com/cloud-build-badges/avid-factor-496115-d6_f2ac36fb-e154-4358-9474-21339bf3fd46.svg)](https://console.cloud.google.com/cloud-build/builds?project=avid-factor-496115-d6)

---

## Features

### For Students

- Write and edit final papers in Markdown with live preview
- Auto-save every 30 seconds (manual save with Ctrl+S)
- Upload images via drag-and-drop or clipboard paste; manage from a sidebar
- Set report metadata: title, author name, summary, cover image
- View all enrolled courses from a single workspace

### For Teachers (Admin)

- Create courses with auto-generated 6-character enrollment codes
- Review student reports: Latest draft, Diff vs last published version, full publish History
- Publish or unpublish reports with a confirmation dialog
- Status tags per report: `未發布`, `已發布`, `已發布 + 有更新待審核`
- Regenerate enrollment codes; open/close enrollment per course

### Public Page

- Tab navigation between courses; each tab lists published reports with cover image, title, author, summary
- Individual report pages with full Markdown rendering (GFM, code highlighting, KaTeX math, footnotes, embeds)
- Supports YouTube, Instagram, Facebook, and Threads URL auto-embeds
- SEO metadata, Open Graph image, sitemap, `robots.txt`

### Preview Mode

- Login-gated `/preview` route shows all reports including unpublished drafts
- For course members to review before publication

### Google Drive Sync

- Every report save and publish automatically mirrors `report.md` + `metadata.json` to a Google Drive folder
- Folder structure: `<Root>/<course name>/<email> - <display name>/`
- Sync is fire-and-forget; Drive errors never surface to the user

---

## Tech Stack

| Layer           | Choice                                                             |
| --------------- | ------------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router, Server Actions, RSC)                       |
| Language        | TypeScript 5 strict                                                |
| Styling         | Tailwind CSS 4 (CSS-first `@theme`), Forest accent palette         |
| Auth            | Firebase Auth (Google OAuth) + HttpOnly session cookie (Admin SDK) |
| Database        | Firestore (Native mode, `asia-east1`)                              |
| File storage    | Firebase Storage                                                   |
| Testing         | Vitest (unit)                                                      |
| Package manager | pnpm 11                                                            |

---

## Infrastructure

```
GitHub (source)
    │  push to main
    ▼
Cloud Build (cloudbuild.yaml)
    │  docker build + push to Artifact Registry
    ▼
Cloud Run — course-final-paper-website (asia-east1)
    │  single service, always-on, min 1 instance
    │
    ├── Firebase Auth       (Google sign-in)
    ├── Firestore           (all data)
    ├── Firebase Storage    (uploaded images)
    ├── Secret Manager      (Drive credentials)
    └── Google Drive API    (report sync via OAuth2)
```

**GCP project**: `avid-factor-496115-d6`  
**Region**: `asia-east1` (locked)  
**Service account**: `course-paper-sa@avid-factor-496115-d6.iam.gserviceaccount.com`

### Deployment

Every push to `main` triggers Cloud Build:

1. `docker build` — Next.js standalone image; Firebase client config injected as `--build-arg`
2. `docker push` — tagged `:<SHORT_SHA>` and `:latest` → Artifact Registry
3. `gcloud run deploy` — deploys the new revision with 100% traffic

The Cloud Run service uses Application Default Credentials (ADC) from the attached service account — no Firebase Admin key JSON is needed.

Secrets are stored in Secret Manager and mounted as env vars on the Cloud Run service:

- `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`

Build-time Firebase client config is passed via Cloud Build substitution variables set in the trigger.

### Local Development

```bash
# Install dependencies
pnpm install

# Copy and fill in env vars
cp .env.example .env.local

# Start Firebase emulator (in one terminal) — requires Java 21+
firebase emulators:start

# Start Next.js dev server (in another terminal)
FIREBASE_USE_EMULATOR=1 NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1 pnpm dev
```

To connect to production Firebase instead (e.g. to test Drive sync), set both flags to `0` in `.env.local`.

---

## Repository Layout

```
.
├── src/                    # Application source (see src/README.md)
├── scripts/                # One-off utility scripts (e.g. get-drive-token.mjs)
├── Dockerfile              # Multi-stage Next.js standalone build
├── cloudbuild.yaml         # CI/CD pipeline (Cloud Build)
├── firebase.json           # Firebase CLI config (emulator ports, etc.)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Composite index definitions
├── storage.rules           # Firebase Storage security rules
├── .env.example            # All env var names with comments
├── CLAUDE.md               # AI assistant instructions for this project
└── AGENTS.md               # Agent configuration
```

---

## Environment Variables

See `.env.example` for the full list with inline documentation. Key groups:

| Group                                   | Vars                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| App mode                                | `APP_MODE`                                                                                                          |
| Admin access                            | `ADMIN_EMAILS`                                                                                                      |
| Firebase client (build-time)            | `NEXT_PUBLIC_FIREBASE_*`                                                                                            |
| Firebase Admin (runtime, ADC preferred) | `FIREBASE_ADMIN_PRIVATE_KEY_JSON` (optional fallback)                                                               |
| Google Drive sync                       | `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` |

---

## Testing

```bash
pnpm test          # Vitest unit tests
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint
```

Unit tests live alongside the code they test (`*.test.ts`). Coverage targets: pure utilities, validators, URL matchers, auth role helpers, Firestore converters.
