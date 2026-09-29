import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { upsertEpic } from "src/core/epics/epic.js";
import { saveTask } from "src/core/tasks/task.js";
import { currentInstant, journalFilePath, refreshLinkedEpicMarkdown } from "src/core/workflow/support.js";
import { TEST_TIMEZONE, buildEpic, buildTaskV1, buildTaskV3, createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow support", () => {
  it("prefers an injected instant and otherwise stamps now in the configured zone", async () => {
    const root = await createTestProject(await temporaryRepository());

    expect(await currentInstant(root, "2026-09-29T09:00:00.000+07:00")).toBe("2026-09-29T09:00:00.000+07:00");
    const generated = await currentInstant(root, undefined);
    expect(generated).toMatch(/\+07:00$/u);
    expect(Math.abs(Date.parse(generated) - Date.now())).toBeLessThan(60_000);
  });

  it("partitions the journal file by the local calendar date of the configured zone", async () => {
    const root = await createTestProject(await temporaryRepository());
    const config = { developer: "tam", timezone: TEST_TIMEZONE };

    const path = (await journalFilePath(root, config, "2026-09-28T17:30:00.000Z")).replaceAll("\\", "/");

    expect(path.endsWith("/.harnix/workspace/tam/journal/2026-09-29.jsonl")).toBe(true);
  });

  it("refreshes the epic page only for a task that belongs to an epic", async () => {
    const root = await createTestProject(await temporaryRepository());
    const harnixRoot = join(root, ".harnix");
    await upsertEpic(root, buildEpic({ id: "support-epic" }));
    const member = buildTaskV3({ epicId: "support-epic" });
    await saveTask(harnixRoot, member);

    await refreshLinkedEpicMarkdown(root, member);
    const page = await readFile(join(harnixRoot, "epics", "support-epic.md"), "utf8");
    expect(page).toContain(member.id);

    // No epic id, or a legacy v1 record, is a no-op rather than an error.
    await expect(refreshLinkedEpicMarkdown(root, buildTaskV3())).resolves.toBeUndefined();
    await expect(refreshLinkedEpicMarkdown(root, buildTaskV1())).resolves.toBeUndefined();
  });
});
