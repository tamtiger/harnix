import { describe, expect, it } from "vitest";

import { computeInputDigest } from "src/core/verification/input-digest.js";
import { replaceCheckWorkflow } from "src/core/workflow/replace-check.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:30:00.000Z";

describe("workflow replace-check", () => {
  it("atomically replaces a failed check with a new check declared inline and moves to replan", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    // Record a failed evidence for check first
    await saveWorkflow(root, {
      task: {
        ...task,
        evidence: [
          {
            id: "ev-fail-1",
            checkId: "check",
            recordedAt: NOW,
            result: "fail",
            exitCode: 1,
            summary: "lint error in package",
            artifactPaths: [],
          },
        ],
      },
    });

    const replaced = await replaceCheckWorkflow(
      root,
      {
        oldId: "check",
        newId: "check-focused",
        command: "pnpm eslint src/focused",
        scope: "focused",
        inputs: ["src/**"],
      },
      { reason: "Thay thế check lint toàn bộ bằng check lint tập trung" },
      "2026-08-13T00:35:00.000Z",
    );

    expect(replaced.checkpoint).toBe("replan");
    const oldCheck = replaced.validationPlan.find((c) => c.id === "check");
    const newCheck = replaced.validationPlan.find((c) => c.id === "check-focused");
    expect(oldCheck?.required).toBe(false);
    expect(newCheck?.required).toBe(true);
    expect(newCheck?.criterionIds).toEqual(["a"]);
    expect(replaced.evidence.some((e) => e.summary.includes("Thay thế check lint"))).toBe(true);
  });

  it("rejects replacing a check that has passing evidence or invalid arguments", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const { inputDigest } = await computeInputDigest(root, task, "check");
    await saveWorkflow(root, {
      task: {
        ...task,
        evidence: [
          {
            id: "ev-pass-1",
            checkId: "check",
            recordedAt: NOW,
            result: "pass",
            exitCode: 0,
            summary: "passed ok",
            artifactPaths: [],
            inputDigest,
          },
        ],
      },
    });

    await expect(
      replaceCheckWorkflow(
        root,
        { oldId: "check", newId: "check-replacement" },
        { reason: "Thay the check da pass" },
        NOW,
      ),
    ).rejects.toThrow(/after passing evidence/u);

    await expect(
      replaceCheckWorkflow(root, { oldId: "check", newId: "check" }, { reason: "Trùng id cũ và mới" }, NOW),
    ).rejects.toThrow(/differ/u);

    await expect(
      replaceCheckWorkflow(
        root,
        { oldId: "missing-check", newId: "check-new" },
        { reason: "Check cũ không tồn tại" },
        NOW,
      ),
    ).rejects.toThrow(/not declared/u);
  });

  it("inherits the command and cwd of the retired check when the replacement does not name them", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    await saveWorkflow(root, {
      task: {
        ...task,
        evidence: [
          {
            id: "ev-fail-1",
            checkId: "check",
            recordedAt: NOW,
            result: "fail",
            exitCode: 1,
            summary: "red",
            artifactPaths: [],
          },
        ],
      },
    });

    const replaced = await replaceCheckWorkflow(
      root,
      { oldId: "check", newId: "check-narrow", inputs: ["src/a.ts"] },
      { reason: "Thu hẹp phạm vi input của check bị lỗi" },
      "2026-08-13T00:35:00.000Z",
    );

    expect(replaced.validationPlan.find((check) => check.id === "check-narrow")).toMatchObject({
      command: task.validationPlan[0]!.command,
      inputs: ["src/a.ts"],
      required: true,
    });
  });
});
