import { describe, expect, it } from "vitest";

import { asciiFold, slugOrIssue } from "src/core/workflow/init-issues.js";

describe("slugOrIssue", () => {
  it("accepts an explicit valid slug and derives one from a plain ASCII title", () => {
    expect(slugOrIssue("Chuẩn hóa ID", "normalize-id")).toEqual({ slug: "normalize-id" });
    expect(slugOrIssue("Plain Title Here", undefined)).toEqual({ slug: "plain-title-here" });
  });

  it("suggests the ASCII-folded title when the title has accents and no slug", () => {
    const result = slugOrIssue("Đồng bộ tài liệu", undefined);

    expect(result.slug).toBeUndefined();
    expect(result.issue).toContain("--slug <english-kebab-case>");
    expect(result.issue).toContain("dong-bo-tai-lieu");
  });

  it("rejects a malformed slug", () => {
    expect(slugOrIssue("Plain", "Bad Slug").issue).toMatch(/--slug must be english-kebab-case/u);
  });
});

describe("asciiFold", () => {
  it("removes accents, maps đ and kebab-cases", () => {
    expect(asciiFold("Giảm ma sát — đợt 2")).toBe("giam-ma-sat-dot-2");
  });
});
