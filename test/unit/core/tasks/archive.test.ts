import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { upsertEpic } from "src/core/epics/epic.js";
import { applyArchive, planArchive, restoreFromArchive } from "src/core/tasks/archive.js";
import { locateTask, resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { setActiveTask } from "src/core/tasks/task.js";
import { buildEpic } from "test/support/builders.js";
import { NOW, openTask, saveAll, terminalTask } from "test/support/archive-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-archive-");
const options = { days: 30, now: NOW };

const OLD = "20260801-100000-old-done";
const OLD_CANCELLED = "20260802-100000-old-cancelled";
const RECENT = "20261020-100000-recent-done";

async function project(): Promise<{ root: string; harnixRoot: string }> {
  const root = await temporaryRepository();
  const harnixRoot = join(root, ".harnix");
  await mkdir(harnixRoot, { recursive: true });
  return { root, harnixRoot };
}

describe("archive plan", () => {
  it("selects only completed or cancelled tasks whose end is older than --days", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [
      terminalTask(OLD, { endedDaysAgo: 40 }),
      terminalTask(OLD_CANCELLED, { status: "cancelled", endedDaysAgo: 31 }),
      terminalTask(RECENT, { endedDaysAgo: 7 }),
      terminalTask("20261001-100000-edge", { endedDaysAgo: 30 }),
      openTask("20260701-100000-forgotten"),
      openTask("20260702-100000-blocked", {
        status: "blocked",
        blocker: { kind: "decision", summary: "chờ", nextAction: "hỏi", resumeStatus: "planning" },
      }),
    ]);

    const plan = await planArchive(harnixRoot, options);

    expect(plan.tasks).toEqual([OLD, OLD_CANCELLED]);
    expect(plan.epics).toEqual([]);
    const reasons = Object.fromEntries(plan.skipped.map((item) => [item.id, item.reason]));
    expect(reasons).toMatchObject({
      [RECENT]: "too-recent",
      "20261001-100000-edge": "too-recent",
      "20260701-100000-forgotten": "not-terminal",
      "20260702-100000-blocked": "not-terminal",
    });
    expect((await planArchive(harnixRoot, { days: 5, now: NOW })).tasks).toContain(RECENT);
  });

  it("never archives the active task, a task unreadable on disk or the parent of an open follow-up", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [
      terminalTask(OLD, { endedDaysAgo: 90 }),
      terminalTask(OLD_CANCELLED, { status: "cancelled", endedDaysAgo: 90 }),
      openTask("20260901-100000-follow-up", { followUpOf: OLD_CANCELLED }),
      terminalTask("20260803-100000-closed-parent", { endedDaysAgo: 90 }),
      terminalTask("20260804-100000-closed-child", { endedDaysAgo: 90, followUpOf: "20260803-100000-closed-parent" }),
    ]);
    await setActiveTask(harnixRoot, OLD);
    await mkdir(join(harnixRoot, "tasks", "2026-08", "20260805-100000-broken"), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", "2026-08", "20260805-100000-broken", "task.json"), "{ not json");

    const plan = await planArchive(harnixRoot, options);

    expect(plan.tasks).toEqual(["20260803-100000-closed-parent", "20260804-100000-closed-child"]);
    const reasons = Object.fromEntries(plan.skipped.map((item) => [item.id, item.reason]));
    expect(reasons[OLD]).toBe("active");
    expect(reasons[OLD_CANCELLED]).toBe("follow-up-open");
    expect(plan.invalid).toEqual(["20260805-100000-broken"]);
  });

  it("archives a finished epic together with all its members and holds back an unfinished one", async () => {
    const { root, harnixRoot } = await project();
    const done = "20260801-090000-done-epic";
    const open = "20260802-090000-open-epic";
    const fresh = "20261020-090000-fresh-epic";
    for (const id of [done, open, fresh]) await upsertEpic(root, buildEpic({ id }));
    await saveAll(harnixRoot, [
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId: done }),
      terminalTask("20260801-110000-d2", { status: "cancelled", endedDaysAgo: 50, epicId: done }),
      terminalTask("20260802-100000-o1", { endedDaysAgo: 60, epicId: open }),
      openTask("20260802-110000-o2", { epicId: open }),
      terminalTask("20261020-100000-f1", { endedDaysAgo: 3, epicId: fresh }),
    ]);

    const plan = await planArchive(harnixRoot, options);

    expect(plan.epics).toEqual([done]);
    expect(plan.epicMembers[done]).toEqual(["20260801-100000-d1", "20260801-110000-d2"]);
    expect(plan.tasks).toEqual([]);
    const reasons = Object.fromEntries(plan.skipped.map((item) => [`${item.kind}:${item.id}`, item.reason]));
    expect(reasons).toMatchObject({
      [`epic:${open}`]: "epic-unfinished",
      "task:20260802-100000-o1": "epic-unfinished",
      "task:20260802-110000-o2": "not-terminal",
      [`epic:${fresh}`]: "too-recent",
    });
  });
});

