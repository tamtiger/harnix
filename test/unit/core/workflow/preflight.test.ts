import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { finishWorkflow } from "src/core/workflow/finish.js";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { saveTask, setActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { sha256 } from "src/utils/hashing.js";
import { at } from "test/support/builders.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { initializeUtcProject, writeProjectSource, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow preflight", () => {
  it("returns learning notes only when the next stage is plan", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await writeJournalFile(journal, "2026-09-29.jsonl", [
      buildLearningEntry({ id: "obs-note", status: "candidate", statement: "Prefer builders over hand-built records" }),
    ]);
    const now = Date.parse(at(60));

    expect((await preflightWorkflow(root, now)).learning.map((item) => item.id)).toEqual(["obs-note"]);

    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    expect((await preflightWorkflow(root, now)).learning.map((item) => item.id)).toEqual(["obs-note"]);

    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    const active = {
      ...ready,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: active });

    const implementing = await preflightWorkflow(root, now);
    expect(implementing.nextStage).toBe("implement");
    expect(implementing.learning).toEqual([]);
  });

  it("returns bounded read-only preflight metadata without task prose", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), title: "PRIVATE_TITLE_CANARY", goal: "PRIVATE_GOAL_CANARY" };
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    const active = {
      ...ready,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
    };
    await saveWorkflow(root, { task: active });
    const taskPath = join(root, ".harnix", "tasks", active.id, "task.json");
    const pointerPath = join(root, ".harnix", "tasks", ".active");
    const before = await Promise.all([readFile(taskPath, "utf8"), readFile(pointerPath, "utf8")]);

    const result = await preflightWorkflow(root);

    expect(result).toEqual({
      learning: [],
      clock: {
        timezone: "UTC",
        now: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+\+00:00$/u),
        idPrefix: expect.stringMatching(/^\d{8}-\d{6}$/u),
      },
      generator: "harnix",
      schemaVersion: 1,
      activeTask: { id: active.id, mode: "lite", status: "in_progress", checkpoint: "implementing" },
      contextDrift: "not-recorded",
      requiredChecks: { passed: [], failed: [], stale: [], pending: ["check"] },
      retryLimitReached: [],
      nextStage: "implement",
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
    await expect(Promise.all([readFile(taskPath, "utf8"), readFile(pointerPath, "utf8")])).resolves.toEqual(before);
  });

  it("does not infer implementation authority from a persisted ready task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, {
      task: { ...planning, status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
    });

    await expect(preflightWorkflow(root)).resolves.toMatchObject({ nextStage: "await" });
  });

  it("routes stale active context to continuation before implementation", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "tracked.md"), "new content");
    const active = taskV3("in_progress", "implementing");
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);
    await writeFile(
      join(root, ".harnix", "tasks", active.id, "context.json"),
      `${JSON.stringify(
        {
          generator: "harnix",
          schemaVersion: 1,
          taskId: active.id,
          maxCharacters: 1000,
          entries: [
            {
              path: "tracked.md",
              reason: "test",
              priority: 0,
              pinned: false,
              states: [],
              contentHash: sha256("old content"),
            },
          ],
          omitted: [],
        },
        null,
        2,
      )}\n`,
    );

    await expect(preflightWorkflow(root)).resolves.toMatchObject({ contextDrift: "stale", nextStage: "plan" });
  });

  it("short-circuits stale-context routing before verification snapshot inspection", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "tracked.md"), "new content");
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
      evidence: [
        {
          id: "pass-without-sidecar",
          checkId: "check",
          recordedAt: "2026-08-13T00:02:00.000Z",
          result: "pass",
          exitCode: 0,
          summary: "green",
          artifactPaths: [],
          inputDigest: "a".repeat(64),
        },
      ],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);
    await writeFile(
      join(root, ".harnix", "tasks", active.id, "context.json"),
      `${JSON.stringify(
        {
          generator: "harnix",
          schemaVersion: 1,
          taskId: active.id,
          maxCharacters: 1000,
          entries: [
            {
              path: "tracked.md",
              reason: "test",
              priority: 0,
              pinned: false,
              states: [],
              contentHash: sha256("old content"),
            },
          ],
          omitted: [],
        },
        null,
        2,
      )}\n`,
    );

    await expect(preflightWorkflow(root, Date.parse("2026-08-13T00:03:00.000Z"))).resolves.toMatchObject({
      contextDrift: "stale",
      requiredChecks: { pending: ["check"], stale: [] },
      nextStage: "plan",
    });
  });

  it("stops instead of routing back to debug after a second identical failed check", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const digest = "a".repeat(64);
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
      evidence: [
        {
          id: "failed-1",
          checkId: "check",
          recordedAt: "2026-08-13T00:01:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "same failure",
          artifactPaths: [],
          inputDigest: digest,
        },
        {
          id: "failed-2",
          checkId: "check",
          recordedAt: "2026-08-13T00:02:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: " Same   failure ",
          artifactPaths: [],
          inputDigest: digest,
        },
      ],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);

    await expect(preflightWorkflow(root)).resolves.toMatchObject({
      requiredChecks: { failed: ["check"] },
      retryLimitReached: ["check"],
      nextStage: "stop",
    });
  });

  it("does not let a future-dated pass reset the verification retry breaker", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const digest = "a".repeat(64);
    const active: TaskRecordV3 = {
      ...taskV3("verifying", "verifying"),
      evidence: [
        {
          id: "failed-1",
          checkId: "check",
          recordedAt: "2026-08-13T00:01:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "first",
          artifactPaths: [],
          inputDigest: digest,
        },
        {
          id: "future-pass",
          checkId: "check",
          recordedAt: "2026-08-14T00:00:00.000Z",
          result: "pass",
          exitCode: 0,
          summary: "future",
          artifactPaths: [],
          inputDigest: digest,
        },
        {
          id: "failed-2",
          checkId: "check",
          recordedAt: "2026-08-13T00:02:00.000Z",
          result: "fail",
          exitCode: 1,
          summary: "second",
          artifactPaths: [],
          inputDigest: digest,
        },
      ],
    };
    await saveTask(join(root, ".harnix"), active);
    await setActiveTask(join(root, ".harnix"), active.id);

    await expect(preflightWorkflow(root, Date.parse("2026-08-13T00:03:00.000Z"))).resolves.toMatchObject({
      requiredChecks: { stale: ["check"] },
      retryLimitReached: ["check"],
      nextStage: "stop",
    });
  });

  it("routes finishing to verify whether or not acceptance completion is ready", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const now = Date.parse("2026-08-13T00:03:00.000Z");
    await writeProjectSource(root);
    const base = taskV3("verifying", "finishing");
    const pass = {
      id: "pass-1",
      checkId: "check",
      recordedAt: "2026-08-13T00:02:00.000Z",
      result: "pass" as const,
      exitCode: 0,
      summary: "green",
      artifactPaths: [],
      inputDigest: (await computeInputDigest(root, base, "check")).inputDigest,
    };
    const pendingCriterion = { ...base, evidence: [pass] };
    await saveTask(join(root, ".harnix"), pendingCriterion);
    await setActiveTask(join(root, ".harnix"), pendingCriterion.id);

    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({
      requiredChecks: { passed: ["check"] },
      nextStage: "verify",
    });
    await expect(finishWorkflow(root, new Date(now).toISOString())).rejects.toThrow(
      /fresh complete verification|completion|fresh required evidence/iu,
    );

    const noRequired = {
      ...pendingCriterion,
      acceptanceCriteria: [],
      validationPlan: [],
      evidence: [],
      updatedAt: "2026-08-13T00:02:30.000Z",
    };
    await saveTask(join(root, ".harnix"), noRequired);
    await expect(preflightWorkflow(root, now)).resolves.toMatchObject({
      requiredChecks: { passed: [] },
      nextStage: "verify",
    });
  });
});

