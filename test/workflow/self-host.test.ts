import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { workflowTemplate } from "../../src/templates/harnix/workflow.js";
import { readRepoMap } from "../../src/core/repo-map/store.js";
import { sha256 } from "../../src/utils/hashing.js";
import { packageVersion } from "../../src/version.js";

describe("repository self-host state", () => {
  it("tracks the current canonical workflow and initialized project surfaces", async () => {
    const root = process.cwd();
    const workflow = await readFile(join(root, ".harnix", "workflow.md"), "utf8");
    const manifest = JSON.parse(await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8")) as {
      entries: Array<{ generatedHash: string; generatorVersion: string; path: string }>;
    };
    const config = parse(await readFile(join(root, ".harnix", "config.yaml"), "utf8")) as { schemaVersion?: number };
    const workflowEntry = manifest.entries.find((entry) => entry.path === ".harnix/workflow.md");

    expect(sha256(workflow)).toBe(sha256(workflowTemplate));
    expect(workflowEntry).toMatchObject({ generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion });
    expect(config.schemaVersion).toBe(2);
    await expect(access(join(root, ".harnix", "spec", "guides", "common", "engineering.md"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "cache", "repo-map-v1.json"))).resolves.toBeUndefined();
  });

  it("should_load_the_committed_repository_map_with_the_current_canonical_reader", async () => {
    await expect(readRepoMap(process.cwd())).resolves.toMatchObject({
      extractorVersion: 1,
      generator: "harnix",
      schemaVersion: 1,
    });
  });
});