describe("archive plan for an epic that is still a flat file", () => {
  it("leaves it alone and asks for the layout migration", async () => {
    const { harnixRoot } = await project();
    const epicId = "20260801-090000-flat-epic";
    await mkdir(join(harnixRoot, "epics"), { recursive: true });
    await writeFile(join(harnixRoot, "epics", `${epicId}.json`), JSON.stringify(buildEpic({ id: epicId })));
    await saveAll(harnixRoot, [terminalTask("20260801-100000-flat-member", { endedDaysAgo: 60, epicId })]);

    const plan = await planArchive(harnixRoot, options);

    expect(plan.epics).toEqual([]);
    expect(plan.skipped).toContainEqual({ kind: "epic", id: epicId, reason: "legacy-layout" });
  });
});

describe("applying an archive", () => {
  it("moves tasks and whole epics into _archive with their content intact and reports them", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [
      terminalTask(OLD, { endedDaysAgo: 40 }),
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId }),
      terminalTask(RECENT, { endedDaysAgo: 2 }),
    ]);
    const before = await readFile(join(await resolveTaskDirectory(harnixRoot, OLD), "task.json"), "utf8");

    const result = await applyArchive(harnixRoot, await planArchive(harnixRoot, options));

    expect(result).toEqual({ tasks: [OLD], epics: [epicId], failed: [] });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("archive");
    expect((await locateTask(harnixRoot, "20260801-100000-d1"))?.kind).toBe("archive");
    expect((await locateTask(harnixRoot, RECENT))?.kind).toBe("bucket");
    expect(await readFile(join(harnixRoot, "tasks", "_archive", "2026-08", OLD, "task.json"), "utf8")).toBe(before);
    expect(await readFile(join(harnixRoot, "epics", "_archive", "2026-08", epicId, "epic.json"), "utf8")).toContain(
      epicId,
    );
    expect((await planArchive(harnixRoot, options)).tasks).toEqual([]);
  });

  it("finishes an epic whose archive was interrupted after its members moved", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId }),
      terminalTask("20260801-110000-d2", { endedDaysAgo: 60, epicId }),
    ]);
    await mkdir(join(harnixRoot, "tasks", "_archive", "2026-08"), { recursive: true });
    await rename(
      join(harnixRoot, "tasks", "2026-08", "20260801-100000-d1"),
      join(harnixRoot, "tasks", "_archive", "2026-08", "20260801-100000-d1"),
    );

    const plan = await planArchive(harnixRoot, options);
    expect(plan.epics).toEqual([epicId]);
    expect(plan.epicMembers[epicId]).toEqual(["20260801-110000-d2"]);

    const result = await applyArchive(harnixRoot, plan);

    expect(result.failed).toEqual([]);
    expect((await locateTask(harnixRoot, "20260801-110000-d2"))?.kind).toBe("archive");
    expect(await readFile(join(harnixRoot, "epics", "_archive", "2026-08", epicId, "epic.json"), "utf8")).toContain(
      epicId,
    );
  });

  it("reports a move that fails and leaves that task where it is", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [terminalTask(OLD, { endedDaysAgo: 40 })]);
    const failing = (): Promise<void> => Promise.reject(Object.assign(new Error("locked"), { code: "EPERM" }));

    const result = await applyArchive(harnixRoot, await planArchive(harnixRoot, options), { rename: failing });

    expect(result).toEqual({ tasks: [], epics: [], failed: [`task ${OLD}: rename failed (EPERM)`] });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("bucket");
  });
});

describe("restoring from the archive", () => {
  it("restores a task, and an epic together with its members, into the month bucket", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [
      terminalTask(OLD, { endedDaysAgo: 40 }),
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId }),
      terminalTask("20260801-110000-d2", { endedDaysAgo: 60, epicId }),
    ]);
    await applyArchive(harnixRoot, await planArchive(harnixRoot, options));

    expect(await restoreFromArchive(harnixRoot, OLD)).toEqual({ kind: "task", restored: [OLD] });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("bucket");

    await expect(restoreFromArchive(harnixRoot, "20260801-100000-d1")).rejects.toThrow(epicId);
    expect(await restoreFromArchive(harnixRoot, epicId)).toEqual({
      kind: "epic",
      restored: [epicId, "20260801-100000-d1", "20260801-110000-d2"],
    });
    expect((await locateTask(harnixRoot, "20260801-110000-d2"))?.kind).toBe("bucket");
    expect(await readFile(join(harnixRoot, "epics", "2026-08", epicId, "epic.json"), "utf8")).toContain(epicId);
  });

  it("rejects an ID that is not archived and a restore that would overwrite", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [terminalTask(OLD, { endedDaysAgo: 40 })]);
    await expect(restoreFromArchive(harnixRoot, OLD)).rejects.toThrow("not in the archive");
    await expect(restoreFromArchive(harnixRoot, "20260101-000000-missing")).rejects.toThrow("not in the archive");
    await applyArchive(harnixRoot, await planArchive(harnixRoot, options));
    await mkdir(join(harnixRoot, "tasks", "2026-08", OLD), { recursive: true });
    await expect(restoreFromArchive(harnixRoot, OLD)).rejects.toThrow("destination exists");
  });
});

