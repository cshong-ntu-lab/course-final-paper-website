# GCP Infrastructure

All resources below are managed by Terraform. Changes go through a PR
(`terraform plan` posts as a comment on every push). `terraform apply` runs on PRs
targeting `main`, or manually via workflow dispatch.

**GCP project:** `avid-factor-496115-d6` · **Region:** `asia-east1`

---

## Service Account

A single SA (`course-paper-sa`) is shared across Cloud Build, Cloud Run, and GitHub Actions.

| Resource                   | Console                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Service account            | [IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=avid-factor-496115-d6) |
| Project-level IAM bindings | [IAM](https://console.cloud.google.com/iam-admin/iam?project=avid-factor-496115-d6)                                |

Roles on `avid-factor-496115-d6` (prod):
`run.admin`, `artifactregistry.writer`, `cloudbuild.builds.builder`, `storage.objectAdmin`,
`datastore.indexAdmin`, `secretmanager.secretAccessor` / `secretmanager.admin`,
`iam.serviceAccountUser`, `iam.serviceAccountAdmin`,
`resourcemanager.projectIamAdmin`, `iam.workloadIdentityPoolAdmin`

Roles on `course-final-paper-website-tst` (test Firebase project):
`firebase.admin`, `serviceusage.serviceUsageConsumer`

---

## Workload Identity Federation

Allows GitHub Actions to authenticate as `course-paper-sa` without a key file.

| Resource               | Console                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WIF pool `github-pool` | [Workload Identity Pools](https://console.cloud.google.com/iam-admin/workload-identity-pools?project=avid-factor-496115-d6) |

OIDC provider: `https://token.actions.githubusercontent.com`
Attribute condition: scoped to `cshong-ntu-lab/course-final-paper-website`

GitHub Actions secrets required:

| Secret         | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `WIF_PROVIDER` | `projects/1092980609324/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SA`       | `course-paper-sa@avid-factor-496115-d6.iam.gserviceaccount.com`                                       |

All other configuration (project IDs, emails, service names) lives in `infra/config/terraform.tfvars`.

---

## Artifact Registry

Docker image repository for Cloud Build to push and Cloud Run to pull.

| Resource                                | Console                                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository `course-final-paper-website` | [Artifact Registry](https://console.cloud.google.com/artifacts/docker/avid-factor-496115-d6/asia-east1/course-final-paper-website?project=avid-factor-496115-d6) |

---

## Cloud Run

Two services — both public (`allUsers` invoker). Cloud Build owns the image, env vars,
and scaling on every deploy; Terraform owns service existence and IAM.

| Service                      | Environment                   | Console                                                                                                                                 |
| ---------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `course-final-paper-website` | Production (main branch)      | [prod service](https://console.cloud.google.com/run/detail/asia-east1/course-final-paper-website/metrics?project=avid-factor-496115-d6) |
| `course-paper-test`          | Test (feat/fix/docs branches) | [test service](https://console.cloud.google.com/run/detail/asia-east1/course-paper-test/metrics?project=avid-factor-496115-d6)          |

Both services scale to 0 when idle.

---

## Cloud Build

Two triggers — each runs its own YAML (`cloudbuild.yaml` / `cloudbuild-test.yaml`).
Firebase config is injected at build time from Secret Manager (see below).

| Trigger       | Branch filter           | Console                                                                                                     |
| ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `deploy-prod` | `^main$`                | [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=avid-factor-496115-d6) |
| `deploy-test` | `^(feat\|fix\|docs)/.*` | [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=avid-factor-496115-d6) |

Build history: [Cloud Build History](https://console.cloud.google.com/cloud-build/builds?project=avid-factor-496115-d6)

---

## Secret Manager

Firebase config values are stored as secrets and injected into Cloud Build via
`availableSecrets` + `secretEnv`. Secret **shells** are managed by Terraform;
**values** are set manually and never stored in code.

| Console                                                                                                  |
| -------------------------------------------------------------------------------------------------------- |
| [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=avid-factor-496115-d6) |

Secrets managed:

| Secret name                         | Used in    |
| ----------------------------------- | ---------- |
| `firebase-api-key`                  | prod build |
| `firebase-auth-domain`              | prod build |
| `firebase-project-id`               | prod build |
| `firebase-storage-bucket`           | prod build |
| `firebase-messaging-sender-id`      | prod build |
| `firebase-app-id`                   | prod build |
| `firebase-test-api-key`             | test build |
| `firebase-test-auth-domain`         | test build |
| `firebase-test-project-id`          | test build |
| `firebase-test-storage-bucket`      | test build |
| `firebase-test-messaging-sender-id` | test build |
| `firebase-test-app-id`              | test build |

To add or rotate a secret value:

```bash
echo -n "VALUE" | gcloud secrets versions add SECRET_NAME \
  --data-file=- --project=avid-factor-496115-d6
```

---

## Directory layout

```
infra/
  config/
    terraform.tfvars       # variable values (committed — no secrets)
  deployment/
    *.tf                   # all Terraform resource definitions
    .terraform.lock.hcl    # provider version pin (committed)
  README.md
```

Run locally from the repo root:

```bash
terraform -chdir=infra/deployment init
terraform -chdir=infra/deployment plan  -var-file=../config/terraform.tfvars
terraform -chdir=infra/deployment apply -var-file=../config/terraform.tfvars -auto-approve
```

---

## Terraform State

Remote state is stored in a GCS bucket.

| Resource                               | Console                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Bucket `avid-factor-496115-d6-tfstate` | [Cloud Storage](https://console.cloud.google.com/storage/browser/avid-factor-496115-d6-tfstate?project=avid-factor-496115-d6) |

---

## Not managed by Terraform

| Resource                              | Why                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Firebase project / Firestore database | Created via Firebase console; no reliable TF resource                   |
| Firestore indexes                     | Managed by `firebase-tools` via `firestore.indexes.json` in Cloud Build |
| Firebase Auth (OAuth providers)       | Firebase console only                                                   |
| Secret Manager **values**             | Never in code                                                           |
| GCP projects themselves               | Already exist; Terraform does not create them                           |
