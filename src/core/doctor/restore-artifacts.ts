import { readdir, stat } from "node:fs/promises";

import { loadTask } from "src/core/tasks/task.js";
import { renderPlanTemplate, renderPrdTemplate } from "src/core/workflow/artifact-templates.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * `doctor --fix` for a Full task that never got its planning files (for example one created by `--batch`): writes the
 * standard `prd.md` and `plan.md` templates for every unfinished v3 Full task and never overwrites an existing file.
 * Returns the number of files written; an unreadable task is skipped, since another doctor check reports it.
 */
export async function restoreFullArtifacts(root: string): Promise<number> {
  let restored = 0;
  const entries = await readdir(await resolveSafeHarnixPath(root, "tasks"), { encoding: "utf8", withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const task = await loadTask(await resolveSafeProjectPath(root, `.harnix/tasks/${entry.name}/task.json`));
      if (task.schemaVersion !== 3 || task.mode !== "full") continue;
      if (task.status === "completed" || task.status === "cancelled") continue;
      for (const [name, render] of [
        ["prd.md", renderPrdTemplate],
        ["plan.md", renderPlanTemplate],
      ] as const) {
        const path = await resolveSafeProjectPath(root, `.harnix/tasks/${task.id}/${name}`);
        if (await exists(path)) continue;
        await atomicWriteFile(path, render(task));
        restored += 1;
      }
    } catch {
      continue;
    }
  }
  return restored;
}
