import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import type { CheckRunner } from "src/core/workflow/run-check.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, initializeUtcProject, legacyTask } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-workflow-command-");
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

describe.sequential("hidden workflow flag transports", () => {
  it("records evidence from flags and prints only the brief state", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run([
      "--evidence",
      "--check",
      "check",
      "--result",
      "pass",
      "--exit-code",
      "0",
      "--summary",
      "pnpm test — ok",
      "--artifact",
      "src/a.ts",
      "--brief",
    ]);

    expect(result.code).toBe(0);
    const brief = JSON.parse(result.out) as Record<string, unknown>;
    expect(Object.keys(brief).sort()).toEqual(["checkpoint", "evidenceId", "id", "status", "updatedAt"]);
    expect(brief.evidenceId).toBe("ev-check-1");
  });

  it("keeps the full task output without --brief and marks criteria met", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    await run(["--evidence", "--check", "check", "--result", "pass", "--exit-code", "0", "--summary", "ok"]);

    const met = await run(["--criterion", "a", "--met"]);

    expect(met.code).toBe(0);
    const task = JSON.parse(met.out) as { acceptanceCriteria: { status: string; evidenceIds: string[] }[] };
    expect(task.acceptanceCriteria[0]).toMatchObject({ status: "met", evidenceIds: ["ev-check-1"] });
  });

  it("supports a brief transition", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const result = await run(["--transition", "verifying/verifying", "--brief"]);

    expect(JSON.parse(result.out)).toMatchObject({ status: "verifying", checkpoint: "verifying" });
  });

  it("migrates the active legacy task with --migrate and stdin overrides", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    const legacy = legacyTask("in_progress", "implementing");
    await saveTask(`${root}/.harnix`, legacy);
    await setActiveTask(`${root}/.harnix`, legacy.id);
    process.chdir(root);

    const missing = await run(["--migrate"], { workflowInput: async () => "" });
    expect(missing.code).toBe(2);
    expect(missing.err).toMatch(/check \(criterionIds, inputs\)/u);

    const migrated = await run(["--migrate", "--brief"], {
      workflowInput: async () => JSON.stringify({ checks: { check: { criterionIds: ["a"], inputs: ["src/**"] } } }),
    });
    expect(migrated.code).toBe(0);
    expect(JSON.parse(migrated.out)).toMatchObject({ id: legacy.id, status: "in_progress" });
  });

  it("runs a check through the injected runner without a shell and records the outcome", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const calls: string[][] = [];
    const checkRunner: CheckRunner = async (executable, args) => {
      calls.push([executable, ...args]);
      return { exitCode: 0, output: "fine" };
    };

    const result = await run(["--run-check", "check", "--", "pnpm", "test", "--filter", "x y"], { checkRunner });

    expect(result.code).toBe(0);
    expect(calls).toEqual([["pnpm", "test", "--filter", "x y"]]);
    expect(JSON.parse(result.out)).toMatchObject({
      evidenceId: "ev-check-1",
      result: "pass",
      exitCode: 0,
      outputTail: "fine",
    });
  });

  it("keeps the read-only and terminal transports working through the shared dispatcher", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const schema = JSON.parse((await run(["--schema"])).out) as { transports: Record<string, string> };
    expect(Object.keys(schema.transports)).toEqual(expect.arrayContaining(["--criterion", "--migrate", "--run-check"]));
    expect(JSON.parse((await run(["--inspect"])).out)).toHaveProperty("activeTask");
    expect(JSON.parse((await run(["--preflight"])).out)).toHaveProperty("nextStage");
    expect(JSON.parse((await run(["--snapshot", "--check", "check"])).out)).toHaveProperty("inputDigest");

    const learn = await run(["--learn"], { workflowInput: async () => "not json" });
    expect(learn.code).toBe(2);
    expect(learn.err).toMatch(/valid bounded JSON/u);

    const cancelled = await run(["--cancel"], {
      workflowInput: async () => JSON.stringify({ reason: "no longer needed", authorizedBy: "user" }),
    });
    expect(cancelled.code).toBe(0);
    expect(JSON.parse(cancelled.out)).toMatchObject({ status: "cancelled" });
  });

  it("rejects flag combinations that do not belong together", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    const cases: [string[], RegExp][] = [
      [["--inspect", "--brief"], /--brief/u],
      [["--save", "--result", "pass"], /--result/u],
      [["--inspect", "--met"], /--met/u],
      [["--criterion", "a"], /--met/u],
      [["--run-check", "check"], /executable/u],
      [["--evidence", "--check", "check"], /--result/u],
      [["--snapshot", "--check", "check", "--summary", "x"], /--summary/u],
      [["--inspect", "extra"], /operand/u],
      [["--inspect", "--migrate"], /exactly one/u],
    ];
    for (const [argv, message] of cases) {
      const result = await run(argv, { workflowInput: async () => "{}" });
      expect(result.code, argv.join(" ")).toBe(2);
      expect(result.err, argv.join(" ")).toMatch(message);
    }
  });
});
