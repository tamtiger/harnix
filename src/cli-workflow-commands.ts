import { Option, type Command } from "commander";

import { resolveProjectRoot } from "./utils/paths.js";
import { runInternalContextCommand } from "./commands/internal-context-cli.js";
import { reportSkill, reportSkillCatalog, reportSkillReference, suggestSkills } from "./commands/skills.js";
import { discoverProjectSkills, type SkillTemplate } from "./core/spec/project-skills.js";
import { runLearning, type LearningCommandOptions } from "./commands/learning.js";
import { searchMemory } from "./commands/mem.js";
import {
  inspectProjectStatus,
  inspectWorkspaceGitStatus,
  explainProjectStatus,
  summarizeProjectStatus,
  listProjectChecks,
  reportProjectCriteria,
} from "./commands/status.js";
import { resolveStatusMode } from "./commands/status-mode.js";
import { listProjectTasks } from "./commands/tasks.js";
import { listPublicEpics, detailPublicEpic } from "./commands/epic.js";
import { resumeProjectTask } from "./commands/resume.js";
import { pauseProjectTask } from "./commands/pause.js";
import { reportProjectContext } from "./commands/context-report.js";
import { diagnoseProject } from "./commands/doctor.js";
import { doctorExitCode } from "./core/doctor/exit-code.js";
import { inspectVerifyPlan } from "./commands/verify-plan.js";
import { runRepoMapCommand } from "./commands/repo-map-internal.js";
import { parsePlatformId } from "./core/platform/registry.js";
import { readBoundedInput } from "./utils/bounded-input.js";
import { requireInitializedProject } from "./utils/project-discovery.js";
import {
  parseReportLimit,
  parseTaskLimit,
  parseTaskStatus,
  type ProgramOptions,
  type RepoMapCliOptions,
} from "./cli-helpers.js";

