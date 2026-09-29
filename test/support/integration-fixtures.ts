import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import type {
  EvidenceV1,
  EvidenceV2,
  TaskMode,
  TaskRecordV1,
  TaskRecordV2,
  TaskRecordV3,
  TaskStatus,
  WorkflowCheckpoint,
} from "src/core/tasks/task.js";
import { buildCheck, buildCriterion, buildTaskV1, buildTaskV2, buildTaskV3 } from "./builders.js";

/** Instant used by tests that model records written before the restructuring (UTC `Z` form). */
export const LEGACY_TIMESTAMP = "2026-08-13T00:00:00.000Z";

/**
 * A minimal historical v1 record (no criteria, checks or evidence) for doctor and history tests that
 * assert legacy data is reported without being rewritten.
 */
export function legacyTaskRecord(
  id: string,
  status: "in_progress" | "completed",
  checkpoint: "implementing" | "finishing",
): TaskRecordV1 {
  return buildTaskV1({
    id,
    title: id,
    status,
    checkpoint,
    goal: "test",
    acceptanceCriteria: [],
    validationPlan: [],
    createdAt: LEGACY_TIMESTAMP,
    updatedAt: LEGACY_TIMESTAMP,
  });
}

/** Injected global-integration inputs so doctor never reads a real user profile. */
export function globalDoctorOptions(home: string) {
  return {
    commandLookup: async () => true,
    environment: { CODEX_HOME: join(home, "codex") },
    homeResolver: async () => home,
  };
}

/** The knobs command-level tests vary on the common "one criterion, one required gate check" task. */
export interface GatedTaskShape {
  id: string;
  title?: string;
  goal?: string;
  mode?: TaskMode;
  status?: TaskStatus;
  checkpoint?: WorkflowCheckpoint;
  relevantPaths?: string[];
  criterion?: {
    id?: string;
    text?: string;
    status?: "pending" | "met" | "waived";
    evidenceIds?: string[];
    waiverReason?: string;
  };
  gate?: { id?: string; description?: string; command?: string; inputs?: string[] };
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

/** Drops `undefined` entries so optional builder overrides are only passed when a test sets them. */
function present<T extends object>(values: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

function gatedParts(shape: GatedTaskShape) {
  const criterionId = shape.criterion?.id ?? "criterion";
  const criterion = buildCriterion({
    id: criterionId,
    text: shape.criterion?.text ?? "criterion",
    ...present({
      status: shape.criterion?.status,
      evidenceIds: shape.criterion?.evidenceIds,
      waiverReason: shape.criterion?.waiverReason,
    }),
  });
  const common = {
    id: shape.id,
    ...present({
      title: shape.title,
      goal: shape.goal,
      mode: shape.mode,
      status: shape.status,
      checkpoint: shape.checkpoint,
      relevantPaths: shape.relevantPaths,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
      completedAt: shape.completedAt,
    }),
    acceptanceCriteria: [criterion],
  };
  return { common, criterionId, gateId: shape.gate?.id ?? "gate" };
}

/** Current (v3) task with one criterion and one required `gate` check; `evidence` is appended as given. */
export function buildGatedTask(shape: GatedTaskShape, evidence: EvidenceV2[] = []): TaskRecordV3 {
  const { common, criterionId, gateId } = gatedParts(shape);
  return buildTaskV3({
    ...common,
    validationPlan: [
      buildCheck({
        id: gateId,
        criterionIds: [criterionId],
        ...present({ description: shape.gate?.description, command: shape.gate?.command, inputs: shape.gate?.inputs }),
      }),
    ],
    evidence,
  });
}

/** Historical v1 task (checks without criterionIds/inputs) with the same gate shape, for compatibility tests. */
export function buildLegacyGatedTask(shape: GatedTaskShape, evidence: EvidenceV1[] = []): TaskRecordV1 {
  const { common, gateId } = gatedParts(shape);
  return buildTaskV1({
    ...common,
    validationPlan: [
      {
        id: gateId,
        description: shape.gate?.description ?? "Unit tests",
        scope: "focused",
        required: true,
        command: shape.gate?.command ?? "pnpm test",
      },
    ],
    evidence,
  });
}

/** Historical v2 task (checks declare the retired `@task-contract` input) with the same gate shape. */
export function buildLegacyV2GatedTask(shape: GatedTaskShape): TaskRecordV2 {
  const { common, criterionId, gateId } = gatedParts(shape);
  const gate = buildCheck({
    id: gateId,
    criterionIds: [criterionId],
    inputs: ["@task-contract", ...(shape.gate?.inputs ?? [])],
    ...present({ description: shape.gate?.description, command: shape.gate?.command }),
  });
  // A v2 check without a command is not "behavioral", so it needs no repository input (only @task-contract).
  if (shape.gate?.command === undefined) delete gate.command;
  return buildTaskV2({ ...common, validationPlan: [gate] });
}

/** Content-addressed listing of every file under `root`, to prove a command left a project untouched. */
export async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walkFiles(root);
  return Promise.all(
    files.map(async (path) => ({
      path: relative(root, path).replaceAll("\\", "/"),
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    })),
  );
}

async function walkFiles(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...(await walkFiles(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}

/** Concatenated first argument of every recorded `process.stdout.write` spy call. */
export function output(calls: readonly (readonly unknown[])[]): string {
  return calls.map((call) => String(call[0])).join("");
}

/** Historical v1 evidence item (no digest); pass/fail/skip with the exit code a command-backed check records. */
export function buildLegacyEvidence(
  overrides: Pick<EvidenceV1, "id" | "checkId" | "recordedAt" | "result"> & Partial<EvidenceV1>,
): EvidenceV1 {
  return { summary: "legacy evidence", artifactPaths: [], ...overrides };
}

/** Appends a passing evidence item and marks the task's first criterion met by it. */
export function withPassingEvidence(task: TaskRecordV3, evidence: EvidenceV2): TaskRecordV3 {
  const [first, ...rest] = task.acceptanceCriteria;
  return {
    ...task,
    acceptanceCriteria: [{ ...first!, status: "met", evidenceIds: [evidence.id] }, ...rest],
    evidence: [...task.evidence, evidence],
  };
}
