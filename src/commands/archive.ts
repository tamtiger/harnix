import { readConfig } from "src/core/config/config.js";
import { applyArchive, planArchive, restoreFromArchive, type ArchiveSkip } from "src/core/tasks/archive.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { findInitializedProject } from "src/utils/project-discovery.js";

export interface ArchiveCommandOptions {
  readonly days?: number | undefined;
  readonly apply?: boolean | undefined;
  readonly restore?: string | undefined;
  /** Epoch milliseconds; injectable for tests, the system clock otherwise. */
  readonly now?: number | undefined;
}

export interface ArchiveCommandResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly mode: "dry-run" | "apply" | "restore";
  readonly days: number;
  /** Standalone tasks planned (dry run) or moved (apply). */
  readonly tasks: readonly string[];
  readonly epics: readonly string[];
  /** The members that travel with each archived epic. */
  readonly epicMembers: Readonly<Record<string, readonly string[]>>;
  readonly skipped: {
    /** Items left alone, counted by reason. */
    readonly counts: Readonly<Record<string, number>>;
    /** Every skipped item except those merely too recent, which would flood the output. */
    readonly items: readonly ArchiveSkip[];
  };
  /** Task folders whose record could not be read; they are never moved. */
  readonly invalid: readonly string[];
  /** Moves that did not happen. */
  readonly failed: readonly string[];
  readonly restored?: { readonly kind: "task" | "epic"; readonly ids: readonly string[] };
}

export const DEFAULT_ARCHIVE_DAYS = 30;

export async function archiveProject(cwd: string, options: ArchiveCommandOptions): Promise<ArchiveCommandResult> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Archive requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const days = options.days ?? DEFAULT_ARCHIVE_DAYS;
  const empty = { counts: {}, items: [] };
  const base = { generator: "harnix", schemaVersion: 1, days, tasks: [], epics: [], epicMembers: {}, skipped: empty };

  if (options.restore !== undefined) {
    if (options.apply === true || options.days !== undefined)
      throw new Error("--restore restores one archived task or epic and cannot be combined with --apply or --days.");
    const restored = await restoreFromArchive(harnixRoot, options.restore);
    return {
      ...base,
      mode: "restore",
      invalid: [],
      failed: [],
      restored: { kind: restored.kind, ids: restored.restored },
    } as ArchiveCommandResult;
  }

  const plan = await planArchive(harnixRoot, { days, now: options.now ?? Date.now() });
  const counts: Record<string, number> = {};
  for (const { reason } of plan.skipped) counts[reason] = (counts[reason] ?? 0) + 1;
  const skipped = { counts, items: plan.skipped.filter((item) => item.reason !== "too-recent") };
  if (options.apply !== true)
    return {
      ...base,
      mode: "dry-run",
      tasks: plan.tasks,
      epics: plan.epics,
      epicMembers: plan.epicMembers,
      skipped,
      invalid: plan.invalid,
      failed: [],
    } as ArchiveCommandResult;
  const moved = await applyArchive(harnixRoot, plan, {
    replan: () => planArchive(harnixRoot, { days, now: options.now ?? Date.now() }),
  });
  const epicMembers = Object.fromEntries(moved.epics.map((id) => [id, plan.epicMembers[id] ?? []]));
  return {
    ...base,
    mode: "apply",
    tasks: moved.tasks,
    epics: moved.epics,
    epicMembers,
    skipped,
    invalid: plan.invalid,
    failed: moved.failed,
  } as ArchiveCommandResult;
}
