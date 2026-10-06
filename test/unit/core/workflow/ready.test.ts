import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertReadyRequirements, collectReadyIssues, inspectReadyConditions } from "src/core/workflow/ready.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { initializeProject } from "src/commands/init.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow ready", () => {
  it("re-enters ready only from replan and reruns the Full ready gate", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const base = taskV3("planning", "planning");
    const planning = {
      ...base,
      mode: "full" as const,
      relevantPaths: ["src/a.ts"],
      validationPlan: [{ ...base.validationPlan[0]!, scope: "focused" as const }],
    };
    const prd = "# PRD\nDone.\n";
    const plan = "# Plan\n- [ ] `CAP-A` — implement criterion a\n";
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

describe("collectReadyIssues", () => {
  it("lists exactly what the ready transition rejects, in order, and is empty for an acceptable task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const harnixRoot = join(root, ".harnix");
    const ok = taskV3("planning", "planning");

    await expect(collectReadyIssues(harnixRoot, ok)).resolves.toEqual([]);
    await expect(assertReadyRequirements(harnixRoot, ok)).resolves.toBeUndefined();
    const empty = { ...ok, acceptanceCriteria: [], validationPlan: [] };
    const issues = await collectReadyIssues(harnixRoot, empty);
    expect(issues[0]).toBe("Workflow ready requires at least one acceptance criterion.");
    await expect(assertReadyRequirements(harnixRoot, empty)).rejects.toThrow(issues[0]);
  });
});

describe("workflow ready inspection", () => {
  const baselineEvidence = (result: "pass" | "fail") => ({
    id: `ev-${result}`,
    checkId: "check",
    recordedAt: "2026-08-13T00:00:30.000Z",
    result,
    exitCode: result === "pass" ? 0 : 1,
    summary: "baseline",
    artifactPaths: [],
  });

  it("reports no issue for a baselined Full task with artifacts and matching inputs", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const base = taskV3("planning", "planning");
    const task = {
      ...base,
      mode: "full" as const,
      validationPlan: [{ ...base.validationPlan[0]!, scope: "focused" as const }],
      evidence: [baselineEvidence("pass")],
    };
    await mkdir(join(root, ".harnix", "tasks", task.id), { recursive: true });

    const result = await inspectReadyConditions(join(root, ".harnix"), task, {
      prd: "# PRD\n",
      plan: "- [ ] slice for a\n",
    });

    expect(result).toEqual({ issues: [], advisories: [], unbaselined: [] });
  });

  it("collects every independent issue in one pass", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const empty = {
      ...taskV3("planning", "planning"),
      mode: "full" as const,
      acceptanceCriteria: [],
      validationPlan: [],
    };

    const emptyResult = await inspectReadyConditions(join(root, ".harnix"), empty, { prd: " ", plan: "" });
    expect(emptyResult.issues).toEqual([
      "Workflow ready requires at least one acceptance criterion.",
      "Workflow ready requires at least one required validation check.",
      "Full tasks require non-empty prd.md and plan.md at ready.",
    ]);

    const missingInput = taskV3("planning", "planning", ["missing/**/*.ts"]);
    const checked = await inspectReadyConditions(join(root, ".harnix"), missingInput);
    expect(checked.issues).toEqual([]);
    expect(checked.advisories).toContain("Required check 'check' input 'missing/**/*.ts' matches no files.");
    expect(checked.advisories).toContain("Required check 'check' has not been baselined before contract freeze.");
    expect(checked.unbaselined).toEqual(["check"]);
  });

  it("flags a missing checklist, a failed baseline and unreadable artifacts", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const task = { ...taskV3("planning", "planning"), mode: "full" as const, evidence: [baselineEvidence("fail")] };
    await mkdir(join(root, ".harnix", "tasks", task.id), { recursive: true });

    const noChecklist = await inspectReadyConditions(join(root, ".harnix"), task, {
      prd: "# PRD\n",
      plan: "# Plan\n",
    });
    expect(noChecklist.issues).toEqual(["Full task plan.md needs at least one checklist item ('- [ ] ...') at ready."]);
    expect(noChecklist.advisories).toEqual(["Required check 'check' failed in baseline run without a waiver."]);

    const noFiles = await inspectReadyConditions(join(root, ".harnix"), task);
    expect(noFiles.issues).toContain("Full tasks require non-empty prd.md and plan.md at ready.");
  });
});
