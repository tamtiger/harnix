import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detailPublicEpic } from "src/commands/epic.js";
import { loadEpicRecord } from "src/core/epics/epic.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { initEpicWorkflow } from "src/core/workflow/init-epic.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-11-24T04:00:00.000Z";

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  await mkdir(join(root, "test"), { recursive: true });
  await writeFile(join(root, "test", "sample.test.ts"), "");
  return root;
}

const MEMBERS = ["Thêm cổng kiểm|add-gate", "Đồng bộ tài liệu|sync-docs", "Phát hành|release"];

describe("initEpicWorkflow", () => {
  it("creates the epic and every member in one save with increasing ids and the first member active", async () => {
    const root = await project();

    const result = await initEpicWorkflow(root, {
      title: "Epic thử",
      slug: "trial-epic",
      goal: "Mục tiêu",
      members: MEMBERS,
      injectedNow: NOW,
    });

    expect(result.dryRun).toBe(false);
    expect(result.epic.id).toBe("20261124-040000-trial-epic");
    expect(result.members.map(({ id }) => id)).toEqual([
      "20261124-040001-add-gate",
      "20261124-040002-sync-docs",
      "20261124-040003-release",
    ]);
    expect(result.members[0]?.checks.length).toBeGreaterThan(0);
    expect((await resolveActiveTask(`${root}/.harnix`))?.id).toBe("20261124-040001-add-gate");
    const epic = await loadEpicRecord(root, result.epic.id);
    expect(epic).toMatchObject({ title: "Epic thử", goal: "Mục tiêu", createdAt: NOW });
    const detail = await detailPublicEpic(root, result.epic.id, false);
    expect("members" in detail && detail.members.map(({ status }) => status)).toEqual([
      "planning",
      "planning",
      "planning",
    ]);
  });

  it("writes nothing with dryRun and still reports the planned ids", async () => {
    const root = await project();

    const result = await initEpicWorkflow(root, {
      title: "Epic thử",
      slug: "trial-epic",
      members: MEMBERS,
      dryRun: true,
      injectedNow: NOW,
    });

    expect(result.dryRun).toBe(true);
    expect(result.task).toBeUndefined();
    expect(result.members).toHaveLength(3);
    expect(await resolveActiveTask(`${root}/.harnix`)).toBeUndefined();
    expect(await loadEpicRecord(root, result.epic.id)).toBeUndefined();
  });

  it("reports every problem in one error with the corrected command", async () => {
    const root = await project();

    const failure = initEpicWorkflow(root, {
      title: "Epic có dấu",
      members: ["Chỉ tiêu đề", "Trùng|same", "Trùng khác|same", "Thiếu slug|"],
    });

    await expect(failure).rejects.toThrow(/has \d problems/u);
    await expect(failure).rejects.toThrow(/not plain ASCII/u);
    await expect(failure).rejects.toThrow(/"Chỉ tiêu đề" must be/u);
    await expect(failure).rejects.toThrow(/slug same is used twice/u);
    await expect(failure).rejects.toThrow(/Gợi ý: lệnh mẫu: harnix workflow --init-epic/u);
  });

  it("refuses one member, since an epic groups at least two tasks", async () => {
    const root = await project();

    await expect(initEpicWorkflow(root, { title: "Epic", slug: "solo", members: ["Một mình|alone"] })).rejects.toThrow(
      /at least 2 tasks/u,
    );
  });

  it("refuses a member slug that is not english kebab-case", async () => {
    const root = await project();

    await expect(
      initEpicWorkflow(root, { title: "Epic", slug: "bad", members: ["A|Bad Slug", "B|good-slug"] }),
    ).rejects.toThrow(/english-kebab-case/u);
  });
});
