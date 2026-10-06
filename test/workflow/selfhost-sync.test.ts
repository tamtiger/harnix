import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { reconcileManagedFiles } from "src/core/managed/project-files.js";
import { sha256 } from "src/utils/hashing.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const { syncSelfHost } = (await import(new URL("../../scripts/selfhost-sync.mjs", import.meta.url).href)) as {
  syncSelfHost: (options: { root: string }) => Promise<{ changed: boolean; updated: string[] }>;
};
const temporaryRepository = useTemporaryRepositories("harnix-selfhost-");
const TEMPLATE = "# Workflow\r\n\r\nBody.\r\n\r\n";
const MANIFEST_PATH = ".harnix/.template-hashes.json";

async function project(root: string): Promise<void> {
  await mkdir(join(root, "src", "templates", "harnix"), { recursive: true });
  await mkdir(join(root, ".harnix"), { recursive: true });
  await writeFile(join(root, "src", "templates", "harnix", "workflow.md"), TEMPLATE);
  await writeFile(join(root, "package.json"), JSON.stringify({ version: "9.9.9-dev.2" }));
  await writeFile(join(root, ".harnix", "workflow.md"), "stale\n");
  const manifest = {
    generator: "harnix",
    schemaVersion: 1,
    entries: [
      { path: "AGENTS.md", sourceId: "a", scope: "project", generatedHash: "0".repeat(64), generatorVersion: "1" },
      {
        path: ".harnix/workflow.md",
        sourceId: "workflow",
        scope: "project",
        generatedHash: "1".repeat(64),
        generatorVersion: "1",
      },
    ],
  };
  await writeFile(join(root, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
}

describe("selfhost:sync", () => {
  it("writes the LF template and its normalized hash and version, and is idempotent", async () => {
    const root = await temporaryRepository();
    await project(root);

    const first = await syncSelfHost({ root });

    const workflow = await readFile(join(root, ".harnix", "workflow.md"), "utf8");
    const manifest = JSON.parse(await readFile(join(root, MANIFEST_PATH), "utf8")) as {
      entries: Array<{ path: string; generatedHash: string; generatorVersion: string }>;
    };
    const entry = manifest.entries.find((item) => item.path === ".harnix/workflow.md");
    expect(first).toMatchObject({ changed: true, updated: [".harnix/workflow.md", MANIFEST_PATH] });
    expect(workflow).toBe("# Workflow\n\nBody.\n");
    expect(entry).toMatchObject({ generatedHash: sha256(workflow), generatorVersion: "9.9.9-dev.2" });
    expect(manifest.entries.find((item) => item.path === "AGENTS.md")?.generatedHash).toBe("0".repeat(64));
    expect(await syncSelfHost({ root })).toMatchObject({ changed: false, updated: [] });
  });

  it("refuses to run without the template", async () => {
    const root = await temporaryRepository();

    await expect(syncSelfHost({ root })).rejects.toThrow(/workflow\.md/u);
  });
});

describe("harnix update on an already synchronized file", () => {
  it("reports it as preserved, never as updated, and does not rewrite it", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, ".harnix"), { recursive: true });
    const content = "# Workflow\n";
    await writeFile(join(root, ".harnix", "workflow.md"), content.replaceAll("\n", "\r\n"));
    const entry = {
      path: ".harnix/workflow.md",
      sourceId: "workflow",
      scope: "project" as const,
      generatedHash: sha256(content),
      generatorVersion: "1",
    };

    const { result } = await reconcileManagedFiles(
      root,
      { generator: "harnix", schemaVersion: 1, entries: [entry] },
      [{ entry, content }],
      { generatorVersion: "1", dryRun: true },
    );

    expect(result.preserved).toEqual([".harnix/workflow.md"]);
    expect(result.updated).toEqual([]);
  });
});
