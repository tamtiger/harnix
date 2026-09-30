import type { TaskRecord, ValidationCheck } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";

const SOURCE_PREFIXES = ["src/", "src/**", "lib/", "app/", "pkg/", "cmd/", "internal/"] as const;
const TEST_PREFIXES = ["test/", "test/**", "tests/", "tests/**", "spec/", "spec/**", "specs/", "specs/**"] as const;
const WILDCARD_INPUTS = new Set([".", "**", "**/*", "*"]);

function matchesAnyPrefix(input: string, prefixes: readonly string[]): boolean {
  const normalized = input.toLowerCase().replace(/\\/g, "/").replace(/^\.\//, "");
  return prefixes.some(
    (prefix) =>
      normalized.startsWith(prefix) ||
      normalized.includes("/" + prefix) ||
      (prefix.endsWith("/") && (normalized === prefix.slice(0, -1) || normalized.endsWith("/" + prefix.slice(0, -1)))),
  );
}

export function coversSourceAndTest(inputs: readonly string[] | string[] | undefined): boolean {
  if (!inputs) return false;
  let coversSource = false;
  let coversTest = false;

  for (const input of inputs) {
    if (WILDCARD_INPUTS.has(input)) return true;
    if (matchesAnyPrefix(input, SOURCE_PREFIXES)) coversSource = true;
    if (matchesAnyPrefix(input, TEST_PREFIXES)) coversTest = true;
  }

  return coversSource && coversTest;
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
      "Workflow ready requires a project-level suite check covering full source and test inputs (with scope: 'full' or 'focused').",
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
    throw new Error("Workflow finish requires a passing project-level suite check with current input digest.");
  }

  const passEvidence = task.evidence.find(
    (e) => e.checkId === suiteCheck.id && e.result === "pass" && typeof e.inputDigest === "string",
  );
  if (!passEvidence || task.schemaVersion !== 3) {
    throw new Error("Workflow finish requires a passing project-level suite check with current input digest.");
  }

  const currentSnapshot = await computeInputDigest(projectRoot, task, suiteCheck.id);
  if (passEvidence.inputDigest !== currentSnapshot.inputDigest) {
    throw new Error("Workflow finish requires a passing project-level suite check with current input digest.");
  }
}
