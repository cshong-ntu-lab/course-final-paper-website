import { describe, expect, it } from "vitest";

import { canPreviewDraft, isInPreviewFeed } from "@/lib/preview";

const student = { uid: "me", role: "student" as const };
const admin = { uid: "boss", role: "admin" as const };
const published = { toMillis: () => 1 };

describe("canPreviewDraft", () => {
  it("lets the owner, author and co-authors see the draft", () => {
    expect(canPreviewDraft({ uid: "me", publishedAt: null }, student)).toBe(true);
    expect(canPreviewDraft({ uid: "x", authorUid: "me", publishedAt: null }, student)).toBe(true);
    expect(
      canPreviewDraft({ uid: "x", coAuthors: [{ uid: "me" }], publishedAt: null }, student),
    ).toBe(true);
  });

  it("hides other students' drafts, but not from admins", () => {
    expect(canPreviewDraft({ uid: "x", publishedAt: published }, student)).toBe(false);
    expect(canPreviewDraft({ uid: "x", publishedAt: null }, admin)).toBe(true);
  });
});

describe("isInPreviewFeed", () => {
  it("lists other students' reports only once they are published", () => {
    expect(isInPreviewFeed({ uid: "x", publishedAt: null }, student)).toBe(false);
    expect(isInPreviewFeed({ uid: "x", publishedAt: published }, student)).toBe(true);
    expect(isInPreviewFeed({ uid: "me", publishedAt: null }, student)).toBe(true);
  });
});
