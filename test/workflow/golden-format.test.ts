import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { formatGolden } from "test/support/golden-format.js";

const goldenPath = join(process.cwd(), "test", "workflow", "behavior-snapshot.golden.json");

describe("golden file format", () => {
  it("rewrites the committed golden byte for byte, so regenerating unchanged code changes nothing", async () => {
    const committed = await readFile(goldenPath, "utf8");

    expect(await formatGolden(JSON.parse(committed), goldenPath)).toBe(committed);
  });

  it("turns a one-string change into a one-line difference", async () => {
    const committed = await readFile(goldenPath, "utf8");
    const changed = JSON.parse(committed.replace('"--cancel": "', '"--cancel": "CHANGED ')) as unknown;

    const before = (await formatGolden(JSON.parse(committed), goldenPath)).split("\n");
    const after = (await formatGolden(changed, goldenPath)).split("\n");

    expect(after).toHaveLength(before.length);
    expect(after.filter((line, index) => line !== before[index])).toHaveLength(1);
  });
});
