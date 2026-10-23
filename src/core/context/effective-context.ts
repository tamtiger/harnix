import type { HarnixConfigV2, PlatformId } from "src/core/config/config.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { guideOutputPath, selectGuideSources } from "src/guides/catalog.js";
import { getPlatform } from "src/core/platform/registry.js";
import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { loadLearnedSpecBlock } from "src/core/journal/learned-spec.js";
import { createSourcePathsLoader } from "src/core/journal/learning-sources.js";
import { renderLearningBlock, summarizeLearning } from "src/core/journal/learning-summary.js";
import {
  GUIDE_POINTER_PREFIX,
  POINTER_MIN_CHARACTERS,
  UNTRUSTED_CONTEXT_PREFIX,
  UNTRUSTED_CONTEXT_SUFFIX,
  buildContext,
  loadContextManifest,
  type ContextEntry,
  type ContextManifest,
} from "./context.js";

export type EffectiveContextReasonCode = "applicable-guide" | "persisted-selection" | "pinned" | "task-reference";

export interface EffectiveContextInput {
  readonly projectRoot: string;
  readonly harnixRoot: string;
  readonly config: HarnixConfigV2;
  readonly task: TaskRecord;
  readonly platform: PlatformId;
  readonly forceBounded?: boolean | undefined;
  /** Wall clock for learning expiry; defaults to the current time. */
  readonly now?: number | undefined;
}

export interface EffectiveContextResult {
  readonly text: string;
  readonly manifest: ContextManifest;
  readonly budget: { readonly maxCharacters: number; readonly maxEntries: number };
  readonly candidates: number;
  readonly reasonCodesByPath: ReadonlyMap<string, readonly EffectiveContextReasonCode[]>;
}

const MAX_HOOK_CONTEXT_ENTRIES = 64;
const MAX_UNPERSISTED_TASK_REFERENCES = 5;

export async function buildEffectiveContext(input: EffectiveContextInput): Promise<EffectiveContextResult> {
  const persisted = await loadPersistedEntries(input.harnixRoot, input.task.id);
  const taskEntries =
    persisted === undefined
      ? input.task.relevantPaths.slice(0, MAX_UNPERSISTED_TASK_REFERENCES).map((path): ContextEntry => ({
          path,
          reason: "task reference",
          priority: 0,
          pinned: false,
          states: ["implementing"],
        }))
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
    ...guidePaths.map((path) => ({
      path,
      reason: "applicable guide",
      priority: 0,
      pinned: false,
      states: ["implementing", "verifying"],
    })),
  ];
  const renderCap = getPlatform(input.platform).contextRenderCap ?? Math.min(input.config.context.maxCharacters, 8_000);
  const bounded = input.forceBounded === true;
  const maxEntries = bounded ? MAX_HOOK_CONTEXT_ENTRIES : Number.POSITIVE_INFINITY;
  const isLean =
    input.config.context.mode === "lean" || (!input.config.context.mode && !input.config.runtime.fullContext);
  const pointerOptions = bounded
    ? {
        prefixes: isLean ? [""] : [GUIDE_POINTER_PREFIX],
        minCharacters: isLean ? 0 : POINTER_MIN_CHARACTERS,
      }
    : isLean
      ? { prefixes: [""], minCharacters: 0 }
      : undefined;

  const output = await buildContext(
    input.projectRoot,
    entries,
    bounded ? renderCap : input.config.context.maxCharacters,
    {
      taskId: input.task.id,
      references: input.task.relevantPaths,
      guides: guidePaths,
      languages: selectedGuides.filter(({ descriptor }) => descriptor.appliesTo.languages?.length).map(guideOutputPath),
      technologies: selectedGuides
        .filter(({ descriptor }) => descriptor.appliesTo.technologies?.length)
        .map(guideOutputPath),
    },
    bounded ? false : input.config.runtime.fullContext,
    bounded ? MAX_HOOK_CONTEXT_ENTRIES : undefined,
    pointerOptions,
  );

  const learning = await learningBlock(input);
  const header = isLean ? taskSummaryHeader(input.task) : undefined;
  return {
    text: withLearning(output.text, learning, header),
    manifest: output.manifest,
    budget: { maxCharacters: renderCap, maxEntries },
    candidates: entries.length,
    reasonCodesByPath: reasonCodes(entries, input.task.relevantPaths, guidePaths, persisted !== undefined),
  };
}

function taskSummaryHeader(task: TaskRecord): string {
  return [
    `[Active Task: ${task.id} (${task.mode})]`,
    `Status: ${task.status}/${task.checkpoint}`,
    `Title: ${task.title}`,
    `Goal: ${task.goal}`,
  ].join("\n");
}

/**
 * Promoted rules (bounded, picked by the task's paths) go to every stage; unreviewed learning only while planning.
 */
async function learningBlock(input: EffectiveContextInput): Promise<string> {
  const promoted = await loadLearnedSpecBlock(input.projectRoot, input.task.relevantPaths);
  const notes = input.task.status === "planning" ? await unreviewedLearningBlock(input) : "";
  return [promoted, notes].filter((part) => part.length > 0).join("\n\n");
}

async function unreviewedLearningBlock(input: EffectiveContextInput): Promise<string> {
  try {
    const journalRoot = await resolveSafeProjectPath(input.harnixRoot, `workspace/${input.config.developer}/journal`);
    return renderLearningBlock(
      await summarizeLearning(journalRoot, input.now ?? Date.now(), {
        activePaths: input.task.relevantPaths,
        sourcePaths: createSourcePathsLoader(input.harnixRoot),
      }),
    );
  } catch {
    return "";
  }
}

/** Learning and task header go first inside the untrusted frame so the size budget trims file excerpts before it. */
function withLearning(text: string, learning: string, taskHeader?: string): string {
  const parts = [taskHeader, learning].filter((part): part is string => Boolean(part && part.length > 0));
  const lead = parts.join("\n\n");
  if (lead.length === 0) return text;
  if (text.length === 0) return `${UNTRUSTED_CONTEXT_PREFIX}\n${lead}${UNTRUSTED_CONTEXT_SUFFIX}`;
  return `${UNTRUSTED_CONTEXT_PREFIX}\n${lead}\n\n${text.slice(UNTRUSTED_CONTEXT_PREFIX.length)}`;
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
    try {
      normalized = normalizeRepositoryPath(path);
    } catch {
      return;
    }
    const codes = result.get(normalized) ?? new Set<EffectiveContextReasonCode>();
    codes.add(code);
    result.set(normalized, codes);
  };
  for (const path of taskPaths) add(path, "task-reference");
  for (const path of guidePaths) add(path, "applicable-guide");
  if (persisted)
    for (const entry of entries.slice(0, entries.length - guidePaths.length)) add(entry.path, "persisted-selection");
  for (const entry of entries) if (entry.pinned) add(entry.path, "pinned");
  return new Map([...result].map(([path, codes]) => [path, [...codes].sort(compareCodeUnits)]));
}

function taskTopics(...values: string[]): string[] {
  return [
    ...new Set(
      values
        .join(" ")
        .toLowerCase()
        .match(/[a-z0-9-]+/gu) ?? [],
    ),
  ].sort(compareCodeUnits);
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT"
  );
}
