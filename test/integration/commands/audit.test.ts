import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, saveTaskWithArtifacts, setActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildEvidence } from "test/support/builders.js";
import { buildGatedTask, snapshotTree, withPassingEvidence } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-audit-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("status --explain (audit projection)", () => {
  it("returns no-active success without changing project files", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--explain"])).resolves.toBe(0);

    expect(
      (JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { explain: { audit: unknown } }).explain
        .audit,
    ).toEqual({ generator: "harnix", schemaVersion: 1, activeTask: null });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("audits Full readiness and completion blockers without exposing task prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const task = fullTask();
    const harnixRoot = join(root, ".harnix");
    await saveTaskWithArtifacts(harnixRoot, task, {
      prd: "# PRD\n### AC `criterion`\nDone.\n",
      plan: "# Plan\n- [ ] Triển khai\n",
    });
    await setActiveTask(harnixRoot, task.id);
    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--explain"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect((JSON.parse(output) as { explain: { audit: unknown } }).explain.audit).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: {
        id: task.id,
        mode: "full",
        status: "planning",
        checkpoint: "planning",
        readiness: { status: "pass", diagnostics: [] },
        completion: {
          status: "fail",
          criteria: { met: 0, waived: 0, pending: 1, total: 1, pendingIds: ["criterion"] },
          requiredChecks: {
            passed: 0,
            failed: 0,
            stale: 0,
            pending: 1,
            total: 1,
            failedIds: [],
            staleIds: [],
            pendingIds: ["gate"],
          },
        },
      },
    });
    for (const canary of [
      "PRIVATE_TITLE_CANARY",
      "PRIVATE_GOAL_CANARY",
      "PRIVATE_CHECK_CANARY",
      "PRIVATE_COMMAND_CANARY",
    ])
      expect(output).not.toContain(canary);
    expect(output).not.toContain(root);
    expect(
      Buffer.byteLength(JSON.stringify((JSON.parse(output) as { explain: { audit: unknown } }).explain.audit), "utf8"),
    ).toBeLessThan(4_096);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("uses current v3 input freshness without executing or mutating checks", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const current = Date.parse("2026-08-26T01:00:00.000Z");
    const base = digestTask();
    const snapshot = await computeInputDigest(root, base, "gate");
    const task = withPassingEvidence(
      base,
      buildEvidence({
        id: "e-pass",
        checkId: "gate",
        recordedAt: "2026-08-26T00:59:00.000Z",
        summary: "PRIVATE_EVIDENCE_CANARY",
        inputDigest: snapshot.inputDigest,
      }),
    );
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--explain"], { statusClock: () => current })).resolves.toBe(0);
    expect(
      (JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { explain: { audit: unknown } }).explain
        .audit,
    ).toMatchObject({
      activeTask: {
        completion: { status: "pass", criteria: { met: 1, pending: 0 }, requiredChecks: { passed: 1, stale: 0 } },
      },
    });

    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    const beforeStaleAudit = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "status", "--explain"], { statusClock: () => current })).resolves.toBe(0);
    expect(
      (JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { explain: { audit: unknown } }).explain
        .audit,
    ).toMatchObject({
      activeTask: {
        completion: {
          status: "fail",
          criteria: { met: 0, pending: 1, pendingIds: ["criterion"] },
          requiredChecks: { passed: 0, stale: 1, staleIds: ["gate"] },
        },
      },
    });
    await expect(snapshotTree(root)).resolves.toEqual(beforeStaleAudit);
  });
});

const canaries = {
  title: "PRIVATE_TITLE_CANARY",
  goal: "PRIVATE_GOAL_CANARY",
  criterion: { text: "PRIVATE_CRITERION_CANARY" },
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:30:00.000Z",
};

function fullTask(): TaskRecordV3 {
  return buildGatedTask({
    ...canaries,
    id: "20260826-120000-full-audit",
    mode: "full",
    gate: { description: "PRIVATE_CHECK_CANARY", command: "PRIVATE_COMMAND_CANARY", inputs: ["src/**/*.ts"] },
  });
}

function digestTask(): TaskRecordV3 {
  return buildGatedTask({
    ...canaries,
    id: "20260826-120001-digest-audit",
    status: "verifying",
    checkpoint: "verifying",
    relevantPaths: ["input.ts"],
    gate: { description: "verify input", command: "pnpm test", inputs: ["input.ts"] },
  });
}
