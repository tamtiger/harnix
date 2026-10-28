import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import { inspectStorageLayout } from "src/core/doctor/layout-finding.js";
import { inspectTaskRecords } from "src/core/doctor/project-tasks.js";
import { appendJournal } from "src/core/journal/journal.js";
import { saveTask } from "src/core/tasks/task.js";
import { buildCriterion, buildEvidence, buildTaskV3, at } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-fixtures-");

async function initialized(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function codes(inspector: (root: string, findings: DoctorFinding[]) => Promise<void>, root: string) {
  const findings: DoctorFinding[] = [];
  await inspector(root, findings);
  return findings.map((item) => item.code);
}

describe("task diagnostics fixtures", () => {
  it('produces "active-pointer-unreadable" when the active pointer is a directory', async () => {
    const root = await initialized();
    await rm(join(root, ".harnix", "tasks", ".active"), { force: true, recursive: true });
    await mkdir(join(root, ".harnix", "tasks", ".active"), { recursive: true });

    expect(await codes(inspectTaskRecords, root)).toContain("active-pointer-unreadable");
  });

  it('produces "task-root-unreadable" when the tasks root is a file', async () => {
    const root = await initialized();
    await rm(join(root, ".harnix", "tasks"), { force: true, recursive: true });
    await writeFile(join(root, ".harnix", "tasks"), "not a directory");

    expect(await codes(inspectTaskRecords, root)).toContain("task-root-unreadable");
  });

  it('produces "task-active-completed" when the active pointer names a finished task', async () => {
    const root = await initialized();
    const id = "20260929-090000-done";
    await saveTask(
      join(root, ".harnix"),
      buildTaskV3({
        id,
        status: "completed",
        checkpoint: "finishing",
        acceptanceCriteria: [buildCriterion({ status: "met", evidenceIds: ["ev-check"] })],
        evidence: [buildEvidence()],
        completedAt: at(20),
        updatedAt: at(20),
      }),
    );
    await writeFile(join(root, ".harnix", "tasks", ".active"), `${id}\n`);

    expect(await codes(inspectTaskRecords, root)).toContain("task-active-completed");
  });

  it('produces "task-full-artifact-missing" for a Full task without prd.md and plan.md', async () => {
    const root = await initialized();
    await saveTask(join(root, ".harnix"), buildTaskV3({ id: "20260929-090000-full", mode: "full" }));

    expect(await codes(inspectTaskRecords, root)).toContain("task-full-artifact-missing");
  });

  it('produces "task-layout-legacy" for a task folder in the flat layout', async () => {
    const root = await initialized();
    await mkdir(join(root, ".harnix", "tasks", "20260101-000000-flat"), { recursive: true });

    expect(await codes(inspectStorageLayout, root)).toContain("task-layout-legacy");
  });
});

describe("journal diagnostics fixtures", () => {
  it('produces "journal-root-unreadable" when the workspace root is a file', async () => {
    const root = await initialized();
    await rm(join(root, ".harnix", "workspace"), { force: true, recursive: true });
    await writeFile(join(root, ".harnix", "workspace"), "not a directory");

    expect(await codes(inspectTaskRecords, root)).toContain("journal-root-unreadable");
  });

  it('produces "journal-root-unreadable" when a developer journal folder is a file', async () => {
    const root = await initialized();
    await mkdir(join(root, ".harnix", "workspace", "tam"), { recursive: true });
    await writeFile(join(root, ".harnix", "workspace", "tam", "journal"), "not a directory");

    expect(await codes(inspectTaskRecords, root)).toContain("journal-root-unreadable");
  });

  it('produces "journal-evidence-unlinked" when a journal names evidence the task lacks', async () => {
    const root = await initialized();
    const id = "20260929-090000-linked";
    await saveTask(join(root, ".harnix"), buildTaskV3({ id }));
    await appendJournal(join(root, ".harnix", "workspace", "tam", "journal", "2026-09.jsonl"), {
      generator: "harnix",
      schemaVersion: 1,
      id: "j-1",
      recordedAt: at(5),
      developer: "tam",
      taskId: id,
      kind: "note",
      summary: "Ghi chú",
      evidenceIds: ["ev-absent"],
    });

    expect(await codes(inspectTaskRecords, root)).toContain("journal-evidence-unlinked");
  });
});
