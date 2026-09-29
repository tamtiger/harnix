import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { initializeProject } from "src/commands/init.js";
import { readConfig, writeConfig } from "src/core/config/config.js";
import type { TaskRecord, TaskRecordV1, TaskRecordV3 } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildCheck, buildCriterion, buildEvidence, buildTaskV1, buildTaskV3 } from "./builders.js";

/** Fixed stamp of the historical fixtures used by the workflow-persistence specs. */
export const timestamp = "2026-08-13T00:00:00.000Z";
const WORKFLOW_TASK_ID = "20260813-120000-workflow";

/** Specs that assert calendar-day behavior pin the zone instead of inheriting the machine's. */
export async function initializeUtcProject(root: string): Promise<void> {
  await initializeProject({ root, developer: "tam", yes: true });
  const configPath = join(root, ".harnix", "config.yaml");
  await writeConfig(configPath, { ...(await readConfig(configPath)), timezone: "UTC" });
}

/** Legacy v1 task (`workflow` fixture): no criterionIds or inputs on its check. */
export function legacyTask(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecordV1 {
  return buildTaskV1({
    id: WORKFLOW_TASK_ID,
    title: "workflow",
    status,
    checkpoint,
    goal: "test",
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
    validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true }],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

/** v3 counterpart of `legacyTask`: same identity, one required check over `inputs`. */
export function taskV3(
  status: TaskRecord["status"],
  checkpoint: TaskRecord["checkpoint"],
  inputs = ["src/**/*.ts"],
): TaskRecordV3 {
  return buildTaskV3({
    id: WORKFLOW_TASK_ID,
    title: "workflow",
    status,
    checkpoint,
    goal: "test",
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
    validationPlan: [
      buildCheck({
        id: "check",
        description: "Run tests",
        command: "pnpm test",
        scope: "full",
        criterionIds: ["a"],
        inputs,
      }),
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function writeProjectSource(root: string): Promise<void> {
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
}

export async function loadPersistedTask(root: string, id: string): Promise<unknown> {
  return JSON.parse(await readFile(join(root, ".harnix", "tasks", id, "task.json"), "utf8")) as unknown;
}

export function reverseObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, nested]) => [key, reverseObjectKeys(nested)]),
  );
}

/** Legacy v1 verifying/finishing task with one passing (digest-less) evidence item recorded at `evidenceAt`. */
export function routingTask(evidenceAt: string, scope: "focused" | "full" = "full"): TaskRecord {
  return buildTaskV1({
    id: "20260807-120000-task",
    title: "t",
    status: "verifying",
    checkpoint: "finishing",
    goal: "t",
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done", status: "met", evidenceIds: ["e"] })],
    validationPlan: [{ id: "check", description: "verify", scope, required: true }],
    evidence: [{ id: "e", checkId: "check", recordedAt: evidenceAt, result: "pass", summary: "ok", artifactPaths: [] }],
    createdAt: "2026-08-07T00:00:00.000Z",
    updatedAt: "2026-08-07T00:00:00.000Z",
  });
}

/** A v3 verifying/finishing task whose passing evidence carries the real digest of a file in `root`. */
export async function finishingTask(root: string, evidenceAt: string): Promise<TaskRecordV3> {
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export {};\n");
  const base = buildTaskV3({
    id: "20260807-120000-task",
    title: "t",
    status: "verifying",
    checkpoint: "finishing",
    goal: "t",
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done", status: "met", evidenceIds: ["e"] })],
    validationPlan: [
      buildCheck({ id: "check", description: "verify", command: "pnpm test", scope: "full", criterionIds: ["a"] }),
    ],
    createdAt: "2026-08-07T00:00:00.000Z",
    updatedAt: "2026-08-07T00:00:00.000Z",
  });
  const inputDigest = (await computeInputDigest(root, base, "check")).inputDigest;
  return {
    ...base,
    evidence: [buildEvidence({ id: "e", checkId: "check", recordedAt: evidenceAt, summary: "ok", inputDigest })],
  };
}
