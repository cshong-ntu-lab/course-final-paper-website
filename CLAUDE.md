# CLAUDE.md — Project Instructions

> Read this first when starting any work in this repo. Stable project facts that don't change session-to-session.

## Project identity

- **Repo**: `course-final-paper-website`
- **Purpose**: Platform for the National Taiwan University Department of Sociology to publish final papers from AI-related courses

## GCP / Firebase

- **GCP project ID**: `avid-factor-496115-d6` ← auto-generated; the display name `course-final-paper-website` is **not** the ID
- **GCP project number**: `1092980609324`
- **Billing account**: `billingAccounts/01A9E4-E088AE-910926` (billingEnabled = true)
- **Region**: `asia-east1` for Firestore, Storage, Cloud Run (locked)
- **Firebase**: linked to the same GCP project; **Spark/Blaze**: Blaze (billing enabled)

When running `gcloud` / `firebase` commands, always target `avid-factor-496115-d6`. The display name `course-final-paper-website` works in some contexts but the ID is the authoritative identifier.

## Tech stack (locked Phase 0)

- **Next.js 16.2.6** App Router, Server Actions for mutations, Route Handlers for special endpoints
- **React 19.2.4**
- **TypeScript 5** strict + `noUncheckedIndexedAccess`
- **Tailwind CSS 4** — CSS-first config via `@theme` directive in `src/app/globals.css` (no `tailwind.config.ts`)
- **shadcn/ui style** components, hand-rolled
- **next/font**: Inter / Noto Sans TC / Noto Serif TC / JetBrains Mono
- **Forest accent** palette (`#3a5a3a`); paper neutral background
- **Firebase**: Web SDK in `src/lib/firebase/client.ts`; Admin SDK in `src/lib/firebase/admin.ts` (base64 service account)

## Architecture decisions (post-Phase 0)

- **Single deployment** — one Cloud Run service only. No separate staging Cloud Run service.
- **Preview route** — `/preview` (login-gated) shows all reports including unpublished drafts for course members to review before publishing. No `APP_MODE` env var toggle needed.
- **Auth gates** — `src/proxy.ts` (Next.js edge proxy, replaces `middleware.ts`) gates `/workspace`, `/admin`, and `/preview`. Cookie presence check only; full verification in Server Components via `getCurrentUser()`.
- **Firebase connection** — controlled by `.env.local`: `FIREBASE_USE_EMULATOR=1` / `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1` for local emulator; `0` for cloud (`avid-factor-496115-d6`). Currently set to cloud (`0`).

## Dev workflow

- **npm** is the package manager (`legacy-peer-deps=true` in `.npmrc`).
- **Emulator mode** for local dev. Two-terminal workflow: `firebase emulators:start` + `npm run dev`.
- **Java 21+** required for Firestore emulator (firebase-tools 15.17 dropped Java 19 support).
- **Pre-commit hook** runs `lint-staged` (eslint --fix + prettier --write on staged files).

## Manual verification — after each session

After each batch of changes, verify the listed features using the step-by-step procedure Claude provides at the end of the session. Record what was verified and what was skipped here if needed for continuity.

## Testing

- Unit tests live in `src/**/*.test.ts` and run with `npm test` (Vitest).
- **Add tests whenever implementing non-trivial pure logic**: validators, parsers, generators, URL matchers, role helpers.
- Mocks needed: `server-only` → `vi.mock("server-only", () => ({}))`, `next/headers` → mock `cookies`, Firebase Admin → mock `getFirebaseAdmin`.
- CI (`ci.yml`) runs `npm test` on every push.

## Debugging production

When asked to debug a production issue, always start by fetching Cloud Run logs:

```bash
# All logs (recent)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=course-final-paper-website" \
  --project=avid-factor-496115-d6 --limit=50 --freshness=1h

# Errors only
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=course-final-paper-website AND severity>=ERROR" \
  --project=avid-factor-496115-d6 --limit=20 --freshness=2h

# Filter by URL path
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=course-final-paper-website AND httpRequest.requestUrl:\"/api/auth\"" \
  --project=avid-factor-496115-d6 --limit=10 --freshness=2h
```

Note: client-side errors (e.g. Firebase Auth failures before any server call) won't appear in Cloud Run logs — those need browser DevTools to diagnose.

## Workflow rules

**Every change goes through a branch + PR — never commit directly to `main`.**

1. Branch off `main`: `feat/<topic>` for new features, `fix/<topic>` for bug fixes
2. Make commits as you work
3. Open a PR with `gh pr create` and write a clear description (Summary + Test plan). Update the description as scope evolves. Title format: `[<base-branch>] <type>: <subject>` (e.g. `[main] fix: install triggers via doGet`) so the merge target is visible at a glance.
4. **Each PR ends with exactly one commit.** As you iterate, squash with `git cpf` (alias for `commit --amend --no-edit && push --force-with-lease`). Never let a PR accumulate fix-up commits.
5. Merging the PR triggers the CI/CD pipeline on `main`, which auto-bumps the patch version and deploys.

**Additional constraints:**

- **Never auto-start implementation** even after a plan is approved. Pause at phase boundaries and confirm before starting the next phase.
- **Don't commit `.env.local`** — it's in `.gitignore`.
- **Don't commit service account JSON** files — they get base64-encoded into env vars, never on disk in the repo.
