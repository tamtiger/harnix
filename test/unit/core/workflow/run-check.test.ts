import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { runCheckWorkflow, type CheckRunner } from "src/core/workflow/run-check.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:10:00.000Z";

function fakeRunner(exitCode: number, output = "", onRun: () => Promise<void> = async () => undefined) {
  const calls: { executable: string; args: readonly string[]; cwd: string }[] = [];
  const runner: CheckRunner = async (executable, args, cwd) => {
    calls.push({ executable, args, cwd });
    await onRun();
    return { exitCode, output };
  };
  return { runner, calls };
}

describe("workflow --run-check", () => {
  it("records a pass with the shared digest and returns the output tail without persisting it", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0, "all good");

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test", "--filter", "a b"], { runner, now: NOW });

    expect(calls).toEqual([{ executable: "pnpm", args: ["test", "--filter", "a b"], cwd: root }]);
    expect(result).toMatchObject({ evidenceId: "ev-check-1", result: "pass", exitCode: 0, outputTail: "all good" });
    expect(result.task.evidence.at(-1)).toMatchObject({
      checkId: "check",
      result: "pass",
      exitCode: 0,
      recordedAt: NOW,
      summary: "pnpm — exit 0",
    });
    expect(JSON.stringify(result.task)).not.toContain("all good");
  });

  it("records a failing run with its digest and honours a custom summary", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(3, "boom");

    const result = await runCheckWorkflow(root, "check", ["node", "x.js"], {
      runner,
      now: NOW,
      summary: "RED as intended",
    });

    expect(result).toMatchObject({ result: "fail", exitCode: 3 });
    expect(result.task.evidence.at(-1)).toMatchObject({ result: "fail", exitCode: 3, summary: "RED as intended" });
    expect(result.task.evidence.at(-1)?.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("records nothing when the inputs change while the command runs", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { runner } = fakeRunner(0, "", () => writeFile(join(root, "src", "a.ts"), "export const a = 99;\n"));

    await expect(runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW })).rejects.toThrow(
      /changed while it ran/u,
    );
    const { resolveActiveTask } = await import("src/core/tasks/task.js");
    const persisted = await resolveActiveTask(join(root, ".harnix"));
    expect(persisted?.evidence).toEqual(task.evidence);
  });

  it("keeps only the last 2000 characters of output", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(0, `${"x".repeat(5000)}END`);

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(result.outputTail).toHaveLength(2000);
    expect(result.outputTail.endsWith("END")).toBe(true);
  });

  it("rejects an undeclared check, an empty command and a run without an active task", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    await expect(runCheckWorkflow(root, "nope", ["pnpm"], { runner, now: NOW })).rejects.toThrow(/nope/u);
    await expect(runCheckWorkflow(root, "check", [], { runner, now: NOW })).rejects.toThrow(/executable/u);
    expect(calls).toEqual([]);
  });
});
