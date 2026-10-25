import type { Command } from "commander";

import { withTargetTask } from "src/commands/internal-workflow.js";
import { WORKFLOW_HANDLERS, type Handler, type WorkflowCommandOptions } from "src/commands/workflow-handlers.js";
import {
  assertCommandShape,
  assertFlagGroups,
  selectActions,
  type WorkflowFlags,
} from "src/commands/workflow-flags.js";
import { resolveProjectRoot } from "src/utils/paths.js";
import { requireInitializedProject } from "src/utils/project-discovery.js";

export type { WorkflowCommandOptions } from "src/commands/workflow-handlers.js";

const collect = (value: string, previous: string[] = []): string[] => [...previous, value];
/** A list flag accepts `--f a,b` and `--f a --f b` alike; the handler splits the merged string. */
const joinList = (value: string, previous: string | undefined): string =>
  previous === undefined ? value : `${previous},${value}`;

/** `--text` repeats only with `--init`; the value stays a string until a second one arrives. */
const accumulate = (value: string, previous: string | string[] | undefined): string | string[] =>
  previous === undefined ? value : [...[previous].flat(), value];

function enhanceErrorMessage(error: unknown): Error {
  if (!(error instanceof Error)) return new Error(String(error));
  const msg = error.message;
  let hint = "";
  if (msg.includes("Illegal task transition")) {
    hint =
      "Gợi ý: Kiểm tra hợp lệ bằng --dry-run trước; chỉ có thể chuyển từ ready/ready sang in_progress/implementing khi bắt đầu code.";
  } else if (msg.includes("Task status/checkpoint combination is invalid")) {
    hint = "Gợi ý: Kiểm tra bảng legalCheckpoints hoặc hướng dẫn trạng thái trong .harnix/workflow.md.";
  } else if (msg.includes("Checklist trong plan.md chưa hoàn tất")) {
    hint = "Gợi ý: Đánh dấu [x] cho 100% các mục checklist trong plan.md trước khi chuyển sang verifying.";
  } else if (msg.includes("Invalid or unsupported task record")) {
    hint = "Gợi ý: Kiểm tra task.json tuân thủ TaskRecord schema v3 (chạy harnix workflow --schema).";
  }
  if (hint !== "") {
    error.message = `${msg}\n${hint}`;
  }
  return error;
}

