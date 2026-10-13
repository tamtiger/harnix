import { describe, expect, it } from "vitest";

import { MIN_LEARNING_CHARACTERS, isTaskSpecific, lowValueReason } from "src/core/journal/learning-quality.js";

describe("lowValueReason", () => {
  it("rejects a statement shorter than the minimum, counting characters not bytes", () => {
    expect(lowValueReason("Dùng builder")).toBe("too-short");
    expect(lowValueReason("   ngắn   ")).toBe("too-short");
    expect(lowValueReason("x".repeat(MIN_LEARNING_CHARACTERS - 1))).toBe("too-short");
  });

  it("rejects a statement made only of filler or test words", () => {
    const filler = "test ".repeat(12).trim();

    expect(filler.length).toBeGreaterThanOrEqual(MIN_LEARNING_CHARACTERS);
    expect(lowValueReason(filler)).toBe("test-string");
    expect(lowValueReason("Lorem ipsum dummy placeholder sample test foo bar baz 123")).toBe("test-string");
    expect(lowValueReason("a".repeat(MIN_LEARNING_CHARACTERS))).toBe("test-string");
  });

  it("keeps real lessons, including unaccented Vietnamese and ones that start with a filler word", () => {
    expect(lowValueReason("Tests that read the real clock are flaky on slow Windows runners.")).toBeUndefined();
    expect(
      lowValueReason("Ghi learned.md la doc-sua-ghi khong co khoa nen hai lenh dong thoi co the mat khoi"),
    ).toBeUndefined();
    expect(lowValueReason("Check-suite là bản nháp; phải bổ sung check tập trung cho từng tiêu chí.")).toBeUndefined();
  });
});

describe("isTaskSpecific", () => {
  it("is true for a statement that names a task id", () => {
    expect(isTaskSpecific("Task 20261013-095413-learning-capture-quality bị chặn bởi lỗi lock")).toBe(true);
  });

  it("is false for a general statement", () => {
    expect(isTaskSpecific("Luôn chạy test:gates trước khi vào verifying để bắt lỗi hợp đồng sớm")).toBe(false);
  });
});
