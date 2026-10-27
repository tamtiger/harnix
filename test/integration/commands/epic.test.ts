import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { upsertEpic, type EpicRecord } from "src/core/epics/epic.js";
import { buildEpic, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-epic-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("epic command", () => {
  it("lists epics with task counts by status", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = `${root}/.harnix`;

    const epic = epicRecord("my-epic", "Epic title", "Epic goal");
    await upsertEpic(root, epic);

    const memberTask = taskV2("20260826-100000-member-task", "ready", "my-epic");
    await saveTask(harnixRoot, memberTask);
    await setActiveTask(harnixRoot, memberTask.id);

    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "epic"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      total: 1,
      epics: [{ id: "my-epic", title: "Epic title", totalTasks: 1, completedTasks: 0, cancelledTasks: 0 }],
    });
  });

  it("lists the newest epics first and reports the total number of epics, not the page size", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    for (const id of ["20260101-000000-old", "20260201-000000-mid", "20260301-000000-new"])
      await upsertEpic(root, epicRecord(id, id, "goal"));
    // An unreadable epic is neither listed nor counted.
    await mkdir(join(root, ".harnix", "epics", "20260401-000000-broken"), { recursive: true });
    await writeFile(join(root, ".harnix", "epics", "20260401-000000-broken", "epic.json"), "{ not json");

    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "epic", "--limit", "2"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output.total).toBe(3);
    expect((output.epics as { id: string }[]).map((epic) => epic.id)).toEqual([
      "20260301-000000-new",
      "20260201-000000-mid",
    ]);
  });

  it("details a specific epic with its member tasks and next task", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = `${root}/.harnix`;

    const epic = epicRecord("detail-epic", "Detail epic", "Detail goal");
    await upsertEpic(root, epic);

    const memberTask = taskV2("20260826-100000-detail-task", "in_progress", "detail-epic");
    await saveTask(harnixRoot, memberTask);
    await setActiveTask(harnixRoot, memberTask.id);

    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "epic", "detail-epic"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      epic: { id: "detail-epic", title: "Detail epic" },
      members: [{ id: memberTask.id, status: "in_progress" }],
      nextTask: { id: memberTask.id, status: "in_progress" },
    });
  });

  it("returns PublicCliErrorV1 with exit 2 when --id does not match any epic", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "epic", "nonexistent-epic"])).resolves.toBe(2);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({ ok: false, error: { exitCode: 2 } });
  });

  it("prints a brief epic detail without goals, non-goals or timestamps and with counts by status", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = `${root}/.harnix`;
    const longGoal =
      "A long goal sentence that every full epic detail repeats for the epic and for each member. ".repeat(20);
    await upsertEpic(root, buildEpic({ id: "brief-epic", title: "Brief epic", goal: longGoal, nonGoals: [longGoal] }));
    const statuses: TaskRecordV3["status"][] = ["ready", "planning", "planning", "planning"];
    for (const [index, status] of statuses.entries()) {
      const checkpoint = status === "ready" ? "ready" : "planning";
      await saveTask(
        harnixRoot,
        buildTaskV3({
          id: `20260826-10000${index}-member-${index}`,
          title: `Member ${index}`,
          status,
          checkpoint,
          goal: longGoal,
          epicId: "brief-epic",
        }),
      );
    }
    process.chdir(root);

    const full = await runEpic(["epic", "brief-epic"]);
    const brief = await runEpic(["epic", "brief-epic", "--brief"]);

    expect(JSON.stringify(brief).length).toBeLessThan(JSON.stringify(full).length * 0.25);
    expect(JSON.stringify(brief)).not.toContain("A long goal sentence");
    expect(brief).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      epic: { id: "brief-epic", title: "Brief epic" },
      counts: { planning: 3, ready: 1 },
      members: [
        { id: "20260826-100000-member-0", status: "ready" },
        { id: "20260826-100001-member-1", status: "planning" },
        { id: "20260826-100002-member-2", status: "planning" },
        { id: "20260826-100003-member-3", status: "planning" },
      ],
      nextTask: { id: "20260826-100000-member-0", status: "ready", title: "Member 0" },
    });
    const detail = full as { epic: { goal: string }; members: { goal: string }[] };
    expect(detail.epic.goal).toBe(longGoal);
    expect(detail.members.every((member) => member.goal === longGoal)).toBe(true);
  });

  it("counts archived members and lists archived epics only with --archived", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = `${root}/.harnix`;
    await upsertEpic(root, epicRecord("20261001-100000-live-epic", "Live", "Live goal"));
    await upsertEpic(root, epicRecord("20260801-100000-old-epic", "Old", "Old goal"));
    await saveTask(harnixRoot, taskV2("20261002-100000-live-member", "planning", "20261001-100000-live-epic"));
    const done = taskV2("20260802-100000-old-member", "ready", "20260801-100000-old-epic");
    await saveTask(harnixRoot, done);
    await mkdir(join(harnixRoot, "epics", "_archive", "2026-08"), { recursive: true });
    await rename(
      join(harnixRoot, "epics", "2026-08", "20260801-100000-old-epic"),
      join(harnixRoot, "epics", "_archive", "2026-08", "20260801-100000-old-epic"),
    );
    await mkdir(join(harnixRoot, "tasks", "_archive", "2026-08"), { recursive: true });
    await rename(
      join(harnixRoot, "tasks", "2026-08", done.id),
      join(harnixRoot, "tasks", "_archive", "2026-08", done.id),
    );
    process.chdir(root);

    const live = (await runEpic(["epic"])) as { total: number; epics: { id: string; totalTasks: number }[] };
    const archived = (await runEpic(["epic", "--archived"])) as typeof live;
    const detail = (await runEpic(["epic", "20260801-100000-old-epic"])) as { members: { id: string }[] };

    expect(live.epics).toMatchObject([{ id: "20261001-100000-live-epic", totalTasks: 1 }]);
    expect(archived).toMatchObject({
      total: 1,
      epics: [{ id: "20260801-100000-old-epic", totalTasks: 1, completedTasks: 0 }],
    });
    expect(detail.members.map((member) => member.id)).toEqual([done.id]);
  });

  it("recommends the first unfinished member in ID order as the next task", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = `${root}/.harnix`;
    await upsertEpic(root, epicRecord("order-epic", "Order epic", "Order goal"));
    await saveTask(harnixRoot, taskV2("20260826-100000-foundation", "ready", "order-epic"));
    await saveTask(harnixRoot, taskV2("20260826-100001-dependent", "planning", "order-epic"));
    process.chdir(root);

    const detail = (await runEpic(["epic", "order-epic"])) as { members: { id: string }[]; nextTask: { id: string } };

    expect(detail.members.map((member) => member.id)).toEqual([
      "20260826-100000-foundation",
      "20260826-100001-dependent",
    ]);
    expect(detail.nextTask.id).toBe("20260826-100000-foundation");
  });
});

async function runEpic(argv: string[]): Promise<unknown> {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  await expect(runCli(["node", "harnix", ...argv])).resolves.toBe(0);
  const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as unknown;
  stdout.mockRestore();
  return output;
}

function epicRecord(id: string, title: string, goal: string): EpicRecord {
  return buildEpic({ id, title, goal });
}

function taskV2(id: string, status: TaskRecordV3["status"], epicId: string): TaskRecordV3 {
  const checkpoint = status === "ready" ? "ready" : status === "in_progress" ? "implementing" : "planning";
  return buildTaskV3({ id, title: "epic member", status, checkpoint, goal: "test", epicId });
}
