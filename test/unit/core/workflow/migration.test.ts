import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createTaskV3MigrationEvidence, saveTask, setActiveTask } from "src/core/tasks/task.js";
import type { TaskRecord, TaskRecordV2, TaskRecordV3 } from "src/core/tasks/task.js";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { buildCheck, buildCriterion, buildTaskV2, createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, legacyTask as task } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories("harnix-v3-");
const taskId = "20260929-090000-contract";

function taskV2(
  status: TaskRecord["status"],
  checkpoint: TaskRecord["checkpoint"],
  overrides: Partial<TaskRecordV2> = {},
): TaskRecordV2 {
  return buildTaskV2({ id: taskId, title: "Contract", status, checkpoint, ...overrides });
}

describe("workflow migration", () => {
  it("rejects a new TaskRecord v1 while preserving direct legacy-state loading", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const legacy = task("planning", "planning");

    await expect(saveWorkflow(root, { task: legacy })).rejects.toThrow(/new task.*schema v3|schema v3.*new task/iu);

    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, legacy);
    await setActiveTask(harnixRoot, legacy.id);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: { id: legacy.id, schemaVersion: 1 } });
  });

  describe("of unfinished v1/v2 tasks", () => {
    async function legacyProject(
      status: TaskRecord["status"] = "in_progress",
      checkpoint: TaskRecord["checkpoint"] = "implementing",
    ): Promise<string> {
      const root = await createTestProject(await temporaryRepository());
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
        validationPlan: [buildCheck()],
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

      await expect(transitionWorkflow(root, "verifying", "verifying", "2026-09-29T09:30:00.000+07:00")).rejects.toThrow(
        /migrate/iu,
      );
    });

    it("rejects a migration that drops a criterion, weakens a required check, or omits the migration evidence", async () => {
      const root = await legacyProject();
      const previous = (await inspectWorkflow(root)).activeTask as TaskRecordV2;
      const good = migrated(previous);

      await expect(
        saveWorkflow(root, {
          task: { ...good, acceptanceCriteria: [buildCriterion({ text: "Changed" })] },
        }),
      ).rejects.toThrow(/migration/iu);
      await expect(
        saveWorkflow(root, { task: { ...good, validationPlan: [{ ...good.validationPlan[0]!, command: "true" }] } }),
      ).rejects.toThrow(/migration/iu);
      await expect(saveWorkflow(root, { task: { ...good, evidence: previous.evidence } })).rejects.toThrow(
        /migration/iu,
      );
    });

    it("does not migrate a finished task", async () => {
      const root = await createTestProject(await temporaryRepository());
      const finished: TaskRecordV2 = taskV2("completed", "finishing", {
        completedAt: "2026-09-29T09:20:00.000+07:00",
        updatedAt: "2026-09-29T09:20:00.000+07:00",
        acceptanceCriteria: [buildCriterion({ status: "waived", waiverReason: "test" })],
      });
      await saveTask(join(root, ".harnix"), finished);
      await setActiveTask(join(root, ".harnix"), finished.id);

      await expect(
        saveWorkflow(root, {
          task: migrated(finished, {
            status: "completed",
            checkpoint: "finishing",
            completedAt: "2026-09-29T09:30:00.000+07:00",
          }),
        }),
      ).rejects.toThrow(/migrate|finished|terminal/iu);
    });
  });
});
