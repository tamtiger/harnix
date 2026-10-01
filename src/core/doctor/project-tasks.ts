import { readdir, readFile, stat } from "node:fs/promises";

import { finding, isMissing, redact, type DoctorFinding } from "src/core/doctor/findings.js";
import { searchJournal, type JournalEntry } from "src/core/journal/journal.js";
import { analyzeLearningStatement, type LearningRiskKind } from "src/core/journal/learning-safety.js";
import { validateTask } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath, resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

type ValidTask = ReturnType<typeof validateTask>;

export async function inspectTaskRecords(root: string, findings: DoctorFinding[]): Promise<void> {
  const activePath = await resolveSafeHarnixPath(root, "tasks/.active");
  let activeId: string | undefined;
  try {
    const value = (await readFile(activePath, "utf8")).trim();
    if (value.length > 0) activeId = value;
  } catch (error: unknown) {
    if (!isMissing(error))
      findings.push(finding("active-pointer-unreadable", "error", "tasks/.active", redact(error, root), false));
  }

  const tasks = new Map<string, ValidTask>();
  try {
    const entries = await readdir(await resolveSafeHarnixPath(root, "tasks"), {
      encoding: "utf8",
      withFileTypes: true,
    });
    let activeFound = activeId === undefined;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const logicalPath = `tasks/${entry.name}/task.json`;
      try {
        const task = await readTaskRecord(root, entry.name, logicalPath, activeId, findings);
        tasks.set(task.id, task);
        await inspectTaskState(root, task, entry.name === activeId, logicalPath, findings);
        if (entry.name === activeId) activeFound = true;
      } catch {
        const active = entry.name === activeId;
        findings.push(
          finding(
            active ? "task-invalid-active" : "task-invalid-historical",
            active ? "error" : "warning",
            logicalPath,
            active
              ? "The active task record is invalid and continuation must fail closed."
              : "A historical task record is invalid and was preserved without rewrite.",
            false,
          ),
        );
      }
    }
    if (!activeFound)
      findings.push(
        finding(
          "active-pointer-missing-task",
          "error",
          "tasks/.active",
          "The active pointer does not identify a readable task record.",
          false,
        ),
      );
  } catch (error: unknown) {
    if (!isMissing(error)) findings.push(finding("task-root-unreadable", "error", "tasks", redact(error, root), false));
  }
  await inspectJournalRecords(root, tasks, findings);
}

async function readTaskRecord(
  root: string,
  name: string,
  logicalPath: string,
  activeId: string | undefined,
  findings: DoctorFinding[],
): Promise<ValidTask> {
  const path = await resolveSafeProjectPath(root, `.harnix/${logicalPath}`);
  const source = JSON.parse(await readFile(path, "utf8")) as unknown;
  try {
    return validateTask(source);
  } catch (error: unknown) {
    if (name === activeId) throw error;
    const task = validateTask(source, { allowUnsafeCompletedEvidenceArtifacts: true });
    if (
      task.status !== "completed" ||
      !task.evidence.some((evidence) =>
        evidence.artifactPaths.some((artifactPath) => !isSafeRepositoryPath(artifactPath)),
      )
    )
      throw error;
    findings.push(
      finding(
        "task-evidence-artifact-unsafe",
        "warning",
        logicalPath,
        "A completed historical task references an unsafe or expired artifact path and was preserved without rewrite.",
        false,
      ),
    );
    return task;
  }
}

async function inspectTaskState(
  root: string,
  task: ValidTask,
  isActive: boolean,
  logicalPath: string,
  findings: DoctorFinding[],
): Promise<void> {
  const terminal = task.status === "completed" || task.status === "cancelled";
  if (task.schemaVersion === 1) {
    findings.push(
      finding(
        "legacy-task-schema",
        terminal ? "info" : "warning",
        logicalPath,
        "TaskRecord schema v1 is preserved; migrate an unfinished task explicitly only from a replan checkpoint.",
        false,
      ),
    );
  }
  if (isActive) {
    if (task.status === "completed")
      findings.push(
        finding(
          "task-active-completed",
          "error",
          logicalPath,
          "The active pointer references a completed task and must be repaired before continuation.",
          false,
        ),
      );
    if (task.status === "cancelled")
      findings.push(
        finding(
          "task-active-cancelled",
          "error",
          logicalPath,
          "The active pointer references a cancelled task with incomplete cancellation persistence; run cancellation recovery before continuation.",
          false,
        ),
      );
  }
  if (task.mode !== "full") return;
  for (const artifact of ["prd.md", "plan.md"]) {
    try {
      await stat(await resolveSafeProjectPath(root, `.harnix/tasks/${task.id}/${artifact}`));
    } catch {
      findings.push(
        finding(
          "task-full-artifact-missing",
          isActive ? "error" : "warning",
          `tasks/${task.id}/${artifact}`,
          "A Full task is missing a required planning artifact.",
          false,
        ),
      );
    }
  }
}

