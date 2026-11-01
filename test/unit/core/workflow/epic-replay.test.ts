import { access, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { loadEpicRecord, resolveEpicFile, upsertEpic } from "src/core/epics/epic.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildEpic } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { taskMonth } from "test/support/task-paths.js";

const temporaryRepository = useTemporaryRepositories();
const EPIC = "epic-1";
const MEMBER = { ...taskV3("planning", "planning"), id: "20260813-131100-member-11", epicId: EPIC };
const MAIN = { ...taskV3("planning", "planning"), epicId: EPIC };
const taskDirectory = (root: string, id: string) => join(root, ".harnix", "tasks", taskMonth(id), id);

describe("repairEpicSideEffects through saveWorkflow", () => {
  it("repairs the epic and the members when the same envelope is re-sent after the epic write failed", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const envelope = { task: MAIN, epic: buildEpic({ id: EPIC }), epicMembers: [MEMBER] };
    const epicJson = await resolveEpicFile(join(root, ".harnix"), EPIC, "json");
    await mkdir(epicJson, { recursive: true });

    await expect(saveWorkflow(root, envelope)).rejects.toThrow();
    await expect(access(join(taskDirectory(root, MAIN.id), "task.json"))).resolves.toBeUndefined();
    await rm(epicJson, { recursive: true });
    await rm(taskDirectory(root, MEMBER.id), { recursive: true });

    await expect(saveWorkflow(root, envelope)).resolves.toMatchObject({ id: MAIN.id });

    await expect(loadEpicRecord(root, EPIC)).resolves.toMatchObject({ id: EPIC });
    await expect(access(join(taskDirectory(root, MEMBER.id), "task.json"))).resolves.toBeUndefined();
  });

  it("repairs the epic when the active pointer is still set and the epic write failed on an update", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    const envelope = { task: MAIN, epic: buildEpic({ id: EPIC }) };
    const epicJson = await resolveEpicFile(join(root, ".harnix"), EPIC, "json");
    await mkdir(epicJson, { recursive: true });

    await expect(saveWorkflow(root, envelope)).rejects.toThrow();
    await rm(epicJson, { recursive: true });

    await expect(saveWorkflow(root, envelope)).resolves.toMatchObject({ id: MAIN.id });
    await expect(loadEpicRecord(root, EPIC)).resolves.toMatchObject({ id: EPIC });
  });

  it("notes on stderr that an existing epic with different content was kept on a replay", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const envelope = { task: MAIN, epic: buildEpic({ id: EPIC, title: "Tiêu đề mới" }) };
    const epicJson = await resolveEpicFile(join(root, ".harnix"), EPIC, "json");
    await mkdir(epicJson, { recursive: true });
    await expect(saveWorkflow(root, envelope)).rejects.toThrow();
    await rm(epicJson, { recursive: true });
    await upsertEpic(root, buildEpic({ id: EPIC, title: "Tiêu đề cũ" }));
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      await saveWorkflow(root, envelope);
      const sent = stderr.mock.calls.map((call) => String(call[0])).join("");
      expect(sent).toContain("notice: epic epic-1 already exists with different content");
    } finally {
      stderr.mockRestore();
    }
    await expect(loadEpicRecord(root, EPIC)).resolves.toMatchObject({ title: "Tiêu đề cũ" });
  });
});
