import { describe, expect, it } from "vitest";

import type { DoctorFinding } from "src/core/doctor/findings.js";
import { inspectTaskPreflight } from "src/core/doctor/task-preflight.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { buildCheck, buildTaskV3 } from "test/support/builders.js";

async function inspect(tasks: TaskRecord[], packagePaths: string[] = []): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  await inspectTaskPreflight("/unused", new Map(tasks.map((task) => [task.id, task])), packagePaths, findings);
  return findings;
}

const codesOf = (findings: DoctorFinding[]): string[] => findings.map((item) => item.code);
const PACKAGES = ["api", "web"];

describe("task-check-cwd-missing", () => {
  it("warns when every input is inside one package and the check has no cwd", async () => {
    const task = buildTaskV3({ validationPlan: [buildCheck({ inputs: ["api/src/**", "api/test/**"] })] });
    const findings = await inspect([task], PACKAGES);
    expect(findings).toMatchObject([{ code: "task-check-cwd-missing", severity: "warning", fixable: false }]);
    expect(findings[0]?.message).toContain("--cwd api");
  });

  it.each([
    ["a cwd is declared", { inputs: ["api/src/**"], cwd: "api" }, PACKAGES],
    ["inputs span two packages", { inputs: ["api/src/**", "web/src/**"] }, PACKAGES],
    ["inputs include the root", { inputs: ["api/src/**", "docs/**"] }, PACKAGES],
    ["the input is a wildcard", { inputs: ["**"] }, PACKAGES],
    ["the project has one package", { inputs: ["api/src/**"] }, ["api"]],
  ])("stays silent when %s", async (_name, overrides, packages) => {
    const task = buildTaskV3({ validationPlan: [buildCheck(overrides)] });
    expect(codesOf(await inspect([task], packages))).toEqual([]);
  });

  it("stays silent for a check without a command", async () => {
    const commandless = buildCheck({ inputs: ["api/src/**"] });
    Reflect.deleteProperty(commandless, "command");
    const task = buildTaskV3({ validationPlan: [commandless] });
    expect(codesOf(await inspect([task], PACKAGES))).toEqual([]);
  });

  it("ignores finished tasks", async () => {
    const task = buildTaskV3({
      status: "cancelled",
      checkpoint: "cancelling",
      cancelledAt: "2026-08-13T00:00:00.000Z",
      cancellation: { reason: "Không làm nữa.", authorizedBy: "user" },
      validationPlan: [buildCheck({ inputs: ["api/src/**"] })],
    });
    expect(codesOf(await inspect([task], PACKAGES))).toEqual([]);
  });
});

describe("task-near-duplicate", () => {
  const twin = { title: "Standardize webhook secret", goal: "Standardize webhook secret configuration" };

  it("reports the newer task once, naming the older one", async () => {
    const findings = await inspect([
      buildTaskV3({ id: "20260929-090000-first", ...twin }),
      buildTaskV3({ id: "20260929-090100-second", ...twin, status: "ready", checkpoint: "ready" }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: "task-near-duplicate", path: "tasks/20260929-090100-second/task.json" });
    expect(findings[0]?.message).toContain("20260929-090000-first");
  });

  it("compares only planning and ready tasks", async () => {
    const inProgress = buildTaskV3({
      id: "20260929-090000-first",
      ...twin,
      status: "in_progress",
      checkpoint: "implementing",
    });
    const findings = await inspect([inProgress, buildTaskV3({ id: "20260929-090100-second", ...twin })]);
    expect(codesOf(findings)).toEqual([]);
  });

  it("stays silent for unrelated tasks", async () => {
    const findings = await inspect([
      buildTaskV3({ id: "20260929-090000-first", ...twin }),
      buildTaskV3({ id: "20260929-090100-second", title: "Thêm báo cáo doanh thu", goal: "Báo cáo theo tháng" }),
    ]);
    expect(codesOf(findings)).toEqual([]);
  });
});
