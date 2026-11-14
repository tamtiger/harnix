import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-workflow-hints-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function run(argv: string[]) {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "workflow", ...argv], {});
  const result = { code, out: output(stdout.mock.calls), err: output(stderr.mock.calls) };
  stdout.mockRestore();
  stderr.mockRestore();
  return result;
}

/** The JSON error line a failed workflow command prints on stdout. */
const errorOf = (out: string): { message: string; hint?: string } =>
  (JSON.parse(out.trim().split("\n").at(-1)!) as { error: { message: string; hint?: string } }).error;

describe("workflow error hints", () => {
  it("tells a second --init how to create a task without moving the active pointer", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run(["--init", "--title", "Second task", "--command", "pnpm test"]);

    expect(result.code).toBe(2);
    expect(errorOf(result.out).hint).toMatch(/--no-activate.*harnix pause.*--task/su);
  });

  it("names the covering check when --add-criterion lacks --check", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run(["--add-criterion", "ac-9", "--text", "Một tiêu chí mới"]);

    expect(result.code).toBe(2);
    expect(errorOf(result.out).hint).toMatch(
      /--add-criterion <id> --text.*--check <check-id>.*harnix status --checks/su,
    );
  });

  it("shows the full form when --add-decision lacks --rationale", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run(["--add-decision", "dec-1", "--text", "Một quyết định"]);

    expect(result.code).toBe(2);
    expect(errorOf(result.out).hint).toMatch(/--add-decision <id> --text.*--rationale/su);
  });

  it("shows a runnable --evidence form when --exit-code is missing", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run(["--evidence", "--check", "check", "--result", "pass", "--summary", "đã chạy"]);

    expect(result.code).toBe(2);
    expect(errorOf(result.out).hint).toMatch(/--exit-code 0.*--evidence --check/su);
  });
});
