import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("googleapis", () => ({
  google: {
    auth: { GoogleAuth: vi.fn() },
    drive: vi.fn(),
  },
}));
vi.mock("@/lib/firebase/admin", () => ({ getFirebaseAdmin: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { server: {} } }));

import { buildCourseFolderName, buildMetadata, buildStudentFolderName } from "./drive";
import type { Course, Report, User } from "@/lib/types";

function ts(iso: string) {
  return { toDate: () => new Date(iso) } as unknown as import("firebase-admin/firestore").Timestamp;
}

const baseReport: Report = {
  courseId: "course1",
  uid: "user1",
  title: "My Report",
  author: "Author Name",
  summary: "Summary text",
  coverImageUrl: null,
  contentMd: "# Content\nshould not appear in metadata",
  publishedAt: ts("2026-04-15T10:00:00.000Z"),
  hasNewChanges: false,
  createdAt: ts("2026-03-01T10:00:00.000Z"),
  updatedAt: ts("2026-05-14T08:00:00.000Z"),
};

const baseCourse: Course = {
  name: "質性研究方法",
  year: 113,
  semester: "1",
  description: "",
  coverImageUrl: null,
  code: "AB1234",
  enrollmentOpen: true,
  ownerUid: "admin1",
  createdAt: ts("2026-01-01T00:00:00.000Z"),
  updatedAt: ts("2026-01-01T00:00:00.000Z"),
};

const baseUser: User = {
  email: "student@ntu.edu.tw",
  displayNameGoogle: "Google Name",
  photoURLGoogle: null,
  profileDisplayName: "王小明",
  role: "student",
  createdAt: ts("2026-01-01T00:00:00.000Z"),
  updatedAt: ts("2026-01-01T00:00:00.000Z"),
};

describe("buildCourseFolderName", () => {
  it("formats year-semester and name", () => {
    expect(buildCourseFolderName(114, "2", "量化研究方法")).toBe("114-2 量化研究方法");
  });

  it("works for semester 1", () => {
    expect(buildCourseFolderName(113, "1", "質性研究方法")).toBe("113-1 質性研究方法");
  });
});

describe("buildStudentFolderName", () => {
  it("combines email and displayName with separator", () => {
    expect(buildStudentFolderName("a@b.com", "Alice")).toBe("a@b.com - Alice");
  });

  it("preserves non-ASCII characters", () => {
    expect(buildStudentFolderName("s@ntu.edu.tw", "王小明")).toBe("s@ntu.edu.tw - 王小明");
  });

  it("handles empty displayName", () => {
    expect(buildStudentFolderName("a@b.com", "")).toBe("a@b.com - ");
  });
});

describe("buildMetadata", () => {
  it("includes all expected fields", () => {
    const meta = buildMetadata("course1_user1", baseReport, baseCourse, baseUser);
    expect(meta.reportId).toBe("course1_user1");
    expect(meta.courseId).toBe("course1");
    expect(meta.courseName).toBe("質性研究方法");
    expect(meta.uid).toBe("user1");
    expect(meta.email).toBe("student@ntu.edu.tw");
    expect(meta.profileDisplayName).toBe("王小明");
    expect(meta.title).toBe("My Report");
    expect(meta.author).toBe("Author Name");
    expect(meta.summary).toBe("Summary text");
    expect(meta.coverImageUrl).toBeNull();
    expect(meta.hasNewChanges).toBe(false);
  });

  it("converts timestamps to ISO strings", () => {
    const meta = buildMetadata("course1_user1", baseReport, baseCourse, baseUser);
    expect(meta.publishedAt).toBe("2026-04-15T10:00:00.000Z");
    expect(meta.createdAt).toBe("2026-03-01T10:00:00.000Z");
    expect(meta.updatedAt).toBe("2026-05-14T08:00:00.000Z");
  });

  it("does not include contentMd", () => {
    const meta = buildMetadata("course1_user1", baseReport, baseCourse, baseUser);
    expect(Object.keys(meta)).not.toContain("contentMd");
  });

  it("handles null publishedAt", () => {
    const report = { ...baseReport, publishedAt: null };
    const meta = buildMetadata("id", report, baseCourse, baseUser);
    expect(meta.publishedAt).toBeNull();
  });

  it("reflects hasNewChanges = true", () => {
    const report = { ...baseReport, hasNewChanges: true };
    const meta = buildMetadata("id", report, baseCourse, baseUser);
    expect(meta.hasNewChanges).toBe(true);
  });
});
