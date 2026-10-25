import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { restoreFullArtifacts } from "src/core/doctor/restore-artifacts.js";
import { saveTask } from "src/core/tasks/task.js";
import { buildTaskV3 } from "test/support/builders.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-restore-artifacts-");
const FULL = "20260929-090000-full-one";
const LITE = "20260929-090100-lite-one";

describe("restoreFullArtifacts", () => {
  it("writes the missing prd.md and plan.md of an unfinished Full task, skips a Lite task and keeps a file that exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const harnix = join(root, ".harnix");
    await saveTask(harnix, buildTaskV3({ id: FULL, mode: "full" }));
    await saveTask(harnix, buildTaskV3({ id: LITE, mode: "lite" }));
    await mkdir(join(harnix, "tasks", FULL), { recursive: true });
    await writeFile(join(harnix, "tasks", FULL, "prd.md"), "# Của người dùng\n");

    expect(await restoreFullArtifacts(root)).toBe(1);

    expect(await readFile(join(harnix, "tasks", FULL, "prd.md"), "utf8")).toBe("# Của người dùng\n");
    expect(await readFile(join(harnix, "tasks", FULL, "plan.md"), "utf8")).toContain("- [ ]");
    expect(await restoreFullArtifacts(root)).toBe(0);
    await expect(readFile(join(harnix, "tasks", LITE, "plan.md"), "utf8")).rejects.toThrow();
  });
});
