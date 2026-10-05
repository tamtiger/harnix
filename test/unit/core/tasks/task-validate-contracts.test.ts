import { describe, expect, it } from "vitest";
import { createTaskV2MigrationEvidence, validateTask } from "src/core/tasks/task.js";
import { taskFixture, taskV2Fixture, timestamp } from "test/support/tasks-fixtures.js";

describe("task validation contracts", () => {
  it("rejects unknown fields at every TaskRecord schema boundary", () => {
    const fixture = taskV2Fixture();
    const criterion = fixture.acceptanceCriteria[0]!;
    const check = fixture.validationPlan[0]!;
    const failedEvidence = {
      id: "failed",
      checkId: check.id,
      recordedAt: timestamp,
      result: "fail" as const,
      exitCode: 1,
      summary: "failed",
      artifactPaths: [],
    };

    expect(() => validateTask({ ...fixture, unexpected: true })).toThrow(/field|schema/iu);
    expect(() => validateTask({ ...fixture, acceptanceCriteria: [{ ...criterion, unexpected: true }] })).toThrow(
      /field|schema/iu,
    );
    expect(() => validateTask({ ...fixture, validationPlan: [{ ...check, unexpected: true }] })).toThrow(
      /field|schema/iu,
    );
    expect(() => validateTask({ ...fixture, evidence: [{ ...failedEvidence, unexpected: true }] })).toThrow(
      /field|schema/iu,
    );
    expect(() =>
      validateTask({
        ...fixture,
        status: "blocked",
        checkpoint: "planning",
        blocker: {
          kind: "repository",
          summary: "blocked",
          nextAction: "retry",
          resumeStatus: "planning",
          unexpected: true,
        },
      }),
    ).toThrow(/field|schema/iu);
  });

  it("accepts TaskRecord v2 with explicit criterion coverage and verification inputs", () => {
    expect(validateTask(taskV2Fixture())).toMatchObject({
      schemaVersion: 2,
      validationPlan: [{ criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
    });
  });

  it("rejects incomplete or unsafe TaskRecord v2 validation contracts", () => {
    const fixture = taskV2Fixture();
    const check = fixture.validationPlan[0]!;
    for (const validationPlan of [
      [{ ...check, criterionIds: [] }],
      [{ ...check, criterionIds: ["missing"] }],
      [{ ...check, criterionIds: ["a", "a"] }],
      [{ ...check, inputs: [] }],
      [{ ...check, inputs: ["src/**/*.ts"] }],
      [{ ...check, inputs: ["@task-contract", "../escape"] }],
      [{ ...check, inputs: ["src/**/*.ts", "@task-contract"] }],
    ])
      expect(() => validateTask({ ...fixture, validationPlan })).toThrow();

    expect(() =>
      validateTask({
        ...fixture,
        acceptanceCriteria: [...fixture.acceptanceCriteria, { id: "b", text: "b", status: "pending", evidenceIds: [] }],
        validationPlan: [{ ...check, criterionIds: ["b", "a"] }],
      }),
    ).toThrow(/criterion/iu);
    expect(() =>
      validateTask({ ...fixture, validationPlan: [{ ...check, inputs: ["@task-contract", "!src/**/*.ts"] }] }),
    ).toThrow(/input/iu);

    expect(() =>
      validateTask({
        ...fixture,
        acceptanceCriteria: [
          ...fixture.acceptanceCriteria,
          { id: "orphan", text: "orphan", status: "pending", evidenceIds: [] },
        ],
      }),
    ).toThrow(/criterion|coverage/iu);
    expect(() =>
      validateTask({
        ...fixture,
        acceptanceCriteria: [
          ...fixture.acceptanceCriteria,
          { id: "bad id", text: "waived", status: "waived", evidenceIds: [], waiverReason: "not applicable" },
        ],
      }),
    ).toThrow(/criterion/iu);
  });

  it("provides actionable error message naming missing and valid criteria when reference is invalid", () => {
    const fixture = taskV2Fixture();
    const check = fixture.validationPlan[0]!;
    expect(() =>
      validateTask({
        ...fixture,
        acceptanceCriteria: [{ id: "ac-valid", text: "valid", status: "pending", evidenceIds: [] }],
        validationPlan: [{ ...check, criterionIds: ["ac-missing"] }],
      }),
    ).toThrow(/unknown criterion ac-missing.*valid: ac-valid/iu);
  });

  it("requires repository inputs for behavioral TaskRecord v2 checks and digests for passing evidence", () => {
    const fixture = taskV2Fixture();
    expect(() =>
      validateTask({
        ...fixture,
        validationPlan: [{ ...fixture.validationPlan[0]!, inputs: ["@task-contract"] }],
      }),
    ).toThrow(/input/iu);
    expect(() =>
      validateTask({
        ...fixture,
        evidence: [
          {
            id: "e",
            checkId: "check",
            recordedAt: timestamp,
            result: "pass",
            exitCode: 0,
            summary: "ok",
            artifactPaths: [],
          },
        ],
      }),
    ).toThrow(/digest/iu);
    expect(() =>
      validateTask({
        ...fixture,
        evidence: [
          {
            id: "e",
            checkId: "check",
            recordedAt: timestamp,
            result: "pass",
            exitCode: 0,
            summary: "ok",
            artifactPaths: [],
            inputDigest: "A".repeat(64),
          },
        ],
      }),
    ).toThrow(/digest/iu);
  });

  it("accepts optional findings on EvidenceRecordV2 but rejects them on EvidenceRecordV1", () => {
    const fixtureV2 = taskV2Fixture();
    const withFindings = {
      ...fixtureV2,
      evidence: [
        {
          id: "e",
          checkId: "check",
          recordedAt: timestamp,
          result: "pass" as const,
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          inputDigest: "a".repeat(64),
          findings: [{ id: "f1", text: "Duplicate key in map iteration", severity: "medium" as const }],
        },
      ],
      acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }],
    };
    expect(() => validateTask(withFindings)).not.toThrow();

    const withoutFindings = {
      ...fixtureV2,
      evidence: [
        {
          id: "e",
          checkId: "check",
          recordedAt: timestamp,
          result: "pass" as const,
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          inputDigest: "a".repeat(64),
        },
      ],
      acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }],
    };
    expect(() => validateTask(withoutFindings)).not.toThrow();

    const v1WithFindings = {
      ...taskFixture(),
      evidence: [
        {
          id: "e",
          checkId: undefined,
          recordedAt: timestamp,
          result: "pass" as const,
          summary: "ok",
          artifactPaths: [],
          findings: [{ id: "f1", text: "x", severity: "low" as const }],
        },
      ],
    };
    expect(() => validateTask(v1WithFindings)).toThrow(/unknown schema field/iu);
  });

  it("rejects a finding with an invalid id, empty text, or an out-of-enum severity", () => {
    const fixtureV2 = taskV2Fixture();
    const baseEvidence = {
      id: "e",
      checkId: "check",
      recordedAt: timestamp,
      result: "pass" as const,
      exitCode: 0,
      summary: "ok",
      artifactPaths: [],
      inputDigest: "a".repeat(64),
    };
    const withCriterion = {
      ...fixtureV2,
      acceptanceCriteria: [{ id: "a", text: "x", status: "met" as const, evidenceIds: ["e"] }],
    };

    expect(() =>
      validateTask({
        ...withCriterion,
        evidence: [{ ...baseEvidence, findings: [{ id: "bad id", text: "x", severity: "low" }] }],
      }),
    ).toThrow(/finding/iu);
    expect(() =>
      validateTask({
        ...withCriterion,
        evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "", severity: "low" }] }],
      }),
    ).toThrow(/finding/iu);
    expect(() =>
      validateTask({
        ...withCriterion,
        evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "x", severity: "catastrophic" }] }],
      }),
    ).toThrow(/finding/iu);
    expect(() =>
      validateTask({
        ...withCriterion,
        evidence: [{ ...baseEvidence, findings: [{ id: "f1", text: "x", severity: "critical" }] }],
      }),
    ).not.toThrow();
  });

  it("preserves pre-migration v1 evidence without allowing new undigested v2 passes", () => {
    const fixture = taskV2Fixture();
    const legacyPass = {
      id: "legacy",
      checkId: "check",
      recordedAt: timestamp,
      result: "pass" as const,
      exitCode: 0,
      summary: "legacy",
      artifactPaths: [],
    };
    expect(() =>
      validateTask({
        ...fixture,
        acceptanceCriteria: [{ ...fixture.acceptanceCriteria[0]!, status: "met", evidenceIds: ["legacy"] }],
        evidence: [legacyPass, createTaskV2MigrationEvidence(fixture.id, "2026-08-13T00:01:00.000Z")],
      }),
    ).not.toThrow();
    expect(() =>
      validateTask({
        ...fixture,
        evidence: [createTaskV2MigrationEvidence(fixture.id, timestamp), { ...legacyPass, id: "new" }],
      }),
    ).toThrow(/digest/iu);
  });
});