describe("review regressions", () => {
  it("keeps a live copy of an archived ID live, reports the duplicate and does not move it", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [terminalTask(OLD, { endedDaysAgo: 40 })]);
    await applyArchive(harnixRoot, await planArchive(harnixRoot, options));
    await cp(join(harnixRoot, "tasks", "_archive", "2026-08", OLD), join(harnixRoot, "tasks", "2026-08", OLD), {
      recursive: true,
    });

    const plan = await planArchive(harnixRoot, options);

    expect(plan.tasks).toEqual([]);
    expect(plan.skipped).toContainEqual({ kind: "task", id: OLD, reason: "archived-copy-exists" });
  });

  it("holds back an epic with a duplicated member", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId }),
      terminalTask("20260801-110000-d2", { endedDaysAgo: 60, epicId }),
    ]);
    const member = "20260801-100000-d1";
    await mkdir(join(harnixRoot, "tasks", "_archive", "2026-08"), { recursive: true });
    await cp(join(harnixRoot, "tasks", "2026-08", member), join(harnixRoot, "tasks", "_archive", "2026-08", member), {
      recursive: true,
    });

    const plan = await planArchive(harnixRoot, options);

    expect(plan.epics).toEqual([]);
    expect(plan.skipped).toContainEqual({ kind: "epic", id: epicId, reason: "archived-copy-exists" });
  });

  it("finishes an epic restore that failed on a member when it is run again", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [
      terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId }),
      terminalTask("20260801-110000-d2", { endedDaysAgo: 60, epicId }),
    ]);
    await applyArchive(harnixRoot, await planArchive(harnixRoot, options));
    const failOnSecond = (source: string, destination: string): Promise<void> =>
      destination.includes("d2")
        ? Promise.reject(Object.assign(new Error("io"), { code: "EIO" }))
        : rename(source, destination);

    await expect(restoreFromArchive(harnixRoot, epicId, { rename: failOnSecond })).rejects.toThrow("Cannot restore");
    expect((await locateTask(harnixRoot, "20260801-100000-d1"))?.kind).toBe("bucket");
    expect((await locateTask(harnixRoot, "20260801-110000-d2"))?.kind).toBe("archive");

    const resumed = await restoreFromArchive(harnixRoot, epicId);

    expect(resumed).toEqual({ kind: "epic", restored: [epicId, "20260801-110000-d2"] });
    expect((await locateTask(harnixRoot, "20260801-110000-d2"))?.kind).toBe("bucket");
    expect(await readFile(join(harnixRoot, "epics", "2026-08", epicId, "epic.json"), "utf8")).toContain(epicId);
  });

  it("holds back an epic that has a member whose record cannot be read", async () => {
    const { root, harnixRoot } = await project();
    const epicId = "20260801-090000-done-epic";
    await upsertEpic(root, buildEpic({ id: epicId }));
    await saveAll(harnixRoot, [terminalTask("20260801-100000-d1", { endedDaysAgo: 60, epicId })]);
    const broken = join(harnixRoot, "tasks", "2026-08", "20260801-120000-broken");
    await mkdir(broken, { recursive: true });
    await writeFile(join(broken, "task.json"), `{ "epicId": "${epicId}", not json`);

    const plan = await planArchive(harnixRoot, options);

    expect(plan.epics).toEqual([]);
    expect(plan.skipped).toContainEqual({ kind: "epic", id: epicId, reason: "unreadable-member" });
    expect(plan.invalid).toEqual(["20260801-120000-broken"]);
  });

  it("does not move a task that became active after the plan was made", async () => {
    const { harnixRoot } = await project();
    await saveAll(harnixRoot, [terminalTask(OLD, { endedDaysAgo: 40 })]);
    const plan = await planArchive(harnixRoot, options);
    await setActiveTask(harnixRoot, OLD);

    const result = await applyArchive(harnixRoot, plan);

    expect(result).toEqual({ tasks: [], epics: [], failed: [`task ${OLD}: became active`] });
    expect((await locateTask(harnixRoot, OLD))?.kind).toBe("bucket");
  });
});
