import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { selectActions } from "src/commands/workflow-flags.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import type { CheckRunner } from "src/core/workflow/run-check.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";
import { saveWorkflow } from "src/core/workflow/save.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-workflow-batch-run-checks-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function run(argv: string[], options: Parameters<typeof runCli>[1] = {}) {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "workflow", ...argv], options);
  const result = { code, out: output(stdout.mock.calls), err: output(stderr.mock.calls) };
  stdout.mockRestore();
  stderr.mockRestore();
  return result;
}

const BATCH = [
  "--run-checks",
  "--criterion",
  "a",
  "--met",
  "--transition",
  "verifying/finishing",
  "--finish",
  "--brief",
];

describe("workflow --run-checks in a finish batch: selection", () => {
  it("orders run-checks, criterion, transition and finish whatever the flag order", () => {
    expect(
      selectActions({ finish: true, transition: "verifying/finishing", criterion: "a", met: true, runChecks: true }),
    ).toEqual(["runChecks", "criterion", "transition", "finish"]);
    expect(selectActions({ runChecks: true, criterion: "a", met: true })).toEqual(["runChecks", "criterion"]);
  });

  it("refuses combinations that would hide a gate", () => {
    expect(() => selectActions({ runChecks: true, finish: true })).toThrow(/--finish[\s\S]*verifying\/finishing/u);
    expect(() => selectActions({ runChecks: true, transition: "verifying/verifying" })).toThrow(
      /verifying\/finishing/u,
    );
    expect(() => selectActions({ runChecks: true, transition: "ready/ready" })).toThrow(/verifying\/finishing/u);
    expect(() => selectActions({ runChecks: true, inspect: true })).toThrow(/exactly one of/u);
    expect(() => selectActions({ runChecks: true, criterion: "a", met: true, dryRun: true })).toThrow(/--dry-run/u);
  });
});

describe.sequential("workflow --run-check without a command", () => {
  it("runs the declared command through the injected runner", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const calls: string[][] = [];
    const checkRunner: CheckRunner = async (executable, args) => {
      calls.push([executable, ...args]);
      return { exitCode: 0, output: "all good" };
    };

    const result = await run(["--run-check", "check", "--brief"], { checkRunner });

    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({ result: "pass", exitCode: 0 });
    expect(calls).toEqual([["pnpm", "test"]]);
  });

  it("returns logPath for a failing check and keeps stdout one line of JSON", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const checkRunner: CheckRunner = async () => ({ exitCode: 1, output: "boom" });

    const result = await run(["--run-check", "check", "--brief"], { checkRunner });

    expect(JSON.parse(result.out)).toMatchObject({
      result: "fail",
      logPath: ".harnix/tmp/check-logs/check.log",
      outputTail: "boom",
    });
  });
});

describe.sequential("workflow --run-checks in a finish batch", () => {
  it("runs the checks, marks the criteria, moves to finishing and finishes in one command", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const checkRunner: CheckRunner = async () => ({ exitCode: 0, output: "all good" });

    const result = await run(BATCH, { checkRunner });

    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({ status: "completed" });
  });

  it("stops at the first failing check and keeps the task verifying", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const checkRunner: CheckRunner = async () => ({ exitCode: 1, output: "boom" });

    const result = await run(BATCH, { checkRunner });

    expect(JSON.parse(result.out)).toMatchObject({
      ran: [{ id: "check", result: "fail", logPath: ".harnix/tmp/check-logs/check.log" }],
      remaining: [],
      skipped: ["criterion", "transition", "finish"],
    });
    const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
    expect(task).toMatchObject({ status: "verifying", checkpoint: "verifying" });
  });

  it("refuses a ready task with the hint to start implementation first, running nothing", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, { task: { ...planning, status: "ready", checkpoint: "ready" } });
    process.chdir(root);
    const checkRunner = vi.fn<CheckRunner>(async () => ({ exitCode: 0, output: "ok" }));

    const result = await run(BATCH, { checkRunner });

    expect(result.code).not.toBe(0);
    expect(result.err).toMatch(/in_progress or verifying \(this one is ready\)/u);
    expect(checkRunner).not.toHaveBeenCalled();
  });

  it("marks criteria after the checks without finishing when only --criterion is added", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const checkRunner: CheckRunner = async () => ({ exitCode: 0, output: "all good" });

    const result = await run(["--run-checks", "--criterion", "a", "--met", "--brief"], { checkRunner });

    expect(result.code, result.err).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({ status: "verifying" });
  });
});
