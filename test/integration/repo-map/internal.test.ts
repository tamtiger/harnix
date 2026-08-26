import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "../../../src/cli-program.js";
import { initializeProject } from "../../../src/commands/init.js";
import { useTemporaryRepositories } from "../../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-cli-");
const originalCwd = process.cwd();
afterEach(() => { process.chdir(originalCwd); vi.restoreAllMocks(); });

describe("repository-map operations", () => {
  it("initializes and supports query or refresh as exclusive repo-map actions", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "billing.ts"), "export function bill(orderId: string) { return orderId; }\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram().parseAsync(["node", "harnix", "repo-map", "--refresh"], { from: "node" });
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ scope: "project", status: "refreshed" });
    stdout.mockClear();
    await createProgram().parseAsync(["node", "harnix", "repo-map", "--query", "billing"], { from: "node" });
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ scope: "project", status: "ready", results: [expect.objectContaining({ path: "src/billing.ts" })] });
    expect(createProgram().helpInformation()).toContain("repo-map");
    await expect(runCli(["node", "harnix", "repo-map", "--query", "billing", "--refresh"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "repo-map", "--refresh", "--limit", "3"])).resolves.toBe(2);
  });

  it("reports exact-path dependency impact from cache without changing project files", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "dep.ts"), "export const dependency = true;\n");
    await writeFile(join(root, "src", "billing.ts"), "import './dep';\nexport const billing = true;\n");
    await writeFile(join(root, "src", "api.ts"), "import './billing';\nexport const api = true;\n");
    await writeFile(join(root, "src", "app.ts"), "import './api';\nexport const app = true;\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/billing.ts", "--depth", "2", "--limit", "20"])).resolves.toBe(0);

    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      target: "src/billing.ts",
      depth: 2,
      limit: 20,
      dependencies: ["src/dep.ts"],
      dependents: [
        { path: "src/api.ts", distance: 1 },
        { path: "src/app.ts", distance: 2 },
      ],
      truncated: { dependencies: false, dependents: false },
    });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("returns stable cache/target states and rejects ambiguous impact flags", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "present.ts"), "export const present = true;\n");
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/missing.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ status: "not-found", dependencies: [], dependents: [] });

    for (const argv of [
      ["node", "harnix", "repo-map", "--impact", "./src/present.ts"],
      ["node", "harnix", "repo-map", "--impact", "src/present.ts", "--depth", "0"],
      ["node", "harnix", "repo-map", "--query", "present", "--impact", "src/present.ts"],
      ["node", "harnix", "repo-map", "--query", "present", "--depth", "2"],
      ["node", "harnix", "repo-map", "--refresh", "--depth", "2"],
    ]) {
      stdout.mockClear();
      await expect(runCli(argv)).resolves.toBe(2);
    }

    const cachePath = join(root, ".harnix", "cache", "repo-map-v1.json");
    await rm(cachePath);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/present.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ status: "missing", dependencies: [], dependents: [] });

    await writeFile(cachePath, "{}\n");
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--impact", "src/present.ts"])).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ status: "invalid", dependencies: [], dependents: [] });
  });
});

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walk(root);
  return Promise.all(files.map(async (path) => ({
    path: path.slice(root.length + 1).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(await readFile(path)).digest("hex"),
  })));
}

async function walk(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
