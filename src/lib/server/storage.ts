// Server-side Storage helpers.
//
// Uploads no longer go through signed URLs — see src/lib/client/useImageUpload.ts
// for the rationale (org-policy block on service-account keys). The Web SDK
// uploads bytes directly with Firebase Auth + storage.rules.
//
// This module only exposes the server-side helpers that the server
// genuinely needs: deleting an object (called from the deleteUpload action)
// and the shared MAX_BYTES constant.

import "server-only";

import { getFirebaseAdmin } from "@/lib/firebase/admin";

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export function isAllowedContentType(t: string): t is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(t);
}

export async function deleteStorageObject(storagePath: string): Promise<void> {
  const { storage } = getFirebaseAdmin();
  await storage.bucket().file(storagePath).delete({ ignoreNotFound: true });
}
