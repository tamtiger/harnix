import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { runCli } from "src/cli-program.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-init-artifacts-");
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

async function project(): Promise<string> {
  const root = await fixture();
  await initializeUtcProject(root);
  await mkdir(join(root, "notes"), { recursive: true });
  await writeFile(join(root, "notes", "prd.md"), "# PRD của tôi\n\nNội dung riêng.\n", "utf8");
  await writeFile(join(root, "notes", "plan.md"), "- [ ] [chk-1] Slice riêng\n", "utf8");
  process.chdir(root);
  return root;
}

describe("workflow --init artifacts and task directory", () => {
  it("prints the repository-relative task directory", async () => {
    await project();
    const result = await run(["--init", "--title", "Dir", "--command", "pnpm test", "--brief"]);

    expect(result.code, result.err).toBe(0);
    const parsed = JSON.parse(result.out) as { id: string; taskDir: string };
    expect(parsed.taskDir).toBe(`.harnix/tasks/${parsed.id.slice(0, 4)}-${parsed.id.slice(4, 6)}/${parsed.id}`);
  });

  it("writes --prd-file and --plan-file instead of the templates for a Full task", async () => {
    const root = await project();
    const result = await run([
      "--init",
      "--title",
      "Full",
      "--mode",
      "full",
      "--command",
      "pnpm test",
      "--prd-file",
      "notes/prd.md",
      "--plan-file",
      "notes/plan.md",
      "--brief",
    ]);

    expect(result.code, result.err).toBe(0);
    const { taskDir } = JSON.parse(result.out) as { taskDir: string };
    expect(await readFile(join(root, taskDir, "prd.md"), "utf8")).toBe("# PRD của tôi\n\nNội dung riêng.\n");
    expect(await readFile(join(root, taskDir, "plan.md"), "utf8")).toBe("- [ ] [chk-1] Slice riêng\n");
  });

  it("refuses the files for a Lite task and a path that leaves the project", async () => {
    await project();
    const lite = await run(["--init", "--title", "Lite", "--command", "pnpm test", "--prd-file", "notes/prd.md"]);
    expect(lite.code).not.toBe(0);
    expect(lite.err).toMatch(/--mode full/u);

    const outside = await run([
      "--init",
      "--title",
      "Out",
      "--mode",
      "full",
      "--command",
      "pnpm test",
      "--plan-file",
      "../escape.md",
    ]);
    expect(outside.code).not.toBe(0);
  });
});
