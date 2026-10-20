import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const fixture = useTemporaryRepositories("harnix-doctor-exit-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-exit-home-");
const originalCwd = process.cwd();
afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

async function warningOnlyProject(): Promise<{
  commandLookup: () => Promise<boolean>;
  environment: Record<string, string>;
  homeResolver: () => Promise<string>;
}> {
  const root = await fixture();
  const home = await temporaryUserHome();
  process.chdir(root);
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], {
    from: "node",
  });
  await rm(join(root, ".harnix", "workflow.md"));
  return {
    commandLookup: async () => true,
    environment: { CODEX_HOME: join(home, "codex") },
    homeResolver: async () => home,
  };
}

describe("doctor --allow-warnings", () => {
  it("exits 1 by default and 0 with the flag when there are only warnings, with the same JSON", async () => {
    const options = await warningOnlyProject();
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "doctor"], options)).resolves.toBe(1);
    const strict = JSON.parse(String(stdout.mock.calls.at(-1)?.[0])) as { ok: boolean; summary: { errors: number } };
    await expect(runCli(["node", "harnix", "doctor", "--allow-warnings"], options)).resolves.toBe(0);
    const relaxed = JSON.parse(String(stdout.mock.calls.at(-1)?.[0])) as typeof strict;

    expect(strict.summary.errors).toBe(0);
    expect(relaxed).toEqual(strict);
    expect(relaxed.ok).toBe(false);
  });

  it("still exits 2 for invalid state and combines with --fix and --global", async () => {
    const options = await warningOnlyProject();

    await expect(
      runCli(["node", "harnix", "doctor", "--allow-warnings", "--fix", "--global"], options),
    ).resolves.not.toBe(2);
    await writeFile(join(process.cwd(), ".harnix", "config.yaml"), "not: [valid");
    await expect(runCli(["node", "harnix", "doctor", "--allow-warnings"], options)).resolves.toBe(2);
  });

  it("reports config-packages-drift as information only: ok, the summary and the exit code stay clean", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await mkdir(join(root, "svc"), { recursive: true });
    await writeFile(
      join(root, "svc", "package.json"),
      JSON.stringify({ name: "svc", scripts: { test: "vitest run" } }),
    );
    await writeFile(join(root, "svc", "index.ts"), "export const svc = 1;\n");
    await refreshRepoMap({ root });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const options = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };

    await expect(runCli(["node", "harnix", "doctor"], options)).resolves.toBe(0);

    const report = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      ok: boolean;
      project: { findings: Array<{ code: string; severity: string }> };
      summary: { errors: number; warnings: number };
    };
    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "config-packages-drift", severity: "info" }),
    );
    expect([report.ok, report.summary.errors, report.summary.warnings]).toEqual([true, 0, 0]);
  });
});
