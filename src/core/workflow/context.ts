import { basename, dirname } from "node:path";
import {
  inspectContextDrift,
  loadContextManifest,
  type ContextDrift,
  type ContextManifest,
} from "../context/context.js";
import {
  inspectContextSelectionChanges,
  loadContextSelectionSnapshot,
  type ContextSelectionInput,
} from "../context/selection-freshness.js";
import { readConfig } from "../config/config.js";
import { readRepoMap } from "../repo-map/store.js";
import { guideOutputPath, selectGuideSources } from "../../guides/catalog.js";
import { resolveActiveTask, type TaskRecord } from "../tasks/task.js";
import { isMissing } from "../tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "../../utils/paths.js";
import { compareCodeUnits } from "../../utils/order.js";

export async function continueWorkflowTask(
  harnixRoot: string,
): Promise<{ task: TaskRecord; contextPaths: string[]; contextDrift: ContextDrift } | undefined> {
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) return undefined;
  const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
  return {
    task,
    contextPaths: [...new Set([...task.relevantPaths, ...task.relevantSpecs])].sort(compareCodeUnits),
    contextDrift: await taskContextDrift(projectRoot, harnixRoot, task),
  };
}

export async function taskContextDrift(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
): Promise<ContextDrift> {
  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const path = await resolveSafeProjectPath(taskDirectory, "context.json");
    const manifest = await loadContextManifest(path);
    const contentDrift = await inspectContextDrift(projectRoot, manifest);
    let snapshot;
    try {
      snapshot = await loadContextSelectionSnapshot(
        await resolveSafeProjectPath(taskDirectory, "context-selection.json"),
      );
    } catch (error: unknown) {
      if (isMissing(error))
        return { ...contentDrift, state: contentDrift.state === "stale" ? "stale" : "not-recorded" };
      throw new Error("Context selection snapshot is unreadable or invalid.");
    }
    const input = await contextSelectionInput(projectRoot, harnixRoot, task, manifest, false);
    const selectionChanges = inspectContextSelectionChanges(snapshot, input);
    return {
      changes: contentDrift.changes,
      selectionChanges,
      state:
        contentDrift.state === "stale" || selectionChanges.length > 0
          ? "stale"
          : contentDrift.state === "not-recorded"
            ? "not-recorded"
            : "current",
    };
  } catch (error: unknown) {
    if (isMissing(error)) return inspectContextDrift(projectRoot, undefined);
    throw error;
  }
}

export async function contextSelectionInput(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
  manifest: ContextManifest,
  requireInventory: boolean,
): Promise<ContextSelectionInput> {
  const config = await readConfig(await resolveSafeProjectPath(harnixRoot, "config.yaml"));
  const selectedGuidePaths = selectGuideSources({
    activePaths: task.relevantPaths,
    languages: config.languages,
    technologies: config.technologies,
    topics: [...new Set(`${task.title} ${task.goal}`.toLowerCase().match(/[a-z0-9-]+/gu) ?? [])].sort(compareCodeUnits),
  }).map(guideOutputPath);
  let inventoryFingerprint = "";
  try {
    inventoryFingerprint = (await readRepoMap(projectRoot)).inventoryFingerprint;
  } catch (error: unknown) {
    if (requireInventory) throw error;
  }
  return { config, inventoryFingerprint, manifest, selectedGuidePaths, task };
}
