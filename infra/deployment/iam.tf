# ── Service Account ──────────────────────────────────────────────────────────

resource "google_service_account" "course_paper_sa" {
  account_id   = var.sa_account_id
  display_name = "Course Final Paper Website SA"
  project      = var.prod_project_id
}

# ── SA roles on prod project ──────────────────────────────────────────────────
# These are the roles course-paper-sa needs to run Cloud Build pipelines
# (push images, deploy Cloud Run, write logs) and to run as the Cloud Run SA.

locals {
  sa_prod_roles = [
    # Cloud Build / Cloud Run runtime roles
    "roles/run.admin",                         # deploy / manage Cloud Run services
    "roles/artifactregistry.writer",           # push Docker images
    "roles/cloudbuild.builds.builder",         # submit and run Cloud Build jobs
    "roles/storage.admin",                     # read/write Cloud Storage buckets + objects (build artifacts, bucket config)
    "roles/datastore.indexAdmin",              # deploy Firestore indexes
    "roles/secretmanager.secretAccessor",      # read Secret Manager secret values in Cloud Build
    "roles/iam.serviceAccountUser",            # impersonate itself when deploying Cloud Run
    # Terraform plan / apply roles
    "roles/resourcemanager.projectIamAdmin",   # read/write project-level IAM bindings
    "roles/iam.workloadIdentityPoolAdmin",     # read/write Workload Identity pools + providers
    "roles/secretmanager.admin",              # read/write Secret Manager secret metadata
    "roles/iam.serviceAccountAdmin",          # read/write IAM bindings on service accounts
    "roles/cloudscheduler.admin",             # read/write Cloud Scheduler jobs (firestore backup)
  ]
}

resource "google_project_iam_member" "sa_prod" {
  for_each = toset(local.sa_prod_roles)
  project  = var.prod_project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.course_paper_sa.email}"
}

# ── SA roles on test Firebase project ────────────────────────────────────────
# course-paper-sa needs Firebase Admin on the test project so ADC (via the
# Cloud Run attached SA) can reach the test Firebase project at runtime.
# serviceUsageConsumer is required by firebase-tools to check API enablement.

resource "google_project_iam_member" "sa_firebase_admin_test" {
  provider = google.test
  project  = var.test_project_id
  role     = "roles/firebase.admin"
  member   = "serviceAccount:${google_service_account.course_paper_sa.email}"
}

resource "google_project_iam_member" "sa_service_usage_test" {
  provider = google.test
  project  = var.test_project_id
  role     = "roles/serviceusage.serviceUsageConsumer"
  member   = "serviceAccount:${google_service_account.course_paper_sa.email}"
}

# ── Workload Identity Federation ──────────────────────────────────────────────
# Allows GitHub Actions to authenticate as course-paper-sa without a key file.

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
  project                   = var.prod_project_id
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"
  project                            = var.prod_project_id

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"        = "assertion.sub"
    "attribute.repository"  = "assertion.repository"
    "attribute.actor"       = "assertion.actor"
    "attribute.ref"         = "assertion.ref"
  }

  # Only tokens from this specific repo are accepted.
  attribute_condition = "attribute.repository == \"${var.github_repo}\""
}

resource "google_service_account_iam_member" "wif_github" {
  service_account_id = google_service_account.course_paper_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}
