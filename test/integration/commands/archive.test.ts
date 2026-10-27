import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { upsertEpic } from "src/core/epics/epic.js";
import { locateTask, listTaskIds } from "src/core/tasks/task-location.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { NOW, openTask, saveAll, terminalTask } from "test/support/archive-fixtures.js";
import { buildEpic } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-archive-command-");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

const OLD = "20260801-100000-old-done";
const RECENT = "20261020-100000-recent-done";
const EPIC = "20260801-090000-done-epic";

async function project(): Promise<{ root: string; harnixRoot: string }> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  const harnixRoot = join(root, ".harnix");
  await upsertEpic(root, buildEpic({ id: EPIC }));
  await saveAll(harnixRoot, [
    terminalTask(OLD, { endedDaysAgo: 40 }),
    terminalTask(RECENT, { endedDaysAgo: 3 }),
    terminalTask("20260801-100000-member", { endedDaysAgo: 60, epicId: EPIC }),
    openTask("20260701-100000-forgotten"),
  ]);
  process.chdir(root);
  return { root, harnixRoot };
}

async function run(...args: string[]): Promise<{ code: number; output: Record<string, unknown> }> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const code = await runCli(["node", "harnix", "archive", ...args]);
  const text = stdout.mock.calls.map((call) => String(call[0])).join("");
  stdout.mockRestore();
  return { code, output: JSON.parse(text) as Record<string, unknown> };
}

describe.sequential("archive command", () => {
  it("lists what it would archive and writes nothing by default", async () => {
    const { harnixRoot } = await project();

    const { code, output } = await run();

    expect(code).toBe(0);
    expect(output).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      mode: "dry-run",
      days: 30,
      tasks: [OLD],
      epics: [EPIC],
      epicMembers: { [EPIC]: ["20260801-100000-member"] },
      invalid: [],
      failed: [],
    });
    expect(output.skipped).toEqual({
      counts: { "too-recent": 1, "not-terminal": 1 },
      items: [{ kind: "task", id: "20260701-100000-forgotten", reason: "not-terminal" }],
    });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("bucket");
  });

  it("moves the listed items with --apply, honours --days and then has nothing left to do", async () => {
    const { harnixRoot } = await project();

    const strict = await run("--days", "100");
    expect(strict.output).toMatchObject({ tasks: [], epics: [] });

    const applied = await run("--apply");
    expect(applied.output).toMatchObject({ mode: "apply", tasks: [OLD], epics: [EPIC], failed: [] });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("archive");
    expect((await locateTask(harnixRoot, "20260801-100000-member"))?.kind).toBe("archive");
    expect((await locateTask(harnixRoot, RECENT))?.kind).toBe("bucket");
    expect(await listTaskIds(harnixRoot)).toEqual(["20260701-100000-forgotten", RECENT]);

    expect((await run("--apply")).output).toMatchObject({ tasks: [], epics: [] });
  });

  it("restores a task or an epic with its members and rejects a bad combination or an unknown ID", async () => {
    const { harnixRoot } = await project();
    await run("--apply");

    expect((await run("--restore", OLD)).output).toMatchObject({
      mode: "restore",
      restored: { kind: "task", ids: [OLD] },
    });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("bucket");
    expect((await run("--restore", EPIC)).output).toMatchObject({
      restored: { kind: "epic", ids: [EPIC, "20260801-100000-member"] },
    });

    for (const args of [
      ["--restore", OLD, "--apply"],
      ["--restore", "20260101-000000-missing"],
      ["--days", "0"],
    ]) {
      const failed = await run(...args);
      expect(failed.code).toBe(2);
      expect(failed.output).toMatchObject({ ok: false, error: { exitCode: 2 } });
    }
  });

  it("keeps the active task, rejects workflow writes to an archived task and still lets other commands read it", async () => {
    const { harnixRoot } = await project();
    await setActiveTask(harnixRoot, OLD);
    expect((await run()).output).toMatchObject({ tasks: [] });
    await setActiveTask(harnixRoot, RECENT);
    await run("--apply");

    await expect(saveTask(harnixRoot, terminalTask(OLD, { endedDaysAgo: 40 }))).rejects.toThrow(
      `harnix archive --restore ${OLD}`,
    );

    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await expect(runCli(["node", "harnix", "epic", EPIC])).resolves.toBe(0);
    const detail = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      members: { id: string }[];
    };
    expect(detail.members.map((member) => member.id)).toEqual(["20260801-100000-member"]);
  });
});
