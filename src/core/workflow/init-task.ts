import { compareCodeUnits } from "src/utils/order.js";
import { readProjectTimezone } from "src/core/config/config.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import type { TaskMode, TaskRecordV3, ValidationCheckV3 } from "src/core/tasks/task.js";
import { idPrefix } from "src/utils/clock.js";
import { normalizeRepositoryPath, resolveSafeHarnixPath } from "src/utils/paths.js";
import { initArtifacts } from "./init-artifacts.js";
import { equivalentCommand } from "./command-match.js";
import { flagIssueError } from "./flag-issues.js";
import { asciiFold, slugOrIssue } from "./init-issues.js";
import { checksNotice } from "./init-checks-notice.js";
import { defaultCheckInputs } from "./init-default-inputs.js";
import { buildLintCheck, LINT_CHECK_ID } from "./init-lint-check.js";
import { resolveLineage } from "./init-lineage.js";
import type { InitCheckSpec } from "./init-spec.js";
import { saveWorkflow } from "./save.js";
import { loadSimilarTasks, similarTaskNotice } from "./similar-tasks.js";
import { currentInstant } from "./support.js";

export interface InitTaskOptions {
  title: string;
  slug?: string | undefined;
  mode?: TaskMode;
  goal?: string | undefined;
  /** One text per acceptance criterion, in order (ac-1, ac-2, ...); the title when empty. */
  criteria?: string[] | undefined;
  /** Further required checks, each already parsed from one `--with-check`. */
  checks?: InitCheckSpec[] | undefined;
  command?: string | undefined;
  input?: string[] | undefined;
  followUp?: string | undefined;
  epic?: string | undefined;
  /** False for `--no-activate`: the task is created without touching the active pointer. */
  activate?: boolean | undefined;
  /** Repository-relative directory of the package the task is about: its test command and inputs become the default. */
  cwd?: string | undefined;
  /** True for `--with-lint`: also declare a read-only check-lint from the project lint command. */
  lint?: boolean | undefined;
  /** Text of `prd.md` / `plan.md` for a Full task, in place of the generated template. */
  prd?: string | undefined;
  plan?: string | undefined;
  injectedNow?: string | undefined;
}

const SUITE_DESCRIPTION = "Toàn bộ test của dự án phải xanh";

async function projectTestCommand(root: string, cwd: string | undefined): Promise<string | undefined> {
  if (cwd === undefined) return (await buildVerifyPlan(root)).commands.test?.trim() || undefined;
  const plan = await buildVerifyPlan(root, { recursive: true });
  return plan.packages.find((pkg) => pkg.path === cwd)?.commands.test?.trim() || undefined;
}

async function projectLintCommand(root: string, cwd: string | undefined): Promise<string | undefined> {
  if (cwd === undefined) return (await buildVerifyPlan(root)).commands.lint?.trim() || undefined;
  const plan = await buildVerifyPlan(root, { recursive: true });
  return plan.packages.find((pkg) => pkg.path === cwd)?.commands.lint?.trim() || undefined;
}

/** The `--with-lint` check (or the notice saying why there is none); a declared `check-lint` always wins. */
async function resolveLintCheck(
  root: string,
  options: InitTaskOptions,
  declared: readonly ValidationCheckV3[],
  criteria: TaskRecordV3["acceptanceCriteria"],
  inputs: string[],
  cwd: string | undefined,
): Promise<ReturnType<typeof buildLintCheck>> {
  if (options.lint !== true || declared.some(({ id }) => id === LINT_CHECK_ID)) return {};
  const built = buildLintCheck({
    command: await projectLintCommand(root, cwd),
    criteriaIds: criteria.map(({ id }) => id),
    inputs,
    cwd,
  });
  if (built.notice !== undefined) process.stderr.write(built.notice);
  return built;
}

/** The package directory of `--cwd`, or undefined for the repository root (absent, empty or a dot). */
function packageDirectory(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/u, "");
  return trimmed === undefined || trimmed === "" || trimmed === "." ? undefined : normalizeRepositoryPath(trimmed);
}

/** One criterion per non-empty text, ac-1 onwards; the title when none is given. */
function buildCriteria(texts: string[] | undefined, title: string): TaskRecordV3["acceptanceCriteria"] {
  const given = (texts ?? []).map((text) => text.trim()).filter((text) => text !== "");
  return (given.length > 0 ? given : [title]).map((text, index) => ({
    id: `ac-${index + 1}`,
    text,
    status: "pending" as const,
    evidenceIds: [],
  }));
}

/** The check every `--init` creates: the project suite (check-suite, full) or, for any other command, check-1. */
function defaultCheck(
  title: string,
  command: string,
  projectTest: string | undefined,
  criteria: TaskRecordV3["acceptanceCriteria"],
  inputs: string[],
  cwd: string | undefined,
): ValidationCheckV3 {
  const isSuite = projectTest !== undefined && equivalentCommand(command, projectTest);
  return {
    id: isSuite ? "check-suite" : "check-1",
    description: isSuite ? SUITE_DESCRIPTION : `Kiểm chứng: ${title}`,
    scope: isSuite ? "full" : "focused",
    required: true,
    command,
    ...(cwd === undefined ? {} : { cwd }),
    criterionIds: criteria.map(({ id }) => id).sort(compareCodeUnits),
    inputs: [...new Set(inputs)].sort(compareCodeUnits),
  };
}

