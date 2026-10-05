import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { finishWorkflow } from "src/core/workflow/finish.js";
import { preserveObligations } from "src/core/workflow/obligations.js";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { buildCheck, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow obligations", () => {
  it("preserves persisted acceptance criteria and required validation obligations", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });

    await expect(
      saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [], updatedAt: "2026-08-13T00:02:00.000Z" } }),
    ).rejects.toThrow(/criterion/iu);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, id: "renamed" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow(/criterion/iu);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          acceptanceCriteria: [{ ...ready.acceptanceCriteria[0]!, text: "weaker outcome" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow("acceptance criterion text");
    await expect(
      saveWorkflow(root, { task: { ...ready, validationPlan: [], updatedAt: "2026-08-13T00:02:00.000Z" } }),
    ).rejects.toThrow(/coverage|required validation/iu);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, required: false }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow(/coverage|required validation/iu);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, command: "echo weaker" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow("cannot mutate required validation check");
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, scope: "focused" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow("cannot mutate required validation check");
    await expect(finishWorkflow(root)).rejects.toThrow("verifying/finishing");
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      activeTask: {
        acceptanceCriteria: [{ id: "a", text: "done" }],
        validationPlan: [{ id: "check", command: "pnpm test", scope: "full", required: true }],
      },
    });
  });

  it("treats the working directory of a frozen required check as part of its definition", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });

    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, cwd: "packages/other" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow("Workflow obligations freeze at");
  });

  it("allows TaskRecord v2 obligations to converge during planning before freezing at ready", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });

    const revised = {
      ...planning,
      acceptanceCriteria: [
        ...planning.acceptanceCriteria,
        { id: "b", text: "new", status: "pending" as const, evidenceIds: [] },
      ],
      validationPlan: [
        {
          ...planning.validationPlan[0]!,
          command: "pnpm test:unit",
          criterionIds: ["a", "b"],
          inputs: ["test/**/*.ts"],
        },
      ],
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await expect(saveWorkflow(root, { task: revised })).resolves.toMatchObject({
      validationPlan: [{ command: "pnpm test:unit", criterionIds: ["a", "b"] }],
    });
    const ready = {
      ...revised,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test" }],
          updatedAt: "2026-08-13T00:03:00.000Z",
        },
      }),
    ).rejects.toThrow(/freeze at first ready/iu);
  });

  it("supersedes an unproven frozen check in one save at replan with audit evidence", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test:unit" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
        contractRevision: { reason: "Lệnh cũ không còn đại diện cho focused gate." },
      }),
    ).rejects.toThrow(/persist replan/iu);

    const revisionEnvelope = {
      task: {
        ...ready,
        checkpoint: "replan" as const,
        validationPlan: [{ ...ready.validationPlan[0]!, command: "pnpm test:unit" }],
        updatedAt: "2026-08-13T00:03:00.000Z",
      },
      contractRevision: { reason: "Lệnh cũ không còn đại diện cho focused gate." },
    };
    const revised = await saveWorkflow(root, revisionEnvelope);
    expect(revised).toMatchObject({
      checkpoint: "replan",
      validationPlan: [{ command: "pnpm test:unit" }],
      evidence: [expect.objectContaining({ id: "task-contract-revision-01", result: "skipped" })],
    });
    await expect(saveWorkflow(root, revisionEnvelope)).resolves.toEqual(revised);
  });

  it("locks criteria mapped by failed evidence and requires a new check ID when retiring the failed definition", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    const snapshot = await snapshotWorkflow(root, "check");
    const failed = {
      ...ready,
      evidence: [
        {
          id: "failed-check",
          checkId: "check",
          recordedAt: "2026-08-13T00:02:00.000Z",
          result: "fail" as const,
          exitCode: 1,
          summary: "wrong command",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: failed });
    const replanning = { ...failed, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:03:00.000Z" };

    await expect(
      saveWorkflow(root, {
        task: {
          ...replanning,
          acceptanceCriteria: [{ ...replanning.acceptanceCriteria[0]!, text: "changed meaning" }],
          validationPlan: [{ ...replanning.validationPlan[0]!, command: "pnpm test:unit" }],
          updatedAt: "2026-08-13T00:04:00.000Z",
        },
        contractRevision: { reason: "Thay thế check không còn đúng sau khi đã có failure." },
      }),
    ).rejects.toThrow(/proven acceptance criterion/iu);

    await expect(
      saveWorkflow(root, {
        task: {
          ...replanning,
          validationPlan: [
            { ...replanning.validationPlan[0]!, required: false },
            { ...replanning.validationPlan[0]!, id: "check-replacement", command: "pnpm test:unit" },
          ],
          updatedAt: "2026-08-13T00:04:00.000Z",
        },
        contractRevision: { reason: "Retire check lỗi và thay bằng một check ID mới có coverage tương đương." },
      }),
    ).resolves.toMatchObject({
      validationPlan: [
        { id: "check", required: false },
        { id: "check-replacement", required: true },
      ],
    });
  });

  it("provides actionable error message without referencing v2 when mutating frozen obligations", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });

    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, command: "echo mutated" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow(/--reason.*replan/iu);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          validationPlan: [{ ...ready.validationPlan[0]!, command: "echo mutated" }],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.not.toThrow(/for v2/iu);
  });
});

