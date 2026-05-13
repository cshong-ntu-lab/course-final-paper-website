# CI/CD Setup (Phase 8)

> One-time manual setup in GCP Console + GitHub.
> After this, every push to `main` auto-deploys; every PR runs lint + typecheck.

**Project ID**: `avid-factor-496115-d6`
**Region**: `asia-east1`

---

## 1. Artifact Registry — create repository

```bash
gcloud artifacts repositories create course-app \
  --repository-format=docker \
  --location=asia-east1 \
  --project=avid-factor-496115-d6 \
  --description="Course final paper website container images"
```

Verify:

```bash
gcloud artifacts repositories list --location=asia-east1 --project=avid-factor-496115-d6
```

---

## 2. Service account for Cloud Run

Create a dedicated SA that Cloud Run will run as. This SA gets Firestore + Storage + Auth access via ADC — no service account JSON key needed.

```bash
gcloud iam service-accounts create course-run-sa \
  --display-name="Course Run SA" \
  --project=avid-factor-496115-d6

export SA=course-run-sa@avid-factor-496115-d6.iam.gserviceaccount.com

# Firestore read/write
gcloud projects add-iam-policy-binding avid-factor-496115-d6 \
  --member="serviceAccount:$SA" \
  --role=roles/datastore.user

# Storage read/write
gcloud projects add-iam-policy-binding avid-factor-496115-d6 \
  --member="serviceAccount:$SA" \
  --role=roles/storage.objectAdmin

# Firebase Auth admin (for session cookie verification)
gcloud projects add-iam-policy-binding avid-factor-496115-d6 \
  --member="serviceAccount:$SA" \
  --role=roles/firebaseauth.admin
```

---

## 3. Create the Cloud Run service (first deploy)

Do this once manually; subsequent deploys go through Cloud Build.

```bash
gcloud run deploy course-prod \
  --image=us-docker.pkg.dev/cloudrun/container/hello \
  --region=asia-east1 \
  --platform=managed \
  --service-account=course-run-sa@avid-factor-496115-d6.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --port=8080 \
  --set-env-vars="ADMIN_EMAILS=cshong.ntu@gmail.com" \
  --project=avid-factor-496115-d6
```

Note: uses a placeholder image; Cloud Build will replace it on first deploy.

---

## 4. Cloud Build — IAM permissions

The Cloud Build SA needs to push to Artifact Registry and deploy to Cloud Run.

```bash
export PROJECT_NUMBER=1092980609324
export CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Push to Artifact Registry
gcloud projects add-iam-policy-binding avid-factor-496115-d6 \
  --member="serviceAccount:$CB_SA" \
  --role=roles/artifactregistry.writer

# Deploy to Cloud Run
gcloud projects add-iam-policy-binding avid-factor-496115-d6 \
  --member="serviceAccount:$CB_SA" \
  --role=roles/run.developer

# Act as the Cloud Run SA (required to deploy with --service-account)
gcloud iam service-accounts add-iam-policy-binding \
  course-run-sa@avid-factor-496115-d6.iam.gserviceaccount.com \
  --member="serviceAccount:$CB_SA" \
  --role=roles/iam.serviceAccountUser
```

---

## 5. Cloud Build — GitHub trigger

In GCP Console → Cloud Build → Triggers → Connect repository:

1. Connect the GitHub repo `course-final-paper-website` (authorize Cloud Build GitHub App if needed).
2. Create trigger:
   - **Name**: `deploy-main`
   - **Event**: Push to branch `^main$`
   - **Config**: `cloudbuild.yaml` (repo root)
   - **Substitution variables**:

| Variable                        | Value                                                         |
| ------------------------------- | ------------------------------------------------------------- |
| `_SERVICE_ACCOUNT`              | `course-run-sa@avid-factor-496115-d6.iam.gserviceaccount.com` |
| `_ADMIN_EMAILS`                 | `cshong.ntu@gmail.com`                                        |
| `_FIREBASE_API_KEY`             | (from Firebase Console → Project Settings → Web app)          |
| `_FIREBASE_AUTH_DOMAIN`         | `avid-factor-496115-d6.firebaseapp.com`                       |
| `_FIREBASE_PROJECT_ID`          | `avid-factor-496115-d6`                                       |
| `_FIREBASE_STORAGE_BUCKET`      | `avid-factor-496115-d6.firebasestorage.app`                   |
| `_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase Console)                                       |
| `_FIREBASE_APP_ID`              | (from Firebase Console)                                       |

---

## 6. GitHub branch protection

In GitHub → repo Settings → Branches → Add rule for `main`:

- [x] Require status checks to pass before merging
  - Add required check: `lint-type` (from GitHub Actions)
- [x] Require at least 1 approving review (optional for solo dev — can skip)
- [x] Do not allow bypassing the above settings

---

## 7. First deploy — smoke test

After the trigger is set up, push any trivial commit to `main`:

```bash
git commit --allow-empty -m "chore: trigger first Cloud Build deploy"
git push origin main
```

Then:

1. GCP Console → Cloud Build → History — watch the build
2. Once green, get the Cloud Run URL: `gcloud run services describe course-prod --region=asia-east1 --format='value(status.url)'`
3. Open the URL → confirm the site loads
4. Check Cloud Run → Logs → confirm no startup errors

---

## 8. Verify CI on a PR

Create a branch, make a trivial change, open a PR:

```bash
git checkout -b chore/test-ci
# make any small change
git commit -m "chore: test CI pipeline"
git push origin chore/test-ci
# open PR on GitHub
```

Confirm:

- GitHub Actions `lint-type` check appears and goes green
- PR cannot merge until the check passes (if branch protection is set)
