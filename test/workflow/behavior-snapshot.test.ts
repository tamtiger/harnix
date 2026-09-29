import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { detailPublicEpic, listPublicEpics } from "../../src/commands/epic.js";
import { initializeProject } from "../../src/commands/init.js";
import {
  appendEvidenceWorkflow,
  cancelWorkflow,
  finishWorkflow,
  inspectWorkflow,
  preflightWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "../../src/commands/internal-workflow.js";
import { inspectProjectStatus } from "../../src/commands/status.js";
import { listProjectTasks } from "../../src/commands/tasks.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import type { TaskRecord, TaskRecordV3 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

/**
 * Pure-refactor guard. The golden file was generated from the code as it stood before the
 * `restructure-code` task and must never be regenerated to make a refactor pass; set
 * HARNIX_UPDATE_GOLDEN=1 only when a deliberate, reviewed behavior change requires it.
 */
const goldenPath = join(process.cwd(), "test", "workflow", "behavior-snapshot.golden.json");
const temporaryRepository = useTemporaryRepositories("harnix-golden-");
const VN = "Asia/Ho_Chi_Minh";
const at = (minute: number): string => `2026-09-29T09:${String(minute).padStart(2, "0")}:00.000+07:00`;
const fixedNowMs = Date.parse(at(30));

function task(id: string, overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return {
    generator: "harnix",
    schemaVersion: 3,
    id,
    title: `Task ${id}`,
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    goal: "Golden goal",
    nonGoals: ["No extras"],
    acceptanceCriteria: [{ id: "ac-one", text: "One", status: "pending", evidenceIds: [] }],
    relevantPaths: ["src/a.ts"],
    relevantSpecs: [],
    validationPlan: [
      {
        id: "check",
        description: "Unit tests",
        scope: "focused",
        required: true,
        command: "pnpm test",
        criterionIds: ["ac-one"],
        inputs: ["src/**"],
      },
    ],
    evidence: [],
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides,
  };
}

async function tree(harnixRoot: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(directory: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((left, right) => (left.name < right.name ? -1 : 1))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else
        files[relative(harnixRoot, path).replaceAll("\\", "/")] = (await readFile(path, "utf8")).replaceAll(
          "\r\n",
          "\n",
        );
    }
  }
  for (const part of ["tasks", "epics", "workspace"]) await walk(join(harnixRoot, part));
  return files;
}

