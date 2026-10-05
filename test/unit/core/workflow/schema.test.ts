import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { workflowEnvelopeSchema } from "src/core/workflow/schema.js";
import { briefFlagNames } from "src/core/workflow/brief.js";
import {
  acceptanceCriterionKeys,
  checkScopes,
  criterionStatuses,
  evidenceResults,
  taskModes,
  taskStatuses,
  workflowCheckpoints,
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

  it("lists the constraints validateTask enforces so an agent need not read prose to build an envelope", () => {
    const { constraints } = workflowEnvelopeSchema();

    expect(constraints.mode).toEqual(["lite", "full"]);
    expect(constraints.scope).toEqual(["focused", "full"]);
    expect(constraints.result).toEqual(["pass", "fail", "skipped"]);
    expect(constraints.criterionStatus).toEqual(["pending", "met", "waived"]);
    expect(constraints.status).toContain("in_progress");
    expect(constraints.checkpoint).toContain("replan");
    expect(new RegExp(constraints.taskId, "u").test("20261001-185520-measure-baseline")).toBe(true);
    expect(new RegExp(constraints.taskId, "u").test("measure-baseline")).toBe(false);
    expect(new RegExp(constraints.epicId, "u").test("20261001-185520-agent-token-diet")).toBe(true);
    expect(constraints.sortedUniqueArrays).toEqual(["validationPlan[].criterionIds", "validationPlan[].inputs"]);
    expect(constraints.newCriterion).toContain("evidenceIds");
    expect(constraints.requiredCheck).toContain("criterionIds");
    expect(constraints.envelope).toContain("{ task");
    expect(constraints.brief).toEqual(briefFlagNames());
  });

  it("builds the listed enums from the constants the validator checks against", () => {
    const { constraints } = workflowEnvelopeSchema();

    expect(constraints.mode).toEqual([...taskModes]);
    expect(constraints.status).toEqual([...taskStatuses]);
    expect(constraints.checkpoint).toEqual([...workflowCheckpoints]);
    expect(constraints.scope).toEqual([...checkScopes]);
    expect(constraints.result).toEqual([...evidenceResults]);
    expect(constraints.criterionStatus).toEqual([...criterionStatuses]);
  });

  it("describes the full --batch envelope and its rules", () => {
    const text = workflowEnvelopeSchema().transports["--batch"] ?? "";

    for (const part of ["criteria?", "checks?", "decisions?", "risks?", "paths?: { paths?, specs? }", "reason?"]) {
      expect(text).toContain(part);
    }
    expect(text).toContain("severity defaults to low");
    expect(text).toContain("10-1000 characters");
  });
});
