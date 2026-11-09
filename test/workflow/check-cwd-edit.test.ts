import { describe, expect, it } from "vitest";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { batchWorkflow } from "src/core/workflow/batch.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const fail = { check: "check", result: "fail", exitCode: "1", summary: "MSB1009 project file does not exist" };

describe("changing only the cwd of a check without a passing run", () => {
  it("applies directly: no reason, no replan, the failed evidence stays", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");

    const saved = await setCheckWorkflow(root, { id: "check", cwd: "svc" }, {}, "2026-08-13T00:20:00.000Z");

    expect([saved.status, saved.checkpoint]).toEqual(["in_progress", "implementing"]);
    expect(saved.validationPlan.find((check) => check.id === "check")?.cwd).toBe("svc");
    expect(saved.evidence.filter((item) => item.checkId === "check")).toHaveLength(1);
  });

  it("is refused once the circuit breaker stopped the check, so it cannot be used to get past it", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:11:00.000Z");

    await expect(setCheckWorkflow(root, { id: "check", cwd: "svc" }, {}, "2026-08-13T00:20:00.000Z")).rejects.toThrow(
      /failed twice in a row[^]*--reset-breaker[^]*--replace-check/u,
    );
    await expect(
      setCheckWorkflow(root, { id: "check", description: "đổi mô tả" }, {}, "2026-08-13T00:21:00.000Z"),
    ).rejects.toThrow(/failed twice in a row/u);
  });

  it("is allowed again once the source inputs changed after the failures, as a run would be", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:11:00.000Z");
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;" + String.fromCharCode(10));

    const saved = await setCheckWorkflow(root, { id: "check", cwd: "svc" }, {}, "2026-08-13T00:20:00.000Z");

    expect(saved.validationPlan.find((check) => check.id === "check")?.cwd).toBe("svc");
  });

  it("does not let a reasoned edit or a batch of a stopped check change what it runs", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:11:00.000Z");

    await expect(
      setCheckWorkflow(
        root,
        { id: "check", command: "pnpm other" },
        { reason: "đổi command check đã dừng" },
        "2026-08-13T00:20:00.000Z",
      ),
    ).rejects.toThrow(/retain failed check/u);
    await expect(
      batchWorkflow(
        root,
        { reason: "đổi command check đã dừng", checks: [{ id: "check", command: "pnpm other" }] },
        "2026-08-13T00:21:00.000Z",
      ),
    ).rejects.toThrow(/retain failed check/u);
    await expect(
      batchWorkflow(root, { checks: [{ id: "check", description: "đổi mô tả" }] }, "2026-08-13T00:22:00.000Z"),
    ).rejects.toThrow(/failed twice in a row|--reason/u);
  });

  it("still needs a reason when the command changes, and says when cwd-only is allowed", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");

    await expect(
      setCheckWorkflow(root, { id: "check", command: "pnpm other" }, {}, "2026-08-13T00:20:00.000Z"),
    ).rejects.toThrow(/--reason/u);
    await expect(
      setCheckWorkflow(
        root,
        { id: "check", command: "pnpm other" },
        { reason: "đổi command check" },
        "2026-08-13T00:21:00.000Z",
      ),
    ).rejects.toThrow(/only --cwd or --description[^]*without a passing run/u);
  });

  it("keeps a passed check immutable even for the cwd", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "pass", exitCode: "0", summary: "ok" },
      "2026-08-13T00:10:00.000Z",
    );

    await expect(
      setCheckWorkflow(
        root,
        { id: "check", cwd: "svc" },
        { reason: "đổi cwd check đã pass" },
        "2026-08-13T00:20:00.000Z",
      ),
    ).rejects.toThrow(/passed check check unchanged/u);
  });
});
