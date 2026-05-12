# Local Emulator Development

> Run the whole stack against Firebase emulators — no cloud, no billing, no $$.
> Phases 2–7 are fully developable in this mode.
> When billing is set up, see "Switching to cloud" at the bottom.

---

## One-time setup

### 1. Confirm Java is installed (Firestore emulator needs JRE 11+)

```bash
java --version
# openjdk 19.0.1 ... or similar — anything 11+ is fine
```

If missing: `sudo apt install default-jre` (Ubuntu/WSL) or via your package manager.

### 2. Write `.env.local`

Create the file (it's `.gitignored`):

```bash
cat > .env.local <<'EOF'
# Local emulator mode — no cloud connections.
APP_MODE=production
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1
FIREBASE_USE_EMULATOR=1
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Admin email (any Google account works in emulator auth flow).
ADMIN_EMAILS=your-email@gmail.com

# Public Firebase config — values don't matter in emulator mode but must be present.
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=course-final-paper-website-demo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-emulator.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:demo

# Service account JSON — not needed in emulator mode (Admin SDK uses no creds).
FIREBASE_ADMIN_PRIVATE_KEY_JSON=
EOF
```

Edit the `ADMIN_EMAILS` line to be your actual email.

---

## Daily workflow

You'll need **two terminals**, one for emulators, one for `pnpm dev`.

### Terminal 1 — start emulators

```bash
firebase emulators:start --import=./fb-data --export-on-exit=./fb-data
```

What this does:

- Launches Auth (port 9099), Firestore (8080), Storage (9199), and Emulator UI (4000) locally.
- `--import` loads data from `./fb-data` if it exists.
- `--export-on-exit` writes data back when you `Ctrl-C` the emulator, so next session resumes where you left off.

First run will be slow (~30s, downloads emulator JARs). Subsequent ~5s.

Visit <http://localhost:4000> for the Emulator UI dashboard — you can browse Firestore docs, see auth users, etc.

### Terminal 2 — Next.js dev server

```bash
pnpm dev
```

Visit <http://localhost:3000>. The app now talks to the emulators.

### Stopping

`Ctrl-C` in both terminals. Emulator data persists in `./fb-data/`.

---

## How the SDKs decide between emulator vs cloud

| Side                                        | Trigger                                                                                           | What happens                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web SDK** (`src/lib/firebase/client.ts`)  | `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1`                                                             | Uses placeholder config, calls `connectAuthEmulator` / `connectFirestoreEmulator` / `connectStorageEmulator`.                                                   |
| **Admin SDK** (`src/lib/firebase/admin.ts`) | `FIREBASE_USE_EMULATOR=1` or any of `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` set | Skips service-account loading, calls `initializeApp({ projectId })` only. Firebase Admin SDK auto-routes to emulators when those `*_HOST` env vars are present. |

Both flags being set ensures both client + server agree on emulator mode.

---

## Notes / gotchas

- **Google sign-in in emulator**: The emulator auth UI is a stub — clicking "Sign in with Google" pops a fake form. You can enter any email + display name. No real OAuth happens. Phase 2 will still test the full flow end-to-end.
- **`fb-data/` is gitignored** (`.env*` covers most cases; add explicit ignore if needed): it's local dev state, not source-controlled.
- **Don't commit `.env.local`** — it's in `.gitignore`.
- **Java version**: emulator needs JRE 11+. Anything newer works.

---

## `fb-data/` add to .gitignore

```bash
echo "fb-data/" >> .gitignore
```

---

## Switching to cloud (when billing clears)

When you have a billing-enabled Firebase project ready:

1. Follow `tasks/setup-gcp.md` steps 5–11 (skip 1–4 if your current project already has Firestore + Storage + Auth enabled)
2. Update `.env.local`:
   - Set `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=0` (or delete the line)
   - Set `FIREBASE_USE_EMULATOR=0` (or delete the line)
   - Delete the three `*_EMULATOR_HOST` lines
   - Fill the 6 `NEXT_PUBLIC_FIREBASE_*` values with real Firebase Web app config
   - Fill `FIREBASE_ADMIN_PRIVATE_KEY_JSON` with base64-encoded service account
3. Restart `pnpm dev`. No code changes needed.

You can flip back and forth between modes by editing `.env.local` and restarting.

---

## Verify the setup right now

After writing `.env.local`:

```bash
# Terminal 1
firebase emulators:start

# Terminal 2 (in a different shell)
pnpm dev
```

Open <http://localhost:3000> — should still see the Forest accent hello-world.
Open <http://localhost:4000> — emulator dashboard with all services "running" badge.

If both load: you're ready for Phase 2.
