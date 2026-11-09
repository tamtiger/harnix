import type { ValidationCheckV3 } from "src/core/tasks/task.js";
import { equivalentCommand } from "./command-match.js";

/**
 * The stderr notice `--init` prints: every check it created (id, scope, command, cwd) with the auto-generated default
 * marked, and a warning when a declared full-scope check repeats the command of the auto-generated suite check, since
 * running the same suite twice only costs time.
 */
export function checksNotice(checks: readonly ValidationCheckV3[], autoId: string | undefined): string {
  const lines = checks.map((check) => {
    const where = check.cwd === undefined ? "" : `, cwd ${check.cwd}`;
    const auto = check.id === autoId ? " (auto-generated default)" : "";
    return `  ${check.id} (${check.scope}, ${check.command ?? "no command"}${where})${auto}`;
  });
  const auto = checks.find((check) => check.id === autoId && check.scope === "full");
  const duplicates = checks.filter(
    (check) =>
      auto !== undefined &&
      check.id !== auto.id &&
      check.scope === "full" &&
      check.command !== undefined &&
      auto.command !== undefined &&
      equivalentCommand(check.command, auto.command),
  );
  const warnings = duplicates.map(
    (check) => `  warning: ${check.id} runs the same command as the auto-generated ${auto?.id}; the suite runs twice.`,
  );
  return `notice: checks created by --init:\n${[...lines, ...warnings].join("\n")}\n`;
}
