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
} from "src/core/workflow/routing.js";

describe("workflow routing", () => {
  it("routes action, work kind, risk, and active state deterministically", () => {
    expect(routeWorkflow({ action: "review", workKind: "refactor", mutation: "none", riskSignals: [] })).toMatchObject({
      entry: "bypass",
      owner: "harnix-check",
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
    ).toMatchObject({ entry: "create", mode: "lite", owner: "harnix-brainstorm", reasonCodes: ["low-risk-lite"] });
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
    ).toMatchObject({ entry: "resume", owner: "harnix-brainstorm", reasonCodes: ["active-replan"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "refactor",
        mutation: "project",
        riskSignals: [],
        activeTask: { mode: "full", status: "completed", checkpoint: "finishing" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-continue", reasonCodes: ["completed-active"] });
    expect(
      routeWorkflow({
        action: "change",
        workKind: "refactor",
        mutation: "project",
        riskSignals: [],
        activeTask: { mode: "full", status: "cancelled", checkpoint: "cancelling" },
      }),
    ).toMatchObject({ entry: "resume", owner: "harnix-continue", reasonCodes: ["cancelled-active"] });
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
    ).toMatchObject({ entry: "resume", owner: "harnix-continue", reasonCodes: ["active-stage"] });
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
      owner: "harnix-check",
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
});
