import { describe, expect, it } from "vitest";

import { readBoundedInput } from "../../src/utils/bounded-input.js";

describe("bounded input", () => {
  it("accepts input at the byte boundary and preserves chunk order", async () => {
    const input = chunks([Buffer.from("ab"), "ç"]);

    await expect(readBoundedInput(input, 4)).resolves.toBe("abç");
  });

  it("rejects input as soon as its UTF-8 byte length exceeds the boundary", async () => {
    let consumed = 0;
    async function* input(): AsyncGenerator<string> {
      for (const value of ["1234", "ç", "must-not-be-read"]) {
        consumed += 1;
        yield value;
      }
    }

    await expect(readBoundedInput(input(), 5)).resolves.toBeUndefined();
    expect(consumed).toBe(2);
  });

  it("rejects a non-positive or fractional byte limit", async () => {
    await expect(readBoundedInput(chunks([]), 0)).rejects.toThrow(/positive integer/i);
    await expect(readBoundedInput(chunks([]), 1.5)).rejects.toThrow(/positive integer/i);
  });
});

async function* chunks(values: readonly (Buffer | string)[]): AsyncGenerator<Buffer | string> {
  yield* values;
}
