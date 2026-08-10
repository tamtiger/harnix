import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { discoverLegacy } from "../../src/migration/discovery.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-migration-");

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
