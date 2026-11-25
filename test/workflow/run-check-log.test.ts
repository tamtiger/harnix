// harnix-secret-waiver: the connection string and api key below are made-up values for the redaction test.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { saveWorkflow } from "src/core/workflow/index.js";
import { runCheckWorkflow, type CheckRunner } from "src/core/workflow/run-check.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  commandlessImplementingTaskV3,
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:10:00.000Z";

function fakeRunner(exitCode: number, output = "") {
  const calls: { executable: string; args: readonly string[]; cwd: string }[] = [];
  const runner: CheckRunner = async (executable, args, cwd) => {
    calls.push({ executable, args, cwd });
    return { exitCode, output };
  };
  return { runner, calls };
}

const logPath = (root: string) => join(root, ".harnix", "tmp", "check-logs", "check.log");

describe("workflow --run-check without a command", () => {
  it("runs the declared command and cwd when nothing follows the check id", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0, "all good");

    const result = await runCheckWorkflow(root, "check", [], { runner, now: NOW });

    expect(result).toMatchObject({ result: "pass", exitCode: 0 });
    expect(calls).toHaveLength(1);
    expect([calls[0]?.executable, ...(calls[0]?.args ?? [])].join(" ")).toBe(task.validationPlan[0]?.command);
    expect(calls[0]?.cwd).toBe(root);
  });

  it("still rejects an explicit command that differs from the declared one, and names the short form", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    await expect(runCheckWorkflow(root, "check", ["node", "-e", "0"], { runner, now: NOW })).rejects.toThrow(
      /Rerun exactly: harnix workflow --run-check check -- pnpm test[\s\S]*harnix workflow --run-check check\b/u,
    );
    expect(calls).toEqual([]);
  });

  it("refuses to guess a command for a check that declares none", async () => {
    const root = await temporaryRepository();
    await commandlessImplementingTaskV3(root);
    const { runner, calls } = fakeRunner(0);

    await expect(runCheckWorkflow(root, "check", [], { runner, now: NOW })).rejects.toThrow(
      /declares no command[\s\S]*--set-check check --command/u,
    );
    expect(calls).toEqual([]);
  });
});

describe("workflow --run-check failure log", () => {
  it("writes the whole output of a failing check to a log and returns its relative path", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const lines = Array.from({ length: 60 }, (_, index) => `step ${index} C:\\Users\\dev\\repo\\file${index}.ts`);
    const { runner } = fakeRunner(1, `${lines.join("\n")}\nboom`);

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(result).toMatchObject({ result: "fail", logPath: ".harnix/tmp/check-logs/check.log" });
    const text = await readFile(logPath(root), "utf8");
    expect(text).toContain("step 0 <path>");
    expect(text).toContain("step 59 <path>");
    expect(text).toContain("boom");
    expect(text).not.toContain("Users");
    expect(result.outputTail.length).toBeLessThan(text.length);
  });

  it("hides a connection-string password in the failure summary as well as in the log", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(
      1,
      "connect failed DATABASE_URL=postgres://u:pw123456@host/db\nAPI_KEY=sk-live-abcdef",
    );

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(result.outputTail).not.toContain("pw123456");
    expect(result.outputTail).not.toContain("sk-live-abcdef");
    expect(result.outputTail).toContain("connect failed");
  });

  it("writes no log for a pass and removes the log of an earlier failure", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await mkdir(join(root, ".harnix", "tmp", "check-logs"), { recursive: true });
    await writeFile(logPath(root), "stale failure");
    const { runner } = fakeRunner(0, "all good");

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(result.logPath).toBeUndefined();
    await expect(stat(logPath(root))).rejects.toThrow();
  });

  it("adds nothing to the evidence or the task record", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const { runner } = fakeRunner(1, "boom");

    const result = await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(JSON.stringify(result.task)).not.toContain("check-logs");
    expect(Object.keys(result.task.evidence.at(-1) ?? {})).not.toContain("logPath");
  });

  it("keeps the input digest unchanged by the log, even when an input glob covers everything", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const planning = taskV3("planning", "planning", ["**"]);
    await saveWorkflow(root, { task: planning });
    const ready = { ...planning, status: "ready" as const, checkpoint: "ready" as const };
    await saveWorkflow(root, { task: ready });
    await saveWorkflow(root, {
      task: { ...ready, status: "in_progress" as const, checkpoint: "implementing" as const },
    });
    const before = (await snapshotWorkflow(root, "check")).inputDigest;
    const { runner } = fakeRunner(1, "boom");

    await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: NOW });

    expect(await readFile(logPath(root), "utf8")).toContain("boom");
    expect((await snapshotWorkflow(root, "check")).inputDigest).toBe(before);
  });
});
