import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const TITLE = "# Harnix Implementation Plan";

describe("docs/IMPLEMENTATION_PLAN.md integrity", () => {
  it("has its title only on the first line, so no edit spliced the file head into a paragraph", async () => {
    const lines = (await readFile(resolve("docs", "IMPLEMENTATION_PLAN.md"), "utf8")).split("\n");

    expect(lines[0]).toBe(TITLE);
    expect(lines.slice(1).filter((line) => line.includes(TITLE))).toEqual([]);
  });

  it("keeps item (10) of every copy complete: the slug regex ends with $ and the length limit follows", async () => {
    const text = await readFile(resolve("docs", "IMPLEMENTATION_PLAN.md"), "utf8");
    const items = text.split("\n").flatMap((line) => line.match(/\(10\) `workflow --init[^]*?Mode\./gu) ?? []);

    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const item of items) {
      expect(item).toContain("(`^[a-z0-9]+(?:-[a-z0-9]+)*$`, tối đa 60 ký tự); title có ký tự ngoài ASCII");
      expect(item).toContain("title ASCII vẫn tự sinh slug");
    }
  });
});
