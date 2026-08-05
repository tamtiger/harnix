import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";

const temporaryDirectories: string[] = [];
async function fixture(): Promise<string> { const root = await mkdtemp(join(tmpdir(), "harnix-init-")); temporaryDirectories.push(root); return root; }
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))); });

describe("initializeProject", () => {
  it("creates only the approved Harnix tree and is idempotent", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), '{"dependencies":{"vue":"1"}}');
    await writeFile(join(root, "keep.txt"), "user content");
    await initializeProject({ developer: "tam", root, yes: true });
    const config = await readFile(join(root, ".harnix", "config.yaml"), "utf8");
    expect(config).toContain("developer: tam"); expect(config).toContain("- vue");
    await expect(access(join(root, ".harnix", "spec", "guides"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "tasks"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "workspace", "tam"))).resolves.toBeUndefined();
    await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user content");
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toBe(config);
  });
  it("reports legacy state without writing unless migration is explicitly requested", async () => {
    const root = await fixture(); await writeFile(join(root, ".trellis"), "legacy");
    const result = await initializeProject({ developer: "tam", root, yes: true });
    expect(result.legacyMarkers).toEqual([".trellis"]); await expect(access(join(root, ".harnix"))).rejects.toBeDefined();
  });
  it("preserves existing config, supports dry-run, and initializes quickly", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml"); await writeFile(configPath, `${await readFile(configPath, "utf8")}futureCompatibleNote: keep\n`);
    await initializeProject({ developer: "other", root, yes: true }); await expect(readFile(configPath, "utf8")).resolves.toContain("futureCompatibleNote: keep");
    const dryRunRoot = await fixture(); await expect(initializeProject({ developer: "tam", dryRun: true, root: dryRunRoot, yes: true })).resolves.toEqual({ created: false, legacyMarkers: [] });
    await expect(access(join(dryRunRoot, ".harnix"))).rejects.toBeDefined();
    const performanceRoot = await fixture(); const startedAt = performance.now(); await initializeProject({ developer: "tam", root: performanceRoot, yes: true }); expect(performance.now() - startedAt).toBeLessThan(5000);
  });
});
