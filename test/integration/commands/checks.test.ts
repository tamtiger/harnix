import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV1, type TaskRecordV3 } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildEvidence, buildTaskV1 } from "test/support/builders.js";
import { buildGatedTask, buildLegacyEvidence, output, snapshotTree } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-checks-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("status --explain (checks projection)", () => {
  it("classifies and sorts required v1 checks without exposing private check or evidence prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const now = Date.parse("2026-08-26T01:00:00.000Z");
    const task = v1Task();
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(
      runCli(["node", "harnix", "status", "--explain", "--limit", "50"], { statusClock: () => now }),
    ).resolves.toBe(0);

    const raw = output(stdout.mock.calls);
    const result = (
      JSON.parse(raw) as {
        explain: {
          checks: {
            activeTask: {
              summary: unknown;
              checks: Array<{ id: string; state: string; reasonCodes: string[]; changes: unknown[] }>;
            };
          };
        };
      }
    ).explain.checks;
    expect(result).toMatchObject({ generator: "harnix", schemaVersion: 1, scope: "project", filter: { limit: 50 } });
    expect(result.activeTask.summary).toEqual({
      passed: 0,
      failed: 1,
      stale: 2,
      pending: 2,
      total: 5,
      returned: 5,
      resultTruncated: false,
      detailsTruncated: false,
    });
    expect(result.activeTask.checks.map(({ id, state, reasonCodes }) => ({ id, state, reasonCodes }))).toEqual([
      { id: "a-failed", state: "failed", reasonCodes: ["latest-failed"] },
      { id: "b-passed", state: "stale", reasonCodes: ["legacy-schema"] },
      { id: "c-skipped", state: "pending", reasonCodes: ["latest-skipped"] },
      { id: "m-expired", state: "stale", reasonCodes: ["legacy-schema"] },
      { id: "z-pending", state: "pending", reasonCodes: ["no-evidence"] },
    ]);
    expect(result.activeTask.checks.every((check) => check.changes.length === 0)).toBe(true);
    for (const canary of [
      "PRIVATE_TITLE_CANARY",
      "PRIVATE_GOAL_CANARY",
      "PRIVATE_CHECK_CANARY",
      "PRIVATE_COMMAND_CANARY",
      "PRIVATE_EVIDENCE_CANARY",
      root,
    ])
      expect(raw).not.toContain(canary);
    await expect(snapshotTree(root)).resolves.toEqual(before);

    stdout.mockClear();
    await expect(
      runCli(["node", "harnix", "status", "--explain", "--limit", "2"], { statusClock: () => now }),
    ).resolves.toBe(0);
    expect((JSON.parse(output(stdout.mock.calls)) as { explain: { checks: unknown } }).explain.checks).toMatchObject({
      activeTask: { summary: { total: 5, returned: 2, resultTruncated: true, detailsTruncated: true } },
    });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("reports a v3 digest mismatch after an input changes without running or writing", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const harnixRoot = join(root, ".harnix");
    const base = v3Task();
    const snapshot = await computeInputDigest(root, base, "gate");
    const task: TaskRecordV3 = {
      ...base,
      evidence: [
        buildEvidence({
          id: "e-pass",
          checkId: "gate",
          recordedAt: "2026-08-26T00:59:00.000Z",
          summary: "PRIVATE_EVIDENCE_CANARY",
          inputDigest: snapshot.inputDigest,
        }),
      ],
    };
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(
      runCli(["node", "harnix", "status", "--explain"], { statusClock: () => Date.parse("2026-08-26T01:00:00.000Z") }),
    ).resolves.toBe(0);

    const raw = output(stdout.mock.calls);
    expect((JSON.parse(raw) as { explain: { checks: unknown } }).explain.checks).toMatchObject({
      activeTask: {
        summary: { passed: 0, failed: 0, stale: 1, pending: 0, total: 1, returned: 1 },
        checks: [
          {
            id: "gate",
            state: "stale",
            reasonCodes: ["digest-mismatch"],
            changeSummary: { changed: 0, missing: 0, returned: 0, truncated: false },
            changes: [],
          },
        ],
      },
    });
    for (const canary of ["PRIVATE_EVIDENCE_CANARY", "PRIVATE_COMMAND_CANARY", snapshot.inputDigest, root])
      expect(raw).not.toContain(canary);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("returns no-active metadata and rejects invalid limits", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--explain"])).resolves.toBe(0);
    expect((JSON.parse(output(stdout.mock.calls)) as { explain: { checks: unknown } }).explain.checks).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      filter: { limit: 20 },
      activeTask: null,
    });

    for (const limit of ["0", "51", "1.5", "private"]) {
      stdout.mockClear();
      await expect(runCli(["node", "harnix", "status", "--explain", "--limit", limit])).resolves.toBe(2);
      expect(JSON.parse(output(stdout.mock.calls))).toMatchObject({ ok: false, error: { exitCode: 2 } });
    }
  });

  it("redacts malformed active-task parser input", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const id = "20260826-162002-checks-malformed";
    await mkdir(join(harnixRoot, "tasks", id), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", id, "task.json"), "PRIVATE_TASK_PARSE_CANARY");
    await writeFile(join(harnixRoot, "tasks", ".active"), `${id}\n`);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--explain"])).resolves.toBe(2);

    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "Status task state is unavailable; run harnix doctor." },
    });
    expect(raw).not.toContain("PRIVATE_TASK_PARSE_CANARY");
    expect(raw).not.toContain(root);
  });
});

function v1Task(): TaskRecordV1 {
  const checks = ["z-pending", "m-expired", "a-failed", "c-skipped", "b-passed"].map((id) => ({
    id,
    description: "PRIVATE_CHECK_CANARY",
    command: "PRIVATE_COMMAND_CANARY",
    scope: "focused" as const,
    required: true,
  }));
  const evidence = (
    id: string,
    checkId: string,
    recordedAt: string,
    result: "pass" | "fail" | "skipped",
    exitCode: number,
  ) => buildLegacyEvidence({ id, checkId, recordedAt, result, exitCode, summary: "PRIVATE_EVIDENCE_CANARY" });
  return buildTaskV1({
    id: "20260826-162000-checks-v1",
    title: "PRIVATE_TITLE_CANARY",
    status: "verifying",
    checkpoint: "verifying",
    goal: "PRIVATE_GOAL_CANARY",
    validationPlan: checks,
    evidence: [
      evidence("e-expired", "m-expired", "2026-08-25T22:00:00.000Z", "pass", 0),
      evidence("e-failed", "a-failed", "2026-08-26T00:59:00.000Z", "fail", 1),
      evidence("e-skipped", "c-skipped", "2026-08-26T00:59:00.000Z", "skipped", 0),
      evidence("e-passed", "b-passed", "2026-08-26T00:59:00.000Z", "pass", 0),
    ],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-26T00:59:00.000Z",
  });
}

function v3Task(): TaskRecordV3 {
  return buildGatedTask({
    id: "20260826-162001-checks-v3",
    title: "PRIVATE_TITLE_CANARY",
    goal: "PRIVATE_GOAL_CANARY",
    status: "verifying",
    checkpoint: "verifying",
    relevantPaths: ["input.ts"],
    criterion: { text: "private" },
    gate: { description: "PRIVATE_CHECK_CANARY", command: "PRIVATE_COMMAND_CANARY", inputs: ["input.ts"] },
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  });
}
