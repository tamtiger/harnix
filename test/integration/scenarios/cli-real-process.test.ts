import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-real-process-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

/** No injected runner: `--run-checks` starts real `node` processes, as an agent's call would. */
async function workflow(...argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "workflow", ...argv]);
  const captured = { code, out: output(stdout.mock.calls), err: output(stderr.mock.calls) };
  stdout.mockRestore();
  stderr.mockRestore();
  return captured;
}

async function project(): Promise<void> {
  const root = await fixture();
  await initializeProject({ developer: "tam", root, yes: true });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.js"), "export const a = 1;\n");
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "real-process", private: true }));
  process.chdir(root);
}

describe.sequential("real-process workflow commands", () => {
  it("creates a task from flags and runs its checks with real processes, stopping at the first failure", async () => {
    await project();

    const created = await workflow(
      ...["--init", "--title", "Real run", "--slug", "real-run", "--command", "node -e process.exit(0)"],
      ...["--input", "src/**", "--text", "First", "--text", "Second"],
      ...["--with-check", "id=check-bad;command=node -e process.exit(3);criteria=ac-2;input=src/**", "--brief"],
    );
    const run = await workflow("--run-checks");
    const inspected = JSON.parse((await workflow("--inspect")).out) as {
      activeTask: { evidence: { checkId: string; result: string; exitCode: number }[] };
    };

    expect(created.code).toBe(0);
    expect(JSON.parse(run.out)).toEqual({
      ran: [
        { id: "check-1", result: "pass", exitCode: 0 },
        { id: "check-bad", result: "fail", exitCode: 3, outputTail: "" },
      ],
      remaining: [],
    });
    expect(inspected.activeTask.evidence.map(({ checkId, result, exitCode }) => [checkId, result, exitCode])).toEqual([
      ["check-1", "pass", 0],
      ["check-bad", "fail", 3],
    ]);
  });

  it("reports a command that cannot start as could not start and records no evidence", async () => {
    await project();
    await workflow(
      ...[
        "--init",
        "--title",
        "Missing command",
        "--slug",
        "missing-command",
        "--command",
        "harnix-no-such-command-xyz",
      ],
      ...["--input", "src/**", "--brief"],
    );

    const run = await workflow("--run-checks");
    const inspected = JSON.parse((await workflow("--inspect")).out) as { activeTask: { evidence: unknown[] } };

    expect(run.code).not.toBe(0);
    expect(run.err).toMatch(/could not start/iu);
    expect(inspected.activeTask.evidence).toEqual([]);
  });
});
