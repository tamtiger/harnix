import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { snapshotTree } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-read-only-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

/** Read-only commands: whatever they answer outside an initialized project, they must not leave a trace there. */
const READ_ONLY_COMMANDS: string[][] = [
  ["status"],
  ["status", "--summary"],
  ["status", "--explain"],
  ["verify-plan"],
  ["verify-plan", "--recursive", "--brief"],
  ["repo-map", "--query", "service"],
  ["context-report", "--platform", "codex"],
  ["tasks"],
  ["epic"],
  ["workflow", "--preflight"],
  ["workflow", "--preflight", "--brief"],
  ["workflow", "--inspect"],
  ["workflow", "--schema"],
];

describe.sequential("read-only commands outside an initialized project", () => {
  it.each(READ_ONLY_COMMANDS.map((argv) => [argv.join(" "), argv] as const))(
    "answers harnix %s without creating or changing any file",
    async (_title, argv) => {
      const root = await temporaryRepository();
      await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
      process.chdir(root);
      const before = await snapshotTree(root);
      const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

      const code = await runCli(["node", "harnix", ...argv]);

      // The command really ran and answered (a result on stdout, or an error on stderr), whichever way it ended.
      expect([0, 1, 2]).toContain(code);
      expect(stdout.mock.calls.length + stderr.mock.calls.length).toBeGreaterThan(0);
      await expect(snapshotTree(root)).resolves.toEqual(before);
      await expect(access(join(root, ".harnix"))).rejects.toThrow();
    },
  );
});
