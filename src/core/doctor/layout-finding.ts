import { listLegacyEpicIds } from "src/core/epics/epic-location.js";
import { listLegacyTaskIds } from "src/core/tasks/task-location.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { finding, type DoctorFinding } from "./findings.js";

/** Warns while task or epic folders still sit in the flat layout; `harnix update` or `doctor --fix` moves them. */
export async function inspectStorageLayout(root: string, findings: DoctorFinding[]): Promise<void> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const tasks = (await listLegacyTaskIds(harnixRoot)).length;
  const epics = (await listLegacyEpicIds(harnixRoot)).length;
  if (tasks + epics === 0) return;
  findings.push(
    finding(
      "task-layout-legacy",
      "warning",
      "tasks",
      `${tasks} task and ${epics} epic folders still use the flat layout; run harnix update to move them into month buckets.`,
      true,
    ),
  );
}
