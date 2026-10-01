import { selectLatestEvidence, type TaskRecord, type ValidationCheck } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";

const SOURCE_SEGMENTS = new Set(["src", "lib", "app", "pkg", "cmd", "internal"]);
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

export function findProjectSuiteCheck(task: TaskRecord): ValidationCheck | undefined {
  return task.validationPlan.find((check) => check.required && coversSourceAndTest(check.inputs));
}

export async function assertSuiteGateReady(projectRoot: string, task: TaskRecord): Promise<void> {
  const plan = await buildVerifyPlan(projectRoot);
  if (!plan.hasTests) {
    return;
  }
  const suiteCheck = findProjectSuiteCheck(task);
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
  const suiteCheck = findProjectSuiteCheck(task);
  if (!suiteCheck) {
    throw new Error(
      'Workflow finish requires a passing required check whose inputs cover both source and test (for example ["**"] or ["src/**","test/**"]) with a current input digest. Scope must be "focused" or "full".',
    );
  }

  const passEvidence = selectLatestEvidence(task.evidence, suiteCheck.id);
  if (task.schemaVersion !== 3 || passEvidence?.result !== "pass" || typeof passEvidence.inputDigest !== "string") {
    throw new Error(
      `Workflow finish requires a passing source-and-test check with a current input digest. Re-run it with: harnix workflow --run-check ${suiteCheck.id} -- <command>.`,
    );
  }

  const currentSnapshot = await computeInputDigest(projectRoot, task, suiteCheck.id);
  if (passEvidence.inputDigest !== currentSnapshot.inputDigest) {
    throw new Error(
      `Workflow finish: the source-and-test check ${suiteCheck.id} is stale (inputs changed since it last passed). Re-run it last, with no input-touching command after it, via: harnix workflow --run-check ${suiteCheck.id} -- <command>.`,
    );
  }
}
