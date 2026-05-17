resource "google_storage_bucket" "firestore_backups" {
  name          = "${var.prod_project_id}-firestore-backups"
  location      = var.region
  project       = var.prod_project_id
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }
}
