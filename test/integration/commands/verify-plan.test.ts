import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const execFileAsync = promisify(execFile);
const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-verify-plan-cmd-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("verify-plan command", () => {
  it("outputs verify plan in json format", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });

    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        scripts: { test: "vitest run", lint: "eslint ." },
      }),
    );

    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "verify-plan"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      hasTests: true,
      commands: {
        test: "npm run test",
        lint: "npm run lint",
      },
    });
  });

  it("narrows the package list with --path, --changed and --brief", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\n");
    for (const name of ["a", "b"]) {
      await mkdir(join(root, "packages", name), { recursive: true });
      await writeFile(
        join(root, "packages", name, "package.json"),
        JSON.stringify({ name, scripts: { test: "vitest run" } }),
      );
    }
    await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    const identity = ["-c", "user.email=t@example.com", "-c", "user.name=t", "-c", "commit.gpgsign=false"];
    await execFileAsync("git", [...identity, "commit", "-q", "-m", "base"], { cwd: root });
    await writeFile(join(root, "packages", "b", "index.ts"), "export const value = 2;\n");
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "verify-plan", "--path", "packages", "--changed", "--brief"])).resolves.toBe(
      0,
    );

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      packages: { path: string; hasTests: boolean; commands: Record<string, string> }[];
    };
    // --path alone keeps both packages; only --changed leaves the one Git sees as modified.
    expect(output.packages).toEqual([{ path: "packages/b", hasTests: true, commands: { test: "npm run test" } }]);
  });
});
