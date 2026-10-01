import { validateContextManifest } from "src/core/context/context.js";
import { validateTask, type Evidence, type TaskArtifacts, type TaskRecord } from "src/core/tasks/task.js";
import { unknownFieldsMessage } from "src/core/tasks/task.js";
import { assertExactFields, isRecord } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";

export type WorkflowSaveArtifacts = Omit<TaskArtifacts, "contextSelection">;
export interface WorkflowSaveEnvelope {
  task: unknown;
  artifacts?: WorkflowSaveArtifacts | undefined;
  contractRevision?: { reason: string } | undefined;
  epic?: unknown;
  epicMembers?: TaskRecord[] | undefined;
}

const ENVELOPE_KEYS: ReadonlySet<string> = new Set(["task", "artifacts", "contractRevision", "epic", "epicMembers"]);
const ENVELOPE_SHAPE = "{ task, artifacts?, contractRevision?, epic?, epicMembers? }";

/** Epic members are listed by ID, so the declared order only survives when each ID sorts after the one before it. */
function assertEpicMemberOrder(ids: readonly string[]): void {
  for (let index = 1; index < ids.length; index += 1) {
    const previous = ids[index - 1] as string;
    const next = ids[index] as string;
    if (compareCodeUnits(previous, next) >= 0)
      throw new Error(
        `Epic members must be ordered by execution: "${previous}" is declared before "${next}" but does not sort before it. Give each member a later idPrefix (YYYYMMDD-HHMMSS) than the one before it.`,
      );
  }
}

export function validateWorkflowSaveEnvelope(value: unknown): WorkflowSaveEnvelope {
  if (!isRecord(value)) throw new Error("Workflow save envelope is invalid.");
  const unknown = Object.keys(value).filter((key) => !ENVELOPE_KEYS.has(key));
  if (!("task" in value)) {
    const found =
      unknown.length > 0
        ? `; found top-level ${unknown
            .slice(0, 5)
            .map((key) => JSON.stringify(key))
            .join(", ")} instead`
        : "";
    throw new Error(
      `Workflow save envelope requires task: expected ${ENVELOPE_SHAPE} with the TaskRecord under task${found}.`,
    );
  }
  if (unknown.length > 0)
    throw new Error(`${unknownFieldsMessage("Workflow save envelope", unknown)} Expected ${ENVELOPE_SHAPE}.`);
  const envelope: WorkflowSaveEnvelope = { task: value.task };
  if (value.artifacts !== undefined) envelope.artifacts = validateWorkflowSaveArtifacts(value.artifacts);
  if (value.contractRevision !== undefined) {
    if (!isRecord(value.contractRevision)) throw new Error("Workflow contractRevision is invalid.");
    assertExactFields(value.contractRevision, new Set(["reason"]), "Workflow contractRevision");
    if (typeof value.contractRevision.reason !== "string")
      throw new Error("Workflow contractRevision.reason must be a string.");
    envelope.contractRevision = { reason: value.contractRevision.reason };
  }
  if (value.epic !== undefined) {
    envelope.epic = value.epic;
  }
  if (value.epicMembers !== undefined) {
    if (!Array.isArray(value.epicMembers)) throw new Error("Workflow save envelope epicMembers must be an array.");
    envelope.epicMembers = value.epicMembers.map((m) => validateTask(m));
    if (isRecord(value.task) && typeof value.task.id === "string")
      assertEpicMemberOrder([value.task.id, ...envelope.epicMembers.map((member) => member.id)]);
  }
  return envelope;
}

function validateWorkflowSaveArtifacts(value: unknown): WorkflowSaveArtifacts {
  if (!isRecord(value)) throw new Error("Workflow save artifacts are invalid.");
  assertExactFields(value, new Set(["prd", "plan", "design", "research", "context"]), "Workflow save artifacts");
  const artifacts: WorkflowSaveArtifacts = {};
  for (const key of ["prd", "plan", "design"] as const) {
    if (value[key] === undefined) continue;
    if (typeof value[key] !== "string") throw new Error(`Workflow save artifact ${key} must be a string.`);
    artifacts[key] = value[key];
  }
  if (value.research !== undefined) {
    if (!isRecord(value.research) || Object.values(value.research).some((content) => typeof content !== "string")) {
      throw new Error("Workflow save artifact research must be a string map.");
    }
    artifacts.research = value.research as Record<string, string>;
  }
  if (value.context !== undefined) {
    if (!isRecord(value.context)) throw new Error("Workflow save artifact context must be an object.");
    artifacts.context = validateContextManifest(value.context);
  }
  return artifacts;
}

export function validateEvidenceEnvelope(value: unknown): Evidence {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "evidence") {
    throw new Error('Workflow evidence requires a bounded JSON envelope shaped { "evidence": <Evidence> }.');
  }
  const evidence = value.evidence;
  if (!isRecord(evidence)) throw new Error("Workflow evidence item must be an object.");
  return evidence as unknown as Evidence;
}
