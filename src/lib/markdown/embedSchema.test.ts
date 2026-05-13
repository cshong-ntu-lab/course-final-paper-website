import { describe, expect, it } from "vitest";

import { detectEmbed } from "./embedSchema";

describe("detectEmbed — YouTube", () => {
  it("detects standard watch URL", () => {
    const m = detectEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(m).toMatchObject({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("detects youtu.be short URL", () => {
    const m = detectEmbed("https://youtu.be/dQw4w9WgXcQ");
    expect(m).toMatchObject({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("detects youtube.com/embed/ URL", () => {
    const m = detectEmbed("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(m).toMatchObject({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("ignores extra query params in watch URL", () => {
    const m = detectEmbed("https://www.youtube.com/watch?list=PLabc&v=dQw4w9WgXcQ&t=42");
    expect(m).toMatchObject({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });
});

describe("detectEmbed — Instagram", () => {
  it("detects /p/ post", () => {
    expect(detectEmbed("https://www.instagram.com/p/ABC123xyz/")).toMatchObject({
      kind: "instagram",
    });
  });

  it("detects /reel/", () => {
    expect(detectEmbed("https://instagram.com/reel/ABC123xyz")).toMatchObject({
      kind: "instagram",
    });
  });
});

describe("detectEmbed — Facebook", () => {
  it("detects posts URL", () => {
    expect(detectEmbed("https://www.facebook.com/someuser/posts/1234567890")).toMatchObject({
      kind: "facebook",
    });
  });

  it("detects watch/?v= URL", () => {
    expect(detectEmbed("https://www.facebook.com/watch/?v=123456")).toMatchObject({
      kind: "facebook",
    });
  });
});

describe("detectEmbed — Threads", () => {
  it("detects threads.net post", () => {
    expect(detectEmbed("https://www.threads.net/@someuser/post/ABC123xyz")).toMatchObject({
      kind: "threads",
    });
  });

  it("detects threads.com post", () => {
    expect(detectEmbed("https://www.threads.com/@someuser/post/ABC123xyz")).toMatchObject({
      kind: "threads",
    });
  });
});

describe("detectEmbed — non-embed URLs", () => {
  it("returns null for plain webpage", () => {
    expect(detectEmbed("https://example.com")).toBeNull();
  });

  it("returns null for GitHub URL", () => {
    expect(detectEmbed("https://github.com/user/repo")).toBeNull();
  });

  it("returns null for youtube.com channel (no video)", () => {
    expect(detectEmbed("https://www.youtube.com/channel/UCxxxxxx")).toBeNull();
  });
});
