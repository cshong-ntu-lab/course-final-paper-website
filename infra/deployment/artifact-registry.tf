resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = var.app_name
  description   = "Course final paper website container images"
  format        = "DOCKER"
  project       = var.prod_project_id
}
