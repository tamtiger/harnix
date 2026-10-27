import { describe, expect, it } from "vitest";
import { mapWithLimit } from "src/utils/concurrency.js";

describe("mapWithLimit", () => {
  it("keeps the input order and never runs more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    const result = await mapWithLimit([5, 1, 4, 2, 3, 6], 2, async (value) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, value));
      running -= 1;
      return value * 10;
    });
    expect(result).toEqual([50, 10, 40, 20, 30, 60]);
    expect(peak).toBe(2);
  });

  it("handles an empty list and rejects an invalid limit", async () => {
    expect(await mapWithLimit([], 4, (value: number) => Promise.resolve(value))).toEqual([]);
    await expect(mapWithLimit([1], 0, (value) => Promise.resolve(value))).rejects.toThrow("limit");
  });

  it("rejects with the first error", async () => {
    await expect(
      mapWithLimit([1, 2, 3], 2, (value) => (value === 2 ? Promise.reject(new Error("boom")) : Promise.resolve(value))),
    ).rejects.toThrow("boom");
  });
});
