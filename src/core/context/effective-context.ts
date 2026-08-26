import type { HarnixConfigV2, PlatformId } from "../config/config.js";
import type { TaskRecord } from "../tasks/task.js";
import { guideOutputPath, selectGuideSources } from "../../guides/catalog.js";
import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { buildContext, loadContextManifest, type ContextEntry, type ContextManifest } from "./context.js";

export type EffectiveContextReasonCode = "applicable-guide" | "persisted-selection" | "pinned" | "task-reference";

export interface EffectiveContextInput {
  readonly projectRoot: string;
  readonly harnixRoot: string;
  readonly config: HarnixConfigV2;
  readonly task: TaskRecord;
  readonly platform: PlatformId;
  readonly forceBounded?: boolean | undefined;
}

export interface EffectiveContextResult {
  readonly text: string;
  readonly manifest: ContextManifest;
  readonly budget: { readonly maxCharacters: number; readonly maxEntries: number };
  readonly candidates: number;
  readonly reasonCodesByPath: ReadonlyMap<string, readonly EffectiveContextReasonCode[]>;
}

const MAX_HOOK_CONTEXT_ENTRIES = 64;

export async function buildEffectiveContext(input: EffectiveContextInput): Promise<EffectiveContextResult> {
  const persisted = await loadPersistedEntries(input.harnixRoot, input.task.id);
  const taskEntries = persisted === undefined
    ? input.task.relevantPaths.map((path): ContextEntry => ({ path, reason: "task reference", priority: 0, pinned: false, states: ["implementing"] }))
    : persisted;
  const selectedGuides = selectGuideSources({
    activePaths: input.task.relevantPaths,
    languages: input.config.languages,
    technologies: input.config.technologies,
    topics: taskTopics(input.task.title, input.task.goal),
  });
  const guidePaths = selectedGuides.map(guideOutputPath);
  const entries: ContextEntry[] = [
    ...taskEntries,
    ...guidePaths.map((path) => ({ path, reason: "applicable guide", priority: 0, pinned: false, states: ["implementing", "verifying"] })),
  ];
  const renderCap = input.platform === "codex" ? 2_500 : Math.min(input.config.context.maxCharacters, 8_000);
  const bounded = input.forceBounded === true;
  const maxEntries = bounded ? MAX_HOOK_CONTEXT_ENTRIES : Number.POSITIVE_INFINITY;
  const output = await buildContext(
    input.projectRoot,
    entries,
    bounded ? renderCap : input.config.context.maxCharacters,
    {
      taskId: input.task.id,
      references: input.task.relevantPaths,
      guides: guidePaths,
      languages: selectedGuides.filter(({ descriptor }) => descriptor.appliesTo.languages?.length).map(guideOutputPath),
      technologies: selectedGuides.filter(({ descriptor }) => descriptor.appliesTo.technologies?.length).map(guideOutputPath),
    },
    bounded ? false : input.config.runtime.fullContext,
    bounded ? MAX_HOOK_CONTEXT_ENTRIES : undefined,
  );

  return {
    text: output.text,
    manifest: output.manifest,
    budget: { maxCharacters: renderCap, maxEntries },
    candidates: entries.length,
    reasonCodesByPath: reasonCodes(entries, input.task.relevantPaths, guidePaths, persisted !== undefined),
  };
}

async function loadPersistedEntries(harnixRoot: string, taskId: string): Promise<ContextEntry[] | undefined> {
  const path = await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/context.json`);
  try {
    const manifest = await loadContextManifest(path);
    if (manifest.taskId !== taskId) throw new Error("Context manifest task binding is invalid.");
    return manifest.entries;
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

function reasonCodes(
  entries: readonly ContextEntry[],
  taskPaths: readonly string[],
  guidePaths: readonly string[],
  persisted: boolean,
): ReadonlyMap<string, readonly EffectiveContextReasonCode[]> {
  const result = new Map<string, Set<EffectiveContextReasonCode>>();
  const add = (path: string, code: EffectiveContextReasonCode): void => {
    let normalized: string;
    try { normalized = normalizeRepositoryPath(path); } catch { return; }
    const codes = result.get(normalized) ?? new Set<EffectiveContextReasonCode>();
    codes.add(code);
    result.set(normalized, codes);
  };
  for (const path of taskPaths) add(path, "task-reference");
  for (const path of guidePaths) add(path, "applicable-guide");
  if (persisted) for (const entry of entries.slice(0, entries.length - guidePaths.length)) add(entry.path, "persisted-selection");
  for (const entry of entries) if (entry.pinned) add(entry.path, "pinned");
  return new Map([...result].map(([path, codes]) => [path, [...codes].sort(compareCodeUnits)]));
}

function taskTopics(...values: string[]): string[] {
  return [...new Set(values.join(" ").toLowerCase().match(/[a-z0-9-]+/gu) ?? [])].sort(compareCodeUnits);
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}
