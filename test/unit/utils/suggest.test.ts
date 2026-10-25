import { describe, expect, it } from "vitest";

import { closestMatch, unknownIdError } from "src/utils/suggest.js";

describe("id suggestions", () => {
  it("finds the nearest id only when it is a likely typo", () => {
    expect(closestMatch("chk-replya", ["chk-replay", "chk-lock"])).toBe("chk-replay");
    expect(closestMatch("harnix-plann", ["harnix-plan", "harnix-verify"])).toBe("harnix-plan");
    expect(closestMatch("zzz", ["chk-replay"])).toBeUndefined();
  });

  it("lists the valid ids, the nearest one, and says when there are none", () => {
    expect(unknownIdError("Check x is not declared.", "check", "chk-lok", ["chk-lock", "chk-glob"]).message).toBe(
      "Check x is not declared.\nGợi ý: check hợp lệ: chk-lock, chk-glob. Có phải ý bạn là chk-lock?",
    );
    expect(unknownIdError("Risk r is missing.", "risk", "r", []).message).toBe(
      "Risk r is missing.\nGợi ý: chưa có risk nào.",
    );
    expect(
      unknownIdError(
        "M.",
        "check",
        "q",
        Array.from({ length: 25 }, (_, i) => `c${i}`),
      ).message,
    ).toContain(", …");
  });
});
