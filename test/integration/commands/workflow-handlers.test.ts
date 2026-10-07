import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import type { CheckRunner } from "src/core/workflow/run-check.js";
import { output } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { buildTaskV3 } from "test/support/builders.js";
import { finishingTask, implementingTaskV3, initializeUtcProject } from "test/support/workflow-fixtures.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-workflow-run-checks-");
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
describe.sequential("workflow --run-checks", () => {
  it("runs the pending checks through the injected runner and keeps the failing tail with --brief", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);
    const checkRunner: CheckRunner = async () => ({ exitCode: 1, output: "boom" });

    const full = await run(["--run-checks"], { checkRunner });
    const brief = await run(["--run-checks", "--brief"], { checkRunner });

    expect(JSON.parse(full.out)).toEqual({
      ran: [{ id: "check", result: "fail", exitCode: 1, outputTail: "boom" }],
      remaining: [],
    });
    expect(JSON.parse(brief.out)).toEqual(JSON.parse(full.out));
  });

  it("accepts no operands and no --cwd", async () => {
    const root = await fixture();
    await implementingTaskV3(root);
    process.chdir(root);

    expect((await run(["--run-checks", "pnpm", "test"])).err).toMatch(/does not accept operands/u);
    expect((await run(["--run-checks", "--cwd", "."])).err).toMatch(/--cwd requires/u);
  });
});

describe.sequential("workflow --init with repeated --text and --with-check", () => {
  async function initializedProject(): Promise<string> {
    const root = await fixture();
    await initializeUtcProject(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
    process.chdir(root);
    return root;
  }

  it("creates one criterion per --text and the declared checks without any JSON", async () => {
    await initializedProject();

    const result = await run([
      "--init",
      "--title",
      "Many",
      "--text",
      "First",
      "--text",
      "Second",
      "--with-check",
      "id=check-a;command=pnpm exec vitest run a.test.ts;criteria=ac-1;input=test/**",
      "--with-check",
      "id=check-b;command=pnpm exec vitest run b.test.ts;criteria=ac-2;input=test/**;scope=full",
    ]);

    expect(result.code).toBe(0);
    const task = JSON.parse(result.out) as {
      acceptanceCriteria: { id: string; text: string }[];
      validationPlan: { id: string; scope: string; criterionIds: string[] }[];
    };
    expect(task.acceptanceCriteria.map(({ id, text }) => [id, text])).toEqual([
      ["ac-1", "First"],
      ["ac-2", "Second"],
    ]);
    expect(task.validationPlan.map(({ id, scope }) => [id, scope])).toEqual([
      ["check-suite", "full"],
      ["check-a", "focused"],
      ["check-b", "full"],
    ]);
    expect(task.validationPlan[0]?.criterionIds).toEqual(["ac-1", "ac-2"]);
  });

  it("names the flag to fix and creates nothing when a check spec is wrong", async () => {
    await initializedProject();

    const result = await run(["--init", "--title", "Bad", "--with-check", "id=check-a;command=node -e 0;input=src/**"]);

    expect(result.code).toBe(2);
    expect(result.err).toMatch(/--with-check.*missing key criteria/su);
  });

  it("keeps --with-check and a repeated --text for --init only", async () => {
    await initializedProject();

    const withCheck = await run(["--inspect", "--with-check", "id=a;command=x;criteria=ac-1;input=a"]);
    const repeated = await run(["--add-decision", "d", "--text", "one", "--text", "two", "--rationale", "r"]);

    expect(withCheck.err).toMatch(/--with-check requires workflow --init/u);
    expect(repeated.err).toMatch(/--text may repeat only with workflow --init/u);
  });
});

describe.sequential("workflow --finish secret advisory", () => {
  async function finishableWithSecret(): Promise<void> {
    const root = await fixture();
    await initializeUtcProject(root);
    const task = await finishingTask(root, "2026-08-13T00:00:00.000Z");
    await mkdir(join(root, "config"), { recursive: true });
    await writeFile(join(root, "config", "ci.json"), `{ "Password": "${"Hunter2"}xyz" }`);
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, { ...task, relevantPaths: ["config/ci.json"] });
    await setActiveTask(harnixRoot, task.id);
    process.chdir(root);
  }

  it("prints secretAdvisory with --brief, without any value, and still finishes", async () => {
    await finishableWithSecret();

    const result = await run(["--finish", "--brief"]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({
      status: "completed",
      secretAdvisory: { files: 1, findings: [{ path: "config/ci.json", rule: "credential-assignment" }] },
    });
    expect(result.out).not.toContain("Hunter2");
  });

  it("keeps the plain --finish output as the bare task", async () => {
    await finishableWithSecret();

    const result = await run(["--finish"]);

    expect(JSON.parse(result.out)).not.toHaveProperty("secretAdvisory");
    expect(JSON.parse(result.out)).toMatchObject({ status: "completed" });
  });
});

describe.sequential("workflow --inspect --task", () => {
  it("reads another unfinished task without moving the active pointer, and refuses a terminal or missing one", async () => {
    const root = await fixture();
    const active = await implementingTaskV3(root);
    const other = buildTaskV3({ id: "20260814-120000-other", title: "Other", goal: "Another task" });
    await saveTask(join(root, ".harnix"), other);
    process.chdir(root);

    const inspected = await run(["--inspect", "--task", other.id]);
    const unchanged = await run(["--inspect"]);

    expect(inspected.code).toBe(0);
    expect(JSON.parse(inspected.out)).toMatchObject({ activeTask: { id: other.id, status: "planning" } });
    expect(JSON.parse(unchanged.out)).toMatchObject({ activeTask: { id: active.id } });
    expect((await run(["--inspect", "--task", "20260815-120000-missing"])).err).toMatch(/not found/u);
    await saveTask(join(root, ".harnix"), {
      ...other,
      id: "20260816-120000-done",
      status: "completed",
      checkpoint: "finishing",
      completedAt: other.updatedAt,
      acceptanceCriteria: [{ id: "ac-one", text: "t", status: "waived", evidenceIds: [], waiverReason: "fixture" }],
    });
    expect((await run(["--inspect", "--task", "20260816-120000-done"])).err).toMatch(/terminal/u);
  });
});

describe.sequential("workflow --set-criterion", () => {
  it("rewrites a criterion from flags with accented text and keeps the flag rules", async () => {
    const root = await fixture();
    await initializeUtcProject(root);
    const task = buildTaskV3({ id: "20260814-120000-edit", title: "Edit", goal: "Sửa tiêu chí" });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    process.chdir(root);

    const result = await run(["--set-criterion", "ac-one", "--text", "Tiêu chí đã sửa", "--brief"]);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.out)).toMatchObject({ id: task.id, status: "planning" });
    const inspected = JSON.parse((await run(["--inspect"])).out) as {
      activeTask: { acceptanceCriteria: { text: string }[] };
    };
    expect(inspected.activeTask.acceptanceCriteria[0]?.text).toBe("Tiêu chí đã sửa");
    expect((await run(["--set-criterion", "ac-one"])).err).toMatch(/--set-criterion requires --text/u);
    expect((await run(["--inspect", "--text", "x"])).err).toMatch(/--text requires workflow/u);
  });
});
