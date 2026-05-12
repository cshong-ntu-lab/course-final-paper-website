# GCP + Firebase Console Setup (Phase 1)

> Tick each box as you go. End state: `.env.local` filled in, `pnpm dev` connects to real Firebase.
> **Region**: `asia-east1` (彰化, lowest latency to Taiwan users). Locked-in for everything.
> **Project ID** (suggested): `ntu-soci-papers` — change throughout if you pick another.

---

## 0. Prerequisites

- [ ] You have a Google account that will own GCP billing (Trend Micro account is fine if you're allowed; personal Gmail is fine too)
- [ ] You have a credit card to attach a billing account (Cloud Run + Firestore + Storage MVP usage stays in free tier, <$5/month even at fullness)
- [ ] You're in the project dir: `cd /home/letuvertia/course-final-paper-website`

### 0.1 gcloud + firebase CLI auth

```bash
gcloud auth login                          # opens browser, sign in
gcloud auth application-default login      # for Firebase Admin SDK locally
firebase login                             # for firebase CLI commands
```

Confirm:

```bash
gcloud auth list
firebase projects:list      # should list any projects you can see
```

---

## 1. Create GCP project

```bash
export PROJECT_ID="ntu-soci-papers"

gcloud projects create "$PROJECT_ID" \
  --name="NTU Sociology Papers" \
  --set-as-default
```

If `PROJECT_ID` collides (Google checks globally unique), append a suffix like `ntu-soci-papers-2026`.

**Verify:**

```bash
gcloud config get project
# → ntu-soci-papers
```

---

## 2. Link a billing account

```bash
gcloud beta billing accounts list          # find your billing account ID
# Output example:
# ACCOUNT_ID            NAME                OPEN  MASTER_ACCOUNT_ID
# 0XABCD-123456-DEFGHI  My Billing Account  True

export BILLING_ACCOUNT_ID="0XABCD-123456-DEFGHI"   # paste yours

gcloud beta billing projects link "$PROJECT_ID" \
  --billing-account="$BILLING_ACCOUNT_ID"
```

If you've never created a billing account: go to <https://console.cloud.google.com/billing/create> in browser, create one, then come back.

**Verify:**

```bash
gcloud beta billing projects describe "$PROJECT_ID"
# billingEnabled: true
```

---

## 3. Enable all required APIs (1 command)

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  firebasestorage.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID"
```

Takes 1–2 min. **Verify:**

```bash
gcloud services list --enabled --filter="config.name:run.googleapis.com OR config.name:firestore.googleapis.com" --format="value(config.name)"
# should list both
```

---

## 4. Add Firebase to this GCP project

```bash
firebase projects:addfirebase "$PROJECT_ID"
```

This converts your GCP project into a Firebase project. Browser will open for confirmation; click "Add Firebase".

**Verify:**

```bash
firebase projects:list
# should show ntu-soci-papers with "Firebase"
```

Open Firebase Console once to confirm: <https://console.firebase.google.com/project/ntu-soci-papers/overview>

---

## 5. Configure OAuth consent screen (required for Google sign-in)

This is a one-time browser step.

1. Go to <https://console.cloud.google.com/apis/credentials/consent?project=ntu-soci-papers>
2. **User type**: "External" → Create
3. **App information**:
   - App name: `課程報告 · 台大社會所`
   - User support email: your email
   - Developer contact info: your email
4. **Scopes**: skip (default scopes are enough for `openid email profile`)
5. **Test users** (while in "Testing" mode): add your admin email + your test student email
6. Save and back to dashboard

**Why this step**: Without it, Google sign-in will throw `access_denied` errors. You can stay in "Testing" mode forever (up to 100 test users) — no need to "Publish" the app.

---

## 6. Enable Google sign-in provider

In browser:

1. <https://console.firebase.google.com/project/ntu-soci-papers/authentication/providers>
2. Click **Get Started** if first time, otherwise just **Add new provider**
3. Choose **Google**
4. Toggle "Enable"
5. **Support email** = your admin email (the one in `ADMIN_EMAILS`)
6. **Save**

**Verify:** "Sign-in providers" list shows Google with green ✓.

---

## 7. Create Firestore database (`asia-east1`, Native mode)

```bash
gcloud firestore databases create \
  --location=asia-east1 \
  --type=firestore-native \
  --project="$PROJECT_ID"
```

**Verify:**

```bash
gcloud firestore databases describe --database="(default)" --project="$PROJECT_ID"
# locationId: asia-east1
# type: FIRESTORE_NATIVE
```

If you also want to deploy our placeholder rules now:

```bash
firebase use "$PROJECT_ID"
firebase deploy --only firestore:rules
```

---

## 8. Enable Firebase Storage (`asia-east1`)

> ⚠️ Firebase Storage doesn't have a clean CLI; use console.

1. <https://console.firebase.google.com/project/ntu-soci-papers/storage>
2. Click **Get started**
3. **Start in production mode** (more secure default; we'll deploy real rules later)
4. **Location**: `asia-east1` ← critical, must match Firestore
5. **Done**

After created, deploy our placeholder rules:

```bash
firebase deploy --only storage
```

---

## 9. Create Artifact Registry repo (for Cloud Run images, Phase 8)

```bash
gcloud artifacts repositories create course-papers \
  --location=asia-east1 \
  --repository-format=docker \
  --description="Container images for course-final-paper-website" \
  --project="$PROJECT_ID"
```

**Verify:**

```bash
gcloud artifacts repositories list --location=asia-east1
```

---

## 10. Add a Firebase Web app + grab config

In browser:

1. <https://console.firebase.google.com/project/ntu-soci-papers/settings/general>
2. Scroll to **"Your apps"** section → click **`</>`** (Web) icon
3. **App nickname**: `course-prod-web`
4. **Firebase Hosting**: **leave unchecked** (we use Cloud Run, not Firebase Hosting)
5. **Register app**
6. You'll see a snippet:

```js
const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "ntu-soci-papers.firebaseapp.com",
  projectId: "ntu-soci-papers",
  storageBucket: "ntu-soci-papers.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123...",
};
```

7. Click **Continue to console**

**Action:** Copy these 6 values into `.env.local` (create the file by copying `.env.example`):

```bash
cp .env.example .env.local
# then edit .env.local
```

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy....
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ntu-soci-papers.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ntu-soci-papers
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ntu-soci-papers.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123...
```

