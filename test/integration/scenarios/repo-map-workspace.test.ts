import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-workspace-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

describe("repo-map --workspace with a workspace root cache", () => {
  it("serves uninitialized sub-repositories from the root cache and labels the source", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await mkdir(join(root, "svc-a"), { recursive: true });
    await writeFile(join(root, "svc-a", "package.json"), '{"name":"svc-a"}\n');
    await writeFile(join(root, "svc-a", "order.ts"), "export class OrderService {}\n");
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--refresh", "--workspace"])).resolves.toBe(0);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "repo-map", "--query", "order", "--workspace"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      members: Array<{ name: string; source?: string; status: string }>;
      results: Array<{ path: string }>;
    };
    expect(output.members).toEqual([expect.objectContaining({ name: "svc-a", source: "workspace", status: "ready" })]);
    expect(output.results.map((item) => item.path)).toEqual(["svc-a/order.ts"]);
  });

  it("exits 2 when nothing can hold the cache", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "svc-a"), { recursive: true });
    await writeFile(join(root, "svc-a", "package.json"), '{"name":"svc-a"}\n');
    process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "repo-map", "--refresh", "--workspace"])).resolves.toBe(2);
  });
});
