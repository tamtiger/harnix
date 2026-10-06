import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertFlagGroups } from "src/commands/workflow-flags.js";
import { upsertEpic } from "src/core/epics/epic.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { clearActiveTask } from "src/core/tasks/task-store.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { buildEpic } from "test/support/builders.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function writeTestProject(root: string, ...extraFiles: string[]): Promise<void> {
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  await mkdir(join(root, "test"), { recursive: true });
  await writeFile(join(root, "test", "sample.test.ts"), "");
  for (const file of extraFiles) await writeFile(join(root, file), "");
}

describe("initTaskWorkflow", () => {
  it("should create a valid TaskRecord v3 and set it as active task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    const task = await initTaskWorkflow(root, {
      title: "Fix Payment Portal Lint",
    });

    expect(task.schemaVersion).toBe(3);
    expect(task.title).toBe("Fix Payment Portal Lint");
    expect(task.mode).toBe("lite");
    expect(task.status).toBe("planning");
    expect(task.checkpoint).toBe("planning");
    expect(task.acceptanceCriteria).toHaveLength(1);
    expect(task.acceptanceCriteria[0]?.text).toBe("Fix Payment Portal Lint");
    expect(task.validationPlan).toHaveLength(1);
    expect(task.validationPlan[0]?.required).toBe(true);

    const active = await resolveActiveTask(`${root}/.harnix`);
    expect(active?.id).toBe(task.id);
  });

  it("should support custom mode, goal, criterion text, command, and inputs", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const task = await initTaskWorkflow(root, {
      title: "Add Microservice Gateway",
      mode: "full",
      goal: "Implement API Gateway",
      criterion: "Gateway routes payment requests correctly",
      command: "dotnet test services/gateway",
      input: ["services/gateway/**"],
    });

    expect(task.mode).toBe("full");
    expect(task.goal).toBe("Implement API Gateway");
    expect(task.acceptanceCriteria[0]?.text).toBe("Gateway routes payment requests correctly");
    expect(task.validationPlan[0]?.command).toBe("dotnet test services/gateway");
    expect(task.validationPlan[0]?.inputs).toEqual(["services/gateway/**"]);
  });

  it("should reject an empty title", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(initTaskWorkflow(root, { title: "" })).rejects.toThrow(/--title/u);
    await expect(initTaskWorkflow(root, { title: "   " })).rejects.toThrow(/--title/u);
  });

  it("should inherit relevantPaths, relevantSpecs and epicId from followUp task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);
    const { saveWorkflow } = await import("src/core/workflow/save.js");
    const { clearActiveTask } = await import("src/core/tasks/task-store.js");

    const parent = await initTaskWorkflow(root, {
      title: "Base Payment Service",
    });
    // Add paths and epicId to parent task
    await saveWorkflow(root, {
      task: {
        ...parent,
        relevantPaths: ["src/payments/**"],
        relevantSpecs: ["spec/payment.md"],
        epicId: "20261005-153000-concurrency-and-token-optimization",
      },
    });
    await clearActiveTask(`${root}/.harnix`, parent.id);

    const followUp = await initTaskWorkflow(root, {
      title: "Refund Service Extension",
      followUp: parent.id,
    });

    expect(followUp.relevantPaths).toEqual(["src/payments/**"]);
    expect(followUp.relevantSpecs).toEqual(["spec/payment.md"]);
    expect(followUp.epicId).toBe("20261005-153000-concurrency-and-token-optimization");
    expect(followUp.followUpOf).toBe(parent.id);
  });

  describe("epic and follow-up lineage", () => {
    const epic = (id: string) => buildEpic({ id });

    async function project() {
      const root = await temporaryRepository();
      await initializeUtcProject(root);
      await writeTestProject(root);
      return root;
    }

    it("attaches the new task to an existing epic and regenerates the epic page", async () => {
      const root = await project();
      await upsertEpic(root, epic("20261006-100000-lineage-epic"));

      const task = await initTaskWorkflow(root, { title: "Member Task", epic: "20261006-100000-lineage-epic" });

      expect(task.epicId).toBe("20261006-100000-lineage-epic");
      const page = await readFile(join(root, ".harnix", "epics", "20261006-100000-lineage-epic.md"), "utf8");
      expect(page).toContain(task.id);
    });

    it("refuses an unknown or unsafe epic before creating anything", async () => {
      const root = await project();

      await expect(initTaskWorkflow(root, { title: "Member Task", epic: "20261006-100000-missing" })).rejects.toThrow(
        /epic .*not found/iu,
      );
      await expect(initTaskWorkflow(root, { title: "Member Task", epic: "../escape" })).rejects.toThrow(/epic id/iu);
      expect(await resolveActiveTask(`${root}/.harnix`)).toBeUndefined();
    });

    it("records followUpOf and inherits the parent epic only when it has one", async () => {
      const root = await project();
      const parent = await initTaskWorkflow(root, { title: "Parent Task" });
      await clearActiveTask(`${root}/.harnix`, parent.id);

      const child = await initTaskWorkflow(root, { title: "Child Task", followUp: parent.id });

      expect(child.followUpOf).toBe(parent.id);
      expect(child.epicId).toBeUndefined();
    });

    it("accepts --epic together with a follow-up of the same epic and refuses a different one", async () => {
      const root = await project();
      await upsertEpic(root, epic("20261006-100000-lineage-epic"));
      await upsertEpic(root, epic("20261006-100001-other-epic"));
      const parent = await initTaskWorkflow(root, { title: "Parent Task", epic: "20261006-100000-lineage-epic" });
      await clearActiveTask(`${root}/.harnix`, parent.id);

      const same = await initTaskWorkflow(root, {
        title: "Same Epic Child",
        followUp: parent.id,
        epic: "20261006-100000-lineage-epic",
      });
      await clearActiveTask(`${root}/.harnix`, same.id);

      expect(same).toMatchObject({ followUpOf: parent.id, epicId: "20261006-100000-lineage-epic" });
      await expect(
        initTaskWorkflow(root, { title: "Other Epic Child", followUp: parent.id, epic: "20261006-100001-other-epic" }),
      ).rejects.toThrow(/conflicts/iu);
    });
  });

  it("should reject followUp if specified task does not exist", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    await expect(
      initTaskWorkflow(root, {
        title: "Refund Service Extension",
        followUp: "20261005-000000-non-existent-task",
      }),
    ).rejects.toThrow(/follow-up task.*not found/iu);
  });

  it("takes the default command and inputs from the detected project test command", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    const task = await initTaskWorkflow(root, { title: "Defaults" });

    expect(task.validationPlan[0]?.command).toBe("npm run test");
    expect(task.validationPlan[0]?.inputs).toEqual(["**"]);
  });

  it("asks for --command instead of inventing one when no test command is detected", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(initTaskWorkflow(root, { title: "No tests" })).rejects.toThrow(/--command/u);
  });

  it("rejects a mode that is neither lite nor full", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    await expect(initTaskWorkflow(root, { title: "Bad mode", mode: "ful" as never })).rejects.toThrow(/--mode/u);
  });

  it("never ends the slug with a hyphen after truncation", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    const task = await initTaskWorkflow(root, { title: `${"x".repeat(39)} tail` });

    expect(task.id).toMatch(/^\d{8}-\d{6}-x{39}$/u);
  });

  it("derives the id prefix from the clock in the configured zone", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);

    const task = await initTaskWorkflow(root, { title: "Clocked", injectedNow: "2026-10-06T01:02:03.000Z" });

    expect(task.id).toBe("20261006-010203-clocked");
  });
});

