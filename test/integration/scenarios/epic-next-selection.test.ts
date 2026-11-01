import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { upsertEpic } from "src/core/epics/epic.js";
import { saveTask } from "src/core/tasks/task.js";
import { buildEpic, buildTaskV3 } from "test/support/builders.js";
import { linkDirectory } from "test/support/symlink-support.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-epic-next-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

async function seed(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  const harnixRoot = join(root, ".harnix");
  for (const [epicId, taskId] of [
    ["20260101-000000-old", "20260101-000001-old-task"],
    ["20260301-000000-new", "20260301-000001-new-task"],
  ] as const) {
    await upsertEpic(root, buildEpic({ id: epicId, title: epicId, goal: "goal" }));
    await saveTask(harnixRoot, buildTaskV3({ id: taskId, title: "member", status: "planning", epicId }));
  }
  // Newest id, but unreadable: it must be skipped with a notice, never stop the scan.
  const broken = join(harnixRoot, "epics", "20260401-000000-broken");
  await mkdir(broken, { recursive: true });
  await writeFile(join(broken, "epic.json"), "{ not json");
  process.chdir(root);
  return root;
}

function capture(): { out: () => string; err: () => string } {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  return {
    out: () => stdout.mock.calls.map((call) => String(call[0])).join(""),
    err: () => stderr.mock.calls.map((call) => String(call[0])).join(""),
  };
}

describe.sequential("newest epic selection", () => {
  it("status picks the newest epic with work and notes the unreadable one instead of stopping", async () => {
    await seed();
    const io = capture();
    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);
    expect(JSON.parse(io.out()).epicContext).toMatchObject({ id: "20260301-000000-new" });
    expect(io.err()).toContain("notice: epic 20260401-000000-broken cannot be read");
  });

  it("resume --next skips the unreadable epic and resumes the newest readable one", async () => {
    await seed();
    const io = capture();
    await expect(runCli(["node", "harnix", "resume", "--next", "--brief"])).resolves.toBe(0);
    expect(JSON.parse(io.out())).toMatchObject({ id: "20260301-000001-new-task" });
    expect(io.err()).toContain("notice: epic 20260401-000000-broken cannot be read");
  });

  it("epic list orders by date prefix, puts legacy ids last and reports unreadable epics on stderr", async () => {
    const root = await seed();
    await upsertEpic(root, buildEpic({ id: "zz-legacy", title: "legacy", goal: "goal" }));
    const io = capture();
    await expect(runCli(["node", "harnix", "epic"])).resolves.toBe(0);
    const output = JSON.parse(io.out()) as { total: number; epics: { id: string }[] };
    expect(output.epics.map((epic) => epic.id)).toEqual(["20260301-000000-new", "20260101-000000-old", "zz-legacy"]);
    expect(output.total).toBe(3);
    expect(io.err()).toContain("notice: epic 20260401-000000-broken cannot be read");
  });

  it("status without an active task stays best-effort when the epics directory leaves the root, resume --next reports it", async () => {
    const root = await seed();
    const outside = await temporaryRepository();
    await rename(join(root, ".harnix", "epics"), join(outside, "epics"));
    await linkDirectory(join(outside, "epics"), join(root, ".harnix", "epics"));
    const io = capture();

    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);
    expect(JSON.parse(io.out()).epicContext).toBeUndefined();

    process.exitCode = undefined;
    await expect(runCli(["node", "harnix", "resume", "--next", "--brief"])).resolves.not.toBe(0);
    expect(io.err()).toMatch(/escapes the project root/u);
  });
});