describe("workflow preflight version skew", () => {
  async function projectWithRecordedVersion(version: string): Promise<string> {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const entry = {
      path: "AGENTS.md",
      sourceId: "agents-bootstrap",
      scope: "project",
      generatedHash: "0".repeat(64),
      generatorVersion: version,
    };
    await writeFile(
      join(root, ".harnix", ".template-hashes.json"),
      JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [entry] }),
    );
    return root;
  }

  it("names both versions and the fix when the running CLI is older than the project", async () => {
    const root = await projectWithRecordedVersion("2.2.0-dev.11");

    const result = await preflightWorkflow(root, Date.now(), "2.0.4");

    expect(result.versionSkew).toMatch(/2\.0\.4[\s\S]*2\.2\.0-dev\.11[\s\S]*reinstall/u);
  });

  it.each([
    ["equal", "2.2.0", "2.2.0"],
    ["newer", "2.1.0", "2.2.0"],
    ["a release over its pre-release", "2.2.0-dev.11", "2.2.0"],
  ])("adds nothing when the CLI is %s", async (_name, recorded, running) => {
    const root = await projectWithRecordedVersion(recorded);

    expect("versionSkew" in (await preflightWorkflow(root, Date.now(), running))).toBe(false);
  });

  it("adds nothing for a newer CLI, or without a running version", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    expect("versionSkew" in (await preflightWorkflow(root, Date.now(), "99.0.0"))).toBe(false);
    expect("versionSkew" in (await preflightWorkflow(await projectWithRecordedVersion("9.9.9")))).toBe(false);
  });
});
