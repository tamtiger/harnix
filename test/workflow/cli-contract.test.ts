import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "src/cli-program.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

afterEach(() => vi.restoreAllMocks());

describe("CLI command contract", () => {
  it("exposes eighteen supported commands without exposing hidden/internal commands", () => {
    expect(
      createProgram()
        .commands.filter((command) => !(command as { _hidden?: boolean })._hidden)
        .map((command) => command.name()),
    ).toEqual([
      "init",
      "setup",
      "update",
      "upgrade",
      "uninstall",
      "mem",
      "learning",
      "status",
      "tasks",
      "epic",
      "resume",
      "pause",
      "context-report",
      "skill",
      "doctor",
      "repo-map",
      "verify-plan",
      "archive",
    ]);
  });

  it("registers single-command action flags without nested command trees", () => {
    const program = createProgram();
    const context = program.commands.find((command) => command.name() === "context");
    const repoMap = program.commands.find((command) => command.name() === "repo-map");
    const status = program.commands.find((command) => command.name() === "status");
    const doctor = program.commands.find((command) => command.name() === "doctor");
    const tasks = program.commands.find((command) => command.name() === "tasks");
    const resume = program.commands.find((command) => command.name() === "resume");
    const contextReport = program.commands.find((command) => command.name() === "context-report");
    const workflow = program.commands.find((command) => command.name() === "workflow");

    expect(program.commands.find((command) => command.name() === "internal")).toBeUndefined();
    expect(program.commands.every((command) => command.commands.length === 0)).toBe(true);
    expect((context as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    expect(repoMap?.options.map((option) => option.long)).toEqual([
      "--query",
      "--impact",
      "--tests",
      "--outline",
      "--refs",
      "--symbol",
      "--body",
      "--path",
      "--limit",
      "--depth",
      "--format",
      "--events",
      "--workspace",
      "--refresh",
    ]);
    expect(repoMap?.options.find((option) => option.long === "--refresh")?.hidden).toBe(false);
    expect(doctor?.options.map((option) => option.long)).toEqual(["--fix", "--global", "--allow-warnings"]);
    expect(status?.options.map((option) => option.long)).toEqual([
      "--explain",
      "--summary",
      "--criteria",
      "--checks",
      "--limit",
      "--workspace",
    ]);
    expect(tasks?.options.map((option) => option.long)).toEqual([
      "--limit",
      "--status",
      "--archived",
      "--stale",
      "--days",
      "--brief",
    ]);
    const epic = program.commands.find((command) => command.name() === "epic");
    expect(epic?.options.map((option) => option.long)).toEqual(["--limit", "--brief", "--archived"]);
    expect(resume?.options.map((option) => option.long)).toEqual([
      "--epic",
      "--dry-run",
      "--force",
      "--next",
      "--brief",
    ]);
    expect(contextReport?.options.map((option) => option.long)).toEqual(["--platform", "--limit"]);
    expect(workflow?.options.map((option) => option.long)).toEqual([
      "--inspect",
      "--preflight",
      "--expected-task",
      "--init",
      "--title",
      "--task",
      "--slug",
      "--mode",
      "--goal",
      "--save",
      "--snapshot",
      "--finish",
      "--cancel",
      "--learn",
      "--transition",
      "--evidence",
      "--criterion",
      "--met",
      "--evidence-ids",
      "--migrate",
      "--run-check",
      "--run-checks",
      "--set-check",
      "--set-baseline",
      "--classification",
      "--authorized-by",
      "--epic-order",
      "--replace-check",
      "--reset-breaker",
      "--add-criterion",
      "--set-criterion",
      "--add-decision",
      "--add-risk",
      "--remove-check",
      "--remove-decision",
      "--remove-criterion",
      "--remove-risk",
      "--set-paths",
      "--set-title",
      "--set-goal",
      "--tick",
      "--file",
      "--batch",
      "--schema",
      "--check",
      "--result",
      "--exit-code",
      "--summary",
      "--artifact",
      "--digest",
      "--description",
      "--command",
      "--scope",
      "--required",
      "--no-required",
      "--criteria",
      "--input",
      "--reason",
      "--note",
      "--text",
      "--with-check",
      "--rationale",
      "--severity",
      "--mitigation",
      "--relevant-path",
      "--relevant-spec",
      "--cwd",
      "--reviewed",
      "--epic",
      "--follow-up",
      "--no-activate",
      "--brief",
      "--full",
      "--checklist",
      "--dry-run",
    ]);
  });

  it("keeps the workflow transport hidden and rejects ambiguous action flags", async () => {
    const workflow = createProgram().commands.find((command) => command.name() === "workflow");
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(workflow?.commands).toEqual([]);
    expect((workflow as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    await expect(runCli(["node", "harnix", "workflow"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--finish"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--snapshot"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--check", "check"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "inspect"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--transition", "verifying"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--schema", "--evidence"])).resolves.toBe(2);

    // Every failed workflow call answers with one PublicCliErrorV1 line on stdout, like the public commands.
    const answers = stdout.mock.calls.map((call) => JSON.parse(String(call[0])) as { ok: boolean });
    expect(answers).toHaveLength(7);
    expect(answers.every((answer) => answer.ok === false)).toBe(true);
    stdout.mockClear();

    await expect(runCli(["node", "harnix", "internal", "context", "--platform", "codex"])).resolves.toBe(2);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "error: unknown command 'internal'" },
    });
  });
});

describe("a wrong command answers with the corrected one", () => {
  const temporaryRepository = useTemporaryRepositories("harnix-cli-hints-");
  const originalCwd = process.cwd();
  afterEach(() => process.chdir(originalCwd));

  it.each([
    [["workflow", "--transition", "ready"], /ready\/ready/u],
    [["status", "--criteria", "--task", "x"], /--task không thuộc harnix status; nó dùng với harnix workflow/u],
    [["workflow", "--run-check", "chek", "--", "pnpm", "test"], /check hợp lệ: check\. Có phải ý bạn là check\?/u],
    [["workflow", "--remove-risk", "r-9"], /chưa có risk nào/u],
    [["skill", "harnix-plann"], /Có phải ý bạn là harnix-plan\?/u],
    [["workflow", "--remove-risks", "r"], /Did you mean --remove-risk\?/u],
    [["workflow", "--preflight", "extra"], /Chỉ --run-check nhận đối số/u],
    [["workflow", "--inspect", "--brief"], /bỏ --brief khỏi lệnh này/u],
    [["workflow", "--preflight", "--brief", "--full"], /Chọn một trong --brief hoặc --full/u],
    [
      ["workflow", "--set-baseline", "chk-1"],
      /--result pass\|fail --classification .*--authorized-by user --scope "<phạm vi được duyệt>"/u,
    ],
    [["workflow", "--set-baseline", "--result", "pass"], /cờ giá trị nhận token kế tiếp làm giá trị/u],
    [["workflow", "--remove-risk", "--brief"], /cờ giá trị nhận token kế tiếp làm giá trị/u],
    [["facts"], /harnix update/u],
    [["statuz"], /Có phải ý bạn là harnix status\?/u],
    [["status", "foo"], /harnix status không nhận đối số/u],
    [["epic", "nope"], /chưa có epic nào/u],
    [["repo-map", "--format", "compact"], /--query/u],
  ])("harnix %j", async (args, hint) => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", ...args])).resolves.toBe(2);

    const answer = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      ok: boolean;
      error: { message: string; hint?: string };
    };
    expect(answer.ok).toBe(false);
    expect(answer.error.hint).toMatch(hint);
    expect(answer.error.message).not.toMatch(/Gợi ý/u);
    expect(stderr.mock.calls.map((call) => String(call[0])).join("")).toMatch(hint);
  });
});

describe("a command outside a Harnix project says how to get inside one", () => {
  const temporaryRepository = useTemporaryRepositories("harnix-cli-hints-bare-");
  const originalCwd = process.cwd();
  afterEach(() => process.chdir(originalCwd));

  it.each([
    [["pause"], /Pause requires an initialized Harnix project/u],
    [["resume", "--next"], /Resume requires an initialized Harnix project/u],
    [["repo-map", "--query", "x"], /Repo map requires an initialized Harnix project/u],
    [["tasks"], /Tasks requires an initialized Harnix project/u],
  ])("harnix %j", async (args, message) => {
    process.chdir(await temporaryRepository());
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", ...args])).resolves.toBe(2);

    const answer = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      error: { message: string; hint?: string };
    };
    expect(answer.error.message).toMatch(message);
    expect(answer.error.hint).toMatch(/harnix init/u);
  });
});
