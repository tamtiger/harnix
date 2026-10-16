import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  discoverWorkspaceMembers,
  queryWorkspaceRepoMap,
  refreshWorkspaceRepoMap,
} from "src/core/repo-map/workspace.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-workspace-map-");

describe("workspace repository map", () => {
  it("discovers sub-repositories with and without .harnix", async () => {
    const root = await temporaryRepository();
    // Repo A has .harnix
    await mkdir(join(root, "service-a", ".harnix"), { recursive: true });
    await writeFile(join(root, "service-a", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "service-a", "index.ts"), "export const a = 1;\n");

    // Repo B has package.json but no .harnix
    await mkdir(join(root, "service-b"), { recursive: true });
    await writeFile(join(root, "service-b", "package.json"), '{"name":"service-b"}\n');
    await writeFile(join(root, "service-b", "index.ts"), "export const b = 2;\n");

    const members = await discoverWorkspaceMembers(root);
    expect(members.map((m) => m.name)).toEqual(["service-a", "service-b"]);
    expect(members.find((m) => m.name === "service-a")?.hasHarnix).toBe(true);
    expect(members.find((m) => m.name === "service-b")?.hasHarnix).toBe(false);
  });

  it("queries across workspace members and prefixes paths with member name", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "payment-hub", ".harnix"), { recursive: true });
    await writeFile(join(root, "payment-hub", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(
      join(root, "payment-hub", "payment-service.ts"),
      "export function processPayment() { return true; }\n",
    );

    await mkdir(join(root, "payment-lc", ".harnix"), { recursive: true });
    await writeFile(join(root, "payment-lc", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "payment-lc", "payment-lc.ts"), "export function openPayment() { return true; }\n");

    await refreshWorkspaceRepoMap(root);

    const result = await queryWorkspaceRepoMap({
      root,
      query: "payment",
      limit: 10,
    });

    expect(result.scope).toBe("workspace");
    expect(result.members.length).toBe(2);
    expect(result.results.length).toBeGreaterThanOrEqual(2);
    const paths = result.results.map((r) => r.path);
    expect(paths.some((p) => p.startsWith("payment-hub/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("payment-lc/"))).toBe(true);
  });

  it("breaks ties deterministically using compareCodeUnits on path when scores are identical", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "repo-z", ".harnix"), { recursive: true });
    await writeFile(join(root, "repo-z", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "repo-z", "shared.ts"), "export const sharedToken = true;\n");

    await mkdir(join(root, "repo-a", ".harnix"), { recursive: true });
    await writeFile(join(root, "repo-a", ".harnix", "config.yaml"), "generatorVersion: 1\n");
    await writeFile(join(root, "repo-a", "shared.ts"), "export const sharedToken = true;\n");

    await refreshWorkspaceRepoMap(root);

    const result = await queryWorkspaceRepoMap({
      root,
      query: "sharedToken",
      limit: 10,
    });

    expect(result.results.length).toBe(2);
    expect(result.results[0]!.score).toBe(result.results[1]!.score);
    expect(result.results[0]!.path).toBe("repo-a/shared.ts");
    expect(result.results[1]!.path).toBe("repo-z/shared.ts");
  });
});
