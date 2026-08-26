import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectRequiredChecks } from "../../src/core/verification/check-report.js";
import type { TaskRecordV1, TaskRecordV2 } from "../../src/core/tasks/task.js";
import { computeVerificationInputSnapshot, persistNewVerificationInputSnapshots } from "../../src/core/verification/input-freshness.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-check-report-");

describe("required check report", () => {
  it("classifies base evidence states and preserves append order for timestamp ties", async () => {
    const task = v1Task();
    const now = Date.parse("2026-08-26T01:00:00.000Z");

    const reports = await inspectRequiredChecks("unused", "unused", task, now);

    expect(reports.map(({ id, state, reasonCodes }) => ({ id, state, reasonCodes }))).toEqual([
      { id: "pending", state: "pending", reasonCodes: ["no-evidence"] },
      { id: "tie", state: "failed", reasonCodes: ["latest-failed"] },
      { id: "future", state: "stale", reasonCodes: ["evidence-expired"] },
      { id: "expired", state: "stale", reasonCodes: ["evidence-expired"] },
      { id: "passed", state: "passed", reasonCodes: [] },
      { id: "skipped", state: "pending", reasonCodes: ["latest-skipped"] },
    ]);
  });

  it("explains v2 input, contract, missing-path, and invalid-sidecar freshness", async () => {
    const root = await temporaryRepository();
    const harnixRoot = join(root, ".harnix");
    const base = v2Task();
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(harnixRoot, "tasks", base.id), { recursive: true });
    await writeFile(join(root, "src", "a.ts"), "a1\n");
    await writeFile(join(root, "src", "b.ts"), "b1\n");
    const snapshot = await computeVerificationInputSnapshot(root, base, "gate");
    const task: TaskRecordV2 = { ...base, evidence: [{ id: "pass", checkId: "gate", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", exitCode: 0, summary: "private", artifactPaths: [], inputDigest: snapshot.inputDigest }] };
    await persistNewVerificationInputSnapshots(root, harnixRoot, [], task);
    const sidecarPath = join(harnixRoot, "tasks", task.id, "verification-inputs.json");
    const validSidecar = await readFile(sidecarPath, "utf8");
    const now = Date.parse("2026-08-26T01:00:00.000Z");

    await writeFile(join(root, "src", "a.ts"), "a2\n");
    let report = (await inspectRequiredChecks(root, harnixRoot, task, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["inputs-changed"], changes: [{ path: "src/a.ts", kind: "changed" }] });

    await writeFile(join(root, "src", "a.ts"), "a1\n");
    const contractChanged: TaskRecordV2 = { ...task, acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, text: "changed contract" }] };
    report = (await inspectRequiredChecks(root, harnixRoot, contractChanged, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["task-contract-changed"], changes: [] });

    await rm(join(root, "src", "b.ts"));
    report = (await inspectRequiredChecks(root, harnixRoot, task, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["inputs-missing"], changes: [{ path: "src/b.ts", kind: "missing" }] });

    await rm(sidecarPath);
    report = (await inspectRequiredChecks(root, harnixRoot, task, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["snapshot-missing"], changes: [] });

    await writeFile(sidecarPath, validSidecar);
    const mismatch: TaskRecordV2 = { ...task, evidence: [{ ...task.evidence[0]!, inputDigest: "0".repeat(64) }] };
    report = (await inspectRequiredChecks(root, harnixRoot, mismatch, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["snapshot-mismatch"], changes: [] });

    await rm(join(root, "src", "a.ts"));
    report = (await inspectRequiredChecks(root, harnixRoot, task, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["inputs-unavailable"], changes: [] });

    await writeFile(sidecarPath, "{\"private\":\"PRIVATE_SIDECAR_CANARY\"}\n");
    report = (await inspectRequiredChecks(root, harnixRoot, task, now))[0]!;
    expect(report).toMatchObject({ state: "stale", reasonCodes: ["snapshot-invalid"], changes: [] });
    expect(JSON.stringify(report)).not.toContain("PRIVATE_SIDECAR_CANARY");
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

function v2Task(): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-162101-unit-checks-v2",
    title: "private",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: ["src/a.ts", "src/b.ts"],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "private", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract", "src/*.ts"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
