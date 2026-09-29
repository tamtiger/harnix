import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { initializeProject } from "src/commands/init.js";
import { readConfig, writeConfig } from "src/core/config/config.js";
import type { EpicRecord } from "src/core/epics/epic.js";
import type {
  AcceptanceCriterion,
  EvidenceV2,
  TaskRecordV1,
  TaskRecordV2,
  TaskRecordV3,
  ValidationCheckV2,
} from "src/core/tasks/task.js";

/** Fixed zone and day so every test that needs a wall clock is deterministic on any machine. */
export const TEST_TIMEZONE = "Asia/Ho_Chi_Minh";
export const TEST_DAY = "2026-09-29";
export const TEST_TASK_ID = "20260929-090000-example";
export const TEST_DIGEST = "a".repeat(64);

/** ISO timestamp with the fixed offset, `minute` minutes past 09:00 (rolls over into later hours). */
export function at(minute = 0): string {
  const total = 9 * 60 + minute;
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${TEST_DAY}T${hours}:${minutes}:00.000+07:00`;
}

/** A clock that always returns the same absolute instant, for the `Date.now`-style injection points. */
export function fixedClock(iso: string = at(30)): () => number {
  const value = Date.parse(iso);
  return () => value;
}

export function buildCriterion(overrides: Partial<AcceptanceCriterion> = {}): AcceptanceCriterion {
  return { id: "ac-one", text: "One", status: "pending", evidenceIds: [], ...overrides };
}

export function buildCheck(overrides: Partial<ValidationCheckV2> = {}): ValidationCheckV2 {
  return {
    id: "check",
    description: "Unit tests",
    scope: "focused",
    required: true,
    command: "pnpm test",
    criterionIds: ["ac-one"],
    inputs: ["src/**"],
    ...overrides,
  };
}

/** A passing evidence item with the exit code and digest a v3 required check demands. */
export function buildEvidence(overrides: Partial<EvidenceV2> = {}): EvidenceV2 {
  return {
    id: "ev-check",
    checkId: "check",
    recordedAt: at(10),
    result: "pass",
    exitCode: 0,
    summary: "pnpm test passed",
    artifactPaths: [],
    inputDigest: TEST_DIGEST,
    ...overrides,
  };
}

export function buildTaskV3(overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id: TEST_TASK_ID,
    title: "Example",
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    goal: "Goal",
    nonGoals: [],
    acceptanceCriteria: [buildCriterion()],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [buildCheck()],
    evidence: [],
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides,
  };
}

/** Legacy v2 shape (declares the retired `@task-contract` input); only for compatibility tests. */
export function buildTaskV2(overrides: Partial<TaskRecordV2> = {}): TaskRecordV2 {
  return {
    ...legacyBase(),
    schemaVersion: 2,
    validationPlan: [buildCheck({ inputs: ["@task-contract", "src/**"] })],
    evidence: [],
    ...overrides,
  };
}

/** Fields shared by every schema version, without the version-specific check/evidence shapes. */
function legacyBase() {
  return {
    generator: "harnix" as const,
    id: TEST_TASK_ID,
    title: "Example",
    mode: "lite" as const,
    status: "planning" as const,
    checkpoint: "planning" as const,
    goal: "Goal",
    nonGoals: [] as string[],
    acceptanceCriteria: [buildCriterion()],
    relevantPaths: [] as string[],
    relevantSpecs: [] as string[],
    createdAt: at(0),
    updatedAt: at(0),
  };
}

/** Legacy v1 shape (checks carry no criterionIds or inputs); only for compatibility tests. */
export function buildTaskV1(overrides: Partial<TaskRecordV1> = {}): TaskRecordV1 {
  return {
    ...legacyBase(),
    schemaVersion: 1,
    validationPlan: [
      { id: "check", description: "Unit tests", scope: "focused", required: true, command: "pnpm test" },
    ],
    evidence: [],
    ...overrides,
  };
}

export function buildEpic(overrides: Partial<EpicRecord> = {}): EpicRecord {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "example-epic",
    title: "Example epic",
    goal: "Epic goal",
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides,
  };
}

/**
 * Initialized project in a disposable directory with the fixed time zone and one source file
 * (`src/a.ts`) that a `src/**` check input can match. `root` comes from `useTemporaryRepositories()`.
 */
export async function createTestProject(root: string, timezone: string = TEST_TIMEZONE): Promise<string> {
  await initializeProject({ root, developer: "tam", yes: true });
  const configPath = join(root, ".harnix", "config.yaml");
  await writeConfig(configPath, { ...(await readConfig(configPath)), timezone });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  return root;
}
