import { Buffer } from "node:buffer";

import { readConfig } from "../core/config/config.js";
import type { TaskMode, TaskStatus, WorkflowCheckpoint } from "../core/tasks/task.js";
import {
  inspectRequiredChecks,
  type RequiredCheckInspection,
  type RequiredCheckReasonCode,
  type RequiredCheckState,
} from "../core/verification/check-report.js";
import type { VerificationInputChange } from "../core/verification/input-freshness.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { compareCodeUnits } from "../utils/order.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

const MAX_PUBLIC_RESULT_BYTES = 262_144;
const MAX_CHANGES_PER_CHECK = 20;

interface PublicCheckItemV1 {
  readonly id: string;
  readonly state: RequiredCheckState;
  readonly reasonCodes: readonly RequiredCheckReasonCode[];
  readonly changeSummary: {
    readonly changed: number;
    readonly missing: number;
    readonly returned: number;
    readonly truncated: boolean;
  };
  readonly changes: readonly VerificationInputChange[];
}

export interface ChecksReportResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly filter: { readonly limit: number };
  readonly activeTask: {
    readonly id: string;
    readonly mode: TaskMode;
    readonly status: TaskStatus;
    readonly checkpoint: WorkflowCheckpoint;
    readonly summary: {
      readonly passed: number;
      readonly failed: number;
      readonly stale: number;
      readonly pending: number;
      readonly total: number;
      readonly returned: number;
      readonly resultTruncated: boolean;
      readonly detailsTruncated: boolean;
    };
    readonly checks: readonly PublicCheckItemV1[];
  } | null;
}

interface VisibleInspection {
  readonly inspection: RequiredCheckInspection;
  readonly changes: VerificationInputChange[];
}

export async function reportProjectChecks(cwd: string, limit: number, now = Date.now()): Promise<ChecksReportResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Checks requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const task = await resolveActiveTask(harnixRoot).catch(redactChecksParserError);
  const base = { generator: "harnix" as const, schemaVersion: 1 as const, scope: "project" as const, filter: { limit } };
  if (task === undefined) return { ...base, activeTask: null };

  const inspections = (await inspectRequiredChecks(project.root, harnixRoot, task, now)).sort((left, right) => compareCodeUnits(left.id, right.id));
  const visible: VisibleInspection[] = inspections.slice(0, limit).map((inspection) => ({ inspection, changes: inspection.changes.slice(0, MAX_CHANGES_PER_CHECK) }));
  const counts = countStates(inspections);
  const createResult = (): ChecksReportResultV1 => {
    const checks = visible.map(({ inspection: item, changes }): PublicCheckItemV1 => {
      const changed = item.changes.filter((change) => change.kind === "changed").length;
      const missing = item.changes.length - changed;
      return {
        id: item.id,
        state: item.state,
        reasonCodes: item.reasonCodes,
        changeSummary: { changed, missing, returned: changes.length, truncated: changes.length < item.changes.length },
        changes,
      };
    });
    const resultTruncated = visible.length < inspections.length;
    return {
      ...base,
      activeTask: {
        id: task.id,
        mode: task.mode,
        status: task.status,
        checkpoint: task.checkpoint,
        summary: {
          ...counts,
          returned: checks.length,
          resultTruncated,
          detailsTruncated: resultTruncated || checks.some((check) => check.changeSummary.truncated),
        },
        checks,
      },
    };
  };

  let result = createResult();
  while (serializedBytes(result) > MAX_PUBLIC_RESULT_BYTES) {
    const withChanges = [...visible].reverse().find((item) => item.changes.length > 0);
    if (withChanges !== undefined) withChanges.changes.pop();
    else if (visible.length > 0) visible.pop();
    else throw new Error("Checks metadata exceeds the public output bound.");
    result = createResult();
  }
  return result;
}

function countStates(inspections: readonly RequiredCheckInspection[]): Record<RequiredCheckState | "total", number> {
  const counts = { passed: 0, failed: 0, stale: 0, pending: 0, total: inspections.length };
  for (const item of inspections) counts[item.state] += 1;
  return counts;
}

function serializedBytes(value: ChecksReportResultV1): number {
  return Buffer.byteLength(`${JSON.stringify(value)}\n`, "utf8");
}

function redactChecksParserError(error: unknown): never {
  if (error instanceof SyntaxError) throw new Error("Checks task state is unavailable; run harnix doctor.");
  throw error;
}
