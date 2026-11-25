import { readFile } from "node:fs/promises";

import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

import { renderPlanTemplate, renderPrdTemplate } from "./artifact-templates.js";
import { activeV3 } from "./plan-edit.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

export type ScaffoldDoc = "prd.md" | "plan.md";

export interface ScaffoldDocsOptions {
  /** Text for `prd.md` (the `--prd-file` content); when neither document is given both are generated. */
  prd?: string | undefined;
  /** Text for `plan.md` (the `--plan-file` content). */
  plan?: string | undefined;
  /** Replace a document that has content of its own (`--force`). */
  force?: boolean | undefined;
}

export interface ScaffoldDocsResult {
  task: TaskRecordV3;
  /** The documents this call wrote. */
  written: ScaffoldDoc[];
}

const normalize = (text: string): string => text.replace(/\r\n/gu, "\n").trim();

async function readDocument(taskDirectory: string, name: ScaffoldDoc): Promise<string> {
  return await readFile(await resolveSafeProjectPath(taskDirectory, name), "utf8").catch(() => "");
}

function assertScaffoldable(task: TaskRecordV3): void {
  if (task.mode !== "full")
    throw new Error(
      "--scaffold-docs applies to a Full task: a Lite task has no prd.md or plan.md.\nGợi ý: tạo task Full bằng harnix workflow --init --mode full --title <t> --slug <s> (prd.md và plan.md được sinh sẵn).",
    );
  if (task.status !== "planning")
    throw new Error(
      `--scaffold-docs works only while the task is planning (this one is ${task.status}).\nGợi ý: sửa nghĩa vụ bằng --set-criterion hoặc --set-check kèm --reason để đưa task về replan, rồi chạy lại.`,
    );
}

/**
 * Writes the `prd.md` and `plan.md` of a Full task that is still planning, from the criteria and checks it has now, or
 * from the given texts, through the one save path. A document that is empty or still the generated scaffold of this very
 * task counts as untouched; any other content is somebody's work and is replaced only with `force`. Nothing is written
 * when any target is protected, so a refusal never leaves one document changed and the other not.
 */
export async function scaffoldDocsWorkflow(
  root: string,
  options: ScaffoldDocsOptions,
  injectedNow?: string,
): Promise<ScaffoldDocsResult> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  assertScaffoldable(task);
  const taskDirectory = await resolveTaskDirectory(await resolveSafeHarnixPath(root), task.id);
  const current = {
    prd: await readDocument(taskDirectory, "prd.md"),
    plan: await readDocument(taskDirectory, "plan.md"),
  };
  const generated = { prd: renderPrdTemplate(task), plan: renderPlanTemplate(task) };
  const given = options.prd !== undefined || options.plan !== undefined;
  const wanted = {
    prd: options.prd ?? (given ? undefined : generated.prd),
    plan: options.plan ?? (given ? undefined : generated.plan),
  };

  const written: ScaffoldDoc[] = [];
  const protectedDocs: ScaffoldDoc[] = [];
  const next = { prd: current.prd, plan: current.plan };
  for (const [key, name] of [
    ["prd", "prd.md"],
    ["plan", "plan.md"],
  ] as const) {
    const text = wanted[key];
    if (text === undefined || normalize(text) === normalize(current[key])) continue;
    const untouched = normalize(current[key]) === "" || normalize(current[key]) === normalize(generated[key]);
    if (!untouched && options.force !== true) protectedDocs.push(name);
    else {
      next[key] = text;
      written.push(name);
    }
  }
  if (protectedDocs.length > 0)
    throw new Error(
      `${protectedDocs.join(" and ")} already has content that differs from the scaffold of this task; --scaffold-docs would replace it.\nGợi ý: chạy lại với --force để thay thế (nội dung hiện có sẽ mất), hoặc thêm phần còn thiếu bằng tay.`,
    );
  if (written.length === 0) return { task, written };

  const saved = await saveWorkflow(root, {
    task: { ...task, updatedAt: laterTimestamp(task.updatedAt, now) },
    artifacts: { prd: next.prd, plan: next.plan },
  });
  return { task: saved as TaskRecordV3, written };
}
