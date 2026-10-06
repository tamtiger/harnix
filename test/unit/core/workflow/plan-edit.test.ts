import { describe, expect, it } from "vitest";

import { resolveActiveTask } from "src/core/tasks/task.js";
import {
  addCriterionWorkflow,
  addDecisionWorkflow,
  addRiskWorkflow,
  setCheckWorkflow,
  setPathsWorkflow,
} from "src/core/workflow/plan-edit.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { replaceCheckWorkflow } from "src/core/workflow/replace-check.js";
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

  it("records decisions and residual risks at any unfinished stage without a reason or a replan", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const rationale = "Giữ nguyên contract hash nên không cần replan";

    const withDecision = await addDecisionWorkflow(root, { id: "d1", text: "Ghi decision bằng flag", rationale }, NOW);
    expect(withDecision.decisions).toEqual([{ id: "d1", text: "Ghi decision bằng flag", rationale }]);
    expect(withDecision.checkpoint).toBe("implementing");

    const withRisk = await addRiskWorkflow(
      root,
      { id: "r1", text: "Rủi ro còn lại về mã hóa" },
      "2026-08-13T00:31:00.000Z",
    );
    expect(withRisk.residualRisks).toEqual([{ id: "r1", text: "Rủi ro còn lại về mã hóa", severity: "low" }]);
    const high = await addRiskWorkflow(
      root,
      { id: "r2", text: "Rủi ro cao", severity: "high" },
      "2026-08-13T00:32:00.000Z",
    );
    expect(high.residualRisks?.map((risk) => risk.severity)).toEqual(["low", "high"]);
  });

  it("rejects duplicate ids, empty text or rationale, unknown severity and corrupted text for notes", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await addDecisionWorkflow(root, { id: "d1", text: "Một", rationale: "Lý do" }, NOW);
    await addRiskWorkflow(root, { id: "r1", text: "Rủi ro" }, NOW);

    await expect(addDecisionWorkflow(root, { id: "d1", text: "Hai", rationale: "Lý do" }, NOW)).rejects.toThrow(
      /already/u,
    );
    await expect(addDecisionWorkflow(root, { id: "d2", text: " ", rationale: "Lý do" }, NOW)).rejects.toThrow(
      /--text/u,
    );
    await expect(addDecisionWorkflow(root, { id: "d2", text: "Hai", rationale: "" }, NOW)).rejects.toThrow(
      /--rationale/u,
    );
    await expect(addRiskWorkflow(root, { id: "r1", text: "Trùng" }, NOW)).rejects.toThrow(/already/u);
    await expect(addRiskWorkflow(root, { id: "r2", text: "" }, NOW)).rejects.toThrow(/--text/u);
    await expect(addRiskWorkflow(root, { id: "r2", text: "x", severity: "critical" }, NOW)).rejects.toThrow(
      /--severity/u,
    );
    const garbled = new TextDecoder("windows-1252").decode(Buffer.from("Điều phối", "utf8"));
    await expect(addRiskWorkflow(root, { id: "r3", text: garbled }, NOW)).rejects.toThrow(/wrong text encoding/u);
  });

  it("supports cwd scoping for multi-repo checks in setCheck and replaceCheck", async () => {
    const root = await temporaryRepository();
    await planningProject(root);

    const added = await setCheckWorkflow(
      root,
      {
        id: "core-test",
        description: "Core test in sub repo",
        scope: "focused",
        criteria: ["a"],
        inputs: ["sub-core/**"],
        command: "pnpm test",
        cwd: "sub-core",
      },
      {},
      NOW,
    );
    const check = added.validationPlan.find((c) => c.id === "core-test");
    expect(check?.cwd).toBe("sub-core");

    const replaced = await replaceCheckWorkflow(
      root,
      {
        oldId: "core-test",
        newId: "core-test-v2",
        description: "Core test v2",
        cwd: "sub-core-v2",
      },
      { reason: "Update root repo directory" },
      NOW,
    );
    const newCheck = replaced.validationPlan.find((c) => c.id === "core-test-v2");
    expect(newCheck?.cwd).toBe("sub-core-v2");
  });
});

describe("workflow obligation edits while verifying", () => {
  async function verifyingWithPass(root: string) {
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "pass", exitCode: "0", summary: "ok" },
      "2026-08-13T00:10:00.000Z",
    );
    await transitionWorkflow(root, "verifying", "verifying", "2026-08-13T00:20:00.000Z");
  }

  it("returns to verifying/verifying after a new check, keeping the passed evidence", async () => {
    const root = await temporaryRepository();
    await verifyingWithPass(root);

    const saved = await setCheckWorkflow(
      root,
      { id: "extra", description: "d", scope: "focused", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      "2026-08-13T00:30:00.000Z",
    );

    expect([saved.status, saved.checkpoint]).toEqual(["verifying", "verifying"]);
    expect(saved.validationPlan.some((check) => check.id === "extra")).toBe(true);
    expect(saved.evidence.filter((item) => item.checkId === "check" && item.result === "pass")).toHaveLength(1);
  });

  it("returns to verifying/verifying after a new criterion and refuses to touch the passed check", async () => {
    const root = await temporaryRepository();
    await verifyingWithPass(root);

    await setCheckWorkflow(
      root,
      { id: "extra", description: "d", scope: "focused", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      "2026-08-13T00:30:00.000Z",
    );
    const added = await addCriterionWorkflow(
      root,
      { id: "b", text: "Tiêu chí bổ sung", checks: ["extra"] },
      { reason: REASON },
      "2026-08-13T00:31:00.000Z",
    );
    expect([added.status, added.checkpoint]).toEqual(["verifying", "verifying"]);
    await expect(
      setCheckWorkflow(root, { id: "check", command: "pnpm other" }, { reason: REASON }, "2026-08-13T00:32:00.000Z"),
    ).rejects.toThrow(/after passing evidence/u);
  });
});
