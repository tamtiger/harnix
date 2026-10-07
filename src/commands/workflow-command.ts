import type { Command } from "commander";

import { withTargetTask } from "src/commands/internal-workflow.js";
import { WORKFLOW_HANDLERS, type Handler, type WorkflowCommandOptions } from "src/commands/workflow-handlers.js";
import { assertCommandShape, assertFlagGroups, selectAction, type WorkflowFlags } from "src/commands/workflow-flags.js";
import { resolveProjectRoot } from "src/utils/paths.js";

export type { WorkflowCommandOptions } from "src/commands/workflow-handlers.js";

const collect = (value: string, previous: string[] = []): string[] => [...previous, value];
/** A list flag accepts `--f a,b` and `--f a --f b` alike; the handler splits the merged string. */
const joinList = (value: string, previous: string | undefined): string =>
  previous === undefined ? value : `${previous},${value}`;

/** `--text` repeats only with `--init`; the value stays a string until a second one arrives. */
const accumulate = (value: string, previous: string | string[] | undefined): string | string[] =>
  previous === undefined ? value : [...[previous].flat(), value];

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
    .option("--add-criterion <id>", "Add one acceptance criterion (requires --text)")
    .option("--set-criterion <id>", "Rewrite the text of one acceptance criterion (requires --text)")
    .option("--add-decision <id>", "Record one decision (requires --text and --rationale)")
    .option("--add-risk <id>", "Record one residual risk (requires --text)")
    .option("--set-paths", "Replace the relevant paths and/or specs of the active task")
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
    .option("--relevant-path <path>", "Relevant path for --set-paths (repeatable)", collect, [])
    .option("--relevant-spec <path>", "Relevant spec path for --set-paths (repeatable)", collect, [])
    .option("--cwd <path>", "Working directory relative to project root for check execution")
    .option("--reviewed", "Attest that the ready-review was run (required for a Full task at --transition ready/ready)")
    .option("--epic <epic-id>", "Existing epic to attach the new task to (--init only)")
    .option("--follow-up <task-id>", "Task ID to follow up on, inheriting context from a completed task")
    .option("--brief", "Print only id, status, checkpoint and updatedAt")
    .option("--dry-run", "Validate transition conditions without persisting state")
    .action(async (operands: string[], flags: WorkflowFlags) => {
      const action = selectAction(flags);
      assertCommandShape(action, flags, operands);
      assertFlagGroups(action, flags);
      const root = await resolveProjectRoot(process.cwd());
      const result = await withTargetTask(flags.task, () =>
        (WORKFLOW_HANDLERS[action] as Handler)({ root, flags, operands, options }),
      );
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
}
