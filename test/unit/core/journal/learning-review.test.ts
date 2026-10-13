import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { captureLearningAtFinish } from "src/core/journal/learning-capture.js";
import { observationCandidateId } from "src/core/journal/learning.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { reviewLearning } from "src/core/journal/learning-review.js";
import { at, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-review-");

async function seed(status: "draft" | "candidate" | "promoted" | "rejected" | "archived", recordedAt = at(0)) {
  const root = await temporaryRepository();
  await writeJournalFile(root, "2026-09-29.jsonl", [
    buildLearningEntry({ id: "obs-a", status }, { id: "a-1", recordedAt }),
  ]);
  return root;
}

function review(root: string, action: "reject" | "promote" | "retire", now = at(10), reason?: string) {
  return reviewLearning({
    journalRoot: root,
    journalPath: join(root, "2026-09-30.jsonl"),
    developer: "tam",
    id: "obs-a",
    action,
    now,
    ...(reason === undefined ? {} : { reason }),
  });
}

describe("reviewLearning", () => {
  it.each([
    ["reject", "candidate", "rejected"],
    ["reject", "draft", "rejected"],
    ["promote", "candidate", "promoted"],
    ["promote", "draft", "promoted"],
    ["retire", "promoted", "archived"],
  ] as const)("%s moves %s to %s with a new journal entry", async (action, from, to) => {
    const root = await seed(from);

    const result = await review(root, action);
    const state = (await readLearningStates(root)).get("obs-a");

    expect(result.candidate.status).toBe(to);
    expect(state?.candidate.status).toBe(to);
    expect(state?.candidate.statement).toBe("Keep the fixed clock in tests");
  });

  it.each([
    ["promote", "promoted"],
    ["promote", "rejected"],
    ["promote", "archived"],
    ["reject", "promoted"],
    ["reject", "rejected"],
    ["retire", "candidate"],
    ["retire", "rejected"],
  ] as const)("refuses %s from %s", async (action, from) => {
    const root = await seed(from);

    await expect(review(root, action)).rejects.toThrow(/cannot|not/iu);
  });

  it("refuses a draft that has lapsed to archived by age", async () => {
    const root = await seed("draft", "2026-08-01T00:00:00.000+07:00");

    await expect(review(root, "promote", "2026-10-13T00:00:00.000+07:00")).rejects.toThrow(/lapsed/iu);
  });

  it("reports an unknown learning id", async () => {
    const root = await temporaryRepository();

    await expect(review(root, "reject")).rejects.toThrow(/does not exist/iu);
  });

  it("keeps the old entry and records a bounded reason in the summary", async () => {
    const root = await seed("candidate");

    const result = await review(root, "reject", at(10), "x".repeat(500));

    expect(result.entry.summary.length).toBeLessThanOrEqual(260);
    expect(result.entry.summary).toContain("rejected");
  });

  it("is idempotent for the same instant", async () => {
    const root = await seed("candidate");

    await review(root, "reject", at(10));

    await expect(review(root, "reject", at(10))).rejects.toThrow(/cannot/iu);
  });
});

describe("capture after a review", () => {
  it("does not resurrect a retired learning as a new draft", async () => {
    const statement = "Always inject the clock in tests";
    const id = observationCandidateId(statement);
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry({ id, statement, status: "archived" }, { id: "retired-1", recordedAt: at(0) }),
    ]);
    const task = buildTaskV3({
      id: "20260930-090000-later",
      decisions: [{ id: "d1", text: statement, rationale: "r" }],
      evidence: [buildEvidence({ id: "ev-later" })],
    });

    const created = await captureLearningAtFinish(root, join(root, "2026-09-30.jsonl"), "tam", task, at(30));

    expect(created).toBe(0);
  });
});
