import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { upsertEpic } from "src/core/epics/epic.js";
import { assertCommandShape, assertFlagGroups, selectAction } from "src/commands/workflow-flags.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck, buildEpic } from "test/support/builders.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

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
    expect(selectAction({ replaceCheck: ["c", "n"] })).toBe("replaceCheck");
    expect(selectAction({ addCriterion: "c", text: "t" })).toBe("addCriterion");
    expect(selectAction({ setPaths: true })).toBe("setPaths");
    expect(() => selectAction({})).toThrow(/exactly one of/u);
    expect(() => selectAction({ setPaths: true, inspect: true })).toThrow(
      /--set-check, --replace-check, --add-criterion, --add-decision, --add-risk, --set-paths/u,
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

  it("explains that --learn reads a candidate from stdin when a note flag is passed to it", () => {
    expect(() => assertFlagGroups("learn", { text: "t" })).toThrow(/--learn reads .*candidate.* from stdin/u);
    expect(() => assertFlagGroups("learn", { rationale: "r" })).toThrow(/--learn reads .*candidate.* from stdin/u);
    expect(() => assertFlagGroups("learn", {})).not.toThrow();
  });

  it("keeps --epic with the init action", () => {
    expect(() => assertFlagGroups("init", { epic: "20261006-100000-e" })).not.toThrow();
    expect(() => assertFlagGroups("inspect", { epic: "20261006-100000-e" })).toThrow(
      /--epic requires workflow --init/u,
    );
    expect(() => assertFlagGroups("setCheck", { epic: "20261006-100000-e" })).toThrow(
      /--epic requires workflow --init/u,
    );
  });

  it("keeps --reviewed with the transition action", () => {
    expect(() => assertFlagGroups("transition", { reviewed: true })).not.toThrow();
    expect(() => assertFlagGroups("inspect", { reviewed: true })).toThrow(/--reviewed requires workflow --transition/u);
    expect(() => assertFlagGroups("setCheck", { reviewed: true })).toThrow(
      /--reviewed requires workflow --transition/u,
    );
  });

  it("names the actions a misplaced --follow-up could belong to", () => {
    expect(() => assertFlagGroups("setCheck", { followUp: "20260101-000000-x" })).toThrow(
      /--follow-up requires workflow --init/u,
    );
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

  it("treats repeated --criteria like one comma-separated list", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const reason = "Bổ sung kiểm tra theo yêu cầu mới";
    await run([
      "--add-criterion",
      "b",
      "--text",
      "Tiêu chí thứ hai",
      "--check",
      "check",
      "--reason",
      reason,
      "--brief",
    ]);

    const repeated = await run(
      ["--set-check", "gateway", "--reason", reason, "--criteria", "a", "--criteria", "b", "--input", "src/**"].concat([
        "--description",
        "Kiểm tra lặp cờ",
        "--scope",
        "focused",
        "--command",
        "pnpm test",
      ]),
    );

    expect(repeated.code, repeated.err).toBe(0);
    const task = JSON.parse(repeated.out) as { validationPlan: { id: string; criterionIds: string[] }[] };
    expect(task.validationPlan.find((check) => check.id === "gateway")?.criterionIds).toEqual(["a", "b"]);
  });

  it("makes a Full task repeat the ready transition with --reviewed", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const base = taskV3("planning", "planning");
    const focus = buildCheck({ id: "focus", scope: "focused", criterionIds: ["a"], inputs: ["src/**/*.ts"] });
    const full = { ...base, mode: "full" as const, validationPlan: [...base.validationPlan, focus] };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "- [ ] S1 covers criterion a\n" } });
    process.chdir(root);

    const refused = await run(["--transition", "ready/ready", "--brief"]);
    expect(refused.code).not.toBe(0);
    expect(refused.err).toMatch(/--reviewed/u);
    expect(refused.err).toMatch(/Ready-review checklist/u);

    const dry = await run(["--transition", "ready/ready", "--dry-run"]);
    expect(dry.code, dry.err).toBe(0);
    expect(JSON.parse(dry.out)).toMatchObject({ valid: true, reviewChecklist: expect.any(Array) as unknown });

    const accepted = await run(["--transition", "ready/ready", "--reviewed", "--brief"]);
    expect(accepted.code, accepted.err).toBe(0);
    expect(JSON.parse(accepted.out)).toMatchObject({ status: "ready", checkpoint: "ready" });
  });

  it("creates a task in an existing epic with --init --epic and notes a follow-up that has no epic", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    await upsertEpic(root, buildEpic({ id: "20261006-100000-flag-epic" }));
    process.chdir(root);

    const member = await run([
      "--init",
      "--title",
      "Member",
      "--epic",
      "20261006-100000-flag-epic",
      "--command",
      "pnpm test",
    ]);
    expect(member.code, member.err).toBe(0);
    expect(JSON.parse(member.out)).toMatchObject({ epicId: "20261006-100000-flag-epic" });
    const memberId = (JSON.parse(member.out) as { id: string }).id;

    const unknown = await run([
      "--init",
      "--title",
      "Lost",
      "--epic",
      "20261006-100000-nope",
      "--command",
      "pnpm test",
    ]);
    expect(unknown.code).not.toBe(0);
    expect(unknown.err).toMatch(/not found/u);

    expect(memberId).toMatch(/^\d{8}-\d{6}-member$/u);
  });

  it("prints a notice on stderr when a follow-up parent has no epic, and keeps stdout JSON", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    process.chdir(root);
    const parent = await run(["--init", "--title", "Parent", "--command", "pnpm test"]);
    const parentId = (JSON.parse(parent.out) as { id: string }).id;
    await run(["--cancel"], { workflowInput: async () => '{"reason":"fixture cleanup reason","authorizedBy":"user"}' });

    const child = await run(["--init", "--title", "Child", "--follow-up", parentId, "--command", "pnpm test"]);

    expect(child.code, child.err).toBe(0);
    expect(child.err).toMatch(/^notice: /mu);
    expect(JSON.parse(child.out)).toMatchObject({ followUpOf: parentId });
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
