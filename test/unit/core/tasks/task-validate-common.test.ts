import { describe, expect, it } from "vitest";
import {
  TaskValidationError,
  assertExactKeys,
  ensureUnique,
  isBoundedText,
  isCancellationReason,
  isInputDigest,
  isIsoTimestamp,
  isMissing,
  isRecord,
  isSafeRepositoryPath,
  isSortedUnique,
  validId,
  validateTaskId,
} from "src/core/tasks/task-validate-common.js";
import { resolveActiveTask, saveTask, setActiveTask, validateTask } from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { taskFixture } from "test/support/tasks-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("task validation common rules", () => {
  it("accepts readable kebab-case task slugs and rejects unsafe task IDs", async () => {
    const readable = { ...taskFixture(), id: "20260813-221700-workflow-audit-fix" };
    expect(() => validateTask(readable)).not.toThrow();

    const root = await temporaryRepository();
    await saveTask(root, readable);
    await setActiveTask(root, readable.id);
    await expect(resolveActiveTask(root)).resolves.toMatchObject({ id: readable.id });

    for (const id of [
      "20260813-221700-Workflow-audit-fix",
      "20260813-221700-workflow--audit-fix",
      "20260813-221700--workflow-audit-fix",
      "20260813-221700-workflow-audit-fix-",
      "20260813-221700-../workflow-audit-fix",
    ]) {
      expect(() => validateTask({ ...taskFixture(), id }), id).toThrow("invalid");
      await expect(setActiveTask(root, id), id).rejects.toThrow("unsafe");
    }
  });

  it("rejects malformed evidence and acceptance criteria", () => {
    expect(() => validateTask({ ...taskFixture(), evidence: [{ id: "e" }] })).toThrow("Evidence");
    expect(() =>
      validateTask({ ...taskFixture(), acceptanceCriteria: [{ id: "a", text: "x", status: "bad", evidenceIds: [] }] }),
    ).toThrow("Acceptance");
  });

  it("accepts epicId on TaskRecordV2, rejects on V1, accepts V2 without epicId", () => {
    expect(() => validateTask({ schemaVersion: 2, epicId: "my-epic" })).toThrow(/required|task/iu);

    const v1WithEpicId = { ...taskFixture(), epicId: "my-epic" };
    expect(() => validateTask(v1WithEpicId)).toThrow(/unknown|field/iu);

    const v1NoEpicId = taskFixture();
    expect(() => validateTask(v1NoEpicId)).not.toThrow();
  });
});

describe("task validation helpers", () => {
  it("accepts only offset-bearing ISO timestamps that actually parse", () => {
    expect(isIsoTimestamp("2026-09-29T09:00:00.000+07:00")).toBe(true);
    expect(isIsoTimestamp("2026-09-29T02:00:00Z")).toBe(true);
    expect(isIsoTimestamp("2026-09-29 09:00:00")).toBe(false);
    expect(isIsoTimestamp("2026-09-29T09:00:00")).toBe(false);
    expect(isIsoTimestamp("2026-13-45T00:00:00Z")).toBe(false);
    expect(isIsoTimestamp(20260929)).toBe(false);
  });

  it("checks identifiers, safe repository paths and digests strictly", () => {
    expect(validId("ac-one.v2_x")).toBe(true);
    expect(validId("-leading")).toBe(false);
    expect(validId("has space")).toBe(false);
    expect(isSafeRepositoryPath("src/a.ts")).toBe(true);
    expect(isSafeRepositoryPath("../escape")).toBe(false);
    expect(isSafeRepositoryPath("src\\a.ts")).toBe(false);
    expect(isSafeRepositoryPath(42)).toBe(false);
    expect(isInputDigest("a".repeat(64))).toBe(true);
    expect(isInputDigest("A".repeat(64))).toBe(false);
    expect(isInputDigest("a".repeat(63))).toBe(false);
  });

  it("validates ordering, uniqueness, text bounds and cancellation reasons", () => {
    expect(isSortedUnique(["a", "b", "c"])).toBe(true);
    expect(isSortedUnique(["b", "a"])).toBe(false);
    expect(isSortedUnique(["a", "a"])).toBe(false);
    expect(() => ensureUnique(["x", "y"], "thing")).not.toThrow();
    expect(() => ensureUnique(["x", "x"], "thing")).toThrow("Duplicate thing ID.");
    expect(isBoundedText("ok")).toBe(true);
    expect(isBoundedText("   ")).toBe(false);
    expect(isBoundedText("x".repeat(2_001))).toBe(false);
    expect(isCancellationReason("Người dùng dừng task.")).toBe(true);
    expect(isCancellationReason(" padded ")).toBe(false);
    expect(isCancellationReason("line\nbreak")).toBe(false);
    expect(isCancellationReason("")).toBe(false);
  });

  it("rejects unknown keys with a labelled TaskValidationError and unsafe task IDs", () => {
    expect(() => assertExactKeys({ a: 1 }, new Set(["a"]), "Thing")).not.toThrow();
    expect(() => assertExactKeys({ a: 1, z: 2 }, new Set(["a"]), "Thing")).toThrow(TaskValidationError);
    expect(() => assertExactKeys({ z: 2 }, new Set(["a"]), "Thing")).toThrow("Thing contains an unknown schema field.");
    expect(() => validateTaskId("20260929-090000-example")).not.toThrow();
    expect(() => validateTaskId("Example")).toThrow("Task ID is unsafe.");
    expect(isMissing({ code: "ENOENT" })).toBe(true);
    expect(isRecord(null)).toBe(false);
  });
});
