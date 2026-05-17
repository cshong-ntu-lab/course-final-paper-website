resource "google_cloud_scheduler_job" "firestore_backup" {
  name             = "firestore-daily-backup"
  description      = "Daily Firestore export to GCS (03:00 Asia/Taipei = 19:00 UTC)"
  schedule         = "0 19 * * *"
  time_zone        = "UTC"
  project          = var.prod_project_id
  region           = var.region
  attempt_deadline = "180s"

  retry_config {
    max_backoff_duration = "3600s"
    max_doublings        = 16
    max_retry_duration   = "0s"
    min_backoff_duration = "5s"
    retry_count          = 0
  }

  http_target {
    http_method = "POST"
    uri         = "https://firestore.googleapis.com/v1/projects/${var.prod_project_id}/databases/(default):exportDocuments"
    body        = base64encode("{\"outputUriPrefix\":\"gs://${var.prod_project_id}-firestore-backups\"}")
    headers = {
      "Content-Type" = "application/json"
    }
    oauth_token {
      service_account_email = google_service_account.course_paper_sa.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }
}
