import { describe, expect, it } from "vitest";

import { semesterCitationYear, semesterLabel } from "@/lib/semester";

describe("semesterLabel", () => {
  it("joins academic year and semester", () => {
    expect(semesterLabel(114, "1")).toBe("114-1");
    expect(semesterLabel(113, "2")).toBe("113-2");
  });
});

describe("semesterCitationYear", () => {
  it("maps semester 1 to the year it starts in", () => {
    expect(semesterCitationYear(114, "1")).toBe(2025);
    expect(semesterCitationYear(115, "1")).toBe(2026);
  });

  it("maps semester 2 to the following calendar year", () => {
    expect(semesterCitationYear(114, "2")).toBe(2026);
    expect(semesterCitationYear(115, "2")).toBe(2027);
  });

  it("gives 115-1 and 114-2 the same year", () => {
    expect(semesterCitationYear(115, "1")).toBe(semesterCitationYear(114, "2"));
  });
});
