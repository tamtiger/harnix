import { readFile } from "node:fs/promises";
import type { TaskArtifacts, TaskRecord } from "src/core/tasks/task.js";
import { isMissing, planHasChecklistItem } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

import { dirname, basename } from "node:path";
import { assertSuiteGateReady } from "./suite-gate.js";

import { globby } from "globby";
import { buildGlobIgnores, targetedSegments } from "src/core/verification/transient-directories.js";

/** Ready needs obligations and, for Full, free-form non-empty prd/plan with a checklist; there is no trace grammar. */
export async function assertReadyRequirements(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<void> {
  if (task.acceptanceCriteria.length === 0)
    throw new Error("Workflow ready requires at least one acceptance criterion.");
  if (!task.validationPlan.some((check) => check.required))
    throw new Error("Workflow ready requires at least one required validation check.");
  const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
  await assertSuiteGateReady(projectRoot, task);
  if (task.mode !== "full") return;

  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      artifacts?.prd ?? readFile(prdPath, "utf8"),
      artifacts?.plan ?? readFile(planPath, "utf8"),
    ]);
    if (!prd.trim() || !plan.trim()) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    if (!planHasChecklistItem(plan))
      throw new Error("Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.");
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    throw error;
  }
}

/** Comprehensive diagnosis of ready conditions for dry-run inspection. */
export async function inspectReadyConditions(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<{ issues: string[]; unbaselined: string[] }> {
  const issues: string[] = [];
  const unbaselined: string[] = [];

  if (task.acceptanceCriteria.length === 0) {
    issues.push("Workflow ready requires at least one acceptance criterion.");
  }
  if (!task.validationPlan.some((check) => check.required)) {
    issues.push("Workflow ready requires at least one required validation check.");
  }

  const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
  try {
    await assertSuiteGateReady(projectRoot, task);
  } catch (error: unknown) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  if (task.mode === "full") {
    try {
      const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
      const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
      const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
      const [prd, plan] = await Promise.all([
        artifacts?.prd ?? readFile(prdPath, "utf8").catch(() => ""),
        artifacts?.plan ?? readFile(planPath, "utf8").catch(() => ""),
      ]);
      if (!prd.trim() || !plan.trim()) {
        issues.push("Full tasks require non-empty prd.md and plan.md at ready.");
      } else if (!planHasChecklistItem(plan)) {
        issues.push("Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.");
      }
    } catch {
      issues.push("Full tasks require non-empty prd.md and plan.md at ready.");
    }
  }

  // Check input globs match at least one file
  for (const check of task.validationPlan) {
    if (!check.required || !("inputs" in check) || !Array.isArray(check.inputs)) continue;
    for (const input of check.inputs) {
      if (input === "@task-contract") continue;
      const targeted = targetedSegments(input);
      try {
        const matches = await globby(input, {
          cwd: projectRoot,
          dot: true,
          followSymbolicLinks: false,
          gitignore: true,
          ignore: buildGlobIgnores(targeted),
          onlyFiles: true,
        });
        if (matches.length === 0) {
          issues.push(`Required check '${check.id}' input '${input}' matches no files.`);
        }
      } catch {
        issues.push(`Required check '${check.id}' input '${input}' is invalid or cannot be evaluated.`);
      }
    }
  }

  // Check baseline status
  for (const check of task.validationPlan) {
    if (!check.required) continue;
    const checkRecord = check as { baseline?: { result?: string; classification?: string; authorizedBy?: string; scope?: string } };
    const hasWaiver = checkRecord.baseline?.authorizedBy !== undefined;
    const evidences = task.evidence.filter((e) => e.checkId === check.id);
    if (evidences.length === 0 && !hasWaiver) {
      unbaselined.push(check.id);
      issues.push(`Required check '${check.id}' has not been baselined before contract freeze.`);
    } else if (evidences.length > 0 && !hasWaiver) {
      const latest = evidences[evidences.length - 1];
      if (latest && latest.result === "fail") {
        issues.push(`Required check '${check.id}' failed in baseline run without a waiver.`);
      }
    }
  }

  return { issues, unbaselined };
}
