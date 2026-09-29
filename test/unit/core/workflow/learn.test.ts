import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recordLearningWorkflow } from "src/core/workflow/learn.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { initializeUtcProject, writeProjectSource, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow learn", () => {
  it("records one eligible learning candidate from fresh finishing provenance and retries idempotently", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const now = "2026-08-20T23:59:00.000Z";
    const harnixRoot = join(root, ".harnix");
    await writeProjectSource(root);
    const previousEvidence = {
      id: "e-previous",
      checkId: "check",
      recordedAt: now,
      result: "pass" as const,
      exitCode: 0,
      summary: "previous",
      artifactPaths: [],
      inputDigest: "c".repeat(64),
    };
    const previous = {
      ...taskV3("completed", "finishing"),
      id: "20260812-120000-previous-learning-source",
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [previousEvidence.id] }],
      evidence: [previousEvidence],
      completedAt: now,
      updatedAt: now,
    };
    const currentBase = taskV3("verifying", "finishing");
    const currentEvidence = {
      id: "e-current",
      checkId: "check",
      recordedAt: now,
      result: "pass" as const,
      exitCode: 0,
      summary: "current",
      artifactPaths: [],
      inputDigest: (await computeInputDigest(root, currentBase, "check")).inputDigest,
    };
    const current = {
      ...currentBase,
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [currentEvidence.id] }],
      evidence: [currentEvidence],
      updatedAt: now,
    };
    await saveTask(harnixRoot, previous);
    await saveTask(harnixRoot, current);
    await setActiveTask(harnixRoot, current.id);
    const envelope = {
      candidate: {
        id: "workflow-parity",
        statement: "pnpm test\nhttps://example.invalid/review",
        sourceTaskIds: [current.id, previous.id],
        evidenceIds: [currentEvidence.id, previousEvidence.id],
      },
    };

    const created = await recordLearningWorkflow(root, envelope, "2026-08-20T23:59:59.000Z");
    const retried = await recordLearningWorkflow(root, envelope, "2026-08-21T00:00:01.000Z");

    expect(created).toMatchObject({
      created: true,
      eligible: true,
      findings: ["command-like", "url-like"],
      entry: {
        kind: "learning",
        learning: { id: "workflow-parity", occurrences: 2, confidence: 1, status: "candidate" },
      },
    });
    expect(retried).toEqual({ ...created, created: false });
    await expect(
      recordLearningWorkflow(
        root,
        { candidate: { ...envelope.candidate, statement: "Changed statement." } },
        "2026-08-21T00:00:02.000Z",
      ),
    ).rejects.toThrow(/conflict/iu);
    await expect(
      recordLearningWorkflow(
        root,
        {
          candidate: {
            ...envelope.candidate,
            id: "unknown-evidence",
            evidenceIds: [...envelope.candidate.evidenceIds, "e-injected"],
          },
        },
        "2026-08-21T00:00:02.000Z",
      ),
    ).rejects.toThrow(/evidence/iu);
    await expect(
      recordLearningWorkflow(
        root,
        { candidate: { ...envelope.candidate, id: "oversized", statement: "x".repeat(65_537) } },
        "2026-08-21T00:00:02.000Z",
      ),
    ).rejects.toThrow(/64 KiB/iu);
    await expect(
      readFile(join(harnixRoot, "workspace", "tam", "journal", "2026-08-21.jsonl"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects learning capture below the threshold or with unknown provenance", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const now = new Date().toISOString();
    await writeProjectSource(root);
    const currentBase = taskV3("verifying", "finishing");
    const currentEvidence = {
      id: "e-current",
      checkId: "check",
      recordedAt: now,
      result: "pass" as const,
      exitCode: 0,
      summary: "current",
      artifactPaths: [],
      inputDigest: (await computeInputDigest(root, currentBase, "check")).inputDigest,
    };
    const current = {
      ...currentBase,
      acceptanceCriteria: [{ id: "a", text: "done", status: "met" as const, evidenceIds: [currentEvidence.id] }],
      evidence: [currentEvidence],
      updatedAt: now,
    };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, current);
    await setActiveTask(harnixRoot, current.id);

    await expect(
      recordLearningWorkflow(
        root,
        {
          candidate: {
            id: "single",
            statement: "Single observation.",
            sourceTaskIds: [current.id],
            evidenceIds: [currentEvidence.id],
          },
        },
        now,
      ),
    ).rejects.toThrow(/eligible/iu);
    await expect(
      recordLearningWorkflow(
        root,
        {
          candidate: {
            id: "unknown",
            statement: "Unknown source.",
            sourceTaskIds: [current.id, "20260812-120000-missing"],
            evidenceIds: [currentEvidence.id, "e-missing"],
          },
        },
        now,
      ),
    ).rejects.toThrow(/source task/iu);
  });
});
