provider "google" {
  project = var.prod_project_id
  region  = var.region
}

# Separate provider alias for cross-project IAM on the test Firebase project.
provider "google" {
  alias   = "test"
  project = var.test_project_id
  region  = var.region
}