export function registerWorkflowCliCommands(program: Command, programOptions: ProgramOptions): void {
  program
    .command("mem")
    .argument("[query]")
    .option("--query <query>")
    .option("--user <id>")
    .option("--limit <count>")
    .option("--learning", "Return only learning candidates")
    .action(
      async (
        query: string | undefined,
        options: { query?: string; user?: string; limit?: string; learning?: boolean },
      ) => {
        const limit =
          options.limit === undefined ? undefined : /^\d+$/u.test(options.limit) ? Number(options.limit) : Number.NaN;
        if (limit !== undefined && (!Number.isInteger(limit) || limit < 1))
          throw new Error("--limit must be a positive integer.");
        const result = await searchMemory({
          root: await requireInitializedProject(process.cwd()),
          query: options.query ?? query,
          user: options.user,
          limit,
          learningOnly: options.learning,
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      },
    );

  program
    .command("learning")
    .description("List project learning, or reject, promote (--apply), retire one by id, or --prune low-value drafts")
    .option("--status <status>", "Listing: only this effective status (draft, candidate, promoted, rejected, archived)")
    .option("--limit <count>", "Listing: maximum entries (1-100)")
    .option("--reject <ids>", "Mark drafts or candidates (comma-separated ids) as rejected")
    .option(
      "--promote <id>",
      "Show the rule for a draft or candidate; with --apply write it to .harnix/spec/learned.md",
    )
    .option("--retire <ids>", "Remove promoted rules (comma-separated ids) from .harnix/spec/learned.md and archive")
    .option("--prune", "List drafts and candidates the capture quality filter rejects; with --apply reject them")
    .option("--apply", "With --promote or --prune: write the change instead of only previewing it")
    .option("--reason <text>", "With --reject: why, kept in the journal summary")
    .action(async (options: LearningCommandOptions) => {
      process.stdout.write(`${JSON.stringify(await runLearning(process.cwd(), options))}\n`);
    });

  program
    .command("status")
    .description("Summarize the active Harnix task and next action")
    .option("--explain", "Include required-check freshness and readiness/completion blockers")
    .option("--summary", "Print a concise micro-summary under 80 tokens")
    .option("--criteria", "Print a concise list of acceptance criteria with their status and coverage")
    .option("--checks", "Print a concise list of the task's checks with scope, command and freshness")
    .option("--limit <count>", "Maximum required checks when --explain is set", "20")
    .option("--workspace [path]", "Read-only Git table (branch, changes, upstream) of the sub-repositories")
    .action(async (options: StatusCliOptions, command: Command) => {
      const now = programOptions.statusClock?.() ?? Date.now();
      const mode = resolveStatusMode(options, command.getOptionValueSource("limit") === "cli");
      const cwd = process.cwd();
      const result =
        mode === "workspace"
          ? await inspectWorkspaceGitStatus(cwd, typeof options.workspace === "string" ? options.workspace : undefined)
          : mode === "checks"
            ? await listProjectChecks(cwd, now)
            : mode === "criteria"
              ? await reportProjectCriteria(cwd)
              : mode === "summary"
                ? await summarizeProjectStatus(cwd, now)
                : mode === "explain"
                  ? await explainProjectStatus(cwd, parseReportLimit(options.limit, "status"), now)
                  : await inspectProjectStatus(cwd, now);
      process.stdout.write(`${JSON.stringify(result)}
`);
    });

  program
    .command("tasks")
    .description("List bounded Harnix task metadata")
    .option("--limit <count>", "Maximum task records")
    .option("--status <status>", "Filter by exact task status")
    .option("--archived", "List the read-only archive instead of the live tasks")
    .action(async (options: { limit?: string; status?: string; archived?: boolean }) => {
      const status = parseTaskStatus(options.status);
      const result = await listProjectTasks(process.cwd(), {
        limit: parseTaskLimit(options.limit ?? "20"),
        ...(status === undefined ? {} : { status }),
        ...(options.archived === true ? { archived: true } : {}),
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });

  program
    .command("epic")
    .description("List epics, or show one epic with its member tasks and next task")
    .argument("[epic-id]", "Exact epic ID for the detail view")
    .option("--limit <count>", "Maximum epic records in the list view", "20")
    .option("--brief", "In the detail view, print only ids, titles, status counts and the next task (no goals)")
    .option("--archived", "In the list view, list the read-only archive instead of the live epics")
    .action(async (epicId: string | undefined, options: { limit: string; brief?: boolean; archived?: boolean }) => {
      const result =
        epicId === undefined
          ? await listPublicEpics(process.cwd(), parseTaskLimit(options.limit), options.archived === true)
          : await detailPublicEpic(process.cwd(), epicId, options.brief === true);
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });

  program
    .command("resume")
    .description("Activate an exact unfinished Harnix task, or the next unfinished task of an epic")
    .argument("[task-id]", "Exact Harnix task ID (omit with --epic)")
    .option("--epic <epic-id>", "Resume the next unfinished task of this epic instead of a task id")
    .option("--dry-run", "Preview without writing the active pointer")
    .option("--force", "Activate even if another task is currently active")
    .option("--next", "Resume the next unfinished task of the active or first unfinished epic")
    .option("--brief", "Print only id, status, checkpoint and updatedAt")
    .action(
      async (
        taskId: string | undefined,
        opts: { dryRun?: boolean; epic?: string; force?: boolean; next?: boolean; brief?: boolean },
      ) => {
        const res = await resumeProjectTask(
          process.cwd(),
          taskId,
          opts.dryRun === true,
          opts.epic,
          opts.force === true,
          opts.next === true,
          opts.brief === true,
        );
        process.stdout.write(`${JSON.stringify(res)}\n`);
      },
    );

  program
    .command("pause")
    .description("Pause the active Harnix task by clearing the active pointer")
    .option("--dry-run", "Preview without writing the active pointer")
    .action(async (options: { dryRun?: boolean }) => {
      process.stdout.write(`${JSON.stringify(await pauseProjectTask(process.cwd(), options.dryRun === true))}\n`);
    });

  program
    .command("context-report")
    .description("Explain bounded effective Harnix hook context metadata")
    .option("--platform <platform>", "Target Kiro, Antigravity, Codex, Claude Code, OpenCode, or Cursor")
    .option("--limit <count>", "Maximum details per context category", "20")
    .action(async (options: { platform?: string; limit: string }) => {
      const platform = parsePlatformId(options.platform);
      process.stdout.write(
        `${JSON.stringify(await reportProjectContext(process.cwd(), platform, parseReportLimit(options.limit, "context-report")))}\n`,
      );
    });

  program
    .command("skill")
    .argument("[name]", "Canonical Harnix skill name, for example harnix-implement")
    .option("--reference <topic>", "Print one on-demand reference of the skill instead of its instructions")
    .option("--suggest <query>", "Search and rank skills by semantic relevance or keywords")
    .option("--all", "Include technique skills and custom project skills in the catalog listing")
    .option("--raw", "Print the skill markdown directly instead of JSON-wrapped output")
    .description("Print the canonical Harnix skill catalog, one skill's instructions, or one of its references")
    .action(
      async (
        name: string | undefined,
        options: { reference?: string; suggest?: string; all?: boolean; raw?: boolean },
      ) => {
        if (options.reference !== undefined && name === undefined)
          throw new Error("--reference requires a skill name.");
        if (options.raw === true && name === undefined) throw new Error("--raw requires a skill name.");
        let projectSkills: readonly SkillTemplate[] = [];
        try {
          projectSkills = await discoverProjectSkills(await requireInitializedProject(process.cwd()));
        } catch {
          // Missing project root is expected outside initialized projects.
        }
        if (options.suggest !== undefined) {
          const result = suggestSkills(options.suggest, { all: options.all, projectSkills });
          process.stdout.write(`${JSON.stringify(result)}\n`);
          return;
        }
        const result =
          name === undefined
            ? reportSkillCatalog({ all: options.all, projectSkills })
            : options.reference === undefined
              ? reportSkill(name, projectSkills)
              : reportSkillReference(name, options.reference, projectSkills);
        process.stdout.write(
          options.raw === true && "content" in result ? `${result.content}\n` : `${JSON.stringify(result)}\n`,
        );
      },
    );

  program
    .command("doctor")
    .option("--fix", "Repair safe, unchanged managed files")
    .option("--global", "Allow --fix to reconcile safe global integration drift")
    .option("--allow-warnings", "Exit 0 when only warnings remain; errors and invalid state still fail")
    .action(async (options: { allowWarnings?: boolean; fix?: boolean; global?: boolean }) => {
      const result = await diagnoseProject({
        ...(programOptions.capabilityLookup === undefined ? {} : { capabilityLookup: programOptions.capabilityLookup }),
        ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
        ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
        ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
        fix: options.fix,
        global: options.global,
        root: await resolveProjectRoot(process.cwd()),
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
      const exitCode = doctorExitCode(result, options.allowWarnings === true);
      if (exitCode !== 0) process.exitCode = exitCode;
    });

  program
    .command("repo-map")
    .option("--query <text>", "Search the structural repository map")
    .option("--impact <path>", "Show cached dependency impact for an exact path")
    .option("--tests <path>", "Show affected test files for an exact path")
    .option("--outline <path>", "Show structural symbol outline and line spans for an exact path")
    .option("--refs <symbol>", "Find bounded symbol references across the repository map")
    .option("--symbol <name>", "Filter symbols by name when using --outline")
    .option("--path <path>", "Scope symbol reference lookup to a file and its dependents when using --refs")
    .option("--limit <count>", "Maximum results")
    .option("--depth <count>", "Reverse-dependent traversal depth for --impact")
    .option("--format <format>", "Result format for --query (json, compact, outline)")
    .option("--events", "Generate cross-service event matrix of publishers and subscribers by topic")
    .option("--workspace [path]", "Index and query across sub-repositories in a workspace")
    .addOption(new Option("--refresh", "Rebuild the structural repository map").hideHelp())
    .action(async (options: RepoMapCliOptions) => {
      process.stdout.write(`${JSON.stringify(await runRepoMapCommand(process.cwd(), options))}\n`);
    });

  program
    .command("verify-plan")
    .description("Inspect deterministic test, lint, typecheck, and format commands for this project and its packages")
    .option("--recursive", "Discover nested repositories, solutions and packages recursively")
    .option("--impact [path]", "Show affected test files and focused test command for modified files or an exact path")
    .option("--path <dir>", "Only the packages inside or containing this repository-relative directory")
    .option("--changed", "Only the packages that hold a file Git reports as changed")
    .option("--brief", "Only packages with tests, each with just its path and test command")
    .action(
      async (options: {
        recursive?: boolean;
        impact?: string | boolean;
        path?: string;
        changed?: boolean;
        brief?: boolean;
      }) => {
        const plan = await inspectVerifyPlan(process.cwd(), options);
        process.stdout.write(`${JSON.stringify(plan)}\n`);
      },
    );

  const contextHookStdinIdleTimeoutMs = 2_000;
  program
    .command("context", { hidden: true })
    .option("--platform <platform>")
    .action(async (options: { platform?: string }) => {
      const platform = parsePlatformId(options.platform);
      const hookInput = programOptions.hookEventInput
        ? await programOptions.hookEventInput()
        : process.stdin.isTTY === true
          ? ""
          : await readBoundedInput(process.stdin, undefined, contextHookStdinIdleTimeoutMs);
      await runInternalContextCommand({ hookInput, platform });
    });
}

interface StatusCliOptions {
  explain?: boolean;
  summary?: boolean;
  criteria?: boolean;
  checks?: boolean;
  limit: string;
  workspace?: boolean | string;
}