export function registerWorkflowCommand(program: Command, options: WorkflowCommandOptions): void {
  // The pnpm PowerShell shim forwards `$args` and drops the `--` separator, so everything after the first operand
  // (the command of `--run-check`) is passed through untouched instead of being parsed as harnix options.
  program.enablePositionalOptions();
  program
    .command("workflow", { hidden: true })
    .passThroughOptions()
    .argument("[operands...]")
    .option("--inspect", "Inspect active workflow state")
    .option("--preflight", "Inspect bounded workflow routing metadata")
    .option("--expected-task <task-id>", "Verify active task matches this expected task ID for --preflight")
    .option("--init", "Initialize a new task record with boilerplate obligations")
    .option("--title <title>", "Task title for --init")
    .option(
      "--task <task-id>",
      "Edit this unfinished task instead of the active one (edit commands only; the active pointer stays)",
    )
    .option("--slug <slug>", "English kebab-case slug of the task ID for --init (required for a non-ASCII title)")
    .option("--mode <mode>", "Task mode for --init: lite or full")
    .option("--goal <goal>", "Task goal for --init")
    .option("--save", "Persist workflow state from stdin")
    .option("--snapshot", "Snapshot one required check")
    .option("--finish", "Finish the active workflow task")
    .option("--cancel", "Cancel the active workflow task")
    .option("--learn", "Record one eligible project-local learning candidate")
    .option("--transition <status/checkpoint>", "Move the active task to one legal status/checkpoint")
    .option("--evidence", "Append exactly one evidence item from stdin or from flags")
    .option("--criterion <ids>", "Criterion IDs to mark met, comma-separated or repeated (requires --met)", joinList)
    .option("--met", "Mark the --criterion IDs met from fresh passing evidence")
    .option(
      "--evidence-ids <ids>",
      "Explicit passing evidence IDs for --criterion (comma-separated or repeated)",
      joinList,
    )
    .option("--migrate", "Migrate the active legacy task to schema v3")
    .option("--run-check <id>", "Run the command after -- against a check and record the outcome")
    .option(
      "--run-checks",
      "Run every required check that is not passing, focused first, and stop at the first failure",
    )
    .option("--set-check <id>", "Add or update one validation check of the active task")
    .option(
      "--set-baseline <id>",
      "Record the authorized baseline of one check (requires --result, --classification, --authorized-by, --scope)",
    )
    .option("--classification <kind>", "Baseline classification: pre-existing, introduced, environment or unknown")
    .option("--authorized-by <who>", "Who authorized the baseline for --set-baseline")
    .option("--epic-order <ids...>", "Set an epic run order: <epic-id> then the task ids (none clears it)")
    .option("--replace-check <ids...>", "Replace a failed check with a new check atomically")
    .option("--reset-breaker <id>", "Reset the circuit breaker for a failed check (requires --reason)")
    .option("--add-criterion <id>", "Add one acceptance criterion (requires --text)")
    .option("--set-criterion <id>", "Rewrite the text of one acceptance criterion (requires --text)")
    .option("--add-decision <id>", "Record one decision (requires --text and --rationale)")
    .option("--add-risk <id>", "Record one residual risk (requires --text)")
    .option("--remove-decision <id>", "Remove one decision while the task is in planning")
    .option(
      "--remove-criterion <id>",
      "Remove one acceptance criterion (and its check coverage) while the task is in planning",
    )
    .option("--set-paths", "Replace the relevant paths and/or specs of the active task")
    .option("--set-title <title>", "Update the title of the active task")
    .option("--set-goal <goal>", "Update the goal of the active task")
    .option("--tick <selector>", "Mark plan.md checklist items completed (- [x]) by index, 'all', or pattern")
    .option("--file <path>", "Read payload from a UTF-8 file instead of stdin")
    .option("--batch", "Batch apply criteria, checks, decisions, risks and paths from stdin")
    .option("--schema", "Describe the save envelope schema")
    .option(
      "--check <id>",
      "Check ID for --snapshot or --evidence; check IDs covering the criterion for --add-criterion (comma-separated or repeated)",
      joinList,
    )
    .option("--result <result>", "Evidence result: pass, fail, or skipped")
    .option("--exit-code <n>", "Evidence exit code")
    .option("--summary <text>", "Evidence summary")
    .option("--artifact <path>", "Evidence artifact path (repeatable)", collect, [])
    .option("--digest <hex>", "Input digest captured before the check ran")
    .option("--description <text>", "Check description for --set-check")
    .option("--command <text>", "Check command for --set-check")
    .option("--scope <scope>", "Check scope for --set-check: focused or full")
    .option("--required", "Mark the --set-check check required")
    .option("--no-required", "Mark the --set-check check not required")
    .option("--criteria <ids>", "Criterion IDs a check covers, comma-separated or repeated", joinList)
    .option("--input <glob>", "Repository input glob of a --set-check check (repeatable)", collect, [])
    .option("--reason <text>", "Why obligations change after planning (10-1000 characters)")
    .option("--note <text>", "Optional note or rationale for workflow transition")
    .option(
      "--text <text>",
      "Text for --add-criterion, --add-decision or --add-risk; repeatable with --init, one criterion each",
      accumulate,
    )
    .option(
      "--with-check <spec>",
      "Required check for --init as id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>[;scope=..][;description=..] (repeatable)",
      collect,
    )
    .option("--rationale <text>", "Rationale for --add-decision")
    .option("--severity <level>", "Severity for --add-risk: low, medium or high")
    .option("--mitigation <text>", "Mitigation for --add-risk, kept in the risk text")
    .option("--relevant-path <path>", "Relevant path for --set-paths (repeatable)", collect, [])
    .option("--relevant-spec <path>", "Relevant spec path for --set-paths (repeatable)", collect, [])
    .option(
      "--cwd <path>",
      "Working directory relative to project root for check execution; with --init, the package of the task",
    )
    .option("--reviewed", "Attest that the ready-review was run (required for a Full task at --transition ready/ready)")
    .option("--epic <epic-id>", "Existing epic to attach the new task to (--init only)")
    .option("--follow-up <task-id>", "Task ID to follow up on, inheriting context from a completed task")
    .option("--brief", "Print only id, status, checkpoint and updatedAt")
    .option("--full", "Print full task record instead of default brief output")
    .option("--dry-run", "Validate transition conditions without persisting state")
    .action(async (operands: string[], flags: WorkflowFlags) => {
      const actions = selectActions(flags);
      for (const action of actions) {
        assertCommandShape(action, flags, operands);
        assertFlagGroups(action, flags, actions);
      }
      // The envelope schema is static and must stay printable outside a project; everything else needs the nearest one.
      const root = actions.every((action) => action === "schema")
        ? await resolveProjectRoot(process.cwd())
        : await requireInitializedProject(process.cwd());
      let result: unknown;
      try {
        for (const action of actions) {
          result = await withTargetTask(flags.task, () =>
            (WORKFLOW_HANDLERS[action] as Handler)({ root, flags, operands, options }),
          );
        }
      } catch (error: unknown) {
        throw enhanceErrorMessage(error);
      }
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
}
