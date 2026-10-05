import { readFile } from "node:fs/promises";
import type { TaskArtifacts, TaskRecord } from "src/core/tasks/task.js";
import { planHasChecklistItem } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

import { dirname, basename } from "node:path";
import { assertSuiteGateReady } from "./suite-gate.js";

import { globby } from "globby";
import { buildGlobIgnores, targetedSegments } from "src/core/verification/transient-directories.js";

const FULL_ARTIFACTS_MESSAGE = "Full tasks require non-empty prd.md and plan.md at ready.";
const CHECKLIST_MESSAGE = "Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.";

function projectRootOf(harnixRoot: string): string {
  return basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function obligationIssues(task: TaskRecord): string[] {
  const issues: string[] = [];
  if (task.acceptanceCriteria.length === 0) issues.push("Workflow ready requires at least one acceptance criterion.");
  if (!task.validationPlan.some((check) => check.required)) {
    issues.push("Workflow ready requires at least one required validation check.");
  }
  return issues;
}

async function suiteGateIssues(projectRoot: string, task: TaskRecord): Promise<string[]> {
  try {
    await assertSuiteGateReady(projectRoot, task);
    return [];
  } catch (error: unknown) {
    return [describe(error)];
  }
}

async function fullArtifactIssues(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<string[]> {
  if (task.mode !== "full") return [];
  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      artifacts?.prd ?? readFile(prdPath, "utf8").catch(() => ""),
      artifacts?.plan ?? readFile(planPath, "utf8").catch(() => ""),
    ]);
    if (!prd.trim() || !plan.trim()) return [FULL_ARTIFACTS_MESSAGE];
    return planHasChecklistItem(plan) ? [] : [CHECKLIST_MESSAGE];
  } catch {
    return [FULL_ARTIFACTS_MESSAGE];
  }
}

async function inputGlobIssue(projectRoot: string, checkId: string, input: string): Promise<string | undefined> {
  try {
    const matches = await globby(input, {
      cwd: projectRoot,
      dot: true,
      followSymbolicLinks: false,
      gitignore: true,
      ignore: buildGlobIgnores(targetedSegments(input)),
      onlyFiles: true,
    });
    return matches.length === 0 ? `Required check '${checkId}' input '${input}' matches no files.` : undefined;
  } catch {
    return `Required check '${checkId}' input '${input}' is invalid or cannot be evaluated.`;
  }
}

async function inputIssues(projectRoot: string, task: TaskRecord): Promise<string[]> {
  const issues: string[] = [];
  for (const check of task.validationPlan) {
    if (!check.required || !("inputs" in check) || !Array.isArray(check.inputs)) continue;
    for (const input of check.inputs) {
      if (input === "@task-contract") continue;
      const issue = await inputGlobIssue(projectRoot, check.id, input);
      if (issue) issues.push(issue);
    }
  }
  return issues;
}

function baselineIssues(task: TaskRecord): { issues: string[]; unbaselined: string[] } {
  const issues: string[] = [];
  const unbaselined: string[] = [];
  for (const check of task.validationPlan) {
    if (!check.required) continue;
    const baseline = (check as { baseline?: { authorizedBy?: string } }).baseline;
    if (baseline?.authorizedBy !== undefined) continue;
    const latest = task.evidence.filter((e) => e.checkId === check.id).at(-1);
    if (latest === undefined) {
      unbaselined.push(check.id);
      issues.push(`Required check '${check.id}' has not been baselined before contract freeze.`);
    } else if (latest.result === "fail") {
      issues.push(`Required check '${check.id}' failed in baseline run without a waiver.`);
    }
  }
  return { issues, unbaselined };
}

/**
 * Every condition the ready transition enforces, in the order it reports them. The real transition and the dry-run
 * both use this list, so a dry-run is valid exactly when the transition would be accepted.
 */
export async function collectReadyIssues(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<string[]> {
  return [
    ...obligationIssues(task),
    ...(await suiteGateIssues(projectRootOf(harnixRoot), task)),
    ...(await fullArtifactIssues(harnixRoot, task, artifacts)),
  ];
}

/** Ready needs obligations and, for Full, free-form non-empty prd/plan with a checklist; there is no trace grammar. */
export async function assertReadyRequirements(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<void> {
  const [first] = await collectReadyIssues(harnixRoot, task, artifacts);
  if (first !== undefined) throw new Error(first);
}

/**
 * Dry-run diagnosis: `issues` are what the ready transition would reject; `advisories` are things worth fixing
 * before the contract freezes (an input glob that matches nothing, a check never run against the baseline) that the
 * transition itself does not enforce.
 */
export async function inspectReadyConditions(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<{ issues: string[]; advisories: string[]; unbaselined: string[] }> {
  const baseline = baselineIssues(task);
  const issues = await collectReadyIssues(harnixRoot, task, artifacts).catch((error: unknown) => [describe(error)]);
  const advisories = [...(await inputIssues(projectRootOf(harnixRoot), task)), ...baseline.issues];
  return { issues, advisories, unbaselined: baseline.unbaselined };
}
