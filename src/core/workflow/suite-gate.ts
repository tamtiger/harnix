import { selectLatestEvidence, type TaskRecord, type ValidationCheck } from "src/core/tasks/task.js";
import { computeInputDigest, digestMatches } from "src/core/verification/input-digest.js";
import { buildVerifyPlan, type VerifyPlan } from "src/core/stack/verify-plan.js";
import { baselineAssessment } from "./baseline-status.js";
import { acceptsSuiteCommand } from "./suite-command.js";

const SOURCE_SEGMENTS = new Set([
  "src",
  "lib",
  "app",
  "pkg",
  "cmd",
  "internal",
  "core",
  "model",
  "models",
  "service",
  "services",
  "domain",
  "infra",
  "infrastructure",
  "module",
  "modules",
  "backend",
  "frontend",
  "api",
  "server",
  "client",
]);
const NON_SOURCE_ROOTS = new Set(["docs", "doc", ".github", ".harnix", ".vscode", "scripts"]);
const WILDCARD_INPUTS = new Set([".", "**", "**/*", "*"]);
const GLOB_CHARACTERS = /[*?[\]{}()!]/u;
const TREE_TERMINATORS = new Set(["", "**", "*"]);

interface InputShape {
  directories: string[];
  isTree: boolean;
}

/** Test directories: `test`, `tests`, `spec`, `__tests__`, a `.tests`/`-spec` suffix, or a camel-case `UnitTests` suffix. */
function isTestDirectory(name: string): boolean {
  return (
    /^(tests?|specs?|__tests__)$/iu.test(name) ||
    /(^|[._-])(tests?|specs?)$/iu.test(name) ||
    /[a-z](Tests?|Specs?)$/u.test(name)
  );
}

