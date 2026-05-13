# CLAUDE.md — Project Instructions

> Read this first when starting any work in this repo. Stable project facts that don't change session-to-session.

## Project identity

- **Repo**: `course-final-paper-website`
- **Purpose**: NTU 社會所 graduate course final-paper publishing platform
- **Sole developer / admin**: Jun-Wei Liu (`cshong.ntu@gmail.com` for this project; `jun_j_liu@trendmicro.com` for git author)
- **Specs**: `tasks/plan.md` (architecture) · `tasks/design.md` (visual spec) · `tasks/todo.md` (phase-by-phase checklist)

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
- **shadcn/ui style** components, but hand-rolled (shadcn-cli fails on pnpm 11 build-script strictness)
- **next/font**: Inter / Noto Sans TC / Noto Serif TC / JetBrains Mono
- **Forest accent** palette (`#3a5a3a`); paper neutral background
- **Firebase**: Web SDK in `src/lib/firebase/client.ts`; Admin SDK in `src/lib/firebase/admin.ts` (base64 service account)

## Architecture decisions (post-Phase 0)

- **Single deployment** — one Cloud Run service only. No separate staging Cloud Run service.
- **Preview route** — `/preview` (login-gated) shows all reports including unpublished drafts for course members to review before publishing. No `APP_MODE` env var toggle needed.
- **Auth gates** — `src/proxy.ts` (Next.js edge proxy, replaces `middleware.ts`) gates `/workspace`, `/admin`, and `/preview`. Cookie presence check only; full verification in Server Components via `getCurrentUser()`.
- **Firebase connection** — controlled by `.env.local`: `FIREBASE_USE_EMULATOR=1` / `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1` for local emulator; `0` for cloud (`avid-factor-496115-d6`). Currently set to cloud (`0`).

## Dev workflow

- **pnpm 11** is the package manager. Build script approvals live in `pnpm-workspace.yaml` `allowBuilds:` (NOT `package.json#pnpm.onlyBuiltDependencies`).
- **Emulator mode** for local dev — see `tasks/emulator-dev.md`. Two-terminal workflow: `firebase emulators:start` + `pnpm dev`.
- **Java 21+** required for Firestore emulator (firebase-tools 15.17 dropped Java 19 support).
- **Pre-commit hook** runs `lint-staged` (eslint --fix + prettier --write on staged files).

## Manual verification — after each session

After each batch of changes, verify the listed features using the step-by-step procedure Claude provides at the end of the session. Record what was verified and what was skipped here if needed for continuity.

## Build scripts approval

The following native-binding packages need approval in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  "@firebase/util": true
  protobufjs: true
  sharp: true
  unrs-resolver: true
```

If `pnpm <script>` mysteriously exits 1 after a new install, add the package here.

## Testing

- Unit tests live in `src/**/*.test.ts` and run with `pnpm test` (Vitest).
- **Add tests whenever implementing non-trivial pure logic**: validators, parsers, generators, URL matchers, role helpers.
- Mocks needed: `server-only` → `vi.mock("server-only", () => ({}))`, `next/headers` → mock `cookies`, Firebase Admin → mock `getFirebaseAdmin`.
- CI (`ci.yml`) runs `pnpm test` on every push.

## Implementation strategy

**Design-first** (Strategy B from the planning conversation):

- `tasks/design.md` is the **styling source-of-truth** from Phase 0 onwards.
- When writing any component or page, first read the corresponding section in `tasks/design.md` (§2 for components, §3 for pages, §4 for patterns).
- `tasks/todo.md` Phase headers carry `→ design.md §X.X` references.
- Phase 11.5 is **audit only**, not a big-bang refactor.

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

1. Branch off `main`: `git checkout main && git pull` first, then `git checkout -b feat/<topic>` (or `fix/<topic>`)
2. Make commits as you work
3. Open a PR with `gh pr create` and write a clear description (Summary + Test plan). Update the description as scope evolves. Title format: `[<base-branch>] <type>: <subject>` (e.g. `[main] fix: install triggers via doGet`) so the merge target is visible at a glance.
4. **Each PR ends with exactly one commit.** As you iterate, squash with `git cpf` (alias for `commit --amend --no-edit && push --force-with-lease`). Never let a PR accumulate fix-up commits.
5. Merging the PR triggers the CI/CD pipeline on `main`, which auto-bumps the patch version and deploys.

The `git cpf` alias is configured globally:

```bash
git config --global alias.cpf '!git commit --amend --no-edit && git push --force-with-lease origin $(git rev-parse --abbrev-ref HEAD)'
```

**Additional constraints:**

- **Never auto-start implementation** even after a plan is approved. Pause at phase boundaries and confirm before starting the next phase.
- **Don't commit `.env.local`** — it's in `.gitignore`.
- **Don't commit service account JSON** files — they get base64-encoded into env vars, never on disk in the repo.
- All git commits are signed by the user `Jun-Wei Liu <jun_j_liu@trendmicro.com>`.

## Out of scope (for v1.0)

See `tasks/design.md` §7 and `tasks/plan.md` §23 for the full list. Headlines:

- Dark mode UI toggle (tokens ready, UI in v2)
- Real-time collaboration / multiplayer cursors
- Comments / reactions on public reports
- In-app image cropping
- Full-text search
- i18n (中文 only)

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **course-final-paper-website** (1313 symbols, 2081 relationships, 85 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                                                    | Use for                                  |
| ----------------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/course-final-paper-website/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/course-final-paper-website/clusters`       | All functional areas                     |
| `gitnexus://repo/course-final-paper-website/processes`      | All execution flows                      |
| `gitnexus://repo/course-final-paper-website/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
