import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { type TaskRecordV3 } from "src/core/tasks/task.js";
import { assertInputDigestsFresh } from "src/core/verification/input-digest.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow save-files", () => {
  it("rejects a save-time verification race", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    const candidate = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["e"] }],
      evidence: [
        {
          id: "e",
          checkId: "check",
          recordedAt: "2026-08-14T00:01:00.000Z",
          result: "pass" as const,
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: candidate })).rejects.toThrow(/input digest|snapshot/iu);
    await expect(
      readFile(join(root, ".harnix", "tasks", planning.id, "verification-inputs.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("validates a failed-run input digest before trusting it as a retry fingerprint", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const failed = {
      ...planning,
      evidence: [
        {
          id: "stable-failure",
          checkId: "check",
          recordedAt: "2026-08-14T00:01:00.000Z",
          result: "fail" as const,
          exitCode: 1,
          summary: "same failure",
          artifactPaths: [],
          inputDigest: "f".repeat(64),
        },
      ],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: failed })).rejects.toThrow(/input digest/iu);
    await expect(
      saveWorkflow(root, {
        task: { ...failed, evidence: [{ ...failed.evidence[0]!, inputDigest: snapshot.inputDigest }] },
      }),
    ).resolves.toMatchObject({ evidence: [{ id: "stable-failure", result: "fail" }] });
    await expect(
      readFile(join(root, ".harnix", "tasks", planning.id, "verification-inputs.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("leaves candidate artifacts and the task untouched when evidence validation fails before the task commit", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = { ...taskV3("planning", "planning", ["input.ts"]), mode: "full" as const };
    const initialArtifacts = { prd: "# PRD\nRequirement.\n", plan: "# Plan\nOriginal semantic plan.\n" };
    await saveWorkflow(root, { task: planning, artifacts: initialArtifacts });
    const taskPath = join(root, ".harnix", "tasks", planning.id, "task.json");
    const sidecarPath = join(root, ".harnix", "tasks", planning.id, "verification-inputs.json");
    const taskBefore = await readFile(taskPath, "utf8");
    const mismatched = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met" as const, evidenceIds: ["bad-pass"] }],
      evidence: [
        {
          id: "bad-pass",
          checkId: "check",
          recordedAt: "2026-08-14T00:01:00.000Z",
          result: "pass" as const,
          exitCode: 0,
          summary: "bad digest",
          artifactPaths: [],
          inputDigest: "f".repeat(64),
        },
      ],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(
      saveWorkflow(root, {
        task: mismatched,
        artifacts: { ...initialArtifacts, plan: "# Plan\nChanged semantic plan.\n" },
      }),
    ).rejects.toThrow(/input digest/iu);
    await expect(readFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "utf8")).resolves.toBe(
      initialArtifacts.plan,
    );
    await expect(readFile(taskPath, "utf8")).resolves.toBe(taskBefore);
    await expect(readFile(sidecarPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps saved pass evidence fresh when its required glob matches the active task record", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning", [".harnix/tasks/*/task.json"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence: TaskRecordV3 = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e-self-match"] }],
      evidence: [
        {
          id: "e-self-match",
          checkId: "check",
          recordedAt: "2026-08-14T00:01:00.000Z",
          result: "pass",
          exitCode: 0,
          summary: "self-match pass",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };

    await expect(saveWorkflow(root, { task: withEvidence })).resolves.toMatchObject({
      evidence: [{ id: "e-self-match" }],
    });
    const persisted = (await inspectWorkflow(root)).activeTask;
    if (persisted?.schemaVersion !== 3) throw new Error("Expected an active TaskRecord v3 fixture.");
    await expect(assertInputDigestsFresh(root, persisted)).resolves.toBeUndefined();
    const current = await snapshotWorkflow(root, "check");
    expect(current.inputDigest).toBe(snapshot.inputDigest);
    expect(current.entries.map((entry) => entry.path)).not.toContain(`.harnix/tasks/${planning.id}/task.json`);
  });
});
