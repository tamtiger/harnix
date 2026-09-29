import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  appendEvidenceWorkflow,
  finishWorkflow,
  inspectWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
} from "src/commands/internal-workflow.js";
import type { JournalEntry } from "src/core/journal/journal.js";
import type { LearningCandidate } from "src/core/journal/learning.js";
import { at, buildTaskV3 } from "test/support/builders.js";

export function buildLearningCandidate(overrides: Partial<LearningCandidate> = {}): LearningCandidate {
  return {
    id: "obs-0000000000000001",
    statement: "Keep the fixed clock in tests",
    sourceTaskIds: ["20260929-090000-one", "20260929-090100-two"],
    evidenceIds: ["ev-one", "ev-two"],
    occurrences: 2,
    confidence: 0.8,
    status: "candidate",
    ...overrides,
  };
}

/** A learning journal entry whose recordedAt/id default to something unique per candidate. */
export function buildLearningEntry(
  candidate: Partial<LearningCandidate> = {},
  overrides: Partial<JournalEntry> = {},
): JournalEntry {
  const learning = buildLearningCandidate(candidate);
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: `${learning.id}-entry`,
    recordedAt: at(0),
    developer: "tam",
    kind: "learning",
    summary: `Learning ${learning.status}: ${learning.id}`,
    evidenceIds: learning.evidenceIds,
    learning,
    ...overrides,
  };
}

export async function writeJournalFile(directory: string, name: string, lines: readonly unknown[]): Promise<void> {
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, name),
    `${lines.map((line) => (typeof line === "string" ? line : JSON.stringify(line))).join("\n")}\n`,
  );
}

/** Drives a Lite task through the whole workflow to `completed`, so `finishWorkflow` captures its learning. */
export async function completeTaskWithDecisions(
  root: string,
  input: { id: string; minute: number; decisions?: readonly string[]; evidenceId?: string },
): Promise<void> {
  const decisions = (input.decisions ?? []).map((text, index) => ({
    id: `d${index + 1}`,
    text,
    rationale: "Recorded during the task.",
  }));
  const at2 = (offset: number): string => at(input.minute + offset);
  await saveWorkflow(root, { task: buildTaskV3({ id: input.id, createdAt: at2(0), updatedAt: at2(0), decisions }) });
  await transitionWorkflow(root, "ready", "ready", at2(1));
  await transitionWorkflow(root, "in_progress", "implementing", at2(2));
  await transitionWorkflow(root, "verifying", "verifying", at2(3));
  const snapshot = await snapshotWorkflow(root, "check");
  const evidenceId = input.evidenceId ?? `ev-${input.id}`;
  await appendEvidenceWorkflow(
    root,
    {
      evidence: {
        id: evidenceId,
        checkId: "check",
        recordedAt: at2(4),
        result: "pass",
        exitCode: 0,
        summary: "pnpm test passed",
        artifactPaths: [],
        inputDigest: snapshot.inputDigest,
      },
    },
    at2(4),
  );
  await transitionWorkflow(root, "verifying", "finishing", at2(5));
  const active = (await inspectWorkflow(root)).activeTask!;
  await saveWorkflow(root, {
    task: {
      ...active,
      acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: [evidenceId] }],
      updatedAt: at2(6),
    },
  });
  await finishWorkflow(root, at2(7));
}
