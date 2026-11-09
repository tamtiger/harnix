import { describe, expect, it } from "vitest";

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

  it("counts as a new attempt for the circuit breaker", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:10:00.000Z");
    await appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:11:00.000Z");
    await expect(appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:12:00.000Z")).rejects.toThrow(/failed twice/u);

    await setCheckWorkflow(root, { id: "check", cwd: "svc" }, {}, "2026-08-13T00:20:00.000Z");

    await expect(appendEvidenceFlagsWorkflow(root, fail, "2026-08-13T00:21:00.000Z")).resolves.toBeDefined();
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