To find these again later: same Firebase Console URL above, scroll down, click on the web app card.

---

## 11. Service Account for Firebase Admin SDK

This gives the **server side** of our Next.js app god-mode access to Firestore + Auth.

### 11.1 Create the service account key

In browser:

1. <https://console.firebase.google.com/project/ntu-soci-papers/settings/serviceaccounts/adminsdk>
2. Click **Generate new private key** → **Generate key**
3. Browser downloads `ntu-soci-papers-firebase-adminsdk-xxxxx.json`

### 11.2 Encode + place in `.env.local`

```bash
# adjust filename to whatever you downloaded; ~/Downloads on most systems
SA_FILE=~/Downloads/ntu-soci-papers-firebase-adminsdk-*.json

# base64 -w0 forces single line (no newlines), then dump straight to clipboard or stdout
base64 -w0 "$SA_FILE"
```

Copy the (very long) one-line string and put into `.env.local`:

```dotenv
FIREBASE_ADMIN_PRIVATE_KEY_JSON=<paste the whole base64 string here, no quotes, no newlines>
```

**⚠️ Critical:** Delete the original JSON file after encoding — never commit it. `.env.local` is already in `.gitignore`.

```bash
rm "$SA_FILE"
```

### 11.3 Set `ADMIN_EMAILS` + `APP_MODE`

In `.env.local`:

```dotenv
APP_MODE=production
ADMIN_EMAILS=your-admin-email@gmail.com
```

Use a comma to add a second admin / TA later.

---

## 12. Final verification

```bash
cd /home/letuvertia/course-final-paper-website
pnpm dev
```

Open <http://localhost:3000>. You should see:

- The Phase 0 hello-world with Forest accent
- Browser DevTools console: **no Firebase init errors** (currently no code path actually queries Firebase, but the SDK should construct without throwing)

Once it boots cleanly, you're done with Phase 1. Tell me **"Phase 1 done"** and I'll proceed to Phase 2 (Auth + Onboarding).

---

## What you DON'T need to do now

- Cloud Run deploy — Phase 8
- Cloud Build triggers — Phase 8
- Sentry setup — Phase 9
- Cloud Scheduler backup — Phase 9
- Custom domain — post-MVP

---

## Troubleshooting

| Symptom                                                            | Cause                                                               | Fix                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `gcloud projects create` fails: "project already exists"           | Project ID is globally unique across all GCP                        | Append suffix like `-2026`                                                                      |
| `firebase login` opens but immediately fails                       | Firewall / proxy on Trend Micro network                             | Try personal network or `firebase login --no-localhost`                                         |
| `firebase projects:addfirebase` says "permission denied"           | Account doesn't have `Owner` on GCP project                         | `gcloud projects add-iam-policy-binding $PROJECT_ID --member=user:you@email --role=roles/owner` |
| Google sign-in returns `access_denied` later                       | OAuth consent screen `Testing` user list doesn't include your email | Add to test users in step 5                                                                     |
| `Firebase: Error (auth/configuration-not-found)`                   | Forgot step 6 (enable Google provider)                              | Go enable it                                                                                    |
| Firestore queries 500 with "Cloud Firestore API has not been used" | Forgot step 3 (enable APIs)                                         | Re-run step 3                                                                                   |
| `.env.local` values don't load                                     | Next.js dev server needs restart after `.env.local` changes         | Ctrl-C + `pnpm dev`                                                                             |

---

## Cost note

Free tier covers:

- Firestore: 50K reads / 20K writes / 20K deletes per day
- Storage: 5GB stored, 1GB downloaded/day
- Firebase Auth: free
- Cloud Run: 2M requests / 360K vCPU-seconds / 180K GiB-seconds per month

A 30-student class will not exceed any of these in normal use. Set up a billing budget alert at $10/month for peace of mind:

```bash
# (optional) one-time budget alert
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT_ID" \
  --display-name="ntu-soci-papers $10 alert" \
  --budget-amount=10USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```
