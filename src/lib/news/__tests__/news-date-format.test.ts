import { describe, expect, it } from "vitest";

import { formatNewsPublishedDate } from "../news-date-format";

describe("formatNewsPublishedDate", () => {
  it("formats news published timestamps without clock time", () => {
    expect(formatNewsPublishedDate("2026-06-08T19:30:00.000Z")).toBe(
      "Jun 8, 2026",
    );
  });

  it("preserves invalid values instead of inventing a date", () => {
    expect(formatNewsPublishedDate("not-a-date")).toBe("not-a-date");
  });
});
