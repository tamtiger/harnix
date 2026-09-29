import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  appendEvidenceWorkflow,
  finishWorkflow,
  inspectWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "../../src/commands/internal-workflow.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, taskRecordFieldManifest, createTaskV3MigrationEvidence } from "../../src/core/tasks/task.js";
import type { TaskRecord, TaskRecordV2, TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-v3-");
const createdAt = "2026-09-29T09:00:00.000+07:00";
const evidenceAt = "2026-09-29T09:10:00.000+07:00";
const finishAt = "2026-09-30T09:00:00.000+07:00";
const taskId = "20260929-090000-contract";

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  return root;
}

function taskV3(status: TaskRecord["status"] = "planning", checkpoint: TaskRecord["checkpoint"] = "planning", overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: taskId,
    title: "Contract",
    mode: "lite",
    status,
    checkpoint,
    goal: "Goal",
    nonGoals: [],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["src/**"] }],
    evidence: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function taskV2(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"], overrides: Partial<TaskRecordV2> = {}): TaskRecordV2 {
  return {
    ...(taskV3(status, checkpoint) as unknown as TaskRecordV2),
    schemaVersion: 2,
    validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["@task-contract", "src/**"] }],
    ...overrides,
  };
}

async function directoryLines(directory: string): Promise<{ files: string[]; lines: number }> {
  const files = (await readdir(directory, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
  let lines = 0;
  for (const file of files) lines += (await readFile(file, "utf8")).split("\n").length - 1;
  return { files: files.map((file) => file.slice(directory.length + 1)).sort(), lines };
}

describe("TaskRecord v3 save flow", () => {
  it("requires schema v3 for every new task", async () => {
    const root = await project();

    await expect(saveWorkflow(root, { task: taskV2("planning", "planning") })).rejects.toThrow(/schema v3/u);
    expect((await saveWorkflow(root, { task: taskV3() })).schemaVersion).toBe(3);
  });

  it("completes a sample lifecycle with no sidecar and at most 200 lines of task files", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    await transitionWorkflow(root, "ready", "ready", "2026-09-29T09:01:00.000+07:00");
    await transitionWorkflow(root, "in_progress", "implementing", "2026-09-29T09:02:00.000+07:00");
    await transitionWorkflow(root, "verifying", "verifying", "2026-09-29T09:03:00.000+07:00");
    const snapshot = await snapshotWorkflow(root, "check");
    expect(snapshot.schemaVersion).toBe(3);
    await appendEvidenceWorkflow(root, { evidence: { id: "ev-check", checkId: "check", recordedAt: evidenceAt, result: "pass", exitCode: 0, summary: "pnpm test passed", artifactPaths: [], inputDigest: snapshot.inputDigest } }, evidenceAt);
    await transitionWorkflow(root, "verifying", "finishing", "2026-09-29T09:11:00.000+07:00");
    const active = (await inspectWorkflow(root)).activeTask!;
    await saveWorkflow(root, { task: { ...active, acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev-check"] }], updatedAt: "2026-09-29T09:12:00.000+07:00" } });

    const finished = await finishWorkflow(root, finishAt);

    expect(finished.status).toBe("completed");
    const { files, lines } = await directoryLines(join(root, ".harnix", "tasks", taskId));
    expect(files).toEqual(["review.md", "task.json"]);
    expect(lines).toBeLessThanOrEqual(200);
  });

  it("refuses to finish when an input changed after the passing evidence", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    for (const [status, checkpoint] of [["ready", "ready"], ["in_progress", "implementing"], ["verifying", "verifying"]] as const) await transitionWorkflow(root, status, checkpoint, "2026-09-29T09:05:00.000+07:00");
    const snapshot = await snapshotWorkflow(root, "check");
    await appendEvidenceWorkflow(root, { evidence: { id: "ev-check", checkId: "check", recordedAt: evidenceAt, result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest } }, evidenceAt);
    await transitionWorkflow(root, "verifying", "finishing", "2026-09-29T09:11:00.000+07:00");
    const active = (await inspectWorkflow(root)).activeTask!;
    await saveWorkflow(root, { task: { ...active, acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev-check"] }], updatedAt: "2026-09-29T09:12:00.000+07:00" } });
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\n");

    await expect(finishWorkflow(root, finishAt)).rejects.toThrow(/stale/u);
  });

  it("rejects passing evidence whose digest does not match the current inputs", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    for (const [status, checkpoint] of [["ready", "ready"], ["in_progress", "implementing"], ["verifying", "verifying"]] as const) await transitionWorkflow(root, status, checkpoint, "2026-09-29T09:05:00.000+07:00");

    await expect(appendEvidenceWorkflow(root, { evidence: { id: "ev-bad", checkId: "check", recordedAt: evidenceAt, result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: "b".repeat(64) } }, evidenceAt)).rejects.toThrow(/digest/u);
  });
});

describe("one-step contract revision", () => {
  async function inProgress(): Promise<string> {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    await transitionWorkflow(root, "ready", "ready", "2026-09-29T09:01:00.000+07:00");
    await transitionWorkflow(root, "in_progress", "implementing", "2026-09-29T09:02:00.000+07:00");
    return root;
  }

  it("revises unproven obligations in one save at replan and re-enters ready with one more save", async () => {
    const root = await inProgress();
    const active = (await inspectWorkflow(root)).activeTask as TaskRecordV3;
    const revised: TaskRecordV3 = {
      ...active,
      checkpoint: "replan",
      updatedAt: "2026-09-29T09:20:00.000+07:00",
      acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }],
    };

    const saved = await saveWorkflow(root, { task: revised, contractRevision: { reason: "Tiêu chí ac-one cần chính xác hơn sau khi khảo sát." } });

    expect(saved.status).toBe("in_progress");
    expect(saved.checkpoint).toBe("replan");
    expect(saved.evidence.map((item) => item.id)).toEqual(["task-contract-revision-01"]);
    const reentered = await saveWorkflow(root, { task: { ...saved, status: "ready", checkpoint: "ready", updatedAt: "2026-09-29T09:21:00.000+07:00" } });
    expect(reentered.status).toBe("ready");
    expect(reentered.checkpoint).toBe("ready");
  });

  it("requires a reason and rejects a revision outside the replan checkpoint", async () => {
    const root = await inProgress();
    const active = (await inspectWorkflow(root)).activeTask as TaskRecordV3;
    const changed = { ...active, updatedAt: "2026-09-29T09:20:00.000+07:00", acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending" as const, evidenceIds: [] }] };

    await expect(saveWorkflow(root, { task: { ...changed, checkpoint: "replan" } })).rejects.toThrow(/contractRevision/u);
    await expect(saveWorkflow(root, { task: changed, contractRevision: { reason: "Tiêu chí ac-one cần chính xác hơn." } })).rejects.toThrow(/replan/u);
  });

  it("keeps a criterion immutable after a check with passing evidence covers it", async () => {
    const root = await inProgress();
    await transitionWorkflow(root, "verifying", "verifying", "2026-09-29T09:05:00.000+07:00");
    const snapshot = await snapshotWorkflow(root, "check");
    await appendEvidenceWorkflow(root, { evidence: { id: "ev-check", checkId: "check", recordedAt: evidenceAt, result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest } }, evidenceAt);
    const active = (await inspectWorkflow(root)).activeTask as TaskRecordV3;

    await expect(saveWorkflow(root, {
      task: { ...active, checkpoint: "replan", updatedAt: "2026-09-29T09:20:00.000+07:00", acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }] },
      contractRevision: { reason: "Thử sửa tiêu chí đã có bằng chứng pass." },
    })).rejects.toThrow(/proven/u);
  });

  it("no longer exposes a separate ready audit step", async () => {
    const schema = workflowEnvelopeSchema();

    expect(schema.envelope.contractRevision).toMatch(/replan/u);
    expect(JSON.stringify(schema)).not.toMatch(/audit-ready/u);
    expect(schema.taskRecord).toEqual(taskRecordFieldManifest(3));
  });
});

describe("migration of unfinished v1/v2 tasks", () => {
  async function legacyProject(status: TaskRecord["status"] = "in_progress", checkpoint: TaskRecord["checkpoint"] = "implementing"): Promise<string> {
    const root = await project();
    const legacy = taskV2(status, checkpoint);
    await saveTask(join(root, ".harnix"), legacy);
    await setActiveTask(join(root, ".harnix"), legacy.id);
    return root;
  }

  function migrated(previous: TaskRecordV2, overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
    const updatedAt = "2026-09-29T09:30:00.000+07:00";
    return {
      ...(previous as unknown as TaskRecordV3),
      schemaVersion: 3,
      validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["src/**"] }],
      evidence: [...previous.evidence, createTaskV3MigrationEvidence(previous.id, updatedAt)],
      updatedAt,
      ...overrides,
    };
  }

  it("upgrades an unfinished v2 task to v3 in one save that preserves its state", async () => {
    const root = await legacyProject();
    const previous = (await inspectWorkflow(root)).activeTask as TaskRecordV2;

    const saved = await saveWorkflow(root, { task: migrated(previous) });

    expect(saved.schemaVersion).toBe(3);
    expect(saved.status).toBe("in_progress");
    expect(saved.evidence.at(-1)?.id).toBe("task-schema-to-v3");
    expect(saved.validationPlan[0]!.inputs).toEqual(["src/**"]);
  });

  it("refuses every other save on an unmigrated task and says how to migrate", async () => {
    const root = await legacyProject();

    await expect(transitionWorkflow(root, "verifying", "verifying", "2026-09-29T09:30:00.000+07:00")).rejects.toThrow(/migrate/iu);
  });

  it("rejects a migration that drops a criterion, weakens a required check, or omits the migration evidence", async () => {
    const root = await legacyProject();
    const previous = (await inspectWorkflow(root)).activeTask as TaskRecordV2;
    const good = migrated(previous);

    await expect(saveWorkflow(root, { task: { ...good, acceptanceCriteria: [{ id: "ac-one", text: "Changed", status: "pending", evidenceIds: [] }] } })).rejects.toThrow(/migration/iu);
    await expect(saveWorkflow(root, { task: { ...good, validationPlan: [{ ...good.validationPlan[0]!, command: "true" }] } })).rejects.toThrow(/migration/iu);
    await expect(saveWorkflow(root, { task: { ...good, evidence: previous.evidence } })).rejects.toThrow(/migration/iu);
  });

  it("does not migrate a finished task", async () => {
    const root = await project();
    const finished: TaskRecordV2 = taskV2("completed", "finishing", {
      completedAt: "2026-09-29T09:20:00.000+07:00",
      updatedAt: "2026-09-29T09:20:00.000+07:00",
      acceptanceCriteria: [{ id: "ac-one", text: "One", status: "waived", evidenceIds: [], waiverReason: "test" }],
    });
    await saveTask(join(root, ".harnix"), finished);
    await setActiveTask(join(root, ".harnix"), finished.id);

    await expect(saveWorkflow(root, { task: migrated(finished, { status: "completed", checkpoint: "finishing", completedAt: "2026-09-29T09:30:00.000+07:00" }) })).rejects.toThrow(/migrate|finished|terminal/iu);
  });
});

describe("free-form planning artifacts", () => {
  const legacyNotes = ["# Kế hoạch", "", "- [ ] `A` — bước một", "", "<!-- harnix:execution-notes:begin -->", "not the old grammar at all", "<!-- harnix:execution-notes:end -->", ""].join("\n");

  it("stores and returns a plan that contains the retired execution-notes markers", async () => {
    const root = await project();
    const full = taskV3("planning", "planning", { mode: "full" });

    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: legacyNotes } });

    expect(await readFile(join(root, ".harnix", "tasks", taskId, "plan.md"), "utf8")).toBe(legacyNotes);
  });

  it("gates a Full task on non-empty prd and plan with at least one checklist item, and nothing more", async () => {
    const root = await project();
    const full = taskV3("planning", "planning", { mode: "full" });
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "Tự do, chưa có checklist.\n" } });
    const ready = { ...full, status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-09-29T09:01:00.000+07:00" };

    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow(/checklist/u);
    const saved = await saveWorkflow(root, { task: ready, artifacts: { prd: "# PRD\n", plan: "- [ ] Bước một\n" } });
    expect(saved.status).toBe("ready");
    await expect(access(join(root, ".harnix", "tasks", taskId, "verification-inputs.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
