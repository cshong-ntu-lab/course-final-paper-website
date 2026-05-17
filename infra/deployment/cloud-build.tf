locals {
  sa_ref   = "projects/${var.prod_project_id}/serviceAccounts/${google_service_account.course_paper_sa.email}"
  registry = "${var.region}-docker.pkg.dev"
  repo     = var.app_name
  image    = var.app_name
}

# ── Production trigger (main → course-final-paper-website Cloud Run) ──────────

resource "google_cloudbuild_trigger" "prod" {
  name            = "deploy-prod"
  project         = var.prod_project_id
  service_account = local.sa_ref
  filename        = "cloudbuild.yaml"

  lifecycle {
    ignore_changes = [include_build_logs]
  }

  github {
    owner = split("/", var.github_repo)[0]
    name  = split("/", var.github_repo)[1]
    push {
      branch = "^main$"
    }
  }

  substitutions = {
    _REGION          = var.region
    _REGISTRY        = local.registry
    _REPO            = local.repo
    _IMAGE           = local.image
    _SERVICE         = var.app_name
    _SERVICE_ACCOUNT = google_service_account.course_paper_sa.email
    _ADMIN_EMAILS    = var.admin_emails
  }
}

# ── Test trigger (feat/fix/docs branches → course-paper-test Cloud Run) ───────

resource "google_cloudbuild_trigger" "test" {
  name            = "deploy-test"
  project         = var.prod_project_id
  service_account = local.sa_ref
  filename        = "cloudbuild-test.yaml"

  lifecycle {
    ignore_changes = [include_build_logs]
  }

  github {
    owner = split("/", var.github_repo)[0]
    name  = split("/", var.github_repo)[1]
    push {
      branch = "^(feat|fix|docs)/.*"
    }
  }

  substitutions = {
    _REGION          = var.region
    _REGISTRY        = local.registry
    _REPO            = local.repo
    _IMAGE           = local.image
    _SERVICE         = var.test_service_name
    _SERVICE_ACCOUNT = google_service_account.course_paper_sa.email
    _ADMIN_EMAILS    = var.admin_emails_test
  }
}
