import { describe, expect, it } from "vitest";
import { taskRecordFieldManifest, validateTask, TaskValidationError } from "src/core/tasks/task.js";

const timestamp = "2026-09-29T09:00:00.000+07:00";
const digest = "a".repeat(64);

function v3(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: "20260929-090000-example",
    title: "Example",
    mode: "lite",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "Goal",
    nonGoals: [],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-one"],
        inputs: ["src/**"],
      },
    ],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function evidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "ev-one",
    checkId: "check-one",
    recordedAt: timestamp,
    result: "pass",
    exitCode: 0,
    summary: "ok",
    artifactPaths: [],
    inputDigest: digest,
    ...overrides,
  };
}

describe("TaskRecord schema v3", () => {
  it("accepts a compact v3 record with inline digest evidence", () => {
    const task = validateTask(v3({ evidence: [evidence()] }));
    expect(task.schemaVersion).toBe(3);
  });

  it("accepts followUpOf as another task id and rejects it when malformed, self-referencing or on v2", () => {
    const other = "20260929-090500-parent-task";

    expect(() => validateTask(v3({ followUpOf: other }))).not.toThrow();
    expect(() => validateTask(v3({ followUpOf: "Not An Id" }))).toThrow(/followUpOf/u);
    expect(() => validateTask(v3({ followUpOf: 7 }))).toThrow(/followUpOf/u);
    const own = v3({});
    expect(() => validateTask({ ...own, followUpOf: own.id })).toThrow(/followUpOf/u);
    expect(() => validateTask(v3({ schemaVersion: 2, followUpOf: other }))).toThrow();
  });

  it("accepts the optional review fields and epicId", () => {
    expect(() =>
      validateTask(
        v3({
          epicId: "20260929-090000-epic",
          decisions: [{ id: "d", text: "t", rationale: "r" }],
          residualRisks: [{ id: "r", text: "t", severity: "low" }],
        }),
      ),
    ).not.toThrow();
  });

  it("rejects the v2 @task-contract input token because the contract is implicit", () => {
    const plan = [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-one"],
        inputs: ["@task-contract", "src/**"],
      },
    ];
    expect(() => validateTask(v3({ validationPlan: plan }))).toThrow(TaskValidationError);
  });

  it("rejects invalid scope with an actionable error message naming allowed values", () => {
    const plan = [
      {
        id: "check-one",
        description: "Suite tests",
        scope: "suite",
        required: true,
        command: "dotnet test",
        criterionIds: ["ac-one"],
        inputs: ["src/**"],
      },
    ];
    expect(() => validateTask(v3({ validationPlan: plan }))).toThrow(
      /Validation plan check 'check-one' has invalid scope 'suite'; expected 'focused' or 'full'/u,
    );
  });

  it("requires a required check to declare criteria and at least one input", () => {
    const noInputs = [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-one"],
        inputs: [],
      },
    ];
    const noCriteria = [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: [],
        inputs: ["src/**"],
      },
    ];
    expect(() => validateTask(v3({ validationPlan: noInputs }))).toThrow(TaskValidationError);
    expect(() => validateTask(v3({ validationPlan: noCriteria }))).toThrow(TaskValidationError);
  });

  it("provides actionable error message naming check ID when v3 check inputs are invalid", () => {
    const noInputs = [
      {
        id: "check-fe",
        description: "FE tests",
        scope: "focused",
        required: true,
        command: "npm test",
        criterionIds: ["ac-one"],
        inputs: [],
      },
    ];
    expect(() => validateTask(v3({ validationPlan: noInputs }))).toThrow(
      /validation inputs are invalid for check "check-fe": required check must declare at least one input glob/iu,
    );
  });

  it("requires every non-waived criterion to be covered by a required check", () => {
    const criteria = [
      { id: "ac-one", text: "One", status: "pending", evidenceIds: [] },
      { id: "ac-two", text: "Two", status: "pending", evidenceIds: [] },
    ];
    expect(() => validateTask(v3({ acceptanceCriteria: criteria }))).toThrow(TaskValidationError);
  });

  it("rejects unsorted or duplicate criterion IDs and inputs", () => {
    const criteria = [
      { id: "ac-a", text: "A", status: "pending", evidenceIds: [] },
      { id: "ac-b", text: "B", status: "pending", evidenceIds: [] },
    ];
    const unsorted = [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-b", "ac-a"],
        inputs: ["src/**"],
      },
    ];
    const duplicateInputs = [
      {
        id: "check-one",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-a", "ac-b"],
        inputs: ["src/**", "src/**"],
      },
    ];
    expect(() => validateTask(v3({ acceptanceCriteria: criteria, validationPlan: unsorted }))).toThrow(
      TaskValidationError,
    );
    expect(() => validateTask(v3({ acceptanceCriteria: criteria, validationPlan: duplicateInputs }))).toThrow(
      TaskValidationError,
    );
  });

  it("requires a digest on a passing required-check evidence item", () => {
    const withoutDigest = evidence();
    delete withoutDigest.inputDigest;
    expect(() => validateTask(v3({ evidence: [withoutDigest] }))).toThrow(TaskValidationError);
  });

  it("requires exit code 0 for a command pass and a non-zero exit code for a command fail", () => {
    expect(() => validateTask(v3({ evidence: [evidence({ exitCode: 1 })] }))).toThrow(TaskValidationError);
    expect(() =>
      validateTask(v3({ evidence: [evidence({ result: "fail", exitCode: 0, inputDigest: undefined })] })),
    ).toThrow(TaskValidationError);
    expect(() =>
      validateTask(v3({ evidence: [evidence({ result: "fail", exitCode: 2, inputDigest: undefined })] })),
    ).not.toThrow();
  });

  it("requires an exit code on command-backed evidence", () => {
    const missingExit = evidence();
    delete missingExit.exitCode;
    expect(() => validateTask(v3({ evidence: [missingExit] }))).toThrow(TaskValidationError);
  });

  it("rejects unknown schema fields", () => {
    expect(() => validateTask(v3({ sidecar: true }))).toThrow(TaskValidationError);
  });

  it("describes the v3 field manifest without dropping the v2 review fields", () => {
    const manifest = taskRecordFieldManifest(3);
    expect(manifest.required).toContain("validationPlan");
    expect(manifest.optional).toEqual(expect.arrayContaining(["decisions", "epicId", "followUpOf", "residualRisks"]));
    expect(taskRecordFieldManifest(2).optional).not.toContain("followUpOf");
  });

  it("still reads historical v1 and v2 records unchanged", () => {
    const legacyV2 = v3({
      schemaVersion: 2,
      validationPlan: [
        {
          id: "check-one",
          description: "Unit tests",
          scope: "focused",
          required: true,
          command: "pnpm test",
          criterionIds: ["ac-one"],
          inputs: ["@task-contract", "src/**"],
        },
      ],
      evidence: [evidence()],
    });
    const legacyV1 = v3({
      schemaVersion: 1,
      validationPlan: [
        { id: "check-one", description: "Unit tests", scope: "focused", required: true, command: "pnpm test" },
      ],
      evidence: [],
    });
    delete legacyV1.decisions;
    expect(validateTask(legacyV2).schemaVersion).toBe(2);
    expect(validateTask(legacyV1).schemaVersion).toBe(1);
  });

  it("aggregates independent validation errors into one message instead of throwing the first", () => {
    const broken = v3({
      validationPlan: [
        {
          id: "check-one",
          description: "Suite tests",
          scope: "suite",
          required: true,
          command: "dotnet test",
          criterionIds: ["ac-one"],
          inputs: ["src/**"],
        },
      ],
      relevantPaths: ["../escape"],
    });
    const run = () => validateTask(broken);
    // Both independent problems appear in a single thrown message, each as its original substring.
    expect(run).toThrow(/invalid scope 'suite'; expected 'focused' or 'full'/u);
    expect(run).toThrow(/Task path is unsafe/u);
  });

  it("still accepts a fully valid v3 record", () => {
    expect(validateTask(v3()).schemaVersion).toBe(3);
  });
});
