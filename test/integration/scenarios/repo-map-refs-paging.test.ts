import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-repo-map-paging-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

async function refs(args: string[]): Promise<Record<string, unknown>> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  await runCli(["node", "harnix", "repo-map", ...args]);
  const text = stdout.mock.calls.map((call) => String(call[0])).join("");
  stdout.mockRestore();
  return JSON.parse(text) as Record<string, unknown>;
}

describe.sequential("repo-map --refs --offset", () => {
  it("lists every caller across pages and rejects --offset without --refs", async () => {
    const root = await temporaryRepository();
    await mkdir(join(root, "src"), { recursive: true });
    const calls = Array.from({ length: 25 }, (_, index) => `run(${index});`);
    await writeFile(join(root, "src", "many.ts"), ["export function run(n: number) {}", ...calls, ""].join("\n"));
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);

    const first = await refs(["--refs", "run"]);
    const second = await refs(["--refs", "run", "--offset", String(first.nextOffset)]);

    expect(first).toMatchObject({ nextOffset: 20, truncated: true });
    expect((first.references as unknown[]).length).toBe(20);
    expect((second.references as unknown[]).length).toBe(6);
    expect(second).toMatchObject({ truncated: false });
    expect(await refs(["--query", "run", "--offset", "1"])).toMatchObject({ ok: false });
  });
});
