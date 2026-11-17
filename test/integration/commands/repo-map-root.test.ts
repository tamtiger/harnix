import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { configuredRoot, initializedRoot } from "src/commands/repo-map-root.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-root-");

describe("repo-map project root", () => {
  it("finds the initialized project from a sub-directory and validates its config", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await mkdir(join(root, "pkg", "src"), { recursive: true });

    expect(await initializedRoot(join(root, "pkg", "src"))).toBe(await initializedRoot(root));
    expect(await configuredRoot(join(root, "pkg"))).toBe(await initializedRoot(root));
  });

  it("refuses a directory outside an initialized project", async () => {
    const root = await temporaryRepository();

    await expect(initializedRoot(root)).rejects.toThrow(/repo map/iu);
    await expect(configuredRoot(root)).rejects.toThrow();
  });
});
