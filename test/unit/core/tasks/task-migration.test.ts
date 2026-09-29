import { describe, expect, it } from "vitest";

import {
  TASK_V2_MIGRATION_EVIDENCE_ID,
  TASK_V2_MIGRATION_SUMMARY,
  TASK_V3_MIGRATION_EVIDENCE_ID,
  TASK_V3_MIGRATION_SUMMARY,
  createTaskV2MigrationEvidence,
  createTaskV3MigrationEvidence,
} from "src/core/tasks/task-migration.js";
import { TEST_TASK_ID, at } from "test/support/builders.js";

describe("task migration evidence", () => {
  it("builds the exact v3 migration evidence a migration save must append", () => {
    expect(createTaskV3MigrationEvidence(TEST_TASK_ID, at(5))).toEqual({
      id: "task-schema-to-v3",
      recordedAt: at(5),
      result: "pass",
      summary: TASK_V3_MIGRATION_SUMMARY,
      artifactPaths: [`.harnix/tasks/${TEST_TASK_ID}/task.json`],
    });
  });

  it("keeps the retired v2 migration evidence reproducible for historical records", () => {
    expect(createTaskV2MigrationEvidence(TEST_TASK_ID, at(5))).toEqual({
      id: "task-schema-v1-to-v2",
      recordedAt: at(5),
      result: "pass",
      summary: TASK_V2_MIGRATION_SUMMARY,
      artifactPaths: [`.harnix/tasks/${TEST_TASK_ID}/task.json`],
    });
  });

  it("uses distinct evidence IDs and carries no check, digest or exit code", () => {
    expect(TASK_V2_MIGRATION_EVIDENCE_ID).not.toBe(TASK_V3_MIGRATION_EVIDENCE_ID);
    const evidence = createTaskV3MigrationEvidence(TEST_TASK_ID, at(0));

    expect(evidence).not.toHaveProperty("checkId");
    expect(evidence).not.toHaveProperty("inputDigest");
    expect(evidence).not.toHaveProperty("exitCode");
  });
});
