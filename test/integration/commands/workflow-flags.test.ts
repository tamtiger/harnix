import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { assertCommandShape, assertFlagGroups, selectAction } from "src/commands/workflow-flags.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, taskV3 } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-workflow-flags-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function run(argv: string[], options: Parameters<typeof runCli>[1] = {}) {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "workflow", ...argv], options);
  const result = { code, out: output(stdout.mock.calls), err: output(stderr.mock.calls) };
  stdout.mockRestore();
  stderr.mockRestore();
  return result;
}

describe("workflow flag validation", () => {
  it("selects exactly one action", () => {
    expect(selectAction({ inspect: true })).toBe("inspect");
    expect(selectAction({ setCheck: "c" })).toBe("setCheck");
    expect(selectAction({ addCriterion: "c", text: "t" })).toBe("addCriterion");
    expect(selectAction({ setPaths: true })).toBe("setPaths");
    expect(() => selectAction({})).toThrow(/exactly one of/u);
    expect(() => selectAction({ setPaths: true, inspect: true })).toThrow(
      /--set-check, --add-criterion, --add-decision, --add-risk, --set-paths/u,
    );
  });

  it("keeps plan-edit flags with their action", () => {
    expect(() => assertFlagGroups("inspect", { description: "d" })).toThrow(
      /--description requires workflow --set-check/u,
    );
    expect(() => assertFlagGroups("save", { input: ["src/**"] })).toThrow(/--input/u);
    expect(() => assertFlagGroups("setCheck", { reason: "r" })).not.toThrow();
    expect(() => assertFlagGroups("inspect", { reason: "r" })).toThrow(/--reason/u);
    expect(() => assertFlagGroups("inspect", { text: "t" })).toThrow(/--text requires workflow --add-criterion/u);
    expect(() => assertFlagGroups("addCriterion", {})).toThrow(/--text/u);
    expect(() => assertFlagGroups("setPaths", {})).toThrow(/--relevant-path/u);
    expect(() => assertFlagGroups("inspect", { relevantPath: ["a"] })).toThrow(
      /--relevant-path requires workflow --set-paths/u,
    );
    expect(() => assertFlagGroups("setPaths", { relevantSpec: ["a"] })).not.toThrow();
    expect(() => assertCommandShape("setCheck", { brief: true }, [])).not.toThrow();
  });
});

describe.sequential("hidden workflow plan-edit transports", () => {
  it("edits checks, criteria and paths from flags, keeping Vietnamese text intact", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const reason = "Bổ sung kiểm tra và tiêu chí theo yêu cầu mới";

    const addCriterion = await run([
      "--add-criterion",
      "b",
      "--text",
      "Điều phối cổng thanh toán",
      "--check",
      "check",
      "--reason",
      reason,
      "--brief",
    ]);
    expect(addCriterion.code, addCriterion.err).toBe(0);
    expect(JSON.parse(addCriterion.out)).toMatchObject({ checkpoint: "replan" });

    const setCheck = await run([
      "--set-check",
      "gateway",
      "--reason",
      reason,
      "--description",
      "Kiểm tra điều phối",
      "--scope",
      "focused",
      "--command",
      "pnpm test",
      "--criteria",
      "a,b",
      "--input",
      "src/**",
      "--input",
      "test/**",
    ]);
    expect(setCheck.code, setCheck.err).toBe(0);
    const task = JSON.parse(setCheck.out) as {
      acceptanceCriteria: { id: string; text: string }[];
      validationPlan: {
        id: string;
        description: string;
        required: boolean;
        criterionIds: string[];
        inputs: string[];
      }[];
    };
    expect(task.acceptanceCriteria.find((criterion) => criterion.id === "b")?.text).toBe("Điều phối cổng thanh toán");
    expect(task.validationPlan.find((check) => check.id === "gateway")).toMatchObject({
      description: "Kiểm tra điều phối",
      required: true,
      criterionIds: ["a", "b"],
      inputs: ["src/**", "test/**"],
    });

    const optional = await run(["--set-check", "gateway", "--no-required", "--reason", reason, "--brief"]);
    expect(optional.code, optional.err).toBe(0);
    const paths = await run([
      "--set-paths",
      "--relevant-path",
      "src/a.ts",
      "--relevant-spec",
      ".harnix/spec/guides/common.md",
      "--brief",
    ]);
    expect(paths.code, paths.err).toBe(0);
  });

  it("accepts a stdin body that starts with a BOM", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const task = taskV3("in_progress", "implementing");

    const result = await run(["--save", "--brief"], {
      workflowInput: async () =>
        `${String.fromCharCode(0xfeff)}${JSON.stringify({ task: { ...task, updatedAt: "2026-08-13T00:05:00.000Z" } })}`,
    });

    expect(result.code, result.err).toBe(0);
  });

  it("rejects mojibake sent through --save so it never reaches task.json", async () => {
    const root = await fixture();
    const running = await implementingTaskV3(root);
    process.chdir(root);
    const garbled = new TextDecoder("windows-1252").decode(Buffer.from("Điều phối cổng thanh toán", "utf8"));

    const result = await run(["--save"], {
      workflowInput: async () =>
        JSON.stringify({ task: { ...running, goal: garbled, updatedAt: "2026-08-13T00:06:00.000Z" } }),
    });

    expect(result.code).toBe(2);
    expect(result.err).toMatch(/wrong text encoding/u);
  });
});

