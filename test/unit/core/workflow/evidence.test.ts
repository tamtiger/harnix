import { describe, expect, it } from "vitest";
import { appendEvidenceWorkflow } from "src/core/workflow/evidence.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow evidence", () => {
  it("should_append_exactly_one_evidence_item_without_removing_history", async () => {
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
    await saveWorkflow(root, {
      task: {
        ...ready,
        status: "in_progress" as const,
        checkpoint: "implementing" as const,
        updatedAt: "2026-08-13T00:02:00.000Z",
      },
    });

    const first = await appendEvidenceWorkflow(root, {
      evidence: {
        id: "red-1",
        checkId: "check",
        recordedAt: "2026-08-13T00:03:00.000Z",
        result: "fail",
        exitCode: 1,
        summary: "RED",
        artifactPaths: [],
      },
    });
    const second = await appendEvidenceWorkflow(root, {
      evidence: {
        id: "red-2",
        checkId: "check",
        recordedAt: "2026-08-13T00:04:00.000Z",
        result: "fail",
        exitCode: 1,
        summary: "still RED",
        artifactPaths: [],
      },
    });

    expect(first.evidence.map((item) => item.id)).toEqual(["red-1"]);
    expect(second.evidence.map((item) => item.id)).toEqual(["red-1", "red-2"]);
    await expect(
      appendEvidenceWorkflow(root, {
        evidence: {
          id: "red-1",
          checkId: "check",
          recordedAt: "2026-08-13T00:05:00.000Z",
          result: "pass",
          exitCode: 0,
          summary: "dup",
          artifactPaths: [],
        },
      }),
    ).rejects.toThrow();
    await expect(appendEvidenceWorkflow(root, { task: {}, evidence: {} })).rejects.toThrow();
  });

  it("rejects evidence dated in the future so it can never hide a later real failure", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    const future = new Date(Date.now() + 60_000).toISOString();

    await expect(
      appendEvidenceWorkflow(root, {
        evidence: {
          id: "future-fail",
          checkId: "check",
          recordedAt: future,
          result: "fail",
          exitCode: 1,
          summary: "claimed",
          artifactPaths: [],
        },
      }),
    ).rejects.toThrow("Evidence future-fail is recorded in the future");
    await expect(
      appendEvidenceWorkflow(root, {
        evidence: {
          id: "future-again",
          checkId: "check",
          recordedAt: new Date(Date.now() + 3_600_000).toISOString(),
          result: "fail",
          exitCode: 2,
          summary: "claimed",
          artifactPaths: [],
        },
      }),
    ).rejects.toThrow("recorded in the future");
  });
});
