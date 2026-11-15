import { compareCodeUnits } from "src/utils/order.js";
import type { ValidationCheckV3 } from "src/core/tasks/task.js";

export const LINT_CHECK_ID = "check-lint";

const WRITING_FLAGS = new Set(["--fix", "--write"]);

/** True when no token asks the tool to rewrite files (`--fix`, `--write`, also with `=value`). */
export function isReadOnlyCommand(command: string): boolean {
  return !command.split(/\s+/u).some((token) => WRITING_FLAGS.has(token.split("=")[0] ?? ""));
}

export interface LintCheckInput {
  /** The lint command `verify-plan` detected, if any. */
  command: string | undefined;
  criteriaIds: readonly string[];
  inputs: readonly string[];
  cwd?: string | undefined;
}

/**
 * The `check-lint` that `--init --with-lint` declares, or a notice saying why there is none. The check is `full`, not
 * `focused`: the ready gate counts only focused checks, so a lint check must not stand in for a behavior test.
 */
export function buildLintCheck({ command, criteriaIds, inputs, cwd }: LintCheckInput): {
  check?: ValidationCheckV3;
  notice?: string;
} {
  const lint = command?.trim();
  if (!lint)
    return {
      notice: `notice: --with-lint found no lint command; declare one with --with-check "id=${LINT_CHECK_ID};command=<cmd>;criteria=<ac-1>;input=<glob>;scope=full".\n`,
    };
  if (!isReadOnlyCommand(lint))
    return {
      notice: `notice: --with-lint skipped "${lint}" because it rewrites files (--fix or --write); use a read-only lint command with --with-check.\n`,
    };
  return {
    check: {
      id: LINT_CHECK_ID,
      description: "Lint của dự án phải xanh",
      scope: "full",
      required: true,
      command: lint,
      ...(cwd === undefined ? {} : { cwd }),
      criterionIds: [...criteriaIds].sort(compareCodeUnits),
      inputs: [...new Set(inputs)].sort(compareCodeUnits),
    },
  };
}
