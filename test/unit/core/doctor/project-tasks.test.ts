import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import { inspectTaskRecords } from "src/core/doctor/project-tasks.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-tasks-");

async function initialized() {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function inspect(root: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  await inspectTaskRecords(root, findings);
  return findings;
}

describe("task record diagnostics", () => {
  it("reports nothing for a project without tasks", async () => {
    expect(await inspect(await initialized())).toEqual([]);
  });

  it("reports an invalid historical task as a warning and keeps the file", async () => {
    const root = await initialized();
    await mkdir(join(root, ".harnix", "tasks", "20260101-000000-broken"), { recursive: true });
    await writeFile(join(root, ".harnix", "tasks", "20260101-000000-broken", "task.json"), "{ not json");

    expect(await inspect(root)).toContainEqual(
      expect.objectContaining({
        code: "task-invalid-historical",
        severity: "warning",
        path: "tasks/20260101-000000-broken/task.json",
      }),
    );
  });

  it("reports an active invalid task as an error", async () => {
    const root = await initialized();
    const id = "20260101-000000-broken";
    await mkdir(join(root, ".harnix", "tasks", id), { recursive: true });
    await writeFile(join(root, ".harnix", "tasks", id, "task.json"), "{ not json");
    await writeFile(join(root, ".harnix", "tasks", ".active"), `${id}\n`);

    expect(await inspect(root)).toContainEqual(
      expect.objectContaining({ code: "task-invalid-active", severity: "error" }),
    );
  });

  it("reports an active pointer that names no task", async () => {
    const root = await initialized();
    await mkdir(join(root, ".harnix", "tasks"), { recursive: true });
    await writeFile(join(root, ".harnix", "tasks", ".active"), "20260101-000000-missing\n");

    expect(await inspect(root)).toContainEqual(
      expect.objectContaining({ code: "active-pointer-missing-task", severity: "error" }),
    );
  });
});
