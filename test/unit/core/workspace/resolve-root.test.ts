import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { resolveWorkspaceRoot } from "src/core/workspace/resolve-root.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-resolve-root-");

describe("resolveWorkspaceRoot", () => {
  it("uses an explicit path relative to cwd", async () => {
    const root = await temporaryRepository();
    expect(await resolveWorkspaceRoot(root, "sub")).toBe(resolve(root, "sub"));
  });

  it("falls back to the nearest initialized project, then to cwd", async () => {
    const plain = await temporaryRepository();
    expect(await resolveWorkspaceRoot(plain)).toBe(plain);
    const initialized = await temporaryRepository();
    await initializeProject({ developer: "tam", root: initialized, yes: true });
    await mkdir(join(initialized, "deep"), { recursive: true });
    expect(await resolveWorkspaceRoot(join(initialized, "deep"))).toBe(initialized);
  });
});
