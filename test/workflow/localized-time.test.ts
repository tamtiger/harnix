import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  appendEvidenceWorkflow,
  finishWorkflow,
  inspectWorkflow,
  preflightWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
} from "../../src/commands/internal-workflow.js";
import { initializeProject } from "../../src/commands/init.js";
import { inspectProjectStatus } from "../../src/commands/status.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { saveTask } from "../../src/core/tasks/task.js";
import type { TaskRecordV1, TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-time-");
const VN = "Asia/Ho_Chi_Minh";
const taskId = "20260929-090000-clock";
const createdAt = "2026-09-29T09:00:00.000+07:00";

async function project(timezone = VN): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  const configPath = join(root, ".harnix", "config.yaml");
  await writeConfig(configPath, { ...(await readConfig(configPath)), timezone });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  return root;
}

function taskV3(overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: taskId,
    title: "Clock",
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    goal: "Goal",
    nonGoals: [],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test", criterionIds: ["ac-one"], inputs: ["src/**"] }],
    evidence: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

/** Drives a task to verifying/finishing so `finishWorkflow` can journal it. */
async function finishingProject(): Promise<string> {
  const root = await project();
  await saveWorkflow(root, { task: taskV3() });
  for (const [status, checkpoint] of [["ready", "ready"], ["in_progress", "implementing"], ["verifying", "verifying"]] as const) await transitionWorkflow(root, status, checkpoint, "2026-09-29T09:05:00.000+07:00");
  const snapshot = await snapshotWorkflow(root, "check");
  await appendEvidenceWorkflow(root, { evidence: { id: "ev", checkId: "check", recordedAt: "2026-09-29T09:10:00.000+07:00", result: "pass", exitCode: 0, summary: "ok", artifactPaths: [], inputDigest: snapshot.inputDigest } }, "2026-09-29T09:10:00.000+07:00");
  await transitionWorkflow(root, "verifying", "finishing", "2026-09-29T09:11:00.000+07:00");
  const active = (await inspectWorkflow(root)).activeTask!;
  await saveWorkflow(root, { task: { ...active, acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev"] }], updatedAt: "2026-09-29T09:12:00.000+07:00" } });
  return root;
}

async function journalFiles(root: string): Promise<string[]> {
  return (await readdir(join(root, ".harnix", "workspace", "tam", "journal"))).sort();
}

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []));
  return nested.flat();
}

describe("configured time zone", () => {
  it("stamps command-generated timestamps with the configured offset when no clock is injected", async () => {
    const root = await project();
    await saveWorkflow(root, { task: taskV3() });

    const moved = await transitionWorkflow(root, "ready", "ready");

    expect(moved.updatedAt).toMatch(/\+07:00$/u);
    expect(Math.abs(Date.parse(moved.updatedAt) - Date.now())).toBeLessThan(60_000);
  });

  it("follows a non-Vietnam zone from config", async () => {
    const root = await project("America/New_York");
    await saveWorkflow(root, { task: taskV3() });

    const moved = await transitionWorkflow(root, "ready", "ready");

    expect(moved.updatedAt).toMatch(/-0[45]:00$/u);
  });

  it("partitions the journal by local date around Vietnam midnight, including UTC-form clocks", async () => {
    const before = await finishingProject();
    await finishWorkflow(before, "2026-09-29T23:59:30.000+07:00");
    const after = await finishingProject();
    await finishWorkflow(after, "2026-09-29T17:30:00.000Z");

    expect(await journalFiles(before)).toEqual(["2026-09-29.jsonl"]);
    expect(await journalFiles(after)).toEqual(["2026-09-30.jsonl"]);
  });

  it("exposes the authoritative clock and ID prefix in preflight", async () => {
    const root = await project();

    const preflight = await preflightWorkflow(root, Date.parse("2026-09-28T17:00:00.000Z"));

    expect(preflight.clock).toEqual({ timezone: VN, now: "2026-09-29T00:00:00.000+07:00", idPrefix: "20260929-000000" });
  });

  it("renders review.md and the epic page in the configured zone, including legacy Z data", async () => {
    const root = await project();
    const legacy = taskV3({ createdAt: "2026-09-28T13:58:01.000Z", updatedAt: "2026-09-28T13:58:01.000Z", epicId: "epic-one" });
    const epic = { generator: "harnix" as const, schemaVersion: 1 as const, id: "epic-one", title: "Epic", goal: "Goal", createdAt: "2026-09-28T13:58:01.000Z", updatedAt: "2026-09-28T13:58:01.000Z" };

    await saveWorkflow(root, { task: legacy, epic });

    const review = await readFile(join(root, ".harnix", "tasks", taskId, "review.md"), "utf8");
    const page = await readFile(join(root, ".harnix", "roadmaps", "epic-one.md"), "utf8");
    expect(review).toContain("**Created:** 2026-09-28 20:58:01 +07:00");
    expect(review).toContain("**Updated:** 2026-09-28 20:58:01 +07:00");
    expect(page).toContain("**Cập nhật:** 2026-09-28 20:58:01 +07:00");
  });

  it("leaves historical task records byte-for-byte untouched while reading them", async () => {
    const root = await project();
    const legacy: TaskRecordV1 = {
      generator: "harnix", schemaVersion: 1, id: "20260813-120000-old", title: "Old", mode: "lite", status: "completed", checkpoint: "finishing", goal: "g", nonGoals: [],
      acceptanceCriteria: [{ id: "a", text: "t", status: "waived", evidenceIds: [], waiverReason: "old" }], relevantPaths: [], relevantSpecs: [], validationPlan: [], evidence: [],
      createdAt: "2026-08-13T00:00:00.000Z", updatedAt: "2026-08-13T00:00:00.000Z", completedAt: "2026-08-13T00:00:00.000Z",
    };
    await saveTask(join(root, ".harnix"), legacy);
    const path = join(root, ".harnix", "tasks", legacy.id, "task.json");
    const before = await readFile(path, "utf8");

    await inspectProjectStatus(root);
    await preflightWorkflow(root);

    expect(await readFile(path, "utf8")).toBe(before);
    expect(before).toContain("2026-08-13T00:00:00.000Z");
  });

  it("keeps timestamp formatting in the single clock module", async () => {
    const offenders: string[] = [];
    for (const file of await sourceFiles(join(process.cwd(), "src"))) {
      if (file.endsWith(join("utils", "clock.ts"))) continue;
      if ((await readFile(file, "utf8")).includes("toISOString(")) offenders.push(file.slice(process.cwd().length + 1));
    }

    expect(offenders).toEqual([]);
  });
});
