import { describe, expect, it } from "vitest";

import { computeInputDigest } from "src/core/verification/input-digest.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:10:00.000Z";

describe("workflow evidence from flags", () => {
  it("fills id, recordedAt and the current digest for a required v3 pass", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);

    const { task: saved, evidenceId } = await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "pass", exitCode: "0", summary: "pnpm test — 3/3 pass" },
      NOW,
    );

    const digest = (await computeInputDigest(root, task, "check")).inputDigest;
    expect(evidenceId).toBe("ev-check-1");
    expect(saved.evidence.at(-1)).toEqual({
      id: "ev-check-1",
      checkId: "check",
      recordedAt: NOW,
      result: "pass",
      exitCode: 0,
      summary: "pnpm test — 3/3 pass",
      artifactPaths: [],
      inputDigest: digest,
    });
  });

  it("numbers evidence per check so earlier items are never overwritten", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", exitCode: "1", summary: "RED" }, NOW);

    const second = await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "pass", exitCode: "0", summary: "GREEN", artifacts: ["src/a.ts"] },
      "2026-08-13T00:11:00.000Z",
    );

    expect(second.evidenceId).toBe("ev-check-2");
    expect(second.task.evidence.map((item) => item.id)).toEqual(["ev-check-1", "ev-check-2"]);
    expect(second.task.evidence.at(-1)?.artifactPaths).toEqual(["src/a.ts"]);
  });

  it("stores a skipped item without a digest and requires an exit code for a command-backed check", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "skipped", summary: "not run" }, NOW),
    ).rejects.toThrow(/--exit-code/u);
    const { task } = await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "skipped", exitCode: "0", summary: "not run" },
      NOW,
    );

    expect(task.evidence.at(-1)).toEqual({
      id: "ev-check-1",
      checkId: "check",
      recordedAt: NOW,
      result: "skipped",
      exitCode: 0,
      summary: "not run",
      artifactPaths: [],
    });
  });

  it("rejects a pass without an exit code, an unknown check and an unknown result", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", summary: "x" }, NOW),
    ).rejects.toThrow(/--exit-code/u);
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "nope", result: "pass", exitCode: "0", summary: "x" }, NOW),
    ).rejects.toThrow(/nope/u);
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "maybe", exitCode: "0", summary: "x" }, NOW),
    ).rejects.toThrow(/--result/u);
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "abc", summary: "x" }, NOW),
    ).rejects.toThrow(/--exit-code/u);
    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "0", summary: " " }, NOW),
    ).rejects.toThrow(/--summary/u);
  });

  it("lets the save guard reject a digest that no longer matches the inputs", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(
      appendEvidenceFlagsWorkflow(
        root,
        { check: "check", result: "pass", exitCode: "0", summary: "x", digest: "0".repeat(64) },
        NOW,
      ),
    ).rejects.toThrow(/digest does not match/u);
  });

  it("requires an active task", async () => {
    const root = await temporaryRepository();
    const { initializeUtcProject } = await import("test/support/workflow-fixtures.js");
    await initializeUtcProject(root);

    await expect(
      appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "0", summary: "x" }, NOW),
    ).rejects.toThrow(/active task/u);
  });
});
