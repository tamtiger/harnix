import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveWorkflow } from "src/core/workflow/save.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { initializeProject } from "src/commands/init.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow ready", () => {
  it("re-enters ready only from replan and reruns the Full ready gate", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), mode: "full" as const, relevantPaths: ["src/a.ts"] };
    const prd = "# PRD\nDone.\n";
    const plan = "# Plan\n- [ ] `CAP-A` — implement\n";
    await saveWorkflow(root, { task: planning, artifacts: { prd, plan } });

    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    const readyReplan = { ...ready, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:01:30.000Z" };
    await saveWorkflow(root, { task: readyReplan });
    const readyAgain = { ...readyReplan, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:45.000Z" };
    await expect(saveWorkflow(root, { task: readyAgain })).resolves.toMatchObject({
      status: "ready",
      checkpoint: "ready",
    });

    const inProgress = {
      ...readyAgain,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: inProgress });
    await expect(
      saveWorkflow(root, {
        task: { ...inProgress, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:03:00.000Z" },
      }),
    ).rejects.toThrow("Illegal task transition");

    const implementationReplan = {
      ...inProgress,
      checkpoint: "replan" as const,
      updatedAt: "2026-08-13T00:04:00.000Z",
    };
    await saveWorkflow(root, { task: implementationReplan });
    await expect(
      saveWorkflow(root, {
        task: {
          ...implementationReplan,
          acceptanceCriteria: [{ ...implementationReplan.acceptanceCriteria[0]!, text: "mutated" }],
        },
      }),
    ).rejects.toThrow("contractRevision");
    await writeFile(join(root, ".harnix", "tasks", planning.id, "plan.md"), "# Plan\nNo checklist here.\n");
    const reready = {
      ...implementationReplan,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:05:00.000Z",
    };
    await expect(saveWorkflow(root, { task: reready })).rejects.toThrow("checklist item");
    await expect(saveWorkflow(root, { task: reready, artifacts: { prd, plan } })).resolves.toMatchObject({
      status: "ready",
      checkpoint: "ready",
    });

    const resumed = {
      ...reready,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:06:00.000Z",
    };
    await saveWorkflow(root, { task: resumed });
    const verifying = {
      ...resumed,
      status: "verifying" as const,
      checkpoint: "verifying" as const,
      updatedAt: "2026-08-13T00:07:00.000Z",
    };
    await saveWorkflow(root, { task: verifying });
    const verificationReplan = { ...verifying, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:08:00.000Z" };
    await saveWorkflow(root, { task: verificationReplan });
    await expect(
      saveWorkflow(root, {
        task: { ...verificationReplan, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:09:00.000Z" },
      }),
    ).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });
  });

  it("rejects readiness when acceptance or required validation gates are empty", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const empty = { ...taskV3("planning", "planning"), acceptanceCriteria: [], validationPlan: [] };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, empty);
    await setActiveTask(harnixRoot, empty.id);

    await expect(
      saveWorkflow(root, {
        task: { ...empty, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
      }),
    ).rejects.toThrow("acceptance");

    const secondRoot = await temporaryRepository();
    await initializeProject({ root: secondRoot, developer: "tam", yes: true });
    const noRequiredChecks = {
      ...taskV3("planning", "planning"),
      acceptanceCriteria: [
        {
          id: "a",
          text: "done",
          status: "waived" as const,
          evidenceIds: [],
          waiverReason: "Không áp dụng cho fixture cổng ready.",
        },
      ],
      validationPlan: [],
    };
    await saveWorkflow(secondRoot, { task: noRequiredChecks });
    await expect(
      saveWorkflow(secondRoot, {
        task: { ...noRequiredChecks, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
      }),
    ).rejects.toThrow("required validation");
  });

  it("rechecks non-empty Full artifacts immediately before readiness", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });
    const ready = {
      ...full,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };

    await rm(join(root, ".harnix", "tasks", full.id, "prd.md"));
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow(
      "Full tasks require non-empty prd.md and plan.md at ready",
    );
    await writeFile(join(root, ".harnix", "tasks", full.id, "prd.md"), "# PRD\n");
    await writeFile(join(root, ".harnix", "tasks", full.id, "plan.md"), "");
    await expect(saveWorkflow(root, { task: ready })).rejects.toThrow(
      "Full tasks require non-empty prd.md and plan.md at ready",
    );
  });
});
