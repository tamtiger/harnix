import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { detailPublicEpic, type PublicEpicDetailResult } from "src/commands/epic.js";
import { initializeProject } from "src/commands/init.js";
import { readConfig, writeConfig } from "src/core/config/config.js";
import { upsertEpic, validateEpic } from "src/core/epics/epic.js";
import { saveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { buildCriterion, buildEpic, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

describe("EpicRecord validation", () => {
  const stamp = { createdAt: "2026-09-24T04:00:00Z", updatedAt: "2026-09-24T04:00:00Z" };

  it("accepts a valid epic record", () => {
    const valid = buildEpic({
      id: "my-epic",
      title: "Tính năng lớn",
      goal: "Thêm roadmap cho epic tracking",
      ...stamp,
    });
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("accepts a valid epic with nonGoals", () => {
    const valid = buildEpic({ id: "epic-2", title: "Khác", goal: "Khác", nonGoals: ["Không làm gì"], ...stamp });
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("rejects epic missing required field", () => {
    const invalid: Record<string, unknown> = { ...buildEpic({ id: "my-epic", title: "Tính năng", ...stamp }) };
    delete invalid.goal;
    expect(() => validateEpic(invalid)).toThrow();
  });

  it("rejects epic with unknown field", () => {
    const invalid = {
      ...buildEpic({ id: "my-epic", title: "Tính năng", goal: "Mục tiêu", ...stamp }),
      extraField: "should-not-be-here",
    };
    expect(() => validateEpic(invalid)).toThrow();
  });

  const temporaryRepository = useTemporaryRepositories();

  it("persists epic record and regenerates markdown derived view", async () => {
    const root = await temporaryRepository();
    const epic = validateEpic(buildEpic({ id: "my-epic", title: "Tính năng lớn", goal: "Thêm roadmap", ...stamp }));

    await upsertEpic(root, epic);
    const jsonContent = await readFile(join(root, ".harnix", "epics", "my-epic.json"), "utf8");
    expect(JSON.parse(jsonContent).id).toBe("my-epic");

    const mdContent = await readFile(join(root, ".harnix", "epics", "my-epic.md"), "utf8");
    expect(mdContent).toContain("Tính năng lớn");
    expect(mdContent).toContain("Thêm roadmap");
  });

  it("writes both epic files atomically: whole files, a final newline and no temporary leftovers", async () => {
    const root = await temporaryRepository();
    const epic = validateEpic(buildEpic({ id: "atomic-epic", title: "Epic", goal: "Goal", ...stamp }));

    await upsertEpic(root, epic);
    await upsertEpic(root, validateEpic({ ...epic, goal: "A different goal" }));

    const directory = join(root, ".harnix", "epics");
    const json = await readFile(join(directory, "atomic-epic.json"), "utf8");
    expect(json.endsWith("}\n")).toBe(true);
    expect(JSON.parse(json).goal).toBe("A different goal");
    expect((await readFile(join(directory, "atomic-epic.md"), "utf8")).endsWith("\n")).toBe(true);
    expect((await readdir(directory)).sort()).toEqual(["atomic-epic.json", "atomic-epic.md"]);
  });
});

const renderRepository = useTemporaryRepositories("harnix-epic-render-");

function memberTask(id: string, status: "planning" | "completed", title: string): TaskRecordV3 {
  const stamp = "2026-09-28T13:58:01.000Z";
  const completed = status === "completed";
  return buildTaskV3({
    id,
    title,
    status,
    checkpoint: completed ? "finishing" : "planning",
    goal: `Goal of ${title}`,
    acceptanceCriteria: [
      buildCriterion({ status: completed ? "waived" : "pending", ...(completed ? { waiverReason: "test" } : {}) }),
    ],
    createdAt: stamp,
    updatedAt: stamp,
    epicId: "render-epic",
    ...(completed ? { completedAt: stamp } : {}),
  });
}

describe("epic page renderer", () => {
  const epic = buildEpic({
    id: "render-epic",
    title: "Render epic",
    goal: "Epic goal",
    nonGoals: ["Không viết lại từ đầu.", "Không thêm telemetry."],
    createdAt: "2026-09-28T13:58:01.000Z",
    updatedAt: "2026-09-28T13:58:01.000Z",
  });

  async function project(): Promise<string> {
    const root = await renderRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeConfig(join(root, ".harnix", "config.yaml"), {
      ...(await readConfig(join(root, ".harnix", "config.yaml"))),
      timezone: "Asia/Ho_Chi_Minh",
    });
    return root;
  }

  it("renders a blank line before every heading, the non-goals and the next task", async () => {
    const root = await project();
    await saveTask(join(root, ".harnix"), memberTask("20260928-100000-done", "completed", "Done task"));
    await saveTask(join(root, ".harnix"), memberTask("20260928-100001-open", "planning", "Open task"));

    await upsertEpic(root, epic);

    const page = await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8");
    expect(page).toBe(
      [
        "# Epic: Render epic",
        "",
        "Epic goal",
        "",
        "- **Cập nhật:** 2026-09-28 20:58:01 +07:00",
        "",
        "## Non-goals",
        "",
        "- Không viết lại từ đầu.",
        "- Không thêm telemetry.",
        "",
        "## Next task",
        "",
        "- `20260928-100001-open` — Open task (`planning`)",
        "",
        "## Members (2 tasks)",
        "",
        "| # | Task ID | Title | Mode | Status |",
        "|---|---------|-------|------|--------|",
        "| 1 | `20260928-100000-done` | Done task | `lite` | `completed` |",
        "| 2 | `20260928-100001-open` | Open task | `lite` | `planning` |",
        "",
        "## Task Overview & Scope",
        "",
        "### 1. `20260928-100000-done` — Done task",
        "",
        "- **Trạng thái:** `completed`",
        "- **Mục tiêu:** Goal of Done task",
        "- **Tiêu chí nghiệm thu:** 1 tiêu chí",
        "",
        "### 2. `20260928-100001-open` — Open task",
        "",
        "- **Trạng thái:** `planning`",
        "- **Mục tiêu:** Goal of Open task",
        "- **Tiêu chí nghiệm thu:** 1 tiêu chí",
        "",
      ].join("\n"),
    );
    expect(page).not.toMatch(/[^\n]\n#/u);
  });

  it("says so when there are no members or every member is finished, and omits empty non-goals", async () => {
    const root = await project();
    const withoutNonGoals = Object.fromEntries(
      Object.entries(epic).filter(([key]) => key !== "nonGoals"),
    ) as unknown as typeof epic;

    await upsertEpic(root, withoutNonGoals);
    const empty = await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8");
    await saveTask(join(root, ".harnix"), memberTask("20260928-100000-done", "completed", "Done task"));
    await upsertEpic(root, withoutNonGoals);
    const finished = await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8");

    expect(empty).not.toContain("Non-goals");
    expect(empty).toContain("Chưa có task thành viên.");
    expect(empty).toContain("No task members yet.");
    expect(finished).toContain("Không còn task nào chưa hoàn tất.");
  });

  it("lists the next task in the JSON view exactly as the page does", async () => {
    const root = await project();
    await saveTask(join(root, ".harnix"), memberTask("20260928-100000-done", "completed", "Done task"));
    await saveTask(join(root, ".harnix"), memberTask("20260928-100001-open", "planning", "Open task"));
    await upsertEpic(root, epic);

    const detail = await detailPublicEpic(root, "render-epic");

    expect(detail.nextTask?.id).toBe("20260928-100001-open");
    expect((detail as PublicEpicDetailResult).members.map((member) => member.mode)).toEqual(["lite", "lite"]);
    expect(await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8")).toContain(
      `\`${detail.nextTask!.id}\``,
    );
  });
});

describe("epic order", () => {
  const A = "20260928-100000-first";
  const B = "20260928-100001-second";
  const ordered = buildEpic({
    id: "ordered-epic",
    title: "Ordered",
    goal: "Goal",
    order: [B, A],
    createdAt: "2026-09-28T13:58:01.000Z",
    updatedAt: "2026-09-28T13:58:01.000Z",
  });

  it("validates the order field and still reads an epic without one", () => {
    expect(validateEpic(ordered).order).toEqual([B, A]);
    expect(() => validateEpic({ ...ordered, order: [A, A] })).toThrow(/duplicate/iu);
    expect(() => validateEpic({ ...ordered, order: "x" })).toThrow(/order/u);
    expect(validateEpic(buildEpic({ id: "plain", title: "t", goal: "g" })).order).toBeUndefined();
  });

  it("picks the next task and renders the members in the declared order", async () => {
    const root = await renderRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const member = (id: string, title: string) => ({ ...memberTask(id, "planning", title), epicId: "ordered-epic" });
    await saveTask(join(root, ".harnix"), member(A, "First task"));
    await saveTask(join(root, ".harnix"), member(B, "Second task"));
    await upsertEpic(root, ordered);

    const detail = (await detailPublicEpic(root, "ordered-epic")) as PublicEpicDetailResult;
    const page = await readFile(join(root, ".harnix", "epics", "ordered-epic.md"), "utf8");

    expect(detail.nextTask?.id).toBe(B);
    expect(detail.members.map((item) => item.id)).toEqual([B, A]);
    expect(page.indexOf(`\`${B}\` | Second task`)).toBeLessThan(page.indexOf(`\`${A}\` | First task`));
  });
});
