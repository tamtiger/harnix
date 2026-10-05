import { describe, expect, it } from "vitest";

import { batchWorkflow, validateWorkflowBatchEnvelope } from "src/core/workflow/batch.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:30:00.000Z";

async function setupPlanningProject(root: string) {
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const planning = taskV3("planning", "planning");
  await saveWorkflow(root, { task: planning });
  return planning;
}

describe("workflow --batch envelope", () => {
  it("validates batch envelope schema and rejects non-objects or invalid items", () => {
    expect(() => validateWorkflowBatchEnvelope(null)).toThrow(/object/u);
    expect(() => validateWorkflowBatchEnvelope([])).toThrow(/object/u);
    expect(() => validateWorkflowBatchEnvelope({ unknownField: true })).toThrow(/unknown/iu);
    expect(() => validateWorkflowBatchEnvelope({ criteria: "not-an-array" })).toThrow(/array/u);
    expect(() => validateWorkflowBatchEnvelope({ checks: "not-an-array" })).toThrow(/array/u);
    expect(() => validateWorkflowBatchEnvelope({ decisions: "not-an-array" })).toThrow(/array/u);
    expect(() => validateWorkflowBatchEnvelope({ decisions: [{ id: "dec-1", text: "t" }] })).toThrow(/rationale/u);
    expect(() => validateWorkflowBatchEnvelope({ decisions: [null] })).toThrow(/id, text, and rationale/u);
    expect(() => validateWorkflowBatchEnvelope({ risks: "not-an-array" })).toThrow(/array/u);
    expect(() => validateWorkflowBatchEnvelope({ risks: [{ id: "r1" }] })).toThrow(/id and text/u);
    expect(() => validateWorkflowBatchEnvelope({ risks: [null] })).toThrow(/id and text/u);

    const valid = validateWorkflowBatchEnvelope({
      criteria: [{ id: "ac-batch-1", text: "Batch criterion" }],
      decisions: [{ id: "dec-batch-1", text: "Dec text", rationale: "Dec why" }],
      risks: [{ id: "risk-batch-1", text: "Risk text", severity: "low" }],
    });
    expect(valid.criteria).toHaveLength(1);
    expect(valid.decisions).toHaveLength(1);
    expect(valid.risks).toHaveLength(1);
  });

  it("applies multiple criteria, checks, decisions, risks and paths in a single atomic operation", async () => {
    const root = await temporaryRepository();
    await setupPlanningProject(root);

    const task = await batchWorkflow(
      root,
      {
        criteria: [{ id: "c2", text: "Second criterion", checks: ["ch2"] }],
        checks: [
          {
            id: "ch2",
            description: "Second check",
            command: "pnpm test",
            scope: "focused",
            criteria: ["c2"],
            inputs: ["src/**"],
          },
        ],
        decisions: [{ id: "dec-1", text: "Decision 1", rationale: "Why 1" }],
        risks: [{ id: "risk-1", text: "Risk 1", severity: "medium" }],
        paths: {
          paths: ["src/core/workflow/batch.ts"],
          specs: [".harnix/spec/guides/common.md"],
        },
      },
      NOW,
    );

    expect(task.acceptanceCriteria.some((c) => c.id === "c2")).toBe(true);
    expect(task.validationPlan.some((c) => c.id === "ch2")).toBe(true);
    expect(task.decisions?.some((d) => d.id === "dec-1")).toBe(true);
    expect(task.residualRisks?.some((r) => r.id === "risk-1")).toBe(true);
    expect(task.relevantPaths).toContain("src/core/workflow/batch.ts");

    const reloaded = await resolveActiveTask(`${root}/.harnix`);
    expect(reloaded?.schemaVersion).toBe(3);
    if (reloaded?.schemaVersion !== 3) throw new Error("expected a schema v3 task after batch");
    expect(reloaded.decisions?.some((d) => d.id === "dec-1")).toBe(true);
    expect(reloaded.residualRisks?.some((r) => r.id === "risk-1")).toBe(true);
  });

  it("rejects mojibake in text values", () => {
    expect(() =>
      validateWorkflowBatchEnvelope({
        decisions: [{ id: "d1", text: "Lá»—i font tiáº¿ng Viá»‡t", rationale: "mojibake" }],
      }),
    ).toThrow(/UTF-8/u);
  });

  it("requires reason when modifying obligations past planning", async () => {
    const root = await temporaryRepository();
    const planning = await setupPlanningProject(root);
    planning.checkpoint = "ready";
    planning.status = "ready";
    await saveWorkflow(root, { task: planning });

    await expect(
      batchWorkflow(root, {
        criteria: [{ id: "c3", text: "Third criterion", checks: ["check"] }],
      }),
    ).rejects.toThrow(/reason/u);

    const updated = await batchWorkflow(root, {
      criteria: [{ id: "c3", text: "Third criterion", checks: ["check"] }],
      reason: "Bổ sung criterion thứ ba phục vụ verify",
    });
    expect(updated.acceptanceCriteria.some((c) => c.id === "c3")).toBe(true);
  });

  it("bounds the reason like --set-check: 10 to 1000 characters once obligations are frozen", async () => {
    const root = await temporaryRepository();
    const planning = await setupPlanningProject(root);
    await saveWorkflow(root, { task: { ...planning, status: "ready", checkpoint: "ready" } });
    const criteria = [{ id: "c3", text: "Third criterion", checks: ["check"] }];

    await expect(batchWorkflow(root, { criteria, reason: "too short" })).rejects.toThrow(/10-1000 characters/u);
    await expect(batchWorkflow(root, { criteria, reason: "x".repeat(1_001) })).rejects.toThrow(/10-1000 characters/u);
    await expect(batchWorkflow(root, { criteria, reason: "  Lý do đủ dài để hợp lệ  " })).resolves.toMatchObject({
      checkpoint: "replan",
    });
  });

  it("decides whether obligations are frozen by status, so a planning task at replan stays editable", async () => {
    const root = await temporaryRepository();
    const planning = await setupPlanningProject(root);
    await saveWorkflow(root, { task: { ...planning, checkpoint: "replan", updatedAt: "2026-08-13T00:00:30.000Z" } });

    const updated = await batchWorkflow(root, { criteria: [{ id: "c9", text: "Late criterion", checks: ["check"] }] });

    expect(updated.acceptanceCriteria.some((criterion) => criterion.id === "c9")).toBe(true);
    expect(updated.status).toBe("planning");
  });

  it("rejects a repeated decision id like --add-decision and keeps the task unchanged", async () => {
    const root = await temporaryRepository();
    await setupPlanningProject(root);
    await batchWorkflow(root, { decisions: [{ id: "d1", text: "first", rationale: "why" }] });

    await expect(batchWorkflow(root, { decisions: [{ id: "d1", text: "again", rationale: "why" }] })).rejects.toThrow(
      "Decision d1 already exists.",
    );
  });

  it("updates existing checks and criteria with status and waiverReason", async () => {
    const root = await temporaryRepository();
    await setupPlanningProject(root);

    // Initial batch
    await batchWorkflow(root, {
      criteria: [{ id: "c1", text: "Original c1" }],
      checks: [{ id: "ch1", description: "Original ch1", command: "echo 1", criteria: ["c1"], inputs: ["src/**"] }],
    });

    // Update batch
    const updated = await batchWorkflow(root, {
      criteria: [{ id: "c1", status: "waived", waiverReason: "Not needed" }],
      checks: [{ id: "ch1", description: "Updated ch1", command: "echo 2" }],
    });

    const c1 = updated.acceptanceCriteria.find((c) => c.id === "c1");
    expect(c1?.status).toBe("waived");
    expect(c1?.waiverReason).toBe("Not needed");

    const ch1 = updated.validationPlan.find((c) => c.id === "ch1");
    expect(ch1?.description).toBe("Updated ch1");
    expect(ch1?.command).toBe("echo 2");
  });

  it("rejects batch mutation when no active task exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await expect(batchWorkflow(root, {})).rejects.toThrow(/active task/u);
  });
});
