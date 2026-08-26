import { Buffer } from "node:buffer";

import { readConfig, type PlatformId } from "../core/config/config.js";
import { buildEffectiveContext, type EffectiveContextReasonCode } from "../core/context/effective-context.js";
import type { ContextChange, ContextDrift, ContextManifest } from "../core/context/context.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { taskContextDrift } from "../core/workflow.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

const MAX_PUBLIC_RESULT_BYTES = 262_144;

interface ContextReportSelectedV1 {
  readonly path: string;
  readonly reasonCodes: readonly EffectiveContextReasonCode[];
  readonly priority: number;
  readonly pinned: boolean;
}

export interface ContextReportResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly platform: PlatformId;
  readonly filter: { readonly limit: number };
  readonly activeTask: {
    readonly id: string;
    readonly budget: { readonly maxCharacters: number; readonly maxEntries: number };
    readonly drift: {
      readonly state: ContextDrift["state"];
      readonly changeCount: number;
      readonly returnedChanges: number;
      readonly changesTruncated: boolean;
      readonly changes: readonly ContextChange[];
      readonly selectionChanges: ContextDrift["selectionChanges"];
    };
    readonly summary: {
      readonly candidates: number;
      readonly selected: number;
      readonly omitted: number;
      readonly returnedSelected: number;
      readonly returnedOmitted: number;
      readonly selectedTruncated: boolean;
      readonly omittedTruncated: boolean;
      readonly detailsTruncated: boolean;
    };
    readonly selected: readonly ContextReportSelectedV1[];
    readonly omitted: readonly ContextManifest["omitted"][number][];
  } | null;
}

export async function reportProjectContext(cwd: string, platform: PlatformId, limit: number): Promise<ContextReportResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Context report requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  const config = await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const task = await resolveActiveTask(harnixRoot).catch(redactContextReportParserError);
  const base = { generator: "harnix" as const, schemaVersion: 1 as const, scope: "project" as const, platform, filter: { limit } };
  if (task === undefined) return { ...base, activeTask: null };

  const [effective, drift] = await Promise.all([
    buildEffectiveContext({ projectRoot: project.root, harnixRoot, config, task, platform, forceBounded: true }),
    taskContextDrift(project.root, harnixRoot, task),
  ]).catch(redactContextReportParserError);
  const selected = effective.manifest.entries.slice(0, limit).map((entry): ContextReportSelectedV1 => ({
    path: entry.path,
    reasonCodes: effective.reasonCodesByPath.get(entry.path) ?? [],
    priority: entry.priority,
    pinned: entry.pinned,
  }));
  const omitted = effective.manifest.omitted.slice(0, limit);
  const changes = drift.changes.slice(0, limit);

  const createResult = (): ContextReportResultV1 => {
    const selectedTruncated = selected.length < effective.manifest.entries.length;
    const omittedTruncated = omitted.length < effective.manifest.omitted.length;
    const changesTruncated = changes.length < drift.changes.length;
    return {
      ...base,
      activeTask: {
        id: task.id,
        budget: effective.budget,
        drift: {
          state: drift.state,
          changeCount: drift.changes.length,
          returnedChanges: changes.length,
          changesTruncated,
          changes,
          selectionChanges: drift.selectionChanges,
        },
        summary: {
          candidates: effective.candidates,
          selected: effective.manifest.entries.length,
          omitted: effective.manifest.omitted.length,
          returnedSelected: selected.length,
          returnedOmitted: omitted.length,
          selectedTruncated,
          omittedTruncated,
          detailsTruncated: selectedTruncated || omittedTruncated || changesTruncated,
        },
        selected,
        omitted,
      },
    };
  };

  let result = createResult();
  while (serializedBytes(result) > MAX_PUBLIC_RESULT_BYTES) {
    if (changes.length > 0) changes.pop();
    else if (omitted.length > 0) omitted.pop();
    else if (selected.length > 0) selected.pop();
    else throw new Error("Context report metadata exceeds the public output bound.");
    result = createResult();
  }
  return result;
}

function serializedBytes(value: ContextReportResultV1): number {
  return Buffer.byteLength(`${JSON.stringify(value)}\n`, "utf8");
}

function redactContextReportParserError(error: unknown): never {
  if (error instanceof SyntaxError) throw new Error("Context report state is unavailable; run harnix doctor.");
  throw error;
}
