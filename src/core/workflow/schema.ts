import { epicIdPattern } from "src/core/epics/epic.js";
import {
  acceptanceCriterionKeys,
  blockerKeys,
  checkScopes,
  criterionStatuses,
  evidenceResults,
  evidenceV2Keys,
  taskIdPattern,
  taskModes,
  taskRecordFieldManifest,
  taskStatuses,
  validationCheckV2Keys,
  workflowCheckpoints,
} from "src/core/tasks/task.js";
import { briefFlagNames } from "./brief.js";

export interface WorkflowEnvelopeSchemaV1 {
  generator: "harnix";
  schemaVersion: 1;
  envelope: Record<string, string>;
  taskRecord: { required: string[]; optional: string[] };
  nested: { acceptanceCriteria: string[]; validationPlan: string[]; evidence: string[]; blocker: string[] };
  transports: Record<string, string>;
  /** Values and rules the validator enforces, so an envelope can be built right the first time. */
  constraints: {
    mode: string[];
    status: string[];
    checkpoint: string[];
    scope: string[];
    result: string[];
    criterionStatus: string[];
    taskId: string;
    epicId: string;
    sortedUniqueArrays: string[];
    checkCwd: string;
    checkBaseline: string;
    newCriterion: string;
    requiredCheck: string;
    envelope: string;
    brief: string[];
  };
}

/** Read-only self-description so an agent can build a valid envelope before its first save fails. */
export function workflowEnvelopeSchema(): WorkflowEnvelopeSchemaV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    envelope: {
      artifacts: "optional { prd?, plan?, design?, research?: { <safe>.md: text }, context? }",
      contractRevision:
        "optional { reason: 10-1000 characters }, accepted in the save that sets checkpoint replan on an unfinished task and revises unproven obligations",
      epic: "optional EpicRecord schema v1; when present, upserts .harnix/epics/<epic-id>.json and regenerates markdown",
      epicMembers:
        "optional TaskRecord[] schema v3 in planning state; saved as non-active member tasks with matching epicId",
      task: "TaskRecord, required",
    },
    taskRecord: taskRecordFieldManifest(3),
    nested: {
      acceptanceCriteria: [...acceptanceCriterionKeys].sort(),
      validationPlan: [...validationCheckV2Keys].sort(),
      evidence: [...evidenceV2Keys].sort(),
      blocker: [...blockerKeys].sort(),
    },
    constraints: {
      mode: [...taskModes],
      status: [...taskStatuses],
      checkpoint: [...workflowCheckpoints],
      scope: [...checkScopes],
      result: [...evidenceResults],
      criterionStatus: [...criterionStatuses],
      taskId: taskIdPattern.source,
      epicId: epicIdPattern.source,
      sortedUniqueArrays: ["validationPlan[].criterionIds", "validationPlan[].inputs"],
      checkCwd:
        'optional repository-relative POSIX path ("." is the root); traversal, absolute and drive-relative forms are rejected',
      checkBaseline: "optional { result?, classification?, authorizedBy?, scope? }; no other key",
      newCriterion: 'status "pending" with evidenceIds: [] on every criterion; criteria text is free-form',
      requiredCheck:
        "a required check needs non-empty criterionIds and inputs; every non-waived criterion is covered by one",
      envelope:
        "{ task, artifacts?, contractRevision?, epic?, epicMembers? }; the TaskRecord goes under task, never bare",
      brief: briefFlagNames(),
    },
    transports: {
      "--init":
        "Create a valid v3 task and set it active: --init --title <t> [--mode lite|full --goal <g> --text <criterion> --command <cmd> --input <glob,glob> --epic <epic-id> --follow-up <task-id>]; the command and inputs default from verify-plan; --epic attaches an existing epic and --follow-up records followUpOf and inherits the parent's epic and paths.",
      "--preflight": "Read-only routing metadata: clock, learning notes, check counts, active task and nextStage.",
      "--snapshot": "Read-only input digest of one check (--snapshot --check <id>).",
      "--inspect": "Read-only view of the active workflow state.",
      "--save": "Full record plus artifacts. Required for obligations, artifacts and contract revisions.",
      "--transition":
        "Status and checkpoint only, read from the persisted record: --transition <status>/<checkpoint> [--dry-run] [--reviewed]. Entering ready/ready checks the plan content (placeholders, every criterion named in plan.md, a focused required check per criterion); a Full task also needs --reviewed after the ready-review, and --dry-run returns reviewChecklist.",
      "--evidence":
        "Append exactly one evidence item from a stdin envelope, or from --check, --result, --summary and optional --exit-code, --artifact, --digest flags.",
      "--criterion":
        "Mark criteria met from fresh passing evidence: --criterion <ids> --met [--evidence-ids <ids>]; schema v3 only.",
      "--migrate":
        "Migrate the active unfinished legacy v1/v2 task to schema v3; optional stdin { checks } supplies criterionIds and inputs.",
      "--run-check":
        "Run the command after -- between two input snapshots of one check and record the outcome; the argv must equal the declared command and runs in the declared cwd, and a check that failed twice in a row is refused; output is returned, never stored.",
      "--set-check":
        "Add or update one validation check of the active v3 task from flags; after planning it needs --reason and makes the guarded replan save.",
      "--replace-check":
        "Retire a failed or unpassed required check and activate or declare a replacement check covering its criteria: --replace-check <old> <new> --reason <why> [--description --command --scope --input --criteria --cwd]; the replacement must differ from the retired check in command, inputs or cwd; schema v3 only.",
      "--add-criterion":
        "Add one acceptance criterion from --text and cover it with the --check IDs; same --reason rule as --set-check.",
      "--add-decision": "Record one decision (--text, --rationale) on the active v3 task; review data, so no --reason.",
      "--add-risk":
        "Record one residual risk (--text, optional --severity) on the active v3 task; review data, so no --reason.",
      "--set-paths":
        "Replace the relevant paths and/or specs from repeatable --relevant-path and --relevant-spec flags; needs no reason.",
      "--batch":
        "Apply criteria, checks, decisions, risks and paths atomically from the stdin envelope { criteria?: [{ id, text?, status?, waiverReason?, checks? }], checks?: [{ id, description?, command?, scope?, required?, criteria?, inputs? }], decisions?: [{ id, text, rationale }], risks?: [{ id, text, severity? }], paths?: { paths?, specs? }, reason? } in one save under the workflow lock; decision and risk ids must be new (severity defaults to low); changing criteria or checks follows --set-check, so after planning it needs reason (10-1000 characters); schema v3 only.",
      "--brief":
        "Print only id, status, checkpoint and updatedAt (preflight: without learning); the commands that accept it are listed in constraints.brief.",
      "--finish":
        "Terminal completion; accepts no body. With --brief it also returns learning { notes, captured, hint? }.",
      "--cancel": "Terminal cancellation; the only cancellation transport.",
      "--learn":
        'Record one hand-authored learning candidate from stdin { "candidate": { id, statement, sourceTaskIds, evidenceIds } } (no --text or --rationale flags); needs an active verifying/finishing task whose required checks are fresh, and the candidate must cite its evidence. Without a stdin body, --add-decision or --add-risk on the active task is captured at --finish.',
    },
  };
}
