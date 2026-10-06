import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { packageVersion } from "src/version.js";

describe("packageVersion", () => {
  it("resolves the version declared in package.json", () => {
    const declared = (JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string })
      .version;
    expect(packageVersion).toBe(declared);
    expect(packageVersion).toMatch(/^\d+\.\d+\.\d+/u);
  });
});
