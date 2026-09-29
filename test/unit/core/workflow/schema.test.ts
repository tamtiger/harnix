import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { workflowEnvelopeSchema } from "src/core/workflow/schema.js";
import {
  acceptanceCriterionKeys,
  blockerKeys,
  evidenceV2Keys,
  taskRecordFieldManifest,
  validationCheckV2Keys,
} from "src/core/tasks/task.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow schema", () => {
  it("should_describe_the_save_envelope_schema_without_writing", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const schema = workflowEnvelopeSchema();

    expect(schema.generator).toBe("harnix");
    expect(schema.schemaVersion).toBe(1);
    expect(Object.keys(schema.envelope).sort()).toEqual([
      "artifacts",
      "contractRevision",
      "epic",
      "epicMembers",
      "task",
    ]);
    expect(schema.taskRecord.required).toContain("acceptanceCriteria");
    expect(schema.taskRecord.required).toContain("validationPlan");
    expect(JSON.stringify(schema)).not.toContain(root);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({ activeTask: null });
  });

  it("should_derive_the_schema_taskRecord_field_lists_from_the_same_manifest_validateTask_enforces", () => {
    // This is a structural guarantee, not a coincidence: workflowEnvelopeSchema
    // must call the exported task.ts manifest directly rather than keep a
    // second hardcoded list, so a field added to TaskRecordV3 shows up here
    // automatically instead of silently going stale.
    const schema = workflowEnvelopeSchema();

    expect(schema.taskRecord).toEqual(taskRecordFieldManifest(3));
    expect(schema.nested.acceptanceCriteria.sort()).toEqual([...acceptanceCriterionKeys].sort());
    expect(schema.nested.validationPlan.sort()).toEqual([...validationCheckV2Keys].sort());
    expect(schema.nested.evidence.sort()).toEqual([...evidenceV2Keys].sort());
    expect(schema.nested.blocker.sort()).toEqual([...blockerKeys].sort());
  });
});
