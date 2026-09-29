import { describe, expect, it } from "vitest";
import { canCompleteTask, evidenceSupportsScope, verificationRetryDisposition } from "src/core/workflow/completion.js";
import { type TaskRecordV2 } from "src/core/tasks/task.js";
import { routingTask } from "test/support/workflow-fixtures.js";

describe("workflow completion", () => {
  it("requires fresh required evidence for completion", () => {
    const now = Date.parse("2026-08-07T10:00:00Z");
    expect(canCompleteTask(routingTask("2026-08-07T09:30:00Z"), now)).toBe(true);
    expect(canCompleteTask(routingTask("2026-08-07T06:00:00Z"), now)).toBe(false);
  });

  it("requires TaskRecord v2 criterion evidence to intersect its declared check", () => {
    const now = Date.parse("2026-08-07T10:00:00Z");
    const digest = "a".repeat(64);
    const candidate: TaskRecordV2 = {
      ...routingTask("2026-08-07T09:30:00Z"),
      schemaVersion: 2 as const,
      acceptanceCriteria: [
        { id: "a", text: "done", status: "met" as const, evidenceIds: ["e2"] },
        { id: "b", text: "waived", status: "waived" as const, evidenceIds: [], waiverReason: "not required" },
      ],
      validationPlan: [
        {
          id: "check-a",
          description: "Run unit tests",
          scope: "full" as const,
          required: true,
          criterionIds: ["a"],
          inputs: ["@task-contract", "src/**/*.ts"],
        },
        {
          id: "check-b",
          description: "Review documentation",
          scope: "full" as const,
          required: true,
          criterionIds: ["b"],
          inputs: ["@task-contract"],
        },
      ],
      evidence: [
        {
          id: "e1",
          checkId: "check-a",
          recordedAt: "2026-08-07T09:30:00Z",
          result: "pass" as const,
          summary: "ok",
          artifactPaths: [],
          inputDigest: digest,
        },
        {
          id: "e2",
          checkId: "check-b",
          recordedAt: "2026-08-07T09:31:00Z",
          result: "pass" as const,
          summary: "ok",
          artifactPaths: [],
          inputDigest: digest,
        },
      ],
    };
    expect(canCompleteTask(candidate, now)).toBe(false);
    expect(
      canCompleteTask(
        {
          ...candidate,
          acceptanceCriteria: [
            { ...candidate.acceptanceCriteria[0]!, evidenceIds: ["e1"] },
            candidate.acceptanceCriteria[1]!,
          ],
        },
        now,
      ),
    ).toBe(true);
    const undigestedEvidence = candidate.evidence.map((evidence) => {
      if (evidence.id !== "e1") return evidence;
      const withoutDigest = { ...evidence };
      delete withoutDigest.inputDigest;
      return withoutDigest;
    });
    expect(
      canCompleteTask(
        {
          ...candidate,
          acceptanceCriteria: [
            { ...candidate.acceptanceCriteria[0]!, evidenceIds: ["e1"] },
            candidate.acceptanceCriteria[1]!,
          ],
          evidence: undigestedEvidence,
        },
        now,
      ),
    ).toBe(false);
  });

  it("treats every criterion mapped to a passed multi-criteria check as met, not only the one pinned to the check's absolute-latest evidence", () => {
    const now = Date.parse("2026-08-07T10:00:00Z");
    const digest = "a".repeat(64);
    const candidate: TaskRecordV2 = {
      ...routingTask("2026-08-07T09:30:00Z"),
      schemaVersion: 2 as const,
      acceptanceCriteria: [
        { id: "a", text: "done a", status: "met" as const, evidenceIds: ["e1"] },
        { id: "b", text: "done b", status: "met" as const, evidenceIds: ["e2"] },
      ],
      validationPlan: [
        {
          id: "shared-check",
          description: "Run unit tests",
          scope: "full" as const,
          required: true,
          criterionIds: ["a", "b"],
          inputs: ["@task-contract", "src/**/*.ts"],
        },
      ],
      evidence: [
        {
          id: "e1",
          checkId: "shared-check",
          recordedAt: "2026-08-07T09:30:00Z",
          result: "pass" as const,
          summary: "ok",
          artifactPaths: [],
          inputDigest: digest,
        },
        {
          id: "e2",
          checkId: "shared-check",
          recordedAt: "2026-08-07T09:31:00Z",
          result: "pass" as const,
          summary: "ok",
          artifactPaths: [],
          inputDigest: digest,
        },
      ],
    };
    expect(canCompleteTask(candidate, now)).toBe(true);
  });

  it("keeps digest-backed v2 evidence current across long pauses while rejecting future evidence", () => {
    const now = Date.parse("2026-08-07T10:00:00Z");
    const digest = "a".repeat(64);
    const oldPass: TaskRecordV2 = {
      ...routingTask("2026-08-01T09:30:00Z"),
      schemaVersion: 2,
      acceptanceCriteria: [{ id: "a", text: "done", status: "met", evidenceIds: ["e"] }],
      validationPlan: [
        {
          id: "check",
          description: "verify",
          scope: "full",
          required: true,
          criterionIds: ["a"],
          inputs: ["@task-contract", "src/**/*.ts"],
        },
      ],
      evidence: [
        {
          id: "e",
          checkId: "check",
          recordedAt: "2026-08-01T09:30:00Z",
          result: "pass",
          summary: "ok",
          artifactPaths: [],
          inputDigest: digest,
        },
      ],
    };

    expect(canCompleteTask(oldPass, now)).toBe(true);
    expect(
      canCompleteTask({ ...oldPass, evidence: [{ ...oldPass.evidence[0]!, recordedAt: "2026-08-07T10:00:01Z" }] }, now),
    ).toBe(false);
  });

  it("stops after one failed remediation round and resets only after a pass", () => {
    const digest = "b".repeat(64);
    const base: TaskRecordV2 = {
      ...routingTask("2026-08-07T09:30:00Z"),
      schemaVersion: 2,
      acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }],
      validationPlan: [
        {
          id: "check",
          description: "verify",
          command: "pnpm test",
          scope: "full",
          required: true,
          criterionIds: ["a"],
          inputs: ["@task-contract", "src/**/*.ts"],
        },
      ],
      evidence: [],
    };
    const first = {
      id: "f1",
      checkId: "check",
      recordedAt: "2026-08-07T09:30:00Z",
      result: "fail" as const,
      exitCode: 1,
      summary: "  SAME   FAILURE ",
      artifactPaths: [],
      inputDigest: digest,
    };
    const second = { ...first, id: "f2", recordedAt: "2026-08-07T09:31:00Z", summary: "same failure" };

    expect(verificationRetryDisposition(base, "check")).toBe("run");
    expect(verificationRetryDisposition({ ...base, evidence: [first] }, "check")).toBe("debug");
    expect(verificationRetryDisposition({ ...base, evidence: [first, second] }, "check")).toBe("stop");
    expect(
      verificationRetryDisposition({ ...base, evidence: [first, { ...second, inputDigest: "c".repeat(64) }] }, "check"),
    ).toBe("stop");
    expect(verificationRetryDisposition({ ...base, evidence: [second, first] }, "check")).toBe("stop");
    const skipped = { ...first, id: "s", recordedAt: "2026-08-07T09:30:30Z", result: "skipped" as const };
    expect(verificationRetryDisposition({ ...base, evidence: [first, skipped, second] }, "check")).toBe("stop");
    const pass = { ...first, id: "p", recordedAt: "2026-08-07T09:30:30Z", result: "pass" as const };
    expect(verificationRetryDisposition({ ...base, evidence: [first, pass, second] }, "check")).toBe("debug");
    const now = Date.parse("2026-08-07T09:32:00Z");
    const futurePass = { ...pass, recordedAt: "2026-08-08T09:30:30Z" };
    expect(verificationRetryDisposition({ ...base, evidence: [first, futurePass, second] }, "check", now)).toBe("stop");
  });

  it("does not treat empty completion obligations as complete", () => {
    expect(
      canCompleteTask(
        { ...routingTask("2026-08-07T09:30:00Z"), acceptanceCriteria: [], validationPlan: [], evidence: [] },
        Date.parse("2026-08-07T10:00:00Z"),
      ),
    ).toBe(false);
  });

  it("does not let focused evidence prove a full verification claim", () => {
    const evidence = routingTask("2026-08-07T09:30:00Z").evidence[0]!;
    expect(evidenceSupportsScope(evidence, "focused", "focused")).toBe(true);
    expect(evidenceSupportsScope(evidence, "full", "focused")).toBe(false);
    expect(evidenceSupportsScope(evidence, "full", "full")).toBe(true);
  });

  it("should_reject_completion_when_latest_required_evidence_failed", () => {
    const current = routingTask("2026-08-07T09:30:00Z");
    current.evidence.push({
      id: "e-fail",
      checkId: "check",
      recordedAt: "2026-08-07T09:45:00Z",
      result: "fail",
      exitCode: 1,
      summary: "failed",
      artifactPaths: [],
    });
    expect(canCompleteTask(current, Date.parse("2026-08-07T10:00:00Z"))).toBe(false);
  });
});
