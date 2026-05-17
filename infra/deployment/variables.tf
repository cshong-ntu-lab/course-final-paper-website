variable "prod_project_id" {
  description = "GCP project ID for production (also hosts test Cloud Run service)"
  type        = string
}

variable "test_project_id" {
  description = "Firebase project ID for the test environment"
  type        = string
}

variable "region" {
  description = "Primary GCP region"
  type        = string
}

variable "github_repo" {
  description = "GitHub owner/repo for WIF principal binding and Cloud Build triggers"
  type        = string
}

variable "app_name" {
  description = "Name used for the prod Cloud Run service, Artifact Registry repo, and Docker image"
  type        = string
}

variable "test_service_name" {
  description = "Name for the test Cloud Run service"
  type        = string
}

variable "sa_account_id" {
  description = "Service account account_id (short name, not the full email)"
  type        = string
}

variable "admin_emails" {
  description = "Comma-separated admin email list passed to the prod Cloud Run service (ADMIN_EMAILS env var)"
  type        = string
}

variable "admin_emails_test" {
  description = "Comma-separated admin email list passed to the test Cloud Run service"
  type        = string
}
