import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createCheckFailureFinding, inspectRequiredChecks } from "../../src/core/verification/check-report.js";
import { computeInputDigest } from "../../src/core/verification/input-digest.js";
import type { TaskRecordV1, TaskRecordV2, TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-check-report-");
const now = Date.parse("2026-08-26T01:00:00.000Z");

describe("required check report", () => {
  it("classifies base evidence states; legacy v1 passes cannot be re-proven and report legacy-schema", async () => {
    const reports = await inspectRequiredChecks("unused", "unused", v1Task(), now);

    expect(reports.map(({ id, state, reasonCodes }) => ({ id, state, reasonCodes }))).toEqual([
      { id: "pending", state: "pending", reasonCodes: ["no-evidence"] },
      { id: "tie", state: "failed", reasonCodes: ["latest-failed"] },
      { id: "future", state: "stale", reasonCodes: ["evidence-expired"] },
      { id: "expired", state: "stale", reasonCodes: ["legacy-schema"] },
      { id: "passed", state: "stale", reasonCodes: ["legacy-schema"] },
      { id: "skipped", state: "pending", reasonCodes: ["latest-skipped"] },
    ]);
  });

  it("reports a legacy v2 pass as stale until the task migrates", async () => {
    const task: TaskRecordV2 = {
      ...(v3Task() as unknown as TaskRecordV2),
      schemaVersion: 2,
      validationPlan: [{ id: "gate", description: "private", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract", "src/*.ts"] }],
      evidence: [{ id: "pass", checkId: "gate", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", exitCode: 0, summary: "private", artifactPaths: [], inputDigest: "a".repeat(64) }],
    };

    expect((await inspectRequiredChecks("unused", "unused", task, now))[0]).toMatchObject({ state: "stale", reasonCodes: ["legacy-schema"], changes: [] });
  });

  it("recomputes the inline v3 digest: current, changed input, missing input, mismatched digest, future evidence", async () => {
    const root = await temporaryRepository();
    const base = v3Task();
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "a1\n");
    await writeFile(join(root, "src", "b.ts"), "b1\n");
    const digest = (await computeInputDigest(root, base, "gate")).inputDigest;
    const task: TaskRecordV3 = { ...base, evidence: [{ id: "pass", checkId: "gate", recordedAt: "2026-08-20T00:00:00.000Z", result: "pass", exitCode: 0, summary: "private", artifactPaths: [], inputDigest: digest }] };
    const inspect = async (candidate: TaskRecordV3) => (await inspectRequiredChecks(root, join(root, ".harnix"), candidate, now))[0]!;

    expect(await inspect(task)).toMatchObject({ state: "passed", reasonCodes: [], changes: [] });

    const future: TaskRecordV3 = { ...task, evidence: [{ ...task.evidence[0]!, recordedAt: "2026-08-26T01:00:01.000Z" }] };
    expect(await inspect(future)).toMatchObject({ state: "stale", reasonCodes: ["evidence-expired"] });

    const futureThenValid: TaskRecordV3 = {
      ...task,
      evidence: [
        { ...task.evidence[0]!, id: "gate-future", recordedAt: "2026-08-26T01:00:01.000Z" },
        { ...task.evidence[0]!, id: "gate-valid", recordedAt: "2026-08-26T00:59:00.000Z" },
      ],
    };
    expect(await inspect(futureThenValid)).toMatchObject({ state: "passed", reasonCodes: [] });

    const mismatch: TaskRecordV3 = { ...task, evidence: [{ ...task.evidence[0]!, inputDigest: "0".repeat(64) }] };
    expect(await inspect(mismatch)).toMatchObject({ state: "stale", reasonCodes: ["digest-mismatch"] });

    await writeFile(join(root, "src", "a.ts"), "a2\n");
    expect(await inspect(task)).toMatchObject({ state: "stale", reasonCodes: ["digest-mismatch"] });
    await writeFile(join(root, "src", "a.ts"), "a1\n");

    const contractChanged: TaskRecordV3 = { ...task, acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, text: "changed contract" }] };
    expect(await inspect(contractChanged)).toMatchObject({ state: "stale", reasonCodes: ["digest-mismatch"] });

    await rm(join(root, "src"), { recursive: true });
    expect(await inspect(task)).toMatchObject({ state: "stale", reasonCodes: ["inputs-unavailable"] });
    expect(await inspect(base)).toMatchObject({ state: "pending", reasonCodes: ["no-evidence"] });
  });

  it("forwards structured findings from evidence to inspection results", async () => {
    const finding1 = createCheckFailureFinding("err-1", "Test suite failed with exit code 1", "critical");
    const finding2 = createCheckFailureFinding("warn-1", "Deprecated API usage", "low");

    expect(finding1).toEqual({ id: "err-1", text: "Test suite failed with exit code 1", severity: "critical" });
    expect(finding2).toEqual({ id: "warn-1", text: "Deprecated API usage", severity: "low" });

    const taskWithFindings: TaskRecordV3 = {
      ...v3Task(),
      evidence: [
        {
          id: "ev-failed",
          checkId: "gate",
          recordedAt: "2026-08-26T00:59:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "Check gate failed",
          artifactPaths: [],
          inputDigest: "0".repeat(64),
          findings: [finding1, finding2],
        },
      ],
    };

    const reports = await inspectRequiredChecks("unused", "unused", taskWithFindings, now);

    expect(reports[0]).toMatchObject({
      id: "gate",
      state: "failed",
      reasonCodes: ["latest-failed"],
      findings: [finding1, finding2],
    });
  });
});

function v1Task(): TaskRecordV1 {
  const checks = ["pending", "tie", "future", "expired", "passed", "skipped"].map((id) => ({ id, description: "private", scope: "focused" as const, required: true }));
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260826-162100-unit-checks-v1",
    title: "private",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: checks,
    evidence: [
      { id: "tie-pass", checkId: "tie", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", summary: "private", artifactPaths: [] },
      { id: "tie-fail", checkId: "tie", recordedAt: "2026-08-26T00:59:00.000Z", result: "fail", summary: "private", artifactPaths: [] },
      { id: "future", checkId: "future", recordedAt: "2026-08-26T01:01:00.000Z", result: "pass", summary: "private", artifactPaths: [] },
      { id: "expired", checkId: "expired", recordedAt: "2026-08-25T22:00:00.000Z", result: "pass", summary: "private", artifactPaths: [] },
      { id: "passed", checkId: "passed", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", summary: "private", artifactPaths: [] },
      { id: "skipped", checkId: "skipped", recordedAt: "2026-08-26T00:59:00.000Z", result: "skipped", summary: "private", artifactPaths: [] },
    ],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-26T00:59:00.000Z",
  };
}

function v3Task(): TaskRecordV3 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: "20260826-162102-unit-checks-v3",
    title: "private",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: ["src/a.ts", "src/b.ts"],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "private", scope: "focused", required: true, command: "pnpm test", criterionIds: ["criterion"], inputs: ["src/*.ts"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
