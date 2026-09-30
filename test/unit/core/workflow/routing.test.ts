import { describe, expect, it } from "vitest";
import {
  implementationStrategy,
  isWithinRequestedScope,
  nextWorkflowStatus,
  routeWorkflow,
  shouldReassessArchitecture,
  shouldResearch,
  validateFullReadyArtifact,
  verificationStages,
  stageOwnerFor,
} from "src/core/workflow/routing.js";
import { legalCheckpoints } from "src/core/tasks/task-schema.js";
import type { TaskRecord } from "src/core/tasks/task.js";

describe("workflow routing", () => {
  it("routes action, work kind, risk, and active state deterministically", () => {
    expect(routeWorkflow({ action: "review", workKind: "refactor", mutation: "none", riskSignals: [] })).toMatchObject({
      entry: "bypass",
      owner: "harnix-review",
      reasonCodes: ["standalone-review"],
    });
    expect(
      routeWorkflow({
        action: "research",
        workKind: "dependency",
        mutation: "none",
        riskSignals: ["material-unknown"],
      }),
    ).toMatchObject({ entry: "bypass", owner: "harnix-research", reasonCodes: ["standalone-research"] });
    expect(
      routeWorkflow({ action: "change", workKind: "feature", mutation: "project", riskSignals: [] }),
    ).toMatchObject({ entry: "create", mode: "lite", owner: "harnix-plan", reasonCodes: ["low-risk-lite"] });
    expect(
      routeWorkflow({ action: "change", workKind: "hotfix", mutation: "project", riskSignals: ["security-sensitive"] }),
    ).toMatchObject({ entry: "create", mode: "full", reasonCodes: ["risk-full"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "bugfix",
        mutation: "project",
        riskSignals: [],
        activeTask: { mode: "lite", status: "ready", checkpoint: "ready" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-implement", reasonCodes: ["active-ready-authorized"] });
    expect(
      routeWorkflow({
        action: "plan",
        workKind: "refactor",
        mutation: "task-artifact",
        riskSignals: [],
        activeTask: { mode: "full", status: "ready", checkpoint: "ready" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-plan", reasonCodes: ["active-replan"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "refactor",
        mutation: "project",
        riskSignals: [],
        activeTask: { mode: "full", status: "completed", checkpoint: "finishing" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-verify", reasonCodes: ["completed-active"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "refactor",
        mutation: "project",
        riskSignals: [],
        activeTask: { mode: "full", status: "cancelled", checkpoint: "cancelling" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-verify", reasonCodes: ["cancelled-active"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "feature",
        mutation: "project",
        riskSignals: [],
        activeTask: {
          mode: "lite",
          status: "blocked",
          checkpoint: "implementing",
          blocker: { kind: "decision", summary: "need decision", nextAction: "decide", resumeStatus: "ready" },
        },
      }),
    ).toMatchObject({ entry: "fail-closed", reasonCodes: ["invalid-active-state"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "feature",
        mutation: "project",
        riskSignals: [],
        activeTask: {
          mode: "full",
          status: "blocked",
          checkpoint: "replan",
          blocker: { kind: "decision", summary: "need decision", nextAction: "decide", resumeStatus: "verifying" },
        },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-plan", reasonCodes: ["active-stage"] });
  });

  it("bypasses a docs-only or literal-value-only edit unless it forces tracked risk, and leaves an active task unchanged", () => {
    expect(routeWorkflow({ action: "change", workKind: "docs", mutation: "docs-only", riskSignals: [] })).toMatchObject(
      { entry: "bypass", reasonCodes: ["docs-only-bypass"] },
    );
    expect(
      routeWorkflow({ action: "change", workKind: "maintenance", mutation: "literal-value", riskSignals: [] }),
    ).toMatchObject({ entry: "bypass", reasonCodes: ["literal-value-bypass"] });
    expect(
      routeWorkflow({ action: "change", workKind: "docs", mutation: "docs-only", riskSignals: ["contract-change"] }),
    ).toMatchObject({ entry: "create", mode: "full", reasonCodes: ["risk-full"] });
    expect(
      routeWorkflow({ action: "change", workKind: "docs", mutation: "docs-only", riskSignals: ["material-unknown"] }),
    ).toMatchObject({ entry: "create", mode: "full" });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "maintenance",
        mutation: "literal-value",
        riskSignals: [],
        activeTask: { mode: "full", status: "in_progress", checkpoint: "implementing" },
      }),
    ).toMatchObject({ entry: "bypass", reasonCodes: ["literal-value-bypass"] });
  });

  it("keeps explicit mode precedence while diagnosing forced Lite risk conflicts", () => {
    expect(
      routeWorkflow({
        action: "change",
        workKind: "security",
        mutation: "project",
        explicitMode: "lite",
        riskSignals: ["security-sensitive"],
      }),
    ).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite", "explicit-lite-risk-conflict"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "feature",
        mutation: "project",
        explicitMode: "lite",
        riskSignals: ["contract-change"],
      }),
    ).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite", "explicit-lite-risk-conflict"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "feature",
        mutation: "project",
        explicitMode: "lite",
        riskSignals: [],
      }),
    ).toMatchObject({ mode: "lite", reasonCodes: ["explicit-lite"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "feature",
        mutation: "project",
        explicitMode: "full",
        riskSignals: [],
      }),
    ).toMatchObject({ mode: "full", reasonCodes: ["explicit-full"] });
  });

  it("honors the latest read-only intent before an unrelated active task", () => {
    const activeTask = { mode: "full" as const, status: "in_progress" as const, checkpoint: "implementing" as const };

    expect(
      routeWorkflow({ action: "inspect", workKind: "docs", mutation: "none", riskSignals: [], activeTask }),
    ).toEqual({
      entry: "bypass",
      reasonCodes: ["read-only"],
    });
    expect(
      routeWorkflow({ action: "review", workKind: "refactor", mutation: "none", riskSignals: [], activeTask }),
    ).toEqual({
      entry: "bypass",
      owner: "harnix-review",
      reasonCodes: ["standalone-review"],
    });
    expect(
      routeWorkflow({
        action: "research",
        workKind: "dependency",
        mutation: "none",
        riskSignals: ["material-unknown"],
        activeTask,
      }),
    ).toEqual({
      entry: "bypass",
      owner: "harnix-research",
      reasonCodes: ["standalone-research"],
    });
    expect(
      routeWorkflow({ action: "verify", workKind: "test", mutation: "none", riskSignals: [], activeTask }),
    ).toMatchObject({
      entry: "resume",
      owner: "harnix-implement",
      reasonCodes: ["active-stage"],
    });
  });

  it("researches only material unknowns and reassesses after three failed hypotheses", () => {
    expect(shouldResearch(false)).toBe(false);
    expect(shouldResearch(true)).toBe(true);
    expect(shouldReassessArchitecture(2)).toBe(false);
    expect(shouldReassessArchitecture(3)).toBe(true);
  });

  it("uses TDD for behavior and records exceptions for non-behavior work", () => {
    expect(implementationStrategy("behavior")).toBe("red-green-refactor");
    expect(() => implementationStrategy("docs")).toThrow("exception");
    expect(implementationStrategy("docs", "copy edit", "spellcheck")).toBe("documented-exception");
  });

  it("holds plan-only work at ready and requires complete Full planning artifacts", () => {
    expect(nextWorkflowStatus("plan", true)).toBe("ready");
    expect(nextWorkflowStatus("implement", true)).toBe("in_progress");
    expect(nextWorkflowStatus("fix", false)).toBe("planning");
    expect(
      validateFullReadyArtifact({ acceptanceCriteria: ["a"], materialUnknownDecision: "not needed", plan: "step" }),
    ).toBe(true);
    expect(validateFullReadyArtifact({ acceptanceCriteria: [], materialUnknownDecision: "x", plan: "x" })).toBe(false);
  });

  it("runs compliance before quality/security and rejects scope creep", () => {
    expect(verificationStages()).toEqual(["compliance", "quality-security"]);
    expect(isWithinRequestedScope(["workflow"], ["workflow"])).toBe(true);
    expect(isWithinRequestedScope(["workflow"], ["workflow", "new-framework"])).toBe(false);
  });

  describe("stage owner coverage matrix", () => {
    type State = Pick<TaskRecord, "status" | "checkpoint" | "blocker">;
    const resumable = ["planning", "ready", "in_progress", "verifying"] as const;
    const states: State[] = [
      ...resumable.flatMap((status) => legalCheckpoints[status].map((checkpoint) => ({ status, checkpoint }))),
      ...resumable.flatMap((resumeStatus) =>
        legalCheckpoints[resumeStatus].map((checkpoint) => ({
          status: "blocked" as const,
          checkpoint,
          blocker: { kind: "decision" as const, summary: "wait", nextAction: "decide", resumeStatus },
        })),
      ),
      { status: "completed", checkpoint: "finishing" },
      { status: "cancelled", checkpoint: "cancelling" },
    ];

    it("gives every legal status and checkpoint exactly one task-stage skill (review and research own no task state)", () => {
      const owners = new Set(["harnix-plan", "harnix-implement", "harnix-verify", "harnix-debug"]);

      expect(states.length).toBeGreaterThan(20);
      for (const state of states) {
        const owner = stageOwnerFor(state);
        expect(owner, JSON.stringify(state)).toBeDefined();
        expect(owners.has(owner as string), JSON.stringify(state)).toBe(true);
      }
    });

    it("maps the documented stages to their owner", () => {
      const owner = (
        status: TaskRecord["status"],
        checkpoint: TaskRecord["checkpoint"],
        resume?: "planning" | "ready" | "in_progress" | "verifying",
      ) =>
        stageOwnerFor({
          status,
          checkpoint,
          ...(resume === undefined
            ? {}
            : { blocker: { kind: "decision", summary: "s", nextAction: "n", resumeStatus: resume } }),
        });

      expect(owner("planning", "planning")).toBe("harnix-plan");
      expect(owner("in_progress", "replan")).toBe("harnix-plan");
      expect(owner("verifying", "replan")).toBe("harnix-plan");
      expect(owner("ready", "ready")).toBe("harnix-implement");
      expect(owner("in_progress", "implementing")).toBe("harnix-implement");
      expect(owner("in_progress", "debugging")).toBe("harnix-debug");
      expect(owner("verifying", "debugging")).toBe("harnix-debug");
      expect(owner("verifying", "verifying")).toBe("harnix-verify");
      expect(owner("verifying", "finishing")).toBe("harnix-verify");
      expect(owner("completed", "finishing")).toBe("harnix-verify");
      expect(owner("cancelled", "cancelling")).toBe("harnix-verify");
      expect(owner("blocked", "implementing", "in_progress")).toBe("harnix-implement");
      expect(owner("blocked", "planning", "planning")).toBe("harnix-plan");
    });

    it("returns nothing for a state that is not legal", () => {
      expect(stageOwnerFor({ status: "planning", checkpoint: "finishing" })).toBeUndefined();
      expect(stageOwnerFor({ status: "blocked", checkpoint: "planning" })).toBeUndefined();
    });
  });
});
