import { describe, expect, it } from "vitest";

import { saveWorkflow } from "src/core/workflow/save.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { replaceCheckWorkflow } from "src/core/workflow/replace-check.js";
import { assertRetryAllowed } from "src/core/workflow/retry-guard.js";
import { runCheckWorkflow, type CheckRunner } from "src/core/workflow/run-check.js";
import { buildEvidence } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const fail = (id: string, recordedAt: string) =>
  buildEvidence({ id, checkId: "check", recordedAt, result: "fail", exitCode: 1, summary: "red" });
const T1 = "2026-08-13T00:10:00.000Z";
const T2 = "2026-08-13T00:11:00.000Z";
const T3 = "2026-08-13T00:12:00.000Z";

describe("assertRetryAllowed", () => {
  it("allows a first failure, a retry after one failure and any run once a pass follows the failures", () => {
    const base = taskV3("in_progress", "implementing");

    expect(() => assertRetryAllowed(base, "check")).not.toThrow();
    expect(() => assertRetryAllowed({ ...base, evidence: [fail("f1", T1)] }, "check")).not.toThrow();
    const passed = buildEvidence({ id: "p", checkId: "check", recordedAt: T3, inputDigest: "a".repeat(64) });
    expect(() =>
      assertRetryAllowed({ ...base, evidence: [fail("f1", T1), fail("f2", T2), passed] }, "check"),
    ).not.toThrow();
  });

  it("stops after two consecutive failures, names the check and points at --replace-check", () => {
    const base = taskV3("in_progress", "implementing");
    const stopped = { ...base, evidence: [fail("f1", T1), fail("f2", T2)] };

    expect(() => assertRetryAllowed(stopped, "check")).toThrow(/Check check failed twice in a row/u);
    expect(() => assertRetryAllowed(stopped, "check")).toThrow(/--replace-check check <new-id> --reason/u);
    expect(() => assertRetryAllowed(stopped, "other")).not.toThrow();
  });
});

describe("circuit breaker on the transports", () => {
  async function twiceFailed(): Promise<string> {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const flags = { check: "check", result: "fail", summary: "red", exitCode: "1" };
    await appendEvidenceFlagsWorkflow(root, flags, T1);
    await appendEvidenceFlagsWorkflow(root, flags, T2);
    return root;
  }

  it("refuses a third failure or pass through --evidence and any save that appends evidence", async () => {
    const root = await twiceFailed();

    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", summary: "red", exitCode: "1" }, T3),
    ).rejects.toThrow(/failed twice in a row/u);
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", summary: "ok", exitCode: "0" }, T3),
    ).rejects.toThrow(/failed twice in a row/u);
    // A skipped record never resets or extends the breaker, so it stays allowed.
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "skipped", summary: "not run", exitCode: "0" }, T3),
    ).resolves.toBeDefined();
  });

  it("refuses --run-check before the command starts", async () => {
    const root = await twiceFailed();
    const calls: string[] = [];
    const runner: CheckRunner = (executable) => {
      calls.push(executable);
      return Promise.resolve({ exitCode: 0, output: "" });
    };

    await expect(runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: T3 })).rejects.toThrow(
      /failed twice in a row/u,
    );
    expect(calls).toEqual([]);
  });

  it("does not let --replace-check reset the breaker with a renamed copy, but accepts a different check", async () => {
    const root = await twiceFailed();
    const reason = "Người dùng cho phép thử giả thuyết mới";

    for (const clone of [{}, { command: "pnpm test" }, { inputs: ["src/**/*.ts"] }]) {
      await expect(
        replaceCheckWorkflow(root, { oldId: "check", newId: "check-copy", ...clone }, { reason }, T3),
      ).rejects.toThrow(/must differ from the retired check check in command, inputs or cwd/u);
    }

    await replaceCheckWorkflow(
      root,
      { oldId: "check", newId: "check-narrow", command: "pnpm vitest run test/a.test.ts", scope: "focused" },
      { reason },
      T3,
    );
    const runner: CheckRunner = () => Promise.resolve({ exitCode: 0, output: "" });
    await expect(
      runCheckWorkflow(root, "check-narrow", ["pnpm", "vitest", "run", "test/a.test.ts"], { runner, now: T3 }),
    ).resolves.toMatchObject({ result: "pass" });
  });

  it("lets a save that adds no evidence proceed", async () => {
    const root = await twiceFailed();
    const { resolveActiveTask } = await import("src/core/tasks/task.js");
    const { join } = await import("node:path");
    const task = (await resolveActiveTask(join(root, ".harnix")))!;

    await expect(
      saveWorkflow(root, { task: { ...task, updatedAt: "2026-08-13T00:13:00.000Z" } }),
    ).resolves.toBeDefined();
  });
});