async function inspectJournalRecords(
  root: string,
  tasks: ReadonlyMap<string, ValidTask>,
  findings: DoctorFinding[],
): Promise<void> {
  let developers;
  try {
    developers = await readdir(await resolveSafeHarnixPath(root, "workspace"), {
      encoding: "utf8",
      withFileTypes: true,
    });
  } catch (error: unknown) {
    if (!isMissing(error))
      findings.push(finding("journal-root-unreadable", "warning", "workspace", redact(error, root), false));
    return;
  }
  for (const developer of developers) {
    if (!developer.isDirectory()) continue;
    const journalRoot = `workspace/${developer.name}/journal`;
    let files;
    try {
      files = await readdir(await resolveSafeHarnixPath(root, journalRoot), { encoding: "utf8", withFileTypes: true });
    } catch (error: unknown) {
      if (!isMissing(error))
        findings.push(finding("journal-root-unreadable", "warning", journalRoot, redact(error, root), false));
      continue;
    }
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".jsonl")) continue;
      await inspectJournalFile(root, `${journalRoot}/${file.name}`, tasks, findings);
    }
  }
}

async function inspectJournalFile(
  root: string,
  logicalPath: string,
  tasks: ReadonlyMap<string, ValidTask>,
  findings: DoctorFinding[],
): Promise<void> {
  try {
    const journal = await searchJournal(await resolveSafeHarnixPath(root, logicalPath));
    if (journal.malformed > 0)
      findings.push(
        finding(
          "journal-malformed",
          "warning",
          logicalPath,
          "A historical journal contains malformed records and was preserved without rewrite.",
          false,
        ),
      );
    for (const entry of journal.entries) inspectJournalLink(entry, tasks, logicalPath, findings);
    const learningRisks = new Set<LearningRiskKind>();
    for (const entry of journal.entries) {
      if (entry.kind !== "learning" || entry.learning === undefined) continue;
      for (const risk of analyzeLearningStatement(entry.learning.statement).findings) learningRisks.add(risk);
    }
    if (learningRisks.size > 0) {
      const categories = [...learningRisks].sort(compareCodeUnits);
      findings.push(
        finding(
          "persistent-learning-suspicious",
          "warning",
          logicalPath,
          `Suspicious persistent learning data categories: ${categories.join(", ")}; review as untrusted data.`,
          false,
        ),
      );
    }
  } catch (error: unknown) {
    findings.push(finding("journal-unreadable", "warning", logicalPath, redact(error, root), false));
  }
}

function inspectJournalLink(
  entry: JournalEntry,
  tasks: ReadonlyMap<string, ValidTask>,
  path: string,
  findings: DoctorFinding[],
): void {
  if (!entry.taskId) return;
  const task = tasks.get(entry.taskId);
  if (!task) {
    findings.push(
      finding(
        "journal-task-unlinked",
        "warning",
        path,
        "A historical journal references an unknown task and was preserved without rewrite.",
        false,
      ),
    );
    return;
  }
  const evidenceIds = new Set(task.evidence.map((evidence) => evidence.id));
  if (entry.evidenceIds.some((id) => !evidenceIds.has(id)))
    findings.push(
      finding(
        "journal-evidence-unlinked",
        "warning",
        path,
        "A historical journal references evidence absent from its task and was preserved without rewrite.",
        false,
      ),
    );
}

function isSafeRepositoryPath(value: string): boolean {
  try {
    return normalizeRepositoryPath(value, { allowRoot: true }) === value;
  } catch {
    return false;
  }
}
