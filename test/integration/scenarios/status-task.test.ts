import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { buildTaskV3 } from "test/support/builders.js";
import { snapshotTree } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-status-task-");

const ACTIVE = "20260826-000000-active-one";
const OTHER = "20260826-000001-other-member";

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function twoTaskProject(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  const harnix = join(root, ".harnix");
  await saveTask(harnix, buildTaskV3({ id: ACTIVE, title: "Active one", goal: "Active goal" }));
  await saveTask(harnix, buildTaskV3({ id: OTHER, title: "Other member", goal: "Other goal" }));
  await setActiveTask(harnix, ACTIVE);
  process.chdir(root);
  return root;
}

async function run(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "status", ...args]);
  const text = (spy: typeof stdout) => spy.mock.calls.map((call) => String(call[0])).join("");
  const result = { code, stdout: text(stdout), stderr: text(stderr) };
  stdout.mockRestore();
  stderr.mockRestore();
  return result;
}

describe.sequential("status --task", () => {
  it.each([
    ["--criteria", (json: { taskId: string }) => json.taskId],
    ["--checks", (json: { taskId: string }) => json.taskId],
    ["--summary", (json: { activeTask: { id: string } }) => json.activeTask.id],
    [undefined, (json: { activeTask: { id: string } }) => json.activeTask.id],
  ] as const)("reads another task with %s without moving the active pointer", async (mode, pick) => {
    const root = await twoTaskProject();
    const before = await snapshotTree(root);

    const { code, stdout } = await run([...(mode === undefined ? [] : [mode]), "--task", OTHER]);

    expect(code).toBe(0);
    expect((pick as (json: unknown) => string)(JSON.parse(stdout))).toBe(OTHER);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("reads another task with --explain", async () => {
    await twoTaskProject();

    const { code, stdout } = await run(["--explain", "--task", OTHER]);

    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({ activeTask: { id: OTHER } });
  });

  it("without --task keeps answering about the active task", async () => {
    await twoTaskProject();

    const { stdout } = await run(["--criteria"]);

    expect(JSON.parse(stdout)).toMatchObject({ taskId: ACTIVE });
  });

  it("answers an unknown task id with the valid ids and the nearest one", async () => {
    await twoTaskProject();

    const { code, stderr } = await run(["--task", "20260826-000001-other-membre"]);

    expect(code).not.toBe(0);
    expect(stderr).toContain(OTHER);
    expect(stderr).toContain("Có phải ý bạn là");
  });

  it("refuses a malformed task id and --task together with --workspace", async () => {
    await twoTaskProject();

    expect((await run(["--task", "not-an-id"])).code).toBe(2);
    expect((await run(["--workspace", "--task", OTHER])).code).toBe(2);
  });
});