function shapeOf(input: string): InputShape | undefined {
  const normalized = input.replace(/\\/gu, "/").replace(/^\.\//u, "");
  if (normalized.startsWith("!")) return undefined;
  const segments = normalized.split("/");
  const last = segments[segments.length - 1] ?? "";
  const isTree = TREE_TERMINATORS.has(last);
  const lastIsDirectory = !isTree && !GLOB_CHARACTERS.test(last) && !last.includes(".");
  const directories = isTree || lastIsDirectory ? segments : segments.slice(0, -1);
  return { directories: directories.filter((segment) => segment !== "" && !GLOB_CHARACTERS.test(segment)), isTree };
}

function coversTest(shape: InputShape): boolean {
  return shape.directories.some(isTestDirectory);
}

function coversSource(shape: InputShape): boolean {
  if (shape.directories.some(isTestDirectory)) return false;
  const first = shape.directories[0]?.toLowerCase();
  if (first !== undefined && NON_SOURCE_ROOTS.has(first)) return false;
  return shape.isTree || shape.directories.some((segment) => SOURCE_SEGMENTS.has(segment.toLowerCase()));
}

export function coversSourceAndTest(inputs: readonly string[] | string[] | undefined): boolean {
  if (!inputs) return false;
  let hasSource = false;
  let hasTest = false;

  for (const input of inputs) {
    if (WILDCARD_INPUTS.has(input)) return true;
    const shape = shapeOf(input);
    if (shape === undefined) continue;
    if (coversSource(shape)) hasSource = true;
    if (coversTest(shape)) hasTest = true;
  }

  return hasSource && hasTest;
}

/**
 * A required check that was already red before the task, with the user's authorization (`pre-existing` or
 * `environment`), whose deliverable is proved by another passing required check covering the same criteria. The red
 * run must be the latest one, so a check that later passed or never ran is judged by the ordinary rules.
 */
export function authorizedRedBaseline(task: TaskRecord, check: ValidationCheck): boolean {
  return baselineAssessment(task, check)?.accepted === true;
}

/** Distinct test commands of the repository and its packages, in detection order. */
export function knownTestCommands(plan: VerifyPlan): string[] {
  const commands = [plan.commands.test, ...plan.packages.map((item) => item.commands.test)];
  return [...new Set(commands.filter((command): command is string => typeof command === "string" && command !== ""))];
}

async function firstAccepted(
  projectRoot: string,
  covering: readonly ValidationCheck[],
  known: readonly string[],
): Promise<ValidationCheck | undefined> {
  for (const check of covering)
    if (await acceptsSuiteCommand(projectRoot, check.command, check.cwd, known)) return check;
  return undefined;
}

/** The directories of .NET solutions or test projects a bare `dotnet test` check could name as its cwd. */
function dotnetCwdCandidates(plan: VerifyPlan): string[] {
  return plan.packages
    .filter((item) => item.ecosystem === "dotnet" && item.hasTests)
    .map((item) => item.path)
    .slice(0, 10);
}

function suiteCommandError(action: string, known: readonly string[], plan: VerifyPlan): Error {
  const candidates = dotnetCwdCandidates(plan);
  const dotnet =
    candidates.length === 0
      ? ""
      : ` For a .NET repository use dotnet test <path/to/solution.sln> (a relative path to an existing solution) or keep a bare dotnet test and declare --cwd <dir> (candidates from verify-plan --recursive: ${candidates.join(", ")}).`;
  return new Error(
    `Workflow ${action}: the suite check command must be the project test command (${known.join(" or ")}); a command that runs only part of the tests, such as a single test file, does not prove the suite.${dotnet}`,
  );
}

/**
 * The required check that proves the whole suite: its inputs cover source and tests and its command is the project
 * test command (or a safe `dotnet test` form, see {@link acceptsSuiteCommand}), so a check that runs one test file
 * cannot stand in for the suite. Without a detected test command only the inputs are judged.
 */
async function selectSuiteCheck(
  projectRoot: string,
  task: TaskRecord,
  plan: VerifyPlan,
  action: "ready" | "finish",
): Promise<ValidationCheck | undefined> {
  const covering = task.validationPlan.filter((check) => check.required && coversSourceAndTest(check.inputs));
  if (covering.length === 0) return undefined;
  const direct = await firstAccepted(projectRoot, covering, knownTestCommands(plan));
  if (direct) return direct;
  const recursive = await buildVerifyPlan(projectRoot, { recursive: true });
  const known = knownTestCommands(recursive);
  const nested = await firstAccepted(projectRoot, covering, known);
  if (nested) return nested;
  throw suiteCommandError(action, known, recursive);
}

/**
 * An early, non-throwing answer to "would the suite gate accept this task": the problem in one sentence, or undefined
 * when the declared suite check is valid (and, with `requirePass`, has a current pass or an authorized baseline), so
 * `status` and `--transition --dry-run` can warn long before `--finish` refuses.
 */
export async function suiteGateProblem(
  projectRoot: string,
  task: TaskRecord,
  requirePass: boolean,
): Promise<string | undefined> {
  try {
    const plan = await buildVerifyPlan(projectRoot);
    if (!plan.hasTests) return undefined;
    const check = await selectSuiteCheck(projectRoot, task, plan, "finish");
    if (check === undefined)
      return 'no required check covers source and tests with the project test command (for example inputs ["src/**","test/**"]); finish will refuse.';
    if (!requirePass || authorizedRedBaseline(task, check)) return undefined;
    const latest = selectLatestEvidence(task.evidence, check.id);
    if (latest?.result !== "pass")
      return `suite check ${check.id} has not passed yet: harnix workflow --run-check ${check.id} -- <command>.`;
    if (
      task.schemaVersion !== 3 ||
      !digestMatches(await computeInputDigest(projectRoot, task, check.id), latest.inputDigest)
    )
      return `suite check ${check.id} is stale: run it again last.`;
    return undefined;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function assertSuiteGateReady(projectRoot: string, task: TaskRecord): Promise<void> {
  const plan = await buildVerifyPlan(projectRoot);
  if (!plan.hasTests) {
    return;
  }
  const suiteCheck = await selectSuiteCheck(projectRoot, task, plan, "ready");
  if (!suiteCheck) {
    throw new Error(
      'Workflow ready requires a required check whose inputs cover both source and test (for example inputs ["**"], or a source tree plus a test tree such as ["src/**","test/**"]). Scope must be "focused" or "full" (there is no "project" scope).',
    );
  }
}

export async function assertSuiteGateFinishing(projectRoot: string, task: TaskRecord): Promise<void> {
  const plan = await buildVerifyPlan(projectRoot);
  if (!plan.hasTests) {
    return;
  }
  const suiteCheck = await selectSuiteCheck(projectRoot, task, plan, "finish");
  if (!suiteCheck) {
    throw new Error(
      'Workflow finish requires a passing required check whose inputs cover both source and test (for example ["**"] or ["src/**","test/**"]) with a current input digest. Scope must be "focused" or "full".',
    );
  }

  if (authorizedRedBaseline(task, suiteCheck)) return;

  const passEvidence = selectLatestEvidence(task.evidence, suiteCheck.id);
  if (task.schemaVersion !== 3 || passEvidence?.result !== "pass" || typeof passEvidence.inputDigest !== "string") {
    throw new Error(
      `Workflow finish requires a passing source-and-test check with a current input digest. Re-run it with: harnix workflow --run-check ${suiteCheck.id} -- <command>.`,
    );
  }

  const currentSnapshot = await computeInputDigest(projectRoot, task, suiteCheck.id);
  if (!digestMatches(currentSnapshot, passEvidence.inputDigest)) {
    throw new Error(
      `Workflow finish: the source-and-test check ${suiteCheck.id} is stale (inputs changed since it last passed). Re-run it last, with no input-touching command after it, via: harnix workflow --run-check ${suiteCheck.id} -- <command>.`,
    );
  }
}
