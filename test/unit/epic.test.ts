import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { detailPublicEpic } from "../../src/commands/epic.js";
import { initializeProject } from "../../src/commands/init.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { upsertEpic, validateEpic } from "../../src/core/epics/epic.js";
import { saveTask, type TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

describe("EpicRecord validation", () => {
  it("accepts a valid epic record", () => {
    const valid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng lớn",
      goal: "Thêm roadmap cho epic tracking",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("accepts a valid epic with nonGoals", () => {
    const valid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "epic-2",
      title: "Khác",
      goal: "Khác",
      nonGoals: ["Không làm gì"],
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("rejects epic missing required field", () => {
    const invalid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(() => validateEpic(invalid)).toThrow();
  });

  it("rejects epic with unknown field", () => {
    const invalid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng",
      goal: "Mục tiêu",
      extraField: "should-not-be-here",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(() => validateEpic(invalid)).toThrow();
  });

  const temporaryRepository = useTemporaryRepositories();

  it("persists epic record and regenerates markdown derived view", async () => {
    const root = await temporaryRepository();
    const epic = validateEpic({
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng lớn",
      goal: "Thêm roadmap",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    });

    await upsertEpic(root, epic);
    const jsonContent = await readFile(join(root, ".harnix", "epics", "my-epic.json"), "utf8");
    expect(JSON.parse(jsonContent).id).toBe("my-epic");

    const mdContent = await readFile(join(root, ".harnix", "epics", "my-epic.md"), "utf8");
    expect(mdContent).toContain("Tính năng lớn");
    expect(mdContent).toContain("Thêm roadmap");
  });
});


const renderRepository = useTemporaryRepositories("harnix-epic-render-");

function memberTask(id: string, status: "planning" | "completed", title: string): TaskRecordV3 {
  const stamp = "2026-09-28T13:58:01.000Z";
  return {
    generator: "harnix", schemaVersion: 3, id, title, mode: "lite", status, checkpoint: status === "completed" ? "finishing" : "planning", goal: `Goal of ${title}`, nonGoals: [],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: status === "completed" ? "waived" : "pending", evidenceIds: [], ...(status === "completed" ? { waiverReason: "test" } : {}) }],
    relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "Unit", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["src/**"] }],
    evidence: [], createdAt: stamp, updatedAt: stamp, epicId: "render-epic", ...(status === "completed" ? { completedAt: stamp } : {}),
  };
}

describe("epic page renderer", () => {
  const epic = {
    generator: "harnix" as const, schemaVersion: 1 as const, id: "render-epic", title: "Render epic", goal: "Epic goal",
    nonGoals: ["Không viết lại từ đầu.", "Không thêm telemetry."], createdAt: "2026-09-28T13:58:01.000Z", updatedAt: "2026-09-28T13:58:01.000Z",
  };

  async function project(): Promise<string> {
    const root = await renderRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    await writeConfig(join(root, ".harnix", "config.yaml"), { ...(await readConfig(join(root, ".harnix", "config.yaml"))), timezone: "Asia/Ho_Chi_Minh" });
    return root;
  }

  it("renders a blank line before every heading, the non-goals and the next task", async () => {
    const root = await project();
    await saveTask(join(root, ".harnix"), memberTask("20260928-100000-done", "completed", "Done task"));
    await saveTask(join(root, ".harnix"), memberTask("20260928-100001-open", "planning", "Open task"));

    await upsertEpic(root, epic);

    const page = await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8");
    expect(page).toBe([
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
      "| # | Task ID | Title | Status |",
      "|---|---------|-------|--------|",
      "| 1 | `20260928-100000-done` | Done task | `completed` |",
      "| 2 | `20260928-100001-open` | Open task | `planning` |",
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
    ].join("\n"));
    expect(page).not.toMatch(/[^\n]\n#/u);
  });

  it("says so when there are no members or every member is finished, and omits empty non-goals", async () => {
    const root = await project();
    const withoutNonGoals = Object.fromEntries(Object.entries(epic).filter(([key]) => key !== "nonGoals")) as unknown as typeof epic;

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
    expect((await readFile(join(root, ".harnix", "epics", "render-epic.md"), "utf8"))).toContain(`\`${detail.nextTask!.id}\``);
  });
});
