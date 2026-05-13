import { describe, expect, it } from "vitest";

import { generateCourseCode, isValidCourseCode, normalizeCourseCode } from "./courseCode";

const GENERATOR_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

describe("generateCourseCode", () => {
  it("returns exactly 6 characters", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCourseCode()).toHaveLength(6);
    }
  });

  it("uses only the unambiguous alphabet (no 0, O, 1, I, L)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCourseCode();
      for (const ch of code) {
        expect(GENERATOR_ALPHABET).toContain(ch);
      }
    }
  });

  it("generates different codes on successive calls (high probability)", () => {
    const codes = new Set(Array.from({ length: 50 }, generateCourseCode));
    expect(codes.size).toBeGreaterThan(40);
  });
});

describe("normalizeCourseCode", () => {
  it("uppercases input", () => {
    expect(normalizeCourseCode("abc123")).toBe("ABC123");
  });

  it("strips whitespace and hyphens", () => {
    expect(normalizeCourseCode("  A3-K9 P2 ")).toBe("A3K9P2");
  });

  it("handles already-clean input unchanged", () => {
    expect(normalizeCourseCode("A3K9P2")).toBe("A3K9P2");
  });
});

describe("isValidCourseCode", () => {
  it("accepts 6 alphanumeric uppercase chars", () => {
    expect(isValidCourseCode("A3K9P2")).toBe(true);
    expect(isValidCourseCode("ZZZZZZ")).toBe(true);
    expect(isValidCourseCode("000000")).toBe(true);
  });

  it("accepts lowercase input (normalised first)", () => {
    expect(isValidCourseCode("a3k9p2")).toBe(true);
  });

  it("accepts input with whitespace / hyphens (normalised first)", () => {
    expect(isValidCourseCode("A3-K9P2")).toBe(true);
    expect(isValidCourseCode(" A3K9P2 ")).toBe(true);
  });

  it("rejects codes shorter or longer than 6 chars after normalisation", () => {
    expect(isValidCourseCode("ABC")).toBe(false);
    expect(isValidCourseCode("ABCDEFG")).toBe(false);
    expect(isValidCourseCode("")).toBe(false);
  });

  it("rejects codes containing special characters", () => {
    expect(isValidCourseCode("A3K9P!")).toBe(false);
    expect(isValidCourseCode("A3K9P.")).toBe(false);
  });
});
