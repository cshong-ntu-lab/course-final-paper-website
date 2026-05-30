"use client";
// Shared client-side upload helper.
//
// Architecture (revised — no signed URLs, no service-account key):
//   1. Compress oversized images in-browser.
//   2. Use the Firebase Web SDK `uploadBytesResumable` — auth is the user's
//      Firebase Auth session, gated by storage.rules.
//   3. Call `getDownloadURL` to get a token-based public URL.
//   4. POST /api/uploads/finalize so the server records the upload in
//      Firestore (decoupled from the upload itself).
//
// Why this avoids the org-policy "cannot sign data without client_email"
// problem: signed URLs require a service-account JSON key, which our GCP
// org policy disallows. Web SDK uploads use Firebase Auth tokens and
// storage.rules — no SA key needed.

import imageCompression from "browser-image-compression";
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import * as React from "react";

import { getFirebaseClient } from "@/lib/firebase/client";

export interface UploadResult {
  uploadId: string;
  downloadUrl: string;
  filename: string;
  sizeBytes: number;
  contentType: string;
}

/** Compose markdown for an uploaded image. Filename (sans extension) becomes
 *  the alt text + a default caption — single-image paragraphs are rendered
 *  as `<figure><img/><figcaption>{caption}</figcaption></figure>`, so the
 *  caption is visible immediately. Students can edit / clear the caption
 *  in the third argument of the markdown link. */
export function imageMarkdown(opts: {
  filename: string;
  downloadUrl: string;
  caption?: string;
}): string {
  const altSource = opts.caption ?? opts.filename.replace(/\.[^.]+$/, "");
  // Escape `"` inside the title attribute.
  const safeCaption = altSource.replace(/"/g, '\\"');
  return `![${altSource}](${opts.downloadUrl} "${safeCaption}")`;
}

const COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024;
const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2400,
  initialQuality: 0.85,
  useWebWorker: true,
};
const ALLOWED_CTYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "text/csv",
  "application/json",
];

export interface ImageUploadOptions {
  reportId: string;
  onProgress?: (state: UploadState) => void;
}

export type UploadState =
  | { phase: "idle" }
  | { phase: "compressing"; filename: string }
  | { phase: "uploading"; filename: string; percent: number }
  | { phase: "finalizing"; filename: string }
  | { phase: "done"; result: UploadResult }
  | { phase: "error"; error: string };

async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= COMPRESSION_THRESHOLD_BYTES) return file;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    return new File([compressed], file.name, { type: compressed.type || file.type });
  } catch {
    return file;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w.\-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

async function uploadOne(file: File, opts: ImageUploadOptions): Promise<UploadResult> {
  const setProg = opts.onProgress ?? (() => undefined);

  if (!ALLOWED_CTYPES.includes(file.type)) {
    throw new Error(`disallowed_content_type:${file.type}`);
  }

  setProg({ phase: "compressing", filename: file.name });
  const prepared = await compressIfNeeded(file);
  const safeName = sanitizeFilename(prepared.name) || "image";

  // Need the report's courseId + the current uid to construct the storage
  // path. We rely on the server-issued finalize endpoint to know the
  // courseId from the report doc — but the WRITE path must include the
  // user's uid for storage.rules to allow. We get uid from the Firebase
  // client SDK's currentUser (the same one that minted the session).
  //
  // authStateReady() ensures the SDK has finished restoring auth state
  // from localStorage before we read currentUser. Without this, the
  // first upload after a fresh page load can race and see currentUser=null.
  const { auth, storage } = getFirebaseClient();
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not_authenticated");

  // Generate a client-side uploadId; server will reuse it as the Firestore
  // doc id during finalize for idempotency.
  const uploadId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // Upload path mirrors design.md §4.2: reports/{courseId}/{uid}/...
  // We don't know courseId on the client yet — embed reportId instead and
  // let the server move/validate during finalize. Simpler: ask finalize
  // for a "intended path"; or stash uploads under a per-user prefix.
  //
  // Pragmatic choice: store under `reports/_pending/{uid}/{reportId}/...`
  // and let the server rules permit writes there. After finalize, we
  // record the path in Firestore. (Trade-off: paths aren't grouped under
  // courseId, but design.md's path scheme was tied to the signed-URL
  // approach. For Web SDK uploads, organising by uid is sufficient.)
  const storagePath = `reports/${opts.reportId}/${uid}/${uploadId}_${safeName}`;

  setProg({ phase: "uploading", filename: prepared.name, percent: 0 });
  const fileRef = storageRef(storage, storagePath);
  const task = uploadBytesResumable(fileRef, prepared, { contentType: prepared.type });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const percent = snap.totalBytes
          ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          : 0;
        setProg({ phase: "uploading", filename: prepared.name, percent });
      },
      (err) => reject(err),
      () => resolve(),
    );
  });

  const downloadUrl = await getDownloadURL(fileRef);

  setProg({ phase: "finalizing", filename: prepared.name });
  const finRes = await fetch("/api/uploads/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reportId: opts.reportId,
      uploadId,
      storagePath,
      filename: prepared.name,
      contentType: prepared.type,
      sizeBytes: prepared.size,
      downloadUrl,
    }),
  });
  if (!finRes.ok) {
    const body = await finRes.json().catch(() => ({}));
    throw new Error(`finalize_failed:${body?.error ?? finRes.status}`);
  }

  const result: UploadResult = {
    uploadId,
    downloadUrl,
    filename: prepared.name,
    sizeBytes: prepared.size,
    contentType: prepared.type,
  };
  setProg({ phase: "done", result });
  return result;
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
// Uploads to avatars/{uid}/{uploadId}_{filename}. No server finalize needed —
// the caller updates the user profile directly after getting the download URL.

