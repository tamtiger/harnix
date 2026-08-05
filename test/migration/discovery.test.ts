import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { discoverLegacy } from "../../src/migration/discovery.js";

const temporaryDirectories: string[] = [];

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "harnix-migration-"));
  temporaryDirectories.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe("discoverLegacy", () => {
  it("reports legacy project directories, packages and skills deterministically", async () => {
    const root = await fixture();
    await mkdir(join(root, ".trellis"));
    await mkdir(join(root, ".trellis-pro"));
    await mkdir(join(root, ".agents", "skills", "trellis-check"), { recursive: true });
    await writeFile(join(root, "package.json"), '{"dependencies":{"@mindfoldhq/trellis":"1"}}');

    await expect(discoverLegacy(root)).resolves.toEqual([
      ".trellis",
      ".trellis-pro",
      ".agents/skills/trellis-check",
      "package:@mindfoldhq/trellis",
    ]);
  });
});
