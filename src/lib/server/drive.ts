import "server-only";

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { env } from "@/lib/env";
import type { Course, Report, User } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Pure helpers — exported for unit tests
// ──────────────────────────────────────────────────────────────

export interface DriveMetadata {
  reportId: string;
  courseId: string;
  courseName: string;
  uid: string;
  email: string;
  profileDisplayName: string;
  title: string;
  author: string;
  summary: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  hasNewChanges: boolean;
  createdAt: string;
  updatedAt: string;
}

export function buildCourseFolderName(year: number, semester: string, name: string): string {
  return `${year}-${semester} ${name}`;
}

export function buildStudentFolderName(email: string, displayName: string): string {
  return `${email} - ${displayName}`;
}

export function buildMetadata(
  reportId: string,
  report: Report,
  course: Course,
  user: User,
): DriveMetadata {
  return {
    reportId,
    courseId: report.courseId,
    courseName: course.name,
    uid: report.uid,
    email: user.email,
    profileDisplayName: user.profileDisplayName,
    title: report.title,
    author: report.author,
    summary: report.summary,
    coverImageUrl: report.coverImageUrl,
    publishedAt: report.publishedAt ? report.publishedAt.toDate().toISOString() : null,
    hasNewChanges: report.hasNewChanges,
    createdAt: report.createdAt.toDate().toISOString(),
    updatedAt: report.updatedAt.toDate().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// Drive client singleton
// ──────────────────────────────────────────────────────────────

let _drive: drive_v3.Drive | null | undefined = undefined;

function getClient(): drive_v3.Drive | null {
  if (_drive !== undefined) return _drive;

  const {
    GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON,
    GOOGLE_DRIVE_ROOT_FOLDER_ID,
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET,
    GOOGLE_DRIVE_REFRESH_TOKEN,
  } = env.server;

  if (!GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    _drive = null;
    return null;
  }

  let auth: InstanceType<typeof google.auth.OAuth2> | InstanceType<typeof google.auth.GoogleAuth>;

  if (GOOGLE_DRIVE_CLIENT_ID && GOOGLE_DRIVE_CLIENT_SECRET && GOOGLE_DRIVE_REFRESH_TOKEN) {
    // OAuth2 user credentials — works with personal My Drive (no storage quota issue).
    const oauth2 = new google.auth.OAuth2(GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET);
    oauth2.setCredentials({ refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN });
    auth = oauth2;
  } else {
    // SA key or ADC fallback — only works with Shared Drives.
    const authConfig: ConstructorParameters<typeof google.auth.GoogleAuth>[0] = {
      scopes: ["https://www.googleapis.com/auth/drive"],
    };
    if (GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) {
      authConfig.credentials = JSON.parse(
        Buffer.from(GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON, "base64").toString("utf-8"),
      );
    }
    auth = new google.auth.GoogleAuth(authConfig);
  }

  _drive = google.drive({ version: "v3", auth });
  return _drive;
}

// ──────────────────────────────────────────────────────────────
// Drive query helpers
// ──────────────────────────────────────────────────────────────

// Drive query strings use single-quoted string literals; escape accordingly.
function driveQ(s: string): string {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

async function getOrCreateFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string> {
  const res = await drive.files.list({
    q: `name=${driveQ(name)} and ${driveQ(parentId)} in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  const existing = res.data.files ?? [];
  const first = existing[0];
  if (first?.id) return first.id;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  if (!created.data.id) throw new Error(`[drive] failed to create folder "${name}"`);
  return created.data.id;
}

async function upsertFile(
  drive: drive_v3.Drive,
  folderId: string,
  name: string,
  content: string,
  mimeType: string,
): Promise<void> {
  const res = await drive.files.list({
    q: `name=${driveQ(name)} and ${driveQ(folderId)} in parents and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  const existing = res.data.files ?? [];
  const first = existing[0];

  if (first?.id) {
    await drive.files.update({
      fileId: first.id,
      media: { mimeType, body: content },
    });
  } else {
    await drive.files.create({
      requestBody: { name, parents: [folderId] },
      media: { mimeType, body: content },
    });
  }
}

async function persistFolderIdOnCourse(courseId: string, folderId: string): Promise<void> {
  const { db } = getFirebaseAdmin();
  await db.collection("courses").doc(courseId).set({ driveFolderId: folderId }, { merge: true });
}

async function persistFolderIdOnReport(reportId: string, folderId: string): Promise<void> {
  const { db } = getFirebaseAdmin();
  await db.collection("reports").doc(reportId).set({ driveFolderId: folderId }, { merge: true });
}

async function ensureFolder(
  drive: drive_v3.Drive,
  storedId: string | undefined,
  parentId: string,
  name: string,
  onNew: (id: string) => Promise<void>,
): Promise<string> {
  if (storedId) {
    try {
      const res = await drive.files.get({ fileId: storedId, fields: "id,trashed" });
      if (!res.data.trashed) return storedId;
    } catch {
      // folder not found — fall through to create
    }
  }
  const id = await getOrCreateFolder(drive, parentId, name);
  await onNew(id);
  return id;
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

export async function syncReportToDrive(reportId: string): Promise<void> {
  const drive = getClient();
  if (!drive) return;

  const rootFolderId = env.server.GOOGLE_DRIVE_ROOT_FOLDER_ID!;
  const { db } = getFirebaseAdmin();

  const reportSnap = await db.collection("reports").doc(reportId).get();
  if (!reportSnap.exists) return;
  const report = reportSnap.data() as Report & { driveFolderId?: string };

  const [courseSnap, userSnap] = await Promise.all([
    db.collection("courses").doc(report.courseId).get(),
    db.collection("users").doc(report.uid).get(),
  ]);
  if (!courseSnap.exists || !userSnap.exists) return;

  const course = courseSnap.data() as Course & { driveFolderId?: string };
  const user = userSnap.data() as User;

  const courseFolderName = buildCourseFolderName(course.year, course.semester, course.name);
  const courseFolderId = await ensureFolder(
    drive,
    course.driveFolderId,
    rootFolderId,
    courseFolderName,
    (id) => persistFolderIdOnCourse(report.courseId, id),
  );

  const studentFolderName = buildStudentFolderName(user.email, user.profileDisplayName);
  const studentFolderId = await ensureFolder(
    drive,
    report.driveFolderId,
    courseFolderId,
    studentFolderName,
    (id) => persistFolderIdOnReport(reportId, id),
  );

  await Promise.all([
    upsertFile(drive, studentFolderId, "report.md", report.contentMd, "text/plain"),
    upsertFile(
      drive,
      studentFolderId,
      "metadata.json",
      JSON.stringify(buildMetadata(reportId, report, course, user), null, 2),
      "application/json",
    ),
  ]);
}

export async function renameCourseFolder(courseId: string): Promise<void> {
  const drive = getClient();
  if (!drive) return;

  const { db } = getFirebaseAdmin();
  const snap = await db.collection("courses").doc(courseId).get();
  if (!snap.exists) return;

  const data = snap.data() as Course & { driveFolderId?: string };
  if (!data.driveFolderId) return;

  const folderName = buildCourseFolderName(data.year, data.semester, data.name);
  await drive.files.update({ fileId: data.driveFolderId, requestBody: { name: folderName } });
}

export async function renameStudentFolders(
  uid: string,
  email: string,
  newDisplayName: string,
): Promise<void> {
  const drive = getClient();
  if (!drive) return;

  const { db } = getFirebaseAdmin();
  const snap = await db.collection("reports").where("uid", "==", uid).get();
  if (snap.empty) return;

  const newName = buildStudentFolderName(email, newDisplayName);

  await Promise.all(
    snap.docs
      .map((doc) => {
        const { driveFolderId } = doc.data() as { driveFolderId?: string };
        if (!driveFolderId) return null;
        return drive.files.update({ fileId: driveFolderId, requestBody: { name: newName } });
      })
      .filter(Boolean),
  );
}
