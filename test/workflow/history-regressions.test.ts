import { describe, expect, it } from "vitest";

import { implementationStrategy, routeWorkflow, verificationStages } from "../../src/core/workflow.js";

describe("history-derived workflow regressions", () => {
  it("does not force localized work to Full because of a generic implementation verb", () => {
    expect(routeWorkflow({ action: "change", workKind: "feature", mutation: "project", riskSignals: [] })).toMatchObject({ entry: "create", mode: "lite" });
    expect(routeWorkflow({ action: "change", workKind: "refactor", mutation: "project", riskSignals: ["architecture-refactor"] })).toMatchObject({ entry: "create", mode: "full" });
  });

  it("keeps review-only read-only while review-and-fix becomes a task", () => {
    expect(routeWorkflow({ action: "review", workKind: "bugfix", mutation: "none", riskSignals: [] })).toMatchObject({ entry: "bypass", owner: "harnix-check" });
    expect(routeWorkflow({ action: "change", workKind: "bugfix", mutation: "project", riskSignals: [] })).toMatchObject({ entry: "create", owner: "harnix-brainstorm" });
  });

  it("keeps standalone research read-only while task-scoped research enters planning", () => {
    expect(routeWorkflow({ action: "research", workKind: "dependency", mutation: "none", riskSignals: ["material-unknown"] })).toMatchObject({ entry: "bypass", owner: "harnix-research" });
    expect(routeWorkflow({ action: "research", workKind: "dependency", mutation: "project", riskSignals: ["material-unknown"] })).toMatchObject({ entry: "create", mode: "full", owner: "harnix-brainstorm" });
  });

  it("keeps hotfix gates and test work distinctions", () => {
    expect(routeWorkflow({ action: "change", workKind: "hotfix", mutation: "project", riskSignals: ["complex-rollback"] })).toMatchObject({ mode: "full" });
    expect(routeWorkflow({ action: "inspect", workKind: "test", mutation: "none", riskSignals: [] })).toMatchObject({ entry: "bypass" });
    expect(routeWorkflow({ action: "change", workKind: "test", mutation: "project", riskSignals: [] })).toMatchObject({ entry: "create", mode: "lite" });
  });

  it("requires a documented alternative when a behavioral RED is not meaningful and keeps compliance first", () => {
    expect(() => implementationStrategy("docs")).toThrow();
    expect(implementationStrategy("docs", "copy change", "exact parity assertion")).toBe("documented-exception");
    expect(verificationStages()).toEqual(["compliance", "quality-security"]);
  });
});
