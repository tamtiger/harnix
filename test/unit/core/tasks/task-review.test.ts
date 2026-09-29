import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveTask, saveTaskWithArtifacts } from "src/core/tasks/task.js";
import { formatDisplay, systemTimezone } from "src/utils/clock.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { buildCheck, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { laterTimestamp, timestamp } from "test/support/tasks-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("task review page", () => {
  it("should_generate_a_plain_review_markdown_file_alongside_task_json_for_direct_review", async () => {
    const root = await temporaryRepository();
    const base = buildTaskV3({
      id: "20260916-220000-review-md",
      title: "Chan brute-force o endpoint login",
      mode: "full",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "Chan brute-force login bang rate limit.",
      nonGoals: ["Khong doi session/token hien tai."],
      acceptanceCriteria: [
        buildCriterion({ id: "ac-a", text: "Lan thu thu 6 bi chan.", status: "met", evidenceIds: ["e1"] }),
        buildCriterion({ id: "ac-b", text: "Reset counter khi thanh cong." }),
      ],
      relevantPaths: ["src/auth/rate-limit.ts"],
      decisions: [{ id: "d1", text: "Dung in-memory counter.", rationale: "Chua co multi-instance deployment." }],
      residualRisks: [{ id: "r1", text: "Khong chia se giua nhieu instance.", severity: "medium" }],
      validationPlan: [
        buildCheck({
          description: "Run tests",
          scope: "full",
          criterionIds: ["ac-a", "ac-b"],
          inputs: ["src/**/*.ts"],
        }),
        buildCheck({
          id: "release-gate",
          description: "Run release gate",
          command: "pnpm test:acceptance",
          scope: "full",
          criterionIds: ["ac-a"],
          inputs: ["src/**/*.ts"],
        }),
      ],
      evidence: [buildEvidence({ id: "e1", recordedAt: timestamp, summary: "GREEN" })],
      createdAt: timestamp,
      updatedAt: "2026-09-16T23:50:00.000Z",
    });

    await saveTask(root, base);
    const reviewPath = join(root, "tasks", base.id, "review.md");
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain(base.title);
    expect(review).toContain("in_progress");
    expect(review).toContain(base.goal);
    expect(review).toContain("Khong doi session/token hien tai.");
    expect(review).toContain("ac-a");
    expect(review).toContain("met");
    expect(review).toContain("ac-b");
    expect(review).toContain("pending");
    // No config under this bare root, so the review falls back to the system zone.
    expect(review).toContain(formatDisplay(timestamp, systemTimezone()));
    expect(review).toContain(formatDisplay("2026-09-16T23:50:00.000Z", systemTimezone()));
    expect(review).toContain("Required checks");
    expect(review).toContain("`check`");
    expect(review).toContain("`release-gate`");
    expect(review).toContain("GREEN");
    expect(review).toMatch(/release-gate[^\n]*chưa chạy|release-gate[^\n]*not yet run/u);
    expect(review).toContain("Dung in-memory counter.");
    expect(review).toContain("Chua co multi-instance deployment.");
    expect(review).toContain("Khong chia se giua nhieu instance.");
    expect(review).toContain("medium");
    expect(review).toContain("GREEN");
    expect(review).not.toContain(root);
    expect(review.startsWith("{")).toBe(false);
  });

  it("should_list_only_the_planning_artifacts_that_actually_exist_on_disk", async () => {
    const root = await temporaryRepository();
    const fullTask = buildTaskV3({
      id: "20260916-234500-review-artifacts-full",
      title: "Full task with prd and plan",
      mode: "full",
      goal: "g",
      acceptanceCriteria: [],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTaskWithArtifacts(root, fullTask, { prd: "# prd", plan: "# plan" });
    const fullReview = await readFile(join(root, "tasks", fullTask.id, "review.md"), "utf8");

    expect(fullReview).toContain("prd.md");
    expect(fullReview).toContain("plan.md");
    expect(fullReview).not.toContain("design.md");

    const liteTask = {
      ...fullTask,
      id: "20260916-234500-review-artifacts-lite",
      mode: "lite" as const,
      title: "Lite task",
    };
    await saveTask(root, liteTask);
    const liteReview = await readFile(join(root, "tasks", liteTask.id, "review.md"), "utf8");

    expect(liteReview).not.toContain("prd.md");
    expect(liteReview).not.toContain("plan.md");
    expect(liteReview).not.toContain("## Artifacts");
  });

  it("should_omit_decisions_and_residual_risk_sections_when_absent_and_regenerate_on_every_save", async () => {
    const root = await temporaryRepository();
    const minimal = buildTaskV3({
      id: "20260916-220100-review-md-minimal",
      title: "Minimal task",
      goal: "g",
      acceptanceCriteria: [],
      validationPlan: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await saveTask(root, minimal);
    const reviewPath = join(root, "tasks", minimal.id, "review.md");
    const first = await readFile(reviewPath, "utf8");

    expect(first).not.toContain("Decisions");
    expect(first).not.toContain("Residual");

    const updated = {
      ...minimal,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-09-16T22:02:00.000Z",
    };
    await saveTask(root, updated);
    const second = await readFile(reviewPath, "utf8");

    expect(second).toContain("ready");
    expect(second).not.toBe(first);
  });

  it("should_show_a_verdict_line_right_after_the_header_summarizing_overall_task_state", async () => {
    const root = await temporaryRepository();
    const pending = buildTaskV3({
      id: "20260924-150000-verdict-pending",
      title: "Verdict pending case",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "g",
      acceptanceCriteria: [
        buildCriterion({ id: "a", text: "x", status: "met", evidenceIds: ["e1"] }),
        buildCriterion({ id: "b", text: "y" }),
      ],
      validationPlan: [
        buildCheck({ description: "d", scope: "full", criterionIds: ["a", "b"], inputs: ["src/**/*.ts"] }),
      ],
      evidence: [buildEvidence({ id: "e1", recordedAt: timestamp, summary: "s" })],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(root, pending);
    const pendingReview = await readFile(join(root, "tasks", pending.id, "review.md"), "utf8");
    const headerEnd = pendingReview.indexOf("## Goal");
    const verdictLine = pendingReview.slice(0, headerEnd);
    expect(verdictLine).toMatch(/Verdict.*PENDING.*1\/2/iu);

    const completed = {
      ...pending,
      id: "20260924-150000-verdict-pass",
      status: "completed" as const,
      checkpoint: "finishing" as const,
      acceptanceCriteria: [
        { id: "a", text: "x", status: "met" as const, evidenceIds: ["e1"] },
        { id: "b", text: "y", status: "met" as const, evidenceIds: ["e1"] },
      ],
      completedAt: laterTimestamp,
      updatedAt: laterTimestamp,
    };
    await saveTask(root, completed);
    const completedReview = await readFile(join(root, "tasks", completed.id, "review.md"), "utf8");
    expect(completedReview.slice(0, completedReview.indexOf("## Goal"))).toMatch(/Verdict.*PASS/iu);

    const blocked = {
      ...pending,
      id: "20260924-150000-verdict-blocked",
      status: "blocked" as const,
      checkpoint: "implementing" as const,
      blocker: {
        kind: "external" as const,
        summary: "waiting on vendor",
        nextAction: "poll vendor",
        resumeStatus: "in_progress" as const,
      },
    };
    await saveTask(root, blocked);
    const blockedReview = await readFile(join(root, "tasks", blocked.id, "review.md"), "utf8");
    expect(blockedReview.slice(0, blockedReview.indexOf("## Goal"))).toMatch(/Verdict.*BLOCKED.*external/iu);

    const cancelled = {
      ...pending,
      id: "20260924-150000-verdict-cancelled",
      status: "cancelled" as const,
      checkpoint: "cancelling" as const,
      cancellation: { reason: "no longer needed", authorizedBy: "user" as const },
      cancelledAt: laterTimestamp,
      updatedAt: laterTimestamp,
    };
    await saveTask(root, cancelled);
    const cancelledReview = await readFile(join(root, "tasks", cancelled.id, "review.md"), "utf8");
    expect(cancelledReview.slice(0, cancelledReview.indexOf("## Goal"))).toMatch(/Verdict.*CANCELLED/iu);
  });

  it("should_collapse_repeated_evidence_for_the_same_check_to_its_latest_entry_without_dropping_task_json_history", async () => {
    const root = await temporaryRepository();
    const task = buildTaskV3({
      id: "20260924-150100-evidence-dedupe",
      title: "Evidence dedupe case",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "g",
      acceptanceCriteria: [buildCriterion({ id: "a", text: "x" })],
      validationPlan: [buildCheck({ description: "d", scope: "full", criterionIds: ["a"], inputs: ["src/**/*.ts"] })],
      evidence: [
        buildEvidence({
          id: "e1",
          recordedAt: "2026-09-24T00:00:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "RED-1",
        }),
        buildEvidence({
          id: "e2",
          recordedAt: "2026-09-24T00:01:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "RED-2",
        }),
        buildEvidence({ id: "e3", recordedAt: "2026-09-24T00:02:00.000Z", summary: "GREEN" }),
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveTask(root, task);
    const reviewPath = join(root, "tasks", task.id, "review.md");
    const review = await readFile(reviewPath, "utf8");
    const evidenceSection = review.slice(review.indexOf("## Evidence"));

    expect(evidenceSection).toContain("GREEN");
    expect(evidenceSection).not.toContain("RED-1");
    expect(evidenceSection).not.toContain("RED-2");
    expect(evidenceSection).toMatch(/2 (earlier|previous).*(rerun|attempt)/iu);

    const persisted = JSON.parse(await readFile(join(root, "tasks", task.id, "task.json"), "utf8")) as {
      evidence: unknown[];
    };
    expect(persisted.evidence).toHaveLength(3);
  });
});
