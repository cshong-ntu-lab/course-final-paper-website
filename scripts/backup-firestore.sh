#!/usr/bin/env bash
# Firestore daily export to GCS.
# Run by Cloud Scheduler → Cloud Run Job (or invoke manually).
#
# Required env vars:
#   BACKUP_BUCKET  — GCS bucket name (without gs://)
#   GCLOUD_PROJECT — GCP project ID (or auto-detected from ADC)

set -euo pipefail

PROJECT="${GCLOUD_PROJECT:-avid-factor-496115-d6}"
BUCKET="${BACKUP_BUCKET:?BACKUP_BUCKET env var is required}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUTPUT_URI="gs://${BUCKET}/${TIMESTAMP}"

echo "[backup-firestore] project=${PROJECT} output=${OUTPUT_URI}"

gcloud firestore export "${OUTPUT_URI}" \
  --project="${PROJECT}" \
  --async

echo "[backup-firestore] export initiated: ${OUTPUT_URI}"
