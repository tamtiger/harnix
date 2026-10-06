import { access, readdir, readFile, writeFile } from "node:fs/promises";
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
} from "src/commands/internal-workflow.js";
import { taskRecordFieldManifest } from "src/core/tasks/task.js";
import type { TaskRecord, TaskRecordV3 } from "src/core/tasks/task.js";
import { at, buildTaskV2, buildTaskV3, createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-v3-");
const createdAt = at(0);
const evidenceAt = at(10);
const finishAt = "2026-09-30T09:00:00.000+07:00";
const taskId = "20260929-090000-contract";

const project = async (): Promise<string> => createTestProject(await temporaryRepository());

function taskV3(
  status: TaskRecord["status"] = "planning",
  checkpoint: TaskRecord["checkpoint"] = "planning",
  overrides: Partial<TaskRecordV3> = {},
): TaskRecordV3 {
  return buildTaskV3({
    id: taskId,
    title: "Contract",
    status,
    checkpoint,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  });
}

async function directoryLines(directory: string): Promise<{ files: string[]; lines: number }> {
  const files = (await readdir(directory, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
  let lines = 0;
  for (const file of files) lines += (await readFile(file, "utf8")).split("\n").length - 1;
  return { files: files.map((file) => file.slice(directory.length + 1)).sort(), lines };
}

describe("TaskRecord v3 save flow", () => {
  it("requires schema v3 for every new task", async () => {
    const root = await project();

    await expect(
      saveWorkflow(root, {
        task: buildTaskV2({ id: taskId, title: "Contract", status: "planning", checkpoint: "planning" }),
      }),
    ).rejects.toThrow(/schema v3/u);
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
    await appendEvidenceWorkflow(
      root,
      {
        evidence: {
          id: "ev-check",
          checkId: "check",
          recordedAt: evidenceAt,
          result: "pass",
          exitCode: 0,
          summary: "pnpm test passed",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      },
      evidenceAt,
    );
    await transitionWorkflow(root, "verifying", "finishing", "2026-09-29T09:11:00.000+07:00");
    const active = (await inspectWorkflow(root)).activeTask!;
    await saveWorkflow(root, {
      task: {
        ...active,
        acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev-check"] }],
        updatedAt: "2026-09-29T09:12:00.000+07:00",
      },
    });

    const finished = await finishWorkflow(root, finishAt);

    expect(finished.status).toBe("completed");
    const { files, lines } = await directoryLines(join(root, ".harnix", "tasks", taskId));
    expect(files).toEqual(["review.md", "task.json"]);
    expect(lines).toBeLessThanOrEqual(200);
  });

  it("refuses to finish when an input changed after the passing evidence", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    for (const [status, checkpoint] of [
      ["ready", "ready"],
      ["in_progress", "implementing"],
      ["verifying", "verifying"],
    ] as const)
      await transitionWorkflow(root, status, checkpoint, "2026-09-29T09:05:00.000+07:00");
    const snapshot = await snapshotWorkflow(root, "check");
    await appendEvidenceWorkflow(
      root,
      {
        evidence: {
          id: "ev-check",
          checkId: "check",
          recordedAt: evidenceAt,
          result: "pass",
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      },
      evidenceAt,
    );
    await transitionWorkflow(root, "verifying", "finishing", "2026-09-29T09:11:00.000+07:00");
    const active = (await inspectWorkflow(root)).activeTask!;
    await saveWorkflow(root, {
      task: {
        ...active,
        acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev-check"] }],
        updatedAt: "2026-09-29T09:12:00.000+07:00",
      },
    });
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\n");

    await expect(finishWorkflow(root, finishAt)).rejects.toThrow(/stale/u);
  });

  it("rejects passing evidence whose digest does not match the current inputs", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });
    for (const [status, checkpoint] of [
      ["ready", "ready"],
      ["in_progress", "implementing"],
      ["verifying", "verifying"],
    ] as const)
      await transitionWorkflow(root, status, checkpoint, "2026-09-29T09:05:00.000+07:00");

    await expect(
      appendEvidenceWorkflow(
        root,
        {
          evidence: {
            id: "ev-bad",
            checkId: "check",
            recordedAt: evidenceAt,
            result: "pass",
            exitCode: 0,
            summary: "ok",
            artifactPaths: [],
            inputDigest: "b".repeat(64),
          },
        },
        evidenceAt,
      ),
    ).rejects.toThrow(/digest/u);
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

    const saved = await saveWorkflow(root, {
      task: revised,
      contractRevision: { reason: "Tiêu chí ac-one cần chính xác hơn sau khi khảo sát." },
    });

    expect(saved.status).toBe("in_progress");
    expect(saved.checkpoint).toBe("replan");
    expect(saved.evidence.map((item) => item.id)).toEqual(["task-contract-revision-01"]);
    const reentered = await saveWorkflow(root, {
      task: { ...saved, status: "ready", checkpoint: "ready", updatedAt: "2026-09-29T09:21:00.000+07:00" },
    });
    expect(reentered.status).toBe("ready");
    expect(reentered.checkpoint).toBe("ready");
  });

  it("requires a reason and rejects a revision outside the replan checkpoint", async () => {
    const root = await inProgress();
    const active = (await inspectWorkflow(root)).activeTask as TaskRecordV3;
    const changed = {
      ...active,
      updatedAt: "2026-09-29T09:20:00.000+07:00",
      acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending" as const, evidenceIds: [] }],
    };

    await expect(saveWorkflow(root, { task: { ...changed, checkpoint: "replan" } })).rejects.toThrow(
      /contractRevision/u,
    );
    await expect(
      saveWorkflow(root, { task: changed, contractRevision: { reason: "Tiêu chí ac-one cần chính xác hơn." } }),
    ).rejects.toThrow(/replan/u);
  });

  it("keeps a criterion immutable after a check with passing evidence covers it", async () => {
    const root = await inProgress();
    await transitionWorkflow(root, "verifying", "verifying", "2026-09-29T09:05:00.000+07:00");
    const snapshot = await snapshotWorkflow(root, "check");
    await appendEvidenceWorkflow(
      root,
      {
        evidence: {
          id: "ev-check",
          checkId: "check",
          recordedAt: evidenceAt,
          result: "pass",
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      },
      evidenceAt,
    );
    const active = (await inspectWorkflow(root)).activeTask as TaskRecordV3;

    await expect(
      saveWorkflow(root, {
        task: {
          ...active,
          checkpoint: "replan",
          updatedAt: "2026-09-29T09:20:00.000+07:00",
          acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }],
        },
        contractRevision: { reason: "Thử sửa tiêu chí đã có bằng chứng pass." },
      }),
    ).rejects.toThrow(/proven/u);
  });

  it("no longer exposes a separate ready audit step", async () => {
    const schema = workflowEnvelopeSchema();

    expect(schema.envelope.contractRevision).toMatch(/replan/u);
    expect(JSON.stringify(schema)).not.toMatch(/audit-ready/u);
    expect(schema.taskRecord).toEqual(taskRecordFieldManifest(3));
  });
});

describe("free-form planning artifacts", () => {
  const legacyNotes = [
    "# Kế hoạch",
    "",
    "- [ ] `A` — bước một",
    "",
    "<!-- harnix:execution-notes:begin -->",
    "not the old grammar at all",
    "<!-- harnix:execution-notes:end -->",
    "",
  ].join("\n");

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
    const ready = {
      ...full,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-09-29T09:01:00.000+07:00",
    };

    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow(/checklist/u);
    const saved = await saveWorkflow(root, {
      task: ready,
      artifacts: { prd: "# PRD\n", plan: "- [ ] Bước một cho ac-one\n" },
    });
    expect(saved.status).toBe("ready");
    await expect(access(join(root, ".harnix", "tasks", taskId, "verification-inputs.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