async function scenario(): Promise<unknown> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  const configPath = join(root, ".harnix", "config.yaml");
  await writeConfig(configPath, { ...(await readConfig(configPath)), timezone: VN });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");

  const log: { step: string; result?: unknown; error?: string }[] = [];
  async function step(name: string, action: () => Promise<unknown>): Promise<unknown> {
    try {
      const result = await action();
      log.push({ step: name, result });
      return result;
    } catch (error: unknown) {
      log.push({ step: name, error: error instanceof Error ? error.message : String(error) });
      return undefined;
    }
  }

  const epic = {
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    id: "golden-epic",
    title: "Golden epic",
    goal: "Epic goal",
    nonGoals: ["Nothing else"],
    createdAt: at(0),
    updatedAt: at(0),
  };
  const first = "20260929-090000-golden-one";
  const second = "20260929-090100-golden-two";
  const full = "20260929-090200-golden-full";

  await step("preflight-empty", () => preflightWorkflow(root, fixedNowMs));
  await step("save-first", () =>
    saveWorkflow(root, {
      task: task(first, { epicId: "golden-epic" }),
      epic,
      epicMembers: [task(second, { epicId: "golden-epic" })],
    }),
  );
  await step("inspect", () => inspectWorkflow(root));
  await step("illegal-jump", () => transitionWorkflow(root, "verifying", "verifying", at(1)));
  await step("ready", () => transitionWorkflow(root, "ready", "ready", at(2)));
  await step("preflight-ready", () => preflightWorkflow(root, fixedNowMs));
  await step("in-progress", () => transitionWorkflow(root, "in_progress", "implementing", at(3)));
  await step("verifying", () => transitionWorkflow(root, "verifying", "verifying", at(4)));
  const snapshot = (await step("snapshot", () => snapshotWorkflow(root, "check"))) as { inputDigest: string };
  await step("bad-evidence", () =>
    appendEvidenceWorkflow(
      root,
      {
        evidence: {
          id: "ev-bad",
          checkId: "check",
          recordedAt: at(5),
          result: "pass",
          exitCode: 0,
          summary: "bad digest",
          artifactPaths: [],
          inputDigest: "b".repeat(64),
        },
      },
      at(5),
    ),
  );
  await step("evidence", () =>
    appendEvidenceWorkflow(
      root,
      {
        evidence: {
          id: "ev-check",
          checkId: "check",
          recordedAt: at(6),
          result: "pass",
          exitCode: 0,
          summary: "pnpm test passed",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      },
      at(6),
    ),
  );
  await step("finishing", () => transitionWorkflow(root, "verifying", "finishing", at(7)));
  const active = (await inspectWorkflow(root)).activeTask as TaskRecord;
  await step("criteria-met", () =>
    saveWorkflow(root, {
      task: {
        ...active,
        acceptanceCriteria: [{ id: "ac-one", text: "One", status: "met", evidenceIds: ["ev-check"] }],
        updatedAt: at(8),
      },
    }),
  );
  await step("preflight-finishing", () => preflightWorkflow(root, fixedNowMs));
  await step("finish", () => finishWorkflow(root, at(9)));

  await step("save-second-active", () => saveWorkflow(root, { task: task(second, { epicId: "golden-epic" }) }));
  await step("cancel", () => cancelWorkflow(root, { reason: "Golden cancellation", authorizedBy: "user" }, at(10)));

  await step("save-full", () =>
    saveWorkflow(root, {
      task: task(full, { mode: "full" }),
      artifacts: { prd: "# PRD\n", plan: "- [ ] Step one\n" },
    }),
  );
  await step("full-ready", () => transitionWorkflow(root, "ready", "ready", at(11)));
  await step("full-in-progress", () => transitionWorkflow(root, "in_progress", "implementing", at(12)));
  const fullActive = (await inspectWorkflow(root)).activeTask as TaskRecordV3;
  await step("revision-one-step", () =>
    saveWorkflow(root, {
      task: {
        ...fullActive,
        checkpoint: "replan",
        updatedAt: at(13),
        acceptanceCriteria: [{ id: "ac-one", text: "One, revised", status: "pending", evidenceIds: [] }],
      },
      contractRevision: { reason: "Golden revision reason for the snapshot." },
    }),
  );
  const revised = (await inspectWorkflow(root)).activeTask as TaskRecordV3;
  await step("revision-reenter-ready", () =>
    saveWorkflow(root, { task: { ...revised, status: "ready", checkpoint: "ready", updatedAt: at(14) } }),
  );
  await step("schema", async () => workflowEnvelopeSchema());
  await step("status", () => inspectProjectStatus(root, fixedNowMs));
  await step("tasks", () => listProjectTasks(root, { limit: 20 }));
  await step("epics", () => listPublicEpics(root, 20));
  await step("epic-detail", () => detailPublicEpic(root, "golden-epic"));
  await step("epic-missing", () => detailPublicEpic(root, "missing-epic"));

  return { log, files: await tree(join(root, ".harnix")) };
}

describe("behavior snapshot", () => {
  it("keeps workflow, status, task and epic outputs and written files identical to the golden", async () => {
    const actual = JSON.parse(JSON.stringify(await scenario())) as unknown;
    if (process.env.HARNIX_UPDATE_GOLDEN === "1") {
      await writeFile(goldenPath, `${JSON.stringify(actual, null, 2)}\n`);
      return;
    }
    const golden = JSON.parse(await readFile(goldenPath, "utf8")) as unknown;

    expect(actual).toEqual(golden);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(golden));
  });
});
