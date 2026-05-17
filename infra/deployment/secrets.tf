# Secret Manager — Firebase configuration.
#
# Terraform creates the secret SHELLS only (replication policy, IAM).
# Values are added manually:
#   echo -n "VALUE" | gcloud secrets versions add SECRET_NAME \
#     --data-file=- --project=avid-factor-496115-d6
#
# After adding values, populate the Cloud Build trigger substitutions by
# triggering a new build — firebase keys are read at build time via
# availableSecrets in cloudbuild.yaml / cloudbuild-test.yaml.

locals {
  prod_secrets = [
    "firebase-api-key",
    "firebase-auth-domain",
    "firebase-project-id",
    "firebase-storage-bucket",
    "firebase-messaging-sender-id",
    "firebase-app-id",
  ]

  test_secrets = [
    "firebase-test-api-key",
    "firebase-test-auth-domain",
    "firebase-test-project-id",
    "firebase-test-storage-bucket",
    "firebase-test-messaging-sender-id",
    "firebase-test-app-id",
  ]

  all_secrets = concat(local.prod_secrets, local.test_secrets)
}

resource "google_secret_manager_secret" "firebase" {
  for_each  = toset(local.all_secrets)
  secret_id = each.value
  project   = var.prod_project_id

  replication {
    auto {}
  }
}

# Grant course-paper-sa access to read all firebase secrets.
# Cloud Build uses this SA when running builds, so it can access availableSecrets.
resource "google_secret_manager_secret_iam_member" "firebase_accessor" {
  for_each  = toset(local.all_secrets)
  project   = var.prod_project_id
  secret_id = google_secret_manager_secret.firebase[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.course_paper_sa.email}"
}
