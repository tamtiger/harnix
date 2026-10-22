import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { readConfig } from "src/core/config/config.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-update-refresh-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

interface UpdateOutput {
  configRefreshed: { added: { packages: string[]; languages: string[]; technologies: string[] }; dryRun: boolean };
}

async function updateOutput(...args: string[]): Promise<{ code: number; output: UpdateOutput }> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "update", ...args]);
  const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as UpdateOutput;
  stdout.mockRestore();
  return { code, output };
}

async function packageDir(root: string, path: string): Promise<void> {
  await mkdir(join(root, path), { recursive: true });
  await writeFile(join(root, path, "index.ts"), "export const value = 1;");
  await writeFile(
    join(root, path, "package.json"),
    JSON.stringify({ name: path.replaceAll("/", "-"), scripts: { test: "vitest run" } }),
  );
}

describe.sequential("harnix update refreshes config.yaml", () => {
  it("previews with --dry-run, adds missing packages once, and never touches tool worktrees or existing entries", async () => {
    const root = await temporaryRepository();
    await packageDir(root, "svc-a");
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    const before = await readFile(configPath, "utf8");
    await packageDir(root, "svc-b");
    await packageDir(root, ".kilo/worktrees/steel");
    process.chdir(root);

    const preview = await updateOutput("--dry-run");
    expect(preview.output.configRefreshed.dryRun).toBe(true);
    expect(preview.output.configRefreshed.added.packages).toEqual(["svc-b"]);
    expect(await readFile(configPath, "utf8")).toBe(before);

    const applied = await updateOutput();
    expect(applied.code).toBe(0);
    expect(applied.output.configRefreshed.added.packages).toEqual(["svc-b"]);
    const config = await readConfig(configPath);
    expect(config.packages.map((item) => item.path)).toEqual(expect.arrayContaining(["svc-a", "svc-b"]));
    expect(config.packages.some((item) => item.path.includes(".kilo"))).toBe(false);
    expect(JSON.stringify(applied.output)).not.toContain(root);

    const again = await readFile(configPath, "utf8");
    const second = await updateOutput();
    expect(second.output.configRefreshed.added).toEqual({ languages: [], packages: [], technologies: [] });
    expect(await readFile(configPath, "utf8")).toBe(again);
  });

  it("fails like update does on a config that is not valid and writes nothing", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    await writeFile(configPath, "not: [valid");
    process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "update"])).resolves.toBe(2);

    expect(await readFile(configPath, "utf8")).toBe("not: [valid");
  });
});
