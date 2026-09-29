import { readFile, rm } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { validateContextManifest } from "../context/context.js";
import { contextSelectionResultHash, validateContextSelectionSnapshot } from "../context/selection-freshness.js";
import type { TaskArtifacts, TaskRecord } from "../tasks/task.js";
import { isMissing, sameBytes } from "../tasks/workflow-helpers.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { compareCodeUnits } from "../../utils/order.js";
import { resolveSafeProjectPath } from "../../utils/paths.js";

const RESEARCH_ARTIFACT_NAME = /^[a-z0-9][a-z0-9._-]*\.md$/u;

export interface WorkflowFileSnapshot {
  relativePath: string;
  path: string;
  original: Uint8Array | undefined;
  forward: Uint8Array | undefined;
}

/** Every file a save may write, with the bytes it will write, so a failed save can be rolled back conservatively. */
function plannedSaveFiles(task: TaskRecord, artifacts: TaskArtifacts | undefined): Map<string, Uint8Array> {
  const taskDirectory = `tasks/${task.id}`;
  const planned = new Map<string, Uint8Array>([
    [`${taskDirectory}/task.json`, Buffer.from(`${JSON.stringify(task, null, 2)}\n`)],
  ]);
  if (artifacts === undefined) return planned;
  if (task.mode === "full") {
    planned.set(`${taskDirectory}/prd.md`, Buffer.from(artifacts.prd ?? ""));
    planned.set(`${taskDirectory}/plan.md`, Buffer.from(artifacts.plan ?? ""));
  }
  if (artifacts.design?.trim()) planned.set(`${taskDirectory}/design.md`, Buffer.from(artifacts.design));
  if (artifacts.research) {
    for (const [name, content] of Object.entries(artifacts.research)) {
      if (!RESEARCH_ARTIFACT_NAME.test(name) || !content.trim())
        throw new Error("Research artifact name or content is invalid.");
      planned.set(`${taskDirectory}/research/${name}`, Buffer.from(content));
    }
  }
  if (artifacts.context !== undefined)
    planned.set(`${taskDirectory}/context.json`, Buffer.from(`${JSON.stringify(artifacts.context, null, 2)}\n`));
  if (artifacts.contextSelection !== undefined) {
    planned.set(
      `${taskDirectory}/context-selection.json`,
      Buffer.from(`${JSON.stringify(artifacts.contextSelection, null, 2)}\n`),
    );
  }
  return planned;
}

export async function captureWorkflowSaveFiles(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<WorkflowFileSnapshot[]> {
  const forwardContent = plannedSaveFiles(task, artifacts);
  const snapshots: WorkflowFileSnapshot[] = [];
  for (const relativePath of [...forwardContent.keys()].sort(compareCodeUnits)) {
    const path = await resolveSafeProjectPath(harnixRoot, relativePath);
    try {
      snapshots.push({ relativePath, path, original: await readFile(path), forward: forwardContent.get(relativePath) });
    } catch (error: unknown) {
      if (isMissing(error))
        snapshots.push({ relativePath, path, original: undefined, forward: forwardContent.get(relativePath) });
      else throw error;
    }
  }
  return snapshots;
}

export async function restoreWorkflowSaveFiles(snapshots: readonly WorkflowFileSnapshot[]): Promise<void> {
  const conflicts: string[] = [];
  for (const snapshot of [...snapshots].reverse()) {
    const current = await readOptionalBytes(snapshot.path);
    if (sameBytes(current, snapshot.original)) continue;
    if (snapshot.forward === undefined || !sameBytes(current, snapshot.forward)) {
      conflicts.push(snapshot.relativePath);
      continue;
    }
    if (snapshot.original === undefined) await rm(snapshot.path, { force: true });
    else await atomicWriteFile(snapshot.path, snapshot.original);
  }
  if (conflicts.length > 0)
    throw new Error(`Concurrent changes were preserved at: ${conflicts.sort(compareCodeUnits).join(", ")}.`);
}

export async function assertWorkflowSaveFilesUnchanged(snapshots: readonly WorkflowFileSnapshot[]): Promise<void> {
  const conflicts: string[] = [];
  for (const snapshot of snapshots) {
    if (!sameBytes(await readOptionalBytes(snapshot.path), snapshot.original)) conflicts.push(snapshot.relativePath);
  }
  if (conflicts.length > 0) {
    throw new Error(
      `Workflow save stopped because task files changed concurrently: ${conflicts.sort(compareCodeUnits).join(", ")}.`,
    );
  }
}

async function readOptionalBytes(path: string): Promise<Uint8Array | undefined> {
  try {
    return await readFile(path);
  } catch (error: unknown) {
    if (!isMissing(error)) throw error;
    return undefined;
  }
}

export async function assertReplayArtifactsMatch(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<void> {
  const directory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
  const expected = new Map<string, string>();
  if (artifacts?.prd !== undefined) expected.set("prd.md", artifacts.prd);
  if (artifacts?.plan !== undefined) expected.set("plan.md", artifacts.plan);
  if (artifacts?.design?.trim()) expected.set("design.md", artifacts.design);
  if (artifacts?.research) {
    for (const [name, content] of Object.entries(artifacts.research)) {
      if (!RESEARCH_ARTIFACT_NAME.test(name) || !content.trim())
        throw new Error("Research artifact name or content is invalid.");
      expected.set(`research/${name}`, content);
    }
  }
  if (artifacts?.context !== undefined) expected.set("context.json", `${JSON.stringify(artifacts.context, null, 2)}\n`);
  if (artifacts?.contextSelection !== undefined)
    expected.set("context-selection.json", `${JSON.stringify(artifacts.contextSelection, null, 2)}\n`);
  for (const [path, content] of expected) {
    let persisted: string;
    try {
      persisted = await readFile(await resolveSafeProjectPath(directory, path), "utf8");
    } catch {
      throw new Error(`Workflow contractRevision replay artifact is missing or unreadable: ${path}`);
    }
    if (persisted !== content)
      throw new Error(`Workflow contractRevision replay cannot replace already committed artifact ${path}.`);
  }
  await assertPersistedContextPair(directory, task);
}

async function assertPersistedContextPair(directory: string, task: TaskRecord): Promise<void> {
  const contextPath = await resolveSafeProjectPath(directory, "context.json");
  const selectionPath = await resolveSafeProjectPath(directory, "context-selection.json");
  const [contextText, selectionText] = await Promise.all([
    readOptionalText(contextPath),
    readOptionalText(selectionPath),
  ]);
  if (contextText === undefined && selectionText === undefined) return;
  if (contextText === undefined || selectionText === undefined) {
    throw new Error("Workflow replay requires a complete context.json and context-selection.json pair.");
  }
  try {
    const context = validateContextManifest(JSON.parse(contextText) as unknown);
    const selection = validateContextSelectionSnapshot(JSON.parse(selectionText) as unknown);
    if (
      context.taskId !== task.id ||
      selection.taskId !== task.id ||
      selection.selectionResultHash !== contextSelectionResultHash(context)
    ) {
      throw new Error("binding mismatch");
    }
  } catch {
    throw new Error("Workflow replay context selection pair is unreadable, invalid, or unbound.");
  }
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}
