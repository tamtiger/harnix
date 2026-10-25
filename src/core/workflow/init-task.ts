import { compareCodeUnits } from "src/utils/order.js";
import { readProjectTimezone } from "src/core/config/config.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import type { TaskMode, TaskRecordV3, ValidationCheckV3 } from "src/core/tasks/task.js";
import { idPrefix } from "src/utils/clock.js";
import { normalizeRepositoryPath, resolveSafeHarnixPath } from "src/utils/paths.js";
import { renderPlanTemplate, renderPrdTemplate } from "./artifact-templates.js";
import { equivalentCommand } from "./command-match.js";
import { resolveLineage } from "./init-lineage.js";
import type { InitCheckSpec } from "./init-spec.js";
import { saveWorkflow } from "./save.js";
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
  /** Repository-relative directory of the package the task is about: its test command and inputs become the default. */
  cwd?: string | undefined;
  injectedNow?: string | undefined;
}

function toSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return normalized.slice(0, 40).replace(/-+$/u, "") || "task";
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SLUG_MAX = 60;

/** An explicit English slug, or one derived from a plain-ASCII title; a title with accents never becomes an ID. */
function resolveSlug(title: string, slug: string | undefined): string {
  if (slug !== undefined) {
    if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX)
      throw new Error(
        `workflow --init --slug must be english-kebab-case (a-z, 0-9, single hyphens, at most ${SLUG_MAX} characters).`,
      );
    return slug;
  }
  // eslint-disable-next-line no-control-regex
  if (/[^\u0000-\u007f]/u.test(title))
    throw new Error(
      "workflow --init: the title is not plain ASCII, so pass --slug <english-kebab-case> for the task ID.",
    );
  return toSlug(title);
}

const SUITE_DESCRIPTION = "Toàn bộ test, lint và typecheck của dự án phải xanh";

async function projectTestCommand(root: string, cwd: string | undefined): Promise<string | undefined> {
  if (cwd === undefined) return (await buildVerifyPlan(root)).commands.test?.trim() || undefined;
  const plan = await buildVerifyPlan(root, { recursive: true });
  return plan.packages.find((pkg) => pkg.path === cwd)?.commands.test?.trim() || undefined;
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

function declaredCheck(spec: InitCheckSpec): ValidationCheckV3 {
  return {
    id: spec.id,
    description: spec.description ?? spec.id,
    scope: spec.scope,
    required: true,
    command: spec.command,
    ...(spec.cwd === undefined ? {} : { cwd: spec.cwd }),
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
}> {
  const cwd = packageDirectory(options.cwd);
  const projectTest = await projectTestCommand(root, cwd);
  const command = options.command?.trim() || projectTest;
  // Declared --with-check specs already say what to run, so no default check is needed without a test command.
  if (!command && (options.checks ?? []).length === 0)
    throw new Error(
      cwd === undefined
        ? "workflow --init found no project test command; pass --command <cmd> explicitly."
        : `workflow --init --cwd ${cwd} found no test command for that package; pass --command <cmd> explicitly.`,
    );
  const given = Array.isArray(options.input) ? options.input : [];
  const inputs = given.length > 0 ? [...new Set(given)].sort() : [cwd === undefined ? "**" : `${cwd}/**`];
  return { cwd, projectTest, command, inputs };
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
  const slug = resolveSlug(title, options.slug);
  const id = `${prefix}-${slug}`;

  const goal = options.goal?.trim() || title;
  const criteria = buildCriteria(options.criteria, title);
  const { cwd, projectTest, command, inputs } = await resolveCheckTarget(root, options);

  const { epicId, followUpOf, relevantPaths, relevantSpecs } = await resolveLineage(root, options);

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
      ...(command === undefined ? [] : [defaultCheck(title, command, projectTest, criteria, inputs, cwd)]),
      ...(options.checks ?? []).map(declaredCheck),
    ],
    evidence: [],
    relevantPaths,
    relevantSpecs,
    createdAt: now,
    updatedAt: now,
  };

  const artifacts =
    mode === "full"
      ? {
          prd: renderPrdTemplate(candidate),
          plan: renderPlanTemplate(candidate),
        }
      : undefined;

  return (await saveWorkflow(root, { task: candidate, ...(artifacts ? { artifacts } : {}) })) as TaskRecordV3;
}
