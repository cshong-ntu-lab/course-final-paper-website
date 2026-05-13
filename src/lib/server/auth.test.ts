import { describe, expect, it, vi } from "vitest";

// Mock env before importing auth so ADMIN_EMAILS is controlled per test.
vi.mock("@/lib/env", () => ({
  env: {
    server: {
      ADMIN_EMAILS: ["teacher@example.com", "admin@ntu.edu.tw"],
    },
    client: {},
  },
}));

// server-only guard must be bypassed in test environment.
vi.mock("server-only", () => ({}));

// Firebase Admin is not needed for isAdminEmail — mock to prevent init errors.
vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdmin: vi.fn(() => ({ auth: {}, db: {} })),
}));

// next/headers is a server-only module — mock it.
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

import { isAdminEmail } from "./auth";

describe("isAdminEmail", () => {
  it("returns true for a listed admin email (exact match)", () => {
    expect(isAdminEmail("teacher@example.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAdminEmail("Teacher@Example.COM")).toBe(true);
    expect(isAdminEmail("ADMIN@NTU.EDU.TW")).toBe(true);
  });

  it("returns false for an email not in the list", () => {
    expect(isAdminEmail("student@example.com")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAdminEmail(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isAdminEmail("")).toBe(false);
  });
});
