import { loadEpicRecord, renderEpicMarkdown, upsertEpic, validateEpic, type EpicRecord } from "src/core/epics/epic.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { prepareEpicMembers, writeEpicMembers } from "./epic-members.js";
import type { WorkflowSaveEnvelope } from "./envelope.js";

/**
 * Finishes the epic side effects of a save whose task already committed: the same envelope sent again after the
 * epic write failed creates only what is missing (the epic record, planned members) and regenerates the derived
 * markdown. An epic or member that already exists is never overwritten.
 */
export async function repairEpicSideEffects(
  root: string,
  harnixRoot: string,
  candidate: TaskRecord,
  envelope: WorkflowSaveEnvelope,
): Promise<void> {
  const epic = envelope.epic === undefined ? undefined : validateEpic(envelope.epic);
  const epicId = epic?.id ?? (candidate.schemaVersion === 1 ? undefined : candidate.epicId);
  await writeEpicMembers(harnixRoot, await prepareEpicMembers(harnixRoot, envelope.epicMembers ?? [], epicId));
  const stored = epic === undefined ? undefined : await loadEpicRecord(root, epic.id);
  if (epic !== undefined && stored === undefined) await upsertEpic(root, epic);
  else if (epicId !== undefined) {
    if (epic !== undefined && stored !== undefined && epicContentDiffers(stored, epic))
      process.stderr.write(
        `notice: epic ${epic.id} already exists with different content, so the replay kept the stored epic; edit it with harnix workflow if the change was intended.
`,
      );
    await renderEpicMarkdown(root, epicId, await loadEpicRecord(root, epicId));
  }
}

function epicContentDiffers(stored: EpicRecord, sent: EpicRecord): boolean {
  return (
    stored.title !== sent.title ||
    stored.goal !== sent.goal ||
    JSON.stringify(stored.nonGoals ?? []) !== JSON.stringify(sent.nonGoals ?? [])
  );
}
