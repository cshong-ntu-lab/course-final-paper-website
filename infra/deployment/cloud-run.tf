# Cloud Run services.
#
# Terraform manages: service existence, ingress policy, IAM (allUsers invoker).
# Cloud Build manages on every deploy: image, scaling, env vars, service account.
#
# ignore_changes = [template] prevents Terraform from overwriting Cloud Build's
# image + env var updates. On first apply, Terraform creates the service with
# a placeholder image; Cloud Build takes over from the first triggered deploy.

resource "google_cloud_run_v2_service" "prod" {
  name     = var.app_name
  location = var.region
  project  = var.prod_project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.course_paper_sa.email
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/placeholder:latest"
    }
  }

  lifecycle {
    ignore_changes = [template, client, client_version, scaling]
  }
}

resource "google_cloud_run_v2_service_iam_member" "prod_public" {
  name     = google_cloud_run_v2_service.prod.name
  location = var.region
  project  = var.prod_project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "test" {
  name     = var.test_service_name
  location = var.region
  project  = var.prod_project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.course_paper_sa.email
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/placeholder:latest"
    }
  }

  lifecycle {
    ignore_changes = [template, client, client_version, scaling]
  }
}

resource "google_cloud_run_v2_service_iam_member" "test_public" {
  name     = google_cloud_run_v2_service.test.name
  location = var.region
  project  = var.prod_project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}
