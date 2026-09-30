import { describe, expect, it } from "vitest";

import { resolveActiveTask } from "src/core/tasks/task.js";
import { addCriterionWorkflow, setCheckWorkflow, setPathsWorkflow } from "src/core/workflow/plan-edit.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:30:00.000Z";
const REASON = "Thêm check phạm vi đầy đủ theo yêu cầu";

async function planningProject(root: string) {
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const planning = taskV3("planning", "planning");
  await saveWorkflow(root, { task: planning });
  return planning;
}

describe("workflow plan-edit transports", () => {
  it("adds a check while planning and keeps every unspecified field when updating it", async () => {
    const root = await temporaryRepository();
    await planningProject(root);

    const added = await setCheckWorkflow(
      root,
      {
        id: "second",
        description: "Kiểm tra tổng",
        scope: "full",
        criteria: ["a"],
        inputs: ["src/**", "src/**"],
        command: "pnpm test",
      },
      {},
      NOW,
    );
    const second = added.validationPlan.find((check) => check.id === "second");
    expect(second).toEqual({
      id: "second",
      description: "Kiểm tra tổng",
      command: "pnpm test",
      scope: "full",
      required: true,
      criterionIds: ["a"],
      inputs: ["src/**"],
    });
    expect(added.checkpoint).toBe("planning");

    const updated = await setCheckWorkflow(
      root,
      { id: "second", command: "pnpm test:unit", inputs: ["src/**", "test/**"] },
      {},
      NOW,
    );
    expect(updated.validationPlan.find((check) => check.id === "second")).toMatchObject({
      description: "Kiểm tra tổng",
      command: "pnpm test:unit",
      scope: "full",
      criterionIds: ["a"],
      inputs: ["src/**", "test/**"],
    });
  });

  it("rejects an incomplete new check and an invalid scope", async () => {
    const root = await temporaryRepository();
    await planningProject(root);

    await expect(setCheckWorkflow(root, { id: "x", scope: "full" }, {}, NOW)).rejects.toThrow(/--description/u);
    await expect(setCheckWorkflow(root, { id: "x", description: "d" }, {}, NOW)).rejects.toThrow(/--scope/u);
    await expect(setCheckWorkflow(root, { id: "x", description: "d", scope: "full" }, {}, NOW)).rejects.toThrow(
      /--criteria/u,
    );
    await expect(
      setCheckWorkflow(
        root,
        { id: "x", description: "d", scope: "huge", criteria: ["a"], inputs: ["src/**"] },
        {},
        NOW,
      ),
    ).rejects.toThrow(/--scope/u);
  });

  it("requires a reason after planning and wraps one replan save with a contract revision", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      setCheckWorkflow(
        root,
        { id: "extra", description: "d", scope: "full", criteria: ["a"], inputs: ["src/**"] },
        {},
        NOW,
      ),
    ).rejects.toThrow(/--reason/u);
    await expect(
      setCheckWorkflow(
        root,
        { id: "extra", description: "d", scope: "full", criteria: ["a"], inputs: ["src/**"] },
        { reason: "short" },
        NOW,
      ),
    ).rejects.toThrow(/--reason/u);

    const replanned = await setCheckWorkflow(
      root,
      { id: "extra", description: "d", scope: "full", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      NOW,
    );
    expect(replanned.status).toBe("in_progress");
    expect(replanned.checkpoint).toBe("replan");
    expect(replanned.evidence.some((item) => item.id.startsWith("task-contract-revision"))).toBe(true);

    await expect(
      setCheckWorkflow(root, { id: "extra", command: "pnpm test" }, {}, "2026-08-13T00:31:00.000Z"),
    ).rejects.toThrow(/--reason/u);
    const again = await setCheckWorkflow(
      root,
      { id: "extra", command: "pnpm test" },
      { reason: "Đổi command của check bổ sung" },
      "2026-08-13T00:31:00.000Z",
    );
    expect(again.checkpoint).toBe("replan");
    expect(
      (await resolveActiveTask(`${root}/.harnix`))?.validationPlan.find((check) => check.id === "extra")?.command,
    ).toBe("pnpm test");
  });

  it("adds a criterion with Vietnamese text intact and refuses a duplicate id", async () => {
    const root = await temporaryRepository();
    await planningProject(root);
    const text = "Khởi tạo đơn hàng thành công với đủ phương thức thanh toán";

    const saved = await addCriterionWorkflow(root, { id: "b", text, checks: ["check"] }, {}, NOW);

    expect(saved.acceptanceCriteria.find((criterion) => criterion.id === "b")).toEqual({
      id: "b",
      text,
      status: "pending",
      evidenceIds: [],
    });
    await expect(addCriterionWorkflow(root, { id: "b", text, checks: ["check"] }, {}, NOW)).rejects.toThrow(/already/u);
    await expect(addCriterionWorkflow(root, { id: "c", text: "  ", checks: ["check"] }, {}, NOW)).rejects.toThrow(
      /--text/u,
    );
  });

  it("applies the same reason rule to a criterion added after planning", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      addCriterionWorkflow(root, { id: "b", text: "Thêm tiêu chí", checks: ["check"] }, {}, NOW),
    ).rejects.toThrow(/--reason/u);
    const saved = await addCriterionWorkflow(
      root,
      { id: "b", text: "Thêm tiêu chí", checks: ["check"] },
      { reason: REASON },
      NOW,
    );
    expect(saved.checkpoint).toBe("replan");
  });

  it("replaces whole path lists without needing a reason and rejects unsafe paths", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    const saved = await setPathsWorkflow(
      root,
      { paths: ["src/b.ts", "src/a.ts"], specs: [".harnix/spec/guides/common.md"] },
      NOW,
    );
    expect(saved.relevantPaths).toEqual(["src/a.ts", "src/b.ts"]);
    expect(saved.relevantSpecs).toEqual([".harnix/spec/guides/common.md"]);
    expect(saved.checkpoint).toBe("implementing");

    const onlyPaths = await setPathsWorkflow(root, { paths: ["src/c.ts"] }, "2026-08-13T00:31:00.000Z");
    expect(onlyPaths.relevantPaths).toEqual(["src/c.ts"]);
    expect(onlyPaths.relevantSpecs).toEqual([".harnix/spec/guides/common.md"]);
    await expect(setPathsWorkflow(root, { paths: ["../escape"] }, NOW)).rejects.toThrow();
    await expect(setPathsWorkflow(root, {}, NOW)).rejects.toThrow(/--relevant-path/u);
  });

  it("requires a schema v3 active task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(setCheckWorkflow(root, { id: "x" }, {}, NOW)).rejects.toThrow(/active task/u);
  });
});