const AVATAR_ALLOWED_CTYPES = ["image/png", "image/jpeg", "image/webp"];

export async function uploadAvatarFile(
  file: File,
  onProgress?: (state: UploadState) => void,
): Promise<string> {
  const setProg = onProgress ?? (() => undefined);

  if (!AVATAR_ALLOWED_CTYPES.includes(file.type)) {
    throw new Error(`disallowed_content_type:${file.type}`);
  }

  setProg({ phase: "compressing", filename: file.name });
  const prepared = await compressIfNeeded(file);
  const safeName = sanitizeFilename(prepared.name) || "avatar";

  const { auth, storage } = getFirebaseClient();
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("not_authenticated");

  const uploadId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const storagePath = `avatars/${uid}/${uploadId}_${safeName}`;

  setProg({ phase: "uploading", filename: prepared.name, percent: 0 });
  const fileRef = storageRef(storage, storagePath);
  const task = uploadBytesResumable(fileRef, prepared, { contentType: prepared.type });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const percent = snap.totalBytes
          ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          : 0;
        setProg({ phase: "uploading", filename: prepared.name, percent });
      },
      (err) => reject(err),
      () => resolve(),
    );
  });

  const downloadUrl = await getDownloadURL(fileRef);
  setProg({
    phase: "done",
    result: {
      uploadId,
      downloadUrl,
      filename: prepared.name,
      sizeBytes: prepared.size,
      contentType: prepared.type,
    },
  });
  return downloadUrl;
}

export function useAvatarUpload() {
  const [state, setState] = React.useState<UploadState>({ phase: "idle" });

  const upload = React.useCallback(async (file: File): Promise<string | null> => {
    try {
      return await uploadAvatarFile(file, (s) => setState(s));
    } catch (e) {
      const error = e instanceof Error ? e.message : "unknown";
      setState({ phase: "error", error });
      return null;
    }
  }, []);

  const reset = React.useCallback(() => setState({ phase: "idle" }), []);

  return { state, upload, reset };
}

// ── Report image upload ───────────────────────────────────────────────────────

export function useImageUpload(opts: ImageUploadOptions) {
  const [state, setState] = React.useState<UploadState>({ phase: "idle" });

  const upload = React.useCallback(
    async (file: File): Promise<UploadResult | null> => {
      try {
        return await uploadOne(file, {
          ...opts,
          onProgress: (s) => {
            setState(s);
            opts.onProgress?.(s);
          },
        });
      } catch (e) {
        const error = e instanceof Error ? e.message : "unknown";
        setState({ phase: "error", error });
        opts.onProgress?.({ phase: "error", error });
        return null;
      }
    },
    [opts],
  );

  const reset = React.useCallback(() => setState({ phase: "idle" }), []);

  return { state, upload, reset };
}
