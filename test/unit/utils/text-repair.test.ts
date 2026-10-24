import { describe, expect, it } from "vitest";

import { autoRepairMojibake } from "src/utils/text-repair.js";

/** UTF-8 bytes of `text` re-read as a single-byte code page, which is what a default-encoding shell does. */
function garble(text: string, label: "windows-1252" | "windows-1258"): string {
  return new TextDecoder(label).decode(Buffer.from(text, "utf8"));
}

const VIETNAMESE = "Khởi tạo tiếng Việt: điều phối cổng thanh toán";

describe("autoRepairMojibake", () => {
  it.each(["windows-1252", "windows-1258"] as const)(
    "automatically repairs UTF-8 Vietnamese garbled by %s",
    (label) => {
      const garbled = garble(VIETNAMESE, label);
      expect(garbled).not.toBe(VIETNAMESE);
      expect(autoRepairMojibake(garbled)).toBe(VIETNAMESE);
    },
  );

  it("automatically repairs mojibake inside full JSON payloads", () => {
    const rawPayload = JSON.stringify({
      title: VIETNAMESE,
      goal: "Triển khai dịch vụ thanh toán trực tuyến",
      status: "planning",
    });
    const garbledPayload = garble(rawPayload, "windows-1252");
    expect(garbledPayload).not.toBe(rawPayload);
    const repaired = autoRepairMojibake(garbledPayload);
    expect(repaired).toBe(rawPayload);
    expect(JSON.parse(repaired)).toEqual({
      title: VIETNAMESE,
      goal: "Triển khai dịch vụ thanh toán trực tuyến",
      status: "planning",
    });
  });

  it("leaves genuine Vietnamese, ASCII, emoji and punctuation untouched", () => {
    expect(autoRepairMojibake(VIETNAMESE)).toBe(VIETNAMESE);
    expect(autoRepairMojibake("Hello world 123 🚀")).toBe("Hello world 123 🚀");
    expect(autoRepairMojibake("")).toBe("");
    expect(autoRepairMojibake("Café résumé naïve")).toBe("Café résumé naïve");
  });
});