function declaredCheck(spec: InitCheckSpec, defaultCwd: string | undefined): ValidationCheckV3 {
  const cwd = spec.cwd ?? defaultCwd;
  return {
    id: spec.id,
    description: spec.description ?? spec.id,
    scope: spec.scope,
    required: true,
    command: spec.command,
    ...(cwd === undefined ? {} : { cwd }),
    criterionIds: [...new Set(spec.criterionIds)].sort(compareCodeUnits),
    inputs: [...new Set(spec.inputs)].sort(compareCodeUnits),
  };
}

/** The package, test command and inputs the default check runs: from `--cwd` and `--command` or the project itself. */
async function resolveCheckTarget(
  root: string,
  options: InitTaskOptions,
): Promise<{
  cwd: string | undefined;
  projectTest: string | undefined;
  command: string | undefined;
  inputs: string[];
  issue?: string;
}> {
  const cwd = packageDirectory(options.cwd);
  const projectTest = await projectTestCommand(root, cwd);
  const command = options.command?.trim() || projectTest;
  // Declared --with-check specs already say what to run, so no default check is needed without a test command.
  const issue =
    !command && (options.checks ?? []).length === 0
      ? cwd === undefined
        ? "workflow --init found no project test command; pass --command <cmd> explicitly."
        : `workflow --init --cwd ${cwd} found no test command for that package; pass --command <cmd> explicitly.`
      : undefined;
  const given = Array.isArray(options.input) ? options.input : [];
  const inputs = given.length > 0 ? [...new Set(given)].sort() : await defaultCheckInputs(root, cwd);
  return { cwd, projectTest, command, inputs, ...(issue === undefined ? {} : { issue }) };
}

/** The task slug, or one error carrying every `--init` problem (slug and missing test command) at once. */
function resolveSlug(title: string, slug: string | undefined, targetIssue: string | undefined): string {
  const resolved = slugOrIssue(title, slug);
  const issues = [resolved.issue, targetIssue].filter((issue): issue is string => issue !== undefined);
  if (issues.length === 0 && resolved.slug !== undefined) return resolved.slug;
  throw flagIssueError(
    "workflow --init",
    issues,
    `harnix workflow --init --title "${title}" --slug ${resolved.slug ?? asciiFold(title)} --command "<cmd>"`,
  );
}

export async function initTaskWorkflow(root: string, options: InitTaskOptions): Promise<TaskRecordV3> {
  const title = options.title?.trim();
  if (!title) {
    throw new Error("workflow --init requires a non-empty --title.");
  }
  if (options.mode !== undefined && options.mode !== "lite" && options.mode !== "full")
    throw new Error("workflow --init --mode must be lite or full.");
  const mode: TaskMode = options.mode ?? "lite";
  const now = await currentInstant(root, options.injectedNow);
  const prefix = idPrefix(Date.parse(now), await readProjectTimezone(await resolveSafeHarnixPath(root)));

  const goal = options.goal?.trim() || title;
  const criteria = buildCriteria(options.criteria, title);
  const target = await resolveCheckTarget(root, options);
  const { cwd, projectTest, command, inputs } = target;
  const slug = resolveSlug(title, options.slug, target.issue);
  const id = `${prefix}-${slug}`;

  const { epicId, followUpOf, relevantPaths, relevantSpecs } = await resolveLineage(root, options);

  const declared = (options.checks ?? []).map((spec) => declaredCheck(spec, cwd));
  const base = command === undefined ? undefined : defaultCheck(title, command, projectTest, criteria, inputs, cwd);
  const lint = await resolveLintCheck(root, options, declared, criteria, inputs, cwd);

  const candidate: TaskRecordV3 = {
    generator: "harnix",
    schemaVersion: 3,
    id,
    title,
    mode,
    status: "planning",
    checkpoint: "planning",
    goal,
    nonGoals: [],
    ...(epicId !== undefined ? { epicId } : {}),
    ...(followUpOf !== undefined ? { followUpOf } : {}),
    acceptanceCriteria: criteria,
    validationPlan: [
      ...(lint.check === undefined ? [] : [lint.check]),
      ...(base === undefined ? [] : [base]),
      ...declared,
    ],
    evidence: [],
    relevantPaths,
    relevantSpecs,
    createdAt: now,
    updatedAt: now,
  };

  const artifacts = initArtifacts(mode, candidate, options);

  const similar = await loadSimilarTasks(root, { title, goal });
  const saved = (await saveWorkflow(
    root,
    { task: candidate, ...(artifacts ? { artifacts } : {}) },
    options.activate === false ? { activate: false } : {},
  )) as TaskRecordV3;
  const notice = similarTaskNotice(similar);
  if (notice !== undefined) process.stderr.write(notice);
  const autoId = base?.id;
  process.stderr.write(checksNotice(candidate.validationPlan, autoId));
  return saved;
}