describe("waiving a frozen criterion", () => {
  const WAIVER = { status: "waived" as const, waiverReason: "Không còn áp dụng cho phạm vi này." };

  async function planningProject() {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    return { root, planning };
  }

  async function readyProject() {
    const { root, planning } = await planningProject();
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    return { root, ready };
  }

  it("is an ordinary edit while the task is still a planning draft", async () => {
    const { root, planning } = await planningProject();

    await expect(
      saveWorkflow(root, {
        task: {
          ...planning,
          acceptanceCriteria: [{ ...planning.acceptanceCriteria[0]!, ...WAIVER }],
          updatedAt: "2026-08-13T00:00:30.000Z",
        },
      }),
    ).resolves.toMatchObject({ status: "planning" });
  });

  it("needs a persisted replan with a contractRevision once the task is ready", async () => {
    const { root, ready } = await readyProject();
    const waived = { ...ready.acceptanceCriteria[0]!, ...WAIVER };

    await expect(
      saveWorkflow(root, { task: { ...ready, acceptanceCriteria: [waived], updatedAt: "2026-08-13T00:02:00.000Z" } }),
    ).rejects.toThrow(/freeze at first ready.*contractRevision/su);
    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          checkpoint: "replan",
          acceptanceCriteria: [waived],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
        contractRevision: { reason: "Người dùng xác nhận tiêu chí này không còn áp dụng." },
      }),
    ).resolves.toMatchObject({ checkpoint: "replan", acceptanceCriteria: [{ status: "waived" }] });
  });

  it("treats a changed waiver reason of an already waived criterion as a contract change too", async () => {
    const { root, planning: base } = await planningProject();
    const waivedPlanning = {
      ...base,
      acceptanceCriteria: [
        { ...base.acceptanceCriteria[0]!, ...WAIVER },
        { id: "b", text: "covered", status: "pending" as const, evidenceIds: [] },
      ],
      validationPlan: [{ ...base.validationPlan[0]!, criterionIds: ["b"] }],
    };
    await saveWorkflow(root, { task: waivedPlanning });
    const ready = { ...waivedPlanning, status: "ready" as const, checkpoint: "ready" as const };
    await saveWorkflow(root, { task: { ...ready, updatedAt: "2026-08-13T00:01:00.000Z" } });
    const [first, second] = ready.acceptanceCriteria as [
      (typeof ready.acceptanceCriteria)[0],
      (typeof ready.acceptanceCriteria)[0],
    ];

    await expect(
      saveWorkflow(root, {
        task: {
          ...ready,
          acceptanceCriteria: [{ ...first, waiverReason: "Một lý do khác hẳn." }, second],
          updatedAt: "2026-08-13T00:02:00.000Z",
        },
      }),
    ).rejects.toThrow(/freeze at first ready/u);
  });

  it("is refused for a criterion that already has evidence, even during a replan", () => {
    const met = buildCriterion({ status: "met", evidenceIds: ["ev-check-1"] });
    const previous = buildTaskV3({
      status: "ready",
      checkpoint: "replan",
      acceptanceCriteria: [met],
      validationPlan: [buildCheck()],
      evidence: [buildEvidence({ id: "ev-check-1", checkId: "check" })],
    });
    const next = buildTaskV3({ ...previous, acceptanceCriteria: [{ ...met, ...WAIVER }] });

    expect(() => preserveObligations(previous, next, { reason: "Một lý do đủ dài để thử." })).toThrow(
      /cannot mutate proven acceptance criterion/u,
    );
  });
});
