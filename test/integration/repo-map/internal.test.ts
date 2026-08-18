import { mkdir, writeFile } from "node:fs/promises";
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
});
