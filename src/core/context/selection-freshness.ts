import { readFile } from "node:fs/promises";

import type { HarnixConfigV2 } from "../config/config.js";
import type { TaskRecord } from "../tasks/task.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { sha256 } from "../../utils/hashing.js";
import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { validateContextManifest, type ContextManifest } from "./context.js";

export const CONTEXT_SELECTOR_VERSION = 1 as const;

export interface ContextSelectionSnapshotV1 {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  selectorVersion: 1;
  inventoryFingerprint: string;
  selectionInputHash: string;
  selectionResultHash: string;
}

export type ContextSelectionChangeKind =
  | "inventory-changed"
  | "inventory-unavailable"
  | "selection-signals-changed"
  | "selector-version-changed";

export interface ContextSelectionInput {
  task: Pick<TaskRecord, "id" | "relevantPaths" | "relevantSpecs">;
  config: Pick<HarnixConfigV2, "languages" | "technologies" | "packages" | "context" | "runtime">;
  selectedGuidePaths: readonly string[];
  inventoryFingerprint: string;
  manifest: ContextManifest;
}

export function createContextSelectionSnapshot(input: ContextSelectionInput): ContextSelectionSnapshotV1 {
  const manifest = validateContextManifest(input.manifest);
  if (manifest.taskId !== input.task.id) throw new Error("Context selection snapshot task binding is invalid.");
  if (!isHash(input.inventoryFingerprint)) throw new Error("Context selection inventory fingerprint is invalid.");
  return {
    generator: "harnix",
    schemaVersion: 1,
    taskId: input.task.id,
    selectorVersion: CONTEXT_SELECTOR_VERSION,
    inventoryFingerprint: input.inventoryFingerprint,
    selectionInputHash: selectionInputHash(input, CONTEXT_SELECTOR_VERSION, input.inventoryFingerprint),
    selectionResultHash: contextSelectionResultHash(manifest),
  };
}

export function inspectContextSelectionChanges(
  snapshot: ContextSelectionSnapshotV1,
  input: ContextSelectionInput & { currentSelectorVersion?: number },
): ContextSelectionChangeKind[] {
  const valid = validateContextSelectionSnapshot(snapshot);
  const manifest = validateContextManifest(input.manifest);
  if (valid.taskId !== input.task.id || manifest.taskId !== input.task.id || valid.selectionResultHash !== contextSelectionResultHash(manifest)) {
    throw new Error("Context selection snapshot binding is invalid.");
  }
  const currentSelectorVersion = input.currentSelectorVersion ?? CONTEXT_SELECTOR_VERSION;
  const changes = new Set<ContextSelectionChangeKind>();
  if (!isHash(input.inventoryFingerprint)) changes.add("inventory-unavailable");
  else if (input.inventoryFingerprint !== valid.inventoryFingerprint) changes.add("inventory-changed");
  if (currentSelectorVersion !== valid.selectorVersion) changes.add("selector-version-changed");
  const comparableInputHash = selectionInputHash(input, valid.selectorVersion, valid.inventoryFingerprint);
  if (comparableInputHash !== valid.selectionInputHash) changes.add("selection-signals-changed");
  return [...changes].sort(compareCodeUnits);
}

export function contextSelectionResultHash(manifest: ContextManifest): string {
  const valid = validateContextManifest(manifest);
  const entries = valid.entries.map(({ path, reason, priority, pinned, states }) => ({
    path,
    reason,
    priority,
    pinned,
    states: sortedUnique(states),
  })).sort((left, right) => compareCodeUnits(left.path, right.path));
  const omitted = valid.omitted.map(({ path, reason }) => ({ path, reason }))
    .sort((left, right) => compareCodeUnits(left.path, right.path) || compareCodeUnits(left.reason, right.reason));
  return sha256(JSON.stringify({ entries, omitted }));
}

export async function saveContextSelectionSnapshot(taskDirectory: string, snapshot: ContextSelectionSnapshotV1): Promise<void> {
  const path = await resolveSafeProjectPath(taskDirectory, "context-selection.json");
  await atomicWriteFile(path, `${JSON.stringify(validateContextSelectionSnapshot(snapshot), null, 2)}\n`);
}

export async function loadContextSelectionSnapshot(path: string): Promise<ContextSelectionSnapshotV1> {
  return validateContextSelectionSnapshot(JSON.parse(await readFile(path, "utf8")) as unknown);
}

export function validateContextSelectionSnapshot(value: unknown): ContextSelectionSnapshotV1 {
  if (!isRecord(value)
    || value.generator !== "harnix"
    || value.schemaVersion !== 1
    || typeof value.taskId !== "string"
    || value.taskId.length === 0
    || value.selectorVersion !== CONTEXT_SELECTOR_VERSION
    || !isHash(value.inventoryFingerprint)
    || !isHash(value.selectionInputHash)
    || !isHash(value.selectionResultHash)) {
    throw new Error("Invalid or unsupported context selection snapshot.");
  }
  return value as unknown as ContextSelectionSnapshotV1;
}

function selectionInputHash(input: Omit<ContextSelectionInput, "manifest">, selectorVersion: number, inventoryFingerprint: string): string {
  const packages = input.config.packages.map((item) => ({
    path: normalizeRepositoryPath(item.path, { allowRoot: true }),
    languages: sortedUnique(item.languages),
    technologies: sortedUnique(item.technologies),
  })).sort((left, right) => compareCodeUnits(left.path, right.path));
  return sha256(JSON.stringify({
    task: {
      relevantPaths: sortedRepositoryPaths(input.task.relevantPaths),
      relevantSpecs: sortedRepositoryPaths(input.task.relevantSpecs),
    },
    config: {
      languages: sortedUnique(input.config.languages),
      technologies: sortedUnique(input.config.technologies),
      packages,
      context: {
        maxCharacters: input.config.context.maxCharacters,
        tokenApproximation: input.config.context.tokenApproximation,
      },
      runtime: {
        fullContext: input.config.runtime.fullContext,
        research: input.config.runtime.research,
      },
    },
    selectedGuidePaths: sortedRepositoryPaths(input.selectedGuidePaths),
    selectorVersion,
    inventoryFingerprint,
  }));
}

function sortedRepositoryPaths(values: readonly string[]): string[] {
  return sortedUnique(values.map((value) => normalizeRepositoryPath(value)));
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