describe("initTaskWorkflow slug", () => {
  async function project(): Promise<string> {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeTestProject(root);
    return root;
  }

  it("requires an English --slug when the title is not plain ASCII", async () => {
    const root = await project();

    await expect(initTaskWorkflow(root, { title: "Chuẩn hóa ID" })).rejects.toThrow(/--slug <english-kebab-case>/u);
  });

  it("uses a valid --slug for the task id and keeps the Vietnamese title", async () => {
    const root = await project();

    const task = await initTaskWorkflow(root, { title: "Chuẩn hóa ID", slug: "normalize-id" });

    expect(task.id).toMatch(/^\d{8}-\d{6}-normalize-id$/u);
    expect(task.title).toBe("Chuẩn hóa ID");
  });

  it.each(["Bad Slug", "-x", "a--b", "x-", "a".repeat(61)])("rejects the malformed slug %s", async (slug) => {
    const root = await project();

    await expect(initTaskWorkflow(root, { title: "Plain title", slug })).rejects.toThrow(/--slug/u);
  });

  it("still derives the slug from an ASCII title", async () => {
    const root = await project();

    expect((await initTaskWorkflow(root, { title: "Plain Title" })).id).toMatch(/-plain-title$/u);
  });
});

describe("--slug flag ownership", () => {
  it("belongs to --init only", () => {
    expect(() => assertFlagGroups("init", { slug: "x" })).not.toThrow();
    expect(() => assertFlagGroups("inspect", { slug: "x" })).toThrow(/--slug requires workflow --init/u);
  });
});
