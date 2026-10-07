import { symlink, writeFile } from "node:fs/promises";
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

    const result = await runCheckWorkflow(root, "check", ["pnpm", "run", "test"], { runner, now: NOW });

    expect(calls).toEqual([{ executable: "pnpm", args: ["run", "test"], cwd: root }]);
    expect(result).toMatchObject({ evidenceId: "ev-check-1", result: "pass", exitCode: 0, outputTail: "" });
    expect(result.task.evidence.at(-1)).toMatchObject({
      checkId: "check",
      result: "pass",
      exitCode: 0,
      recordedAt: NOW,
      summary: "pnpm test — exit 0",
    });
    expect(JSON.stringify(result.task)).not.toContain("all good");
  });

  it("records a failing run with its digest and honours a custom summary", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(3, "boom");

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], {
      runner,
      now: NOW,
      summary: "RED as intended",
    });

    expect(result).toMatchObject({ result: "fail", exitCode: 3 });
    expect(result.task.evidence.at(-1)).toMatchObject({ result: "fail", exitCode: 3, summary: "RED as intended" });
    expect(result.task.evidence.at(-1)?.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects a command that differs from the declared one without running or recording anything", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    for (const argv of [
      ["node", "-e", "0"],
      ["pnpm", "test", "--filter", "a"],
      ["pnpm", "lint"],
    ]) {
      await expect(runCheckWorkflow(root, "check", argv, { runner, now: NOW })).rejects.toThrow(
        /differs from the command declared by check check/u,
      );
    }
    expect(calls).toEqual([]);
    const { resolveActiveTask } = await import("src/core/tasks/task.js");
    expect((await resolveActiveTask(join(root, ".harnix")))?.evidence).toEqual(task.evidence);
  });

  it("runs a check that declares no command and records the command that really ran", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { saveWorkflow } = await import("src/core/workflow/save.js");
    const { id, description, scope, required, criterionIds, inputs } = task.validationPlan[0]!;
    await saveWorkflow(root, {
      task: {
        ...task,
        checkpoint: "replan",
        validationPlan: [{ id, description, scope, required, criterionIds, inputs }],
      },
      contractRevision: { reason: "Declare the check without a command" },
    });
    const { runner, calls } = fakeRunner(0);

    const result = await runCheckWorkflow(root, "check", ["node", "tool.js", "--name", "a b"], { runner, now: NOW });

    expect(calls).toHaveLength(1);
    expect(result.task.evidence.at(-1)?.summary).toBe("node tool.js --name a b — exit 0");
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

  it("returns the short summary of a failing run and no tail for a pass", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(1, `${"x".repeat(5000)}END`);

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(result).toMatchObject({ result: "fail", exitCode: 1 });
    expect(result.outputTail).toHaveLength(600);
    expect(result.outputTail.endsWith("END")).toBe(true);
  });

  it("reports a launcher error as could not start and records nothing, so the breaker never counts it", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { runner } = fakeRunner(1, "ERR_PNPM_NO_PKG_MANIFEST  No package.json found");

    for (const now of [NOW, "2026-08-13T00:11:00.000Z", "2026-08-13T00:12:00.000Z"])
      await expect(runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now })).rejects.toThrow(
        /Check check could not start: no package\.json found in the working directory; nothing was recorded/u,
      );
    const { resolveActiveTask } = await import("src/core/tasks/task.js");
    expect((await resolveActiveTask(join(root, ".harnix")))?.evidence).toEqual(task.evidence);
  });

  it("rejects an undeclared check, an empty command and a run without an active task", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    await expect(runCheckWorkflow(root, "nope", ["pnpm"], { runner, now: NOW })).rejects.toThrow(/nope/u);
    await expect(runCheckWorkflow(root, "check", [], { runner, now: NOW })).rejects.toThrow(/executable/u);
    expect(calls).toEqual([]);
  });

  async function declareCwd(root: string, cwd: string): Promise<void> {
    const task = await implementingTaskV3(root);
    const { saveWorkflow } = await import("src/core/workflow/save.js");
    await saveWorkflow(root, {
      task: { ...task, checkpoint: "replan", validationPlan: [{ ...task.validationPlan[0]!, cwd }] },
      contractRevision: { reason: "Configure cwd for multi-repo check execution" },
    });
  }

  it("runs a check in its declared cwd and accepts an identical explicit cwd", async () => {
    const root = await temporaryRepository();
    await declareCwd(root, "packages/portal");
    const { runner, calls } = fakeRunner(0);

    await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });
    await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW, cwd: "./packages//portal/" });

    const directories = calls.map((call) => call.cwd.replaceAll("\\", "/"));
    expect(directories).toHaveLength(2);
    for (const directory of directories) expect(directory.endsWith("/packages/portal")).toBe(true);
  });

  it("rejects a run-time cwd that differs from the declared one, without running or recording anything", async () => {
    const root = await temporaryRepository();
    await declareCwd(root, "packages/portal");
    const { runner, calls } = fakeRunner(0);

    for (const cwd of ["packages/override", "..", "../other", "C:/x"]) {
      await expect(runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW, cwd })).rejects.toThrow(
        /cwd/u,
      );
    }
    expect(calls).toEqual([]);
  });

  it("rejects an explicit cwd for a check that declares none", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    await expect(
      runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW, cwd: "packages/x" }),
    ).rejects.toThrow(/declares no cwd/u);
    expect(calls).toEqual([]);
  });

  it("refuses a declared cwd that escapes the project through a directory link", async () => {
    const root = await temporaryRepository();
    const outside = await temporaryRepository();
    await declareCwd(root, "linked/work");
    await symlink(outside, join(root, "linked"), "junction");
    const { runner, calls } = fakeRunner(0);

    await expect(runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW })).rejects.toThrow(
      /escapes the project/u,
    );
    expect(calls).toEqual([]);
  });

  it("allows running checks during planning stage for baseline verification", async () => {
    const root = await temporaryRepository();
    const { initializeUtcProject } = await import("test/support/workflow-fixtures.js");
    await initializeUtcProject(root);
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "index.ts"), "export const ok = 1;\n");

    const { initTaskWorkflow } = await import("src/core/workflow/init-task.js");
    await initTaskWorkflow(root, {
      title: "Baseline Planning Task",
      command: "pnpm test",
    });

    const { runner } = fakeRunner(0, "baseline passed");
    const result = await runCheckWorkflow(root, "check-1", ["pnpm", "test"], { runner, now: NOW });

    expect(result.result).toBe("pass");
    expect(result.task.status).toBe("planning");
    expect(result.task.evidence).toHaveLength(1);
    expect(result.task.evidence[0]?.checkId).toBe("check-1");
  });
});
