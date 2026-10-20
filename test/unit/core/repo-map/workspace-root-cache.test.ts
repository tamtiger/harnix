import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { readRepoMap } from "src/core/repo-map/store.js";
import { queryWorkspaceRepoMap, refreshWorkspaceRepoMap } from "src/core/repo-map/workspace.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-workspace-root-cache-");

async function plainMember(root: string, name: string, file: string, source: string): Promise<void> {
  await mkdir(join(root, name), { recursive: true });
  await writeFile(join(root, name, "package.json"), `{"name":"${name}"}\n`);
  await writeFile(join(root, name, file), source);
}

async function initializedRoot(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function listTree(root: string, prefix = ""): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    found.push(path);
    if (entry.isDirectory()) found.push(...(await listTree(root, path)));
  }
  return found.sort();
}

describe("workspace root cache", () => {
  it("serves members without their own cache from the workspace root cache", async () => {
    const root = await initializedRoot();
    await plainMember(root, "svc-a", "billing.ts", "export function billing() { return 1; }\n");
    await plainMember(root, "svc-b", "billing-repo.ts", "export function billingRepo() { return 2; }\n");
    await refreshWorkspaceRepoMap(root);

    const result = await queryWorkspaceRepoMap({ limit: 10, query: "billing", root });

    expect(result.members).toEqual([
      expect.objectContaining({ name: "svc-a", source: "workspace", status: "ready" }),
      expect.objectContaining({ name: "svc-b", source: "workspace", status: "ready" }),
    ]);
    expect(result.members.every((member) => member.records > 0)).toBe(true);
    expect(result.results.map((item) => item.path).sort()).toEqual(["svc-a/billing.ts", "svc-b/billing-repo.ts"]);
  });

  it("prefers a member's own cache and labels it", async () => {
    const root = await initializedRoot();
    await mkdir(join(root, "svc-own"), { recursive: true });
    await initializeProject({ developer: "tam", root: join(root, "svc-own"), yes: true });
    await writeFile(join(root, "svc-own", "ledger.ts"), "export const ledger = true;\n");
    await refreshWorkspaceRepoMap(root);

    const result = await queryWorkspaceRepoMap({ limit: 10, query: "ledger", root });

    expect(result.members).toEqual([expect.objectContaining({ name: "svc-own", source: "member", status: "ready" })]);
    expect(result.results.map((item) => item.path)).toEqual(["svc-own/ledger.ts"]);
  });

  it("reports missing with a hint when no cache covers a member", async () => {
    const root = await temporaryRepository();
    await plainMember(root, "svc-a", "a.ts", "export const a = 1;\n");

    const result = await queryWorkspaceRepoMap({ query: "a", root });

    expect(result.members).toEqual([
      expect.objectContaining({
        hint: expect.stringContaining("repo-map --refresh"),
        name: "svc-a",
        status: "missing",
      }),
    ]);
  });

  it("reports missing when the root cache has no record under the member prefix", async () => {
    const root = await initializedRoot();
    await plainMember(root, "svc-a", "a.ts", "export const a = 1;\n");
    await writeFile(join(root, ".gitignore"), "svc-a/\n");
    await refreshWorkspaceRepoMap(root);

    const result = await queryWorkspaceRepoMap({ query: "a", root });

    expect(result.members).toEqual([expect.objectContaining({ name: "svc-a", records: 0, status: "missing" })]);
  });

  it("reports invalid when the root cache is corrupt", async () => {
    const root = await initializedRoot();
    await plainMember(root, "svc-a", "a.ts", "export const a = 1;\n");
    await mkdir(join(root, ".harnix", "cache"), { recursive: true });
    await writeFile(join(root, ".harnix", "cache", "repo-map-v1.json"), "{not json");

    const result = await queryWorkspaceRepoMap({ query: "a", root });

    expect(result.members).toEqual([expect.objectContaining({ name: "svc-a", status: "invalid" })]);
  });

  it("refreshes the root cache for uninitialized members without writing into them", async () => {
    const root = await initializedRoot();
    await plainMember(root, "svc-a", "a.ts", "export const a = 1;\n");
    const before = await listTree(join(root, "svc-a"));

    const result = await refreshWorkspaceRepoMap(root);

    expect(await listTree(join(root, "svc-a"))).toEqual(before);
    expect(result.members).toEqual([
      expect.objectContaining({ name: "svc-a", skipped: ["Covered by the workspace root cache"] }),
    ]);
    expect((await readRepoMap(root)).records.some((record) => record.path === "svc-a/a.ts")).toBe(true);
  });

  it("fails clearly and writes nothing when the root is not initialized and a member is not either", async () => {
    const root = await temporaryRepository();
    await plainMember(root, "svc-a", "a.ts", "export const a = 1;\n");
    const before = await listTree(root);

    await expect(refreshWorkspaceRepoMap(root)).rejects.toThrow("workspace root is not initialized: run harnix init");

    expect(await listTree(root)).toEqual(before);
  });
});
