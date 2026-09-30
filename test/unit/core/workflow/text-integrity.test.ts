import { describe, expect, it } from "vitest";

import { assertTextIntegrity, findCorruptedText } from "src/core/workflow/text-integrity.js";

/** UTF-8 bytes of `text` re-read as a single-byte code page, which is what a default-encoding shell does. */
function garble(text: string, label: "windows-1252" | "windows-1258"): string {
  return new TextDecoder(label).decode(Buffer.from(text, "utf8"));
}

const VIETNAMESE = "Khởi tạo tiếng Việt: điều phối cổng thanh toán";

describe("text integrity guard", () => {
  it.each(["windows-1252", "windows-1258"] as const)("flags UTF-8 Vietnamese re-read as %s", (label) => {
    const garbled = garble(VIETNAMESE, label);

    expect(garbled).not.toBe(VIETNAMESE);
    expect(findCorruptedText({ goal: garbled })).toMatchObject({ reason: "mojibake" });
  });

  it("flags the replacement character", () => {
    expect(findCorruptedText(["fine", { nested: "broken � text" }])).toMatchObject({ reason: "replacement-character" });
  });

  it("accepts genuine Vietnamese, accented Latin, emoji, punctuation and plain ASCII", () => {
    for (const text of [
      VIETNAMESE,
      "Café résumé naïve",
      "Ünïcödé — “quotes” … –",
      "rocket 🚀 done",
      'plain ascii 123 {"a":1}',
      "Ã",
      "é",
      "",
    ])
      expect(findCorruptedText({ text }), text).toBeUndefined();
  });

  it("finds corruption nested in arrays and objects but ignores object keys", () => {
    const garbled = garble(VIETNAMESE, "windows-1252");

    expect(findCorruptedText({ a: [{ b: [garbled] }] })).toMatchObject({ reason: "mojibake" });
    expect(findCorruptedText({ [garbled]: "ok" })).toBeUndefined();
  });

  it("throws an actionable error that quotes a short excerpt", () => {
    const garbled = garble(VIETNAMESE, "windows-1252");

    expect(() => assertTextIntegrity({ title: garbled })).toThrow(/wrong text encoding/u);
    expect(() => assertTextIntegrity({ title: garbled })).toThrow(/editor tool|flag/u);
    expect(() => assertTextIntegrity({ title: VIETNAMESE })).not.toThrow();
    expect(() => assertTextIntegrity(undefined)).not.toThrow();
  });

  it("stops quoting after forty characters", () => {
    const garbled = garble(VIETNAMESE.repeat(4), "windows-1252");
    const message = (() => {
      try {
        assertTextIntegrity({ text: garbled });
      } catch (error: unknown) {
        return (error as Error).message;
      }
      return "";
    })();

    expect(message).toContain("…");
    expect(message.length).toBeLessThan(600);
  });
});
