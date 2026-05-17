output "prod_service_url" {
  description = "Production Cloud Run service URL"
  value       = google_cloud_run_v2_service.prod.uri
}

output "test_service_url" {
  description = "Test Cloud Run service URL"
  value       = google_cloud_run_v2_service.test.uri
}

output "service_account_email" {
  description = "Email of the shared Cloud Build / Cloud Run service account"
  value       = google_service_account.course_paper_sa.email
}

output "wif_provider" {
  description = "WIF provider resource name — set this as the WIF_PROVIDER GitHub secret"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "artifact_registry_url" {
  description = "Artifact Registry Docker repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.prod_project_id}/${google_artifact_registry_repository.app.repository_id}"
}