describe("workflow note flags", () => {
  it("selects and validates the note actions", () => {
    expect(selectAction({ addDecision: "d1" })).toBe("addDecision");
    expect(selectAction({ addRisk: "r1" })).toBe("addRisk");
    expect(() => selectAction({ addRisk: "r1", inspect: true })).toThrow(/--add-decision, --add-risk/u);
    expect(() => assertFlagGroups("addDecision", { text: "t" })).toThrow(/--rationale/u);
    expect(() => assertFlagGroups("addDecision", { rationale: "r" })).toThrow(/--text/u);
    expect(() => assertFlagGroups("addDecision", { text: "t", rationale: "r" })).not.toThrow();
    expect(() => assertFlagGroups("addRisk", {})).toThrow(/--text/u);
    expect(() => assertFlagGroups("addRisk", { text: "t", severity: "high" })).not.toThrow();
    expect(() => assertFlagGroups("addRisk", { text: "t", severity: "urgent" })).toThrow(/--severity/u);
    expect(() => assertFlagGroups("inspect", { rationale: "r" })).toThrow(
      /--rationale requires workflow --add-decision/u,
    );
    expect(() => assertFlagGroups("addDecision", { text: "t", rationale: "r", severity: "low" })).toThrow(
      /--severity requires workflow --add-risk/u,
    );
    expect(() => assertCommandShape("addRisk", { brief: true }, [])).not.toThrow();
  });
});

describe.sequential("hidden workflow note transports", () => {
  it("records notes from flags and reports the learning captured at finish", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const decision = await run([
      "--add-decision",
      "d1",
      "--text",
      "Ghi decision bằng flag để learning không rỗng",
      "--rationale",
      "Agent không phải dựng JSON",
      "--brief",
    ]);
    const risk = await run([
      "--add-risk",
      "r1",
      "--text",
      "Bản cài ở home chỉ đổi sau update global",
      "--severity",
      "medium",
      "--brief",
    ]);
    expect(decision.code, decision.err).toBe(0);
    expect(risk.code, risk.err).toBe(0);

    await run(["--transition", "verifying/verifying"]);
    await run(["--evidence", "--check", "check", "--result", "pass", "--exit-code", "0", "--summary", "ok"]);
    await run(["--criterion", "a", "--met"]);
    await run(["--transition", "verifying/finishing"]);
    const finish = await run(["--finish", "--brief"]);

    expect(finish.code, finish.err).toBe(0);
    const brief = JSON.parse(finish.out) as { status: string; learning: { notes: number; captured: number } };
    expect(brief.status).toBe("completed");
    expect(brief.learning).toEqual({ notes: 2, captured: 2 });
  });

  it("accepts --brief for a preflight and drops learning from it", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const brief = JSON.parse((await run(["--preflight", "--brief"])).out) as Record<string, unknown>;
    const full = JSON.parse((await run(["--preflight"])).out) as Record<string, unknown>;

    expect("learning" in brief).toBe(false);
    expect(brief.nextStage).toBe(full.nextStage);
    expect(Array.isArray(full.learning)).toBe(true);
  });

  it("names every command that supports --brief when it is refused", () => {
    expect(() => assertCommandShape("preflight", { brief: true }, [])).not.toThrow();
    expect(() => assertCommandShape("inspect", { brief: true }, [])).toThrow(
      /not supported for workflow --inspect.*--preflight.*--run-check.*--set-check/su,
    );
  });
});