describe("validation check cwd and baseline contracts", () => {
  const withCheck = (patch: Record<string, unknown>) => {
    const fixture = taskV2Fixture();
    return { ...fixture, validationPlan: [{ ...fixture.validationPlan[0]!, ...patch }] };
  };

  it("accepts a safe repository-relative cwd and the project root", () => {
    expect(() => validateTask(withCheck({ cwd: "packages/portal" }))).not.toThrow();
    expect(() => validateTask(withCheck({ cwd: "." }))).not.toThrow();
  });

  it.each(["../other", "/abs", "C:/x", "D:foo", "a/../../b", "", "a b"])("rejects the unsafe cwd %j", (cwd) => {
    expect(() => validateTask(withCheck({ cwd }))).toThrow(/cwd/u);
  });

  it("accepts only the documented baseline keys with valid enums", () => {
    const baseline = { result: "fail", classification: "pre-existing", authorizedBy: "user", scope: "legacy suite" };

    expect(() => validateTask(withCheck({ baseline }))).not.toThrow();
    expect(() => validateTask(withCheck({ baseline: { ...baseline, extra: true } }))).toThrow(/baseline/u);
    expect(() => validateTask(withCheck({ baseline: { classification: "nonsense" } }))).toThrow(/baseline/u);
    expect(() => validateTask(withCheck({ baseline: { authorizedBy: 3 } }))).toThrow(/baseline/u);
    expect(() => validateTask(withCheck({ baseline: { scope: 7 } }))).toThrow(/baseline/u);
  });
});
