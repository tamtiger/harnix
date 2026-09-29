import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

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
});
