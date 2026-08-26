import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

interface VersionSyncResult { changed: boolean; previousVersion: string; updated: readonly string[]; version: string; }
type SyncVersion = (options: { date?: string; root: string; summaries: readonly string[]; version: string }) => Promise<VersionSyncResult>;
const { syncVersion } = await import(new URL("../../scripts/version-sync.mjs", import.meta.url).href) as { syncVersion: SyncVersion };
const execFileAsync = promisify(execFile);

const roots: string[] = [];
const skillNames = ["harnix-brainstorm", "harnix-check", "harnix-continue", "harnix-debug", "harnix-finish-work", "harnix-implement", "harnix-research"];

afterEach(async () => { await Promise.all(roots.splice(0).map(async (root) => rm(root, { force: true, recursive: true }))); });

describe("version sync", () => {
  it("synchronizes package, canonical skills, and one changelog entry idempotently", async () => {
    const root = await fixture();

    await expect(syncVersion({ date: "2026-08-18", root, summaries: ["Đồng bộ release metadata qua script."], version: "1.0.5" })).resolves.toMatchObject({ changed: true, previousVersion: "1.0.4", version: "1.0.5" });
    await expect(readFile(join(root, "package.json"), "utf8")).resolves.toContain('"version": "1.0.5"');
    for (const name of skillNames) await expect(readFile(join(root, "src", "skills", name, "SKILL.md"), "utf8")).resolves.toContain('version: "1.0.5"');
    const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## [1.0.5] - 2026-08-18");
    expect(changelog).toContain("- Đồng bộ release metadata qua script.");
    await expect(readFile(join(root, "README.md"), "utf8")).resolves.toContain("source release hiện là `1.0.5`");
    await expect(readFile(join(root, "README.md"), "utf8")).resolves.toContain("với package release, hiện là `1.0.5`");
    await expect(selfHostGeneratorVersions(root)).resolves.toEqual(["1.0.5", "1.0.5"]);

    await writeFile(join(root, "README.md"), "source release hiện là `1.0.4`\n\nvới package release, hiện là `1.0.4`\n");
    await writeSelfHostManifest(root, "1.0.4");
    await expect(syncVersion({ date: "2026-08-19", root, summaries: ["Đồng bộ release metadata qua script."], version: "1.0.5" })).resolves.toMatchObject({ changed: true, updated: [".harnix/.template-hashes.json", "README.md"], version: "1.0.5" });
    expect((await readFile(join(root, "CHANGELOG.md"), "utf8")).match(/^## \[1\.0\.5\]/gmu)).toHaveLength(1);
    await expect(readFile(join(root, "README.md"), "utf8")).resolves.toContain("source release hiện là `1.0.5`");
    await expect(selfHostGeneratorVersions(root)).resolves.toEqual(["1.0.5", "1.0.5"]);
    await expect(syncVersion({ date: "2026-08-19", root, summaries: ["Đồng bộ release metadata qua script."], version: "1.0.5" })).resolves.toMatchObject({ changed: false, version: "1.0.5" });
  });

  it("rejects a non-increasing version and a missing release summary", async () => {
    const root = await fixture();

    await expect(syncVersion({ root, summaries: ["x"], version: "1.0.3" })).rejects.toThrow("greater than current version");
    await expect(syncVersion({ root, summaries: [], version: "1.0.5" })).rejects.toThrow("summary");
  });

  it("accepts the pnpm argument separator used by the documented release command", async () => {
    const root = await fixture();
    const script = join(process.cwd(), "scripts", "version-sync.mjs");

    const { stdout } = await execFileAsync(process.execPath, [script, "--", "1.0.5", "--summary", "Đồng bộ release metadata qua pnpm."], { cwd: root });

    expect(JSON.parse(stdout)).toMatchObject({ changed: true, previousVersion: "1.0.4", version: "1.0.5" });
  });
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "harnix-version-sync-"));
  roots.push(root);
  await writeFile(join(root, "package.json"), `${JSON.stringify({ name: "fixture", version: "1.0.4" }, null, 2)}\n`);
  await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\nIntro\n\n## [1.0.4] - 2026-08-17\n");
  await writeFile(join(root, "README.md"), "source release hiện là `1.0.4`\n\nvới package release, hiện là `1.0.4`\n");
  await mkdir(join(root, ".harnix"), { recursive: true });
  await writeSelfHostManifest(root, "1.0.4");
  for (const name of skillNames) {
    const directory = join(root, "src", "skills", name);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "SKILL.md"), `---\nname: ${name}\nmetadata:\n  version: "1.0.4"\n---\n`);
  }
  return root;
}

async function selfHostGeneratorVersions(root: string): Promise<string[]> {
  const manifest = JSON.parse(await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8")) as {
    entries: Array<{ generatorVersion: string }>;
  };
  return manifest.entries.map(({ generatorVersion }) => generatorVersion);
}

async function writeSelfHostManifest(root: string, generatorVersion: string): Promise<void> {
  const manifest = {
    generator: "harnix",
    schemaVersion: 1,
    entries: [
      { path: ".harnix/spec/guides/common/engineering.md", sourceId: "guide-common-engineering", scope: "project", generatedHash: "a".repeat(64), generatorVersion },
      { path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: "b".repeat(64), generatorVersion }
    ]
  };
  await writeFile(join(root, ".harnix", ".template-hashes.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
