import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { saveTask, type TaskRecord, type TaskRecordV3 } from "src/core/tasks/task.js";
import { prepareEpicMembers, removeEpicMembers, writeEpicMembers } from "src/core/workflow/epic-members.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildEvidence } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const EPIC = "epic-1";

const member = (suffix: string, overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 => ({
  ...taskV3("planning", "planning"),
  id: `20260813-13${suffix}00-member-${suffix}`,
  epicId: EPIC,
  ...overrides,
});
const mainTask = (): TaskRecordV3 => ({ ...taskV3("planning", "planning"), epicId: EPIC });
const taskFile = (root: string, id: string) => join(root, ".harnix", "tasks", id, "task.json");

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  return root;
}

describe("prepareEpicMembers", () => {
  it("returns only the members that do not exist yet and accepts an identical replay", async () => {
    const root = await project();
    const first = member("11");
    await saveTask(join(root, ".harnix"), first);

    const created = await prepareEpicMembers(join(root, ".harnix"), [first, member("12")], EPIC);

    expect(created.map((item) => item.id)).toEqual([member("12").id]);
  });

  it("rejects a member that differs from the persisted one, whatever progress it holds", async () => {
    const root = await project();
    const progressed = member("11", {
      status: "in_progress",
      checkpoint: "implementing",
      evidence: [buildEvidence({ id: "kept", result: "fail", exitCode: 1 })],
    });
    await saveTask(join(root, ".harnix"), progressed);

    await expect(prepareEpicMembers(join(root, ".harnix"), [member("11")], EPIC)).rejects.toThrow(
      /Epic member task .* already exists and differs/u,
    );
  });

  it("rejects wrong shape, wrong epic and duplicate ids inside one envelope", async () => {
    const root = await project();
    const harnixRoot = join(root, ".harnix");

    await expect(
      prepareEpicMembers(harnixRoot, [member("11", { status: "ready", checkpoint: "ready" })], EPIC),
    ).rejects.toThrow(/must be schemaVersion 3 and in planning status/u);
    await expect(prepareEpicMembers(harnixRoot, [member("11", { epicId: "other" })], EPIC)).rejects.toThrow(
      /epicId must match epic-1/u,
    );
    await expect(prepareEpicMembers(harnixRoot, [member("11"), member("11")], EPIC)).rejects.toThrow(
      /listed more than once/u,
    );
  });
});

describe("writeEpicMembers and removeEpicMembers", () => {
  it("removes the members it created when a later write fails", async () => {
    const root = await project();
    const harnixRoot = join(root, ".harnix");
    const failing = async (path: string, task: TaskRecord) => {
      if (task.id === member("13").id) throw new Error("disk full");
      await saveTask(path, task);
    };

    await expect(writeEpicMembers(harnixRoot, [member("12"), member("13")], failing)).rejects.toThrow("disk full");

    await expect(access(taskFile(root, member("12").id))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("removes exactly the listed member directories", async () => {
    const root = await project();
    const harnixRoot = join(root, ".harnix");
    await writeEpicMembers(harnixRoot, [member("12"), member("13")]);

    await removeEpicMembers(harnixRoot, [member("12").id]);

    await expect(access(taskFile(root, member("12").id))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(taskFile(root, member("13").id))).resolves.toBeUndefined();
  });
});

describe("saveWorkflow with epicMembers", () => {
  it("creates members once, accepts the same envelope again and never overwrites a member that progressed", async () => {
    const root = await project();
    const envelope = { task: mainTask(), epicMembers: [member("11"), member("12")] };

    await saveWorkflow(root, envelope);
    await saveWorkflow(root, envelope);
    const progressed = member("11", {
      status: "in_progress",
      checkpoint: "implementing",
      evidence: [buildEvidence({ id: "kept", result: "fail", exitCode: 1 })],
    });
    await writeFile(taskFile(root, progressed.id), `${JSON.stringify(progressed, null, 2)}\n`);
    const before = await readFile(taskFile(root, progressed.id), "utf8");

    await expect(saveWorkflow(root, { ...envelope, epicMembers: [member("11"), member("13")] })).rejects.toThrow(
      /already exists and differs/u,
    );

    await expect(readFile(taskFile(root, progressed.id), "utf8")).resolves.toBe(before);
    await expect(access(taskFile(root, member("13").id))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
