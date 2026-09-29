import type { TaskRecord, ValidationCheckV2 } from "src/core/tasks/task.js";
import { buildCheck } from "./builders.js";

/**
 * Legacy-shaped fixtures for the task state, store and validation specs. New specs should build
 * records with `builders.ts`; these keep the historical v1/v2 shapes (and their fixed timestamps)
 * that those specs assert against.
 */
export const timestamp = "2026-08-13T00:00:00.000Z";
export const laterTimestamp = "2026-08-13T00:01:00.000Z";

export function taskFixture(): TaskRecord {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260807-120000-x",
    title: "x",
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    goal: "x",
    nonGoals: [],
    acceptanceCriteria: [{ id: "a", text: "x", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function taskV2Fixture() {
  return {
    ...taskFixture(),
    schemaVersion: 2 as const,
    acceptanceCriteria: [{ id: "a", text: "x", status: "pending" as const, evidenceIds: [] }],
    validationPlan: [
      {
        id: "check",
        description: "Run unit tests",
        command: "pnpm test",
        scope: "focused" as const,
        required: true,
        criterionIds: ["a"],
        inputs: ["@task-contract", "src/**/*.ts"],
      },
    ],
  };
}

/** A v2/v3 check without a `command`, i.e. one the validator does not treat as a behavioral check. */
export function buildCommandlessCheck(overrides: Partial<ValidationCheckV2> = {}): ValidationCheckV2 {
  const check = buildCheck(overrides);
  return {
    id: check.id,
    description: check.description,
    scope: check.scope,
    required: check.required,
    criterionIds: check.criterionIds,
    inputs: check.inputs,
  };
}
