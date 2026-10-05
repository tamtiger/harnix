import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import {
  assertReplayArtifactsMatch,
  assertWorkflowSaveFilesUnchanged,
  captureWorkflowSaveFiles,
  restoreWorkflowSaveFiles,
} from "src/core/workflow/save-files.js";
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

  it("reports an actionable stale message naming --run-check when inputs changed after recording", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await saveWorkflow(root, { task: planning });
    const snapshot = await snapshotWorkflow(root, "check");
    const withEvidence: TaskRecordV3 = {
      ...planning,
      acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e-stale"] }],
      evidence: [
        {
          id: "e-stale",
          checkId: "check",
          recordedAt: "2026-08-14T00:01:00.000Z",
          result: "pass",
          exitCode: 0,
          summary: "pass",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: withEvidence });
    const persisted = (await inspectWorkflow(root)).activeTask;
    if (persisted?.schemaVersion !== 3) throw new Error("Expected an active TaskRecord v3 fixture.");
    // An input touched after the evidence was recorded makes the digest stale.
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");

    await expect(assertInputDigestsFresh(root, persisted)).rejects.toThrow(/are stale for check check/u);
    await expect(assertInputDigestsFresh(root, persisted)).rejects.toThrow(
      /harnix workflow --run-check check -- <command>/u,
    );
    await expect(assertInputDigestsFresh(root, persisted)).rejects.toThrow(/no input-touching command after it/u);
  });
});

describe("workflow save-files helpers", () => {
  async function taskDirectory(root: string, task: TaskRecordV3): Promise<string> {
    const directory = join(root, ".harnix", "tasks", task.id);
    await mkdir(directory, { recursive: true });
    return directory;
  }

  it("plans task.json, Full-only prd and plan, design, research and context files in stable order", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const lite = taskV3("planning", "planning");
    const full = { ...lite, mode: "full" as const };
    const artifacts = { prd: "P", plan: "Q", design: "D", research: { "a.md": "R" }, context: {} as never };

    const fullFiles = await captureWorkflowSaveFiles(join(root, ".harnix"), full, artifacts);
    const liteFiles = await captureWorkflowSaveFiles(join(root, ".harnix"), lite, artifacts);

    const prefix = `tasks/${lite.id}`;
    expect(fullFiles.map((file) => file.relativePath)).toEqual(
      ["context.json", "design.md", "plan.md", "prd.md", "research/a.md", "task.json"].map(
        (name) => `${prefix}/${name}`,
      ),
    );
    expect(liteFiles.map((file) => file.relativePath)).not.toContain(`${prefix}/prd.md`);
    expect(fullFiles.every((file) => file.original === undefined && file.forward !== undefined)).toBe(true);
  });

  it("rejects research artifacts with an invalid name or empty content", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");

    for (const research of [{ "Bad Name.md": "x" }, { "ok.md": "  " }]) {
      await expect(captureWorkflowSaveFiles(join(root, ".harnix"), task, { research })).rejects.toThrow(
        "Research artifact name or content is invalid.",
      );
    }
  });

  it("restores overwritten bytes, removes created files and preserves concurrent changes", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const directory = await taskDirectory(root, taskV3("planning", "planning"));
    const file = (name: string, original: string | undefined, forward: string, current: string) => {
      const path = join(directory, name);
      return writeFile(path, current).then(() => ({
        relativePath: name,
        path,
        original: original === undefined ? undefined : Buffer.from(original),
        forward: Buffer.from(forward),
      }));
    };
    const overwritten = await file("a.md", "old", "new", "new");
    const created = await file("b.md", undefined, "x", "x");
    const untouched = await file("c.md", "same", "other", "same");

    await restoreWorkflowSaveFiles([overwritten, created, untouched]);

    await expect(readFile(overwritten.path, "utf8")).resolves.toBe("old");
    await expect(readFile(created.path, "utf8")).rejects.toThrow();
    const changed = await file("d.md", "orig", "forward", "someone else");
    await expect(restoreWorkflowSaveFiles([changed])).rejects.toThrow("Concurrent changes were preserved at: d.md.");
    await expect(readFile(changed.path, "utf8")).resolves.toBe("someone else");
  });

  it("detects task files that changed since the snapshot", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const directory = await taskDirectory(root, taskV3("planning", "planning"));
    const path = join(directory, "task.json");
    await writeFile(path, "a");
    const snapshot = { relativePath: "task.json", path, original: Buffer.from("a"), forward: Buffer.from("b") };

    await expect(assertWorkflowSaveFilesUnchanged([snapshot])).resolves.toBeUndefined();
    await writeFile(path, "changed");
    await expect(assertWorkflowSaveFilesUnchanged([snapshot])).rejects.toThrow(
      "task files changed concurrently: task.json.",
    );
  });

  it("requires committed artifacts to match on a contractRevision replay", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    const directory = await taskDirectory(root, task);
    await writeFile(join(directory, "prd.md"), "P");
    const harnixRoot = join(root, ".harnix");

    await expect(assertReplayArtifactsMatch(harnixRoot, task, { prd: "P" })).resolves.toBeUndefined();
    await expect(assertReplayArtifactsMatch(harnixRoot, task, { prd: "Z" })).rejects.toThrow(
      "cannot replace already committed artifact prd.md.",
    );
    await expect(assertReplayArtifactsMatch(harnixRoot, task, { plan: "x" })).rejects.toThrow(
      "missing or unreadable: plan.md",
    );
    await expect(assertReplayArtifactsMatch(harnixRoot, task, { research: { "bad name.md": "x" } })).rejects.toThrow(
      "Research artifact name or content is invalid.",
    );
  });

  it("requires a complete, valid and task-bound context pair on replay", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    const directory = await taskDirectory(root, task);
    const harnixRoot = join(root, ".harnix");

    await writeFile(join(directory, "context.json"), "{}");
    await expect(assertReplayArtifactsMatch(harnixRoot, task, undefined)).rejects.toThrow(
      "complete context.json and context-selection.json pair",
    );
    await writeFile(join(directory, "context-selection.json"), "{}");
    await expect(assertReplayArtifactsMatch(harnixRoot, task, undefined)).rejects.toThrow(
      "unreadable, invalid, or unbound",
    );
  });
});
