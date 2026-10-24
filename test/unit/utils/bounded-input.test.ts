import { describe, expect, it } from "vitest";

import { readBoundedInput } from "src/utils/bounded-input.js";

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

  it("returns collected data once the idle timeout elapses instead of hanging on a source that never closes", async () => {
    async function* neverCloses(): AsyncGenerator<string> {
      yield "partial";
      await new Promise(() => {}); // never resolves; source never yields again or ends
    }

    const start = Date.now();
    const result = await readBoundedInput(neverCloses(), 65_536, 50);
    const elapsed = Date.now() - start;

    expect(result).toBe("partial");
    expect(elapsed).toBeLessThan(2000);
  });

  it("waits indefinitely for the source to close when no timeout is given (unchanged default behavior)", async () => {
    const input = chunks([Buffer.from("ab"), "ç"]);

    await expect(readBoundedInput(input, 4)).resolves.toBe("abç");
  });

  it("decodes UTF-16LE with BOM transparently (PowerShell 5.1 pipe signature)", async () => {
    const text = '{"title":"Tiếng Việt có dấu từ PowerShell"}';
    const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
    const input = chunks([buffer]);

    await expect(readBoundedInput(input, 1024)).resolves.toBe(text);
  });

  it("decodes UTF-8 with BOM transparently and strips the BOM bytes", async () => {
    const text = '{"title":"Tiếng Việt có dấu UTF-8 BOM"}';
    const buffer = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, "utf8")]);
    const input = chunks([buffer]);

    await expect(readBoundedInput(input, 1024)).resolves.toBe(text);
  });
});

async function* chunks(values: readonly (Buffer | string)[]): AsyncGenerator<Buffer | string> {
  yield* values;
}
