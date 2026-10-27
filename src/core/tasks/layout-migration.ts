import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { listLegacyEpicIds } from "src/core/epics/epic-location.js";
import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import { errorCode, renameWithRetry, type MoveFunction } from "src/utils/rename-retry.js";
import { directoryExists, listLegacyTaskIds, monthBucket } from "./task-location.js";

export interface LayoutMigrationResult {
  /** Task folders moved (or, on a dry run, that would move). */
  tasks: number;
  epics: number;
  /** One `<kind>/<id>: <reason>` line per folder left where it was. */
  skipped: string[];
}

export interface LayoutMigrationOptions {
  dryRun?: boolean;
  /** Injectable so a test can make one rename fail. */
  rename?: MoveFunction;
}

/**
 * Moves every flat `tasks/<id>` and `epics/<id>` folder into `<YYYY-MM>/<id>` with one rename each. Nothing is ever
 * overwritten or edited, a folder that cannot move is reported and left in place, and a second run only picks up
 * what is still flat. Runs under the project's workflow lock so no `--save` interleaves.
 */
export async function migrateStorageLayout(
  harnixRoot: string,
  options: LayoutMigrationOptions = {},
): Promise<LayoutMigrationResult> {
  return withWorkflowLock(harnixRoot, async () => {
    const result: LayoutMigrationResult = { tasks: 0, epics: 0, skipped: [] };
    const groups = [
      { kind: "tasks", ids: await listLegacyTaskIds(harnixRoot) },
      { kind: "epics", ids: await listLegacyEpicIds(harnixRoot) },
    ] as const;
    for (const { kind, ids } of groups) {
      for (const id of ids) {
        const month = monthBucket(id);
        if (month === undefined) continue;
        const source = await resolveSafeProjectPath(harnixRoot, `${kind}/${id}`);
        const destination = await resolveSafeProjectPath(harnixRoot, `${kind}/${month}/${id}`);
        if (await directoryExists(destination)) {
          result.skipped.push(`${kind}/${id}: destination exists`);
          continue;
        }
        if (options.dryRun !== true) {
          try {
            await mkdir(dirname(destination), { recursive: true });
            await renameWithRetry(source, destination, options.rename);
          } catch (error: unknown) {
            result.skipped.push(`${kind}/${id}: rename failed (${errorCode(error) ?? "error"})`);
            continue;
          }
        }
        result[kind] += 1;
      }
    }
    return result;
  });
}
