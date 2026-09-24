import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { upsertEpic, type EpicRecord } from "../../src/core/roadmaps/roadmap.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-roadmap-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("roadmap command", () => {
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

    await expect(runCli(["node", "harnix", "roadmap"])).resolves.toBe(0);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      total: 1,
      epics: [{ id: "my-epic", title: "Epic title", totalTasks: 1, completedTasks: 0, cancelledTasks: 0 }],
    });
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

    await expect(runCli(["node", "harnix", "roadmap", "--id", "detail-epic"])).resolves.toBe(0);

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

    await expect(runCli(["node", "harnix", "roadmap", "--id", "nonexistent-epic"])).resolves.toBe(2);

    const output = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""));
    expect(output).toMatchObject({ ok: false, error: { exitCode: 2 } });
  });
});

function epicRecord(id: string, title: string, goal: string): EpicRecord {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id,
    title,
    goal,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  };
}

function taskV2(id: string, status: TaskRecordV2["status"], epicId: string): TaskRecordV2 {
  return {
    generator: "harnix",
    schemaVersion: 2,
    id,
    title: "roadmap member",
    mode: "lite",
    status,
    checkpoint: status === "ready" ? "ready" : status === "in_progress" ? "implementing" : "planning",
    goal: "test",
    nonGoals: [],
    epicId,
    acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
    evidence: [],
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  };
}
