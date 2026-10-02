#!/usr/bin/env node

import { Command, Option } from "commander";

import { initializeProject, parseInitProfile } from "./commands/init.js";
import { setupPlatforms, type HookCommandLookup, type SetupPlatformsResult } from "./commands/setup.js";
import { normalizeRepositoryPath, resolveProjectRoot } from "./utils/paths.js";
import { runInternalContextCommand } from "./commands/internal-context-cli.js";
import { updateProject } from "./commands/update.js";
import { updateGlobalPlatforms } from "./commands/global-update.js";
import { upgradeHarnix, type AvailableVersionLookup } from "./commands/upgrade.js";
import { reportSkill, reportSkillCatalog, reportSkillReference } from "./commands/skills.js";
import type { SkillTemplate } from "./core/spec/project-skills.js";
import { uninstallProject } from "./commands/uninstall.js";
import { uninstallGlobalIntegrations } from "./commands/global-uninstall.js";
import { cleanupLegacyProjectSurfaces } from "./commands/legacy-project-surfaces.js";
import { searchMemory } from "./commands/mem.js";
import { inspectProjectStatus, explainProjectStatus } from "./commands/status.js";
import { listProjectTasks } from "./commands/tasks.js";
import { listPublicEpics, detailPublicEpic } from "./commands/epic.js";
import { resumeProjectTask } from "./commands/resume.js";
import { pauseProjectTask } from "./commands/pause.js";
import { reportProjectContext } from "./commands/context-report.js";
import { diagnoseProject } from "./commands/doctor.js";
import { discoverProjectSkills } from "./core/spec/project-skills.js";
import { inspectVerifyPlan } from "./commands/verify-plan.js";
import {
  impactRepoMapInternal,
  queryRepoMapInternal,
  refreshRepoMapInternal,
  testsRepoMapInternal,
} from "./commands/repo-map-internal.js";
import { registerWorkflowCommand } from "./commands/workflow-command.js";
import { packageVersion } from "./version.js";
import type { HomeResolver } from "./core/platform/user-paths.js";
import type { GlobalIntegrationCapabilityLookup } from "./commands/global-doctor.js";
import { GlobalManagedTransactionError } from "./core/global/managed-files.js";
import { parsePlatformId, platformRecords, type PlatformId } from "./core/platform/registry.js";
import { readBoundedInput } from "./utils/bounded-input.js";
import type { TaskStatus } from "./core/tasks/task.js";
import type { CheckRunner } from "./utils/check-runner.js";

export interface ProgramOptions {
  interactive?: boolean | undefined;
  hookEventInput?: (() => Promise<string>) | undefined;
  workflowInput?: (() => Promise<string>) | undefined;
  /** Test/integration injection for the process that `workflow --run-check` starts. */
  checkRunner?: CheckRunner | undefined;
  homeResolver?: HomeResolver | undefined;
  environment?: Readonly<Record<string, string | undefined>> | undefined;
  commandLookup?: HookCommandLookup | undefined;
  /** Test/integration injection for externally verified platform capability evidence. */
  capabilityLookup?: GlobalIntegrationCapabilityLookup | undefined;
  /** Optional explicit available-version lookup; the default upgrade path remains offline. */
  availableVersionLookup?: AvailableVersionLookup | undefined;
  /** Test/integration injection for deterministic status evidence freshness. */
  statusClock?: (() => number) | undefined;
}

export interface PublicCliErrorV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly ok: false;
  readonly error: {
    readonly exitCode: 1 | 2;
    readonly message: string;
  };
}

export function createProgram(programOptions: ProgramOptions = {}): Command {
  const program = new Command();
  program
    .name("harnix")
    .description(
      "Coding-agent harness with project-local workflow data and user-global Kiro, Antigravity, Codex, and Claude Code integrations.",
    )
    .version(packageVersion)
    .showSuggestionAfterError()
    .exitOverride();
  program
    .command("init")
    .option("--user <name>", "Override the detected developer journal ID")
    .option("--languages <csv>", "Override auto-detected language IDs")
    .option("--technologies <csv>", "Override auto-detected technology IDs")
    .option("--dry-run", "Preview without writing")
    .addOption(new Option("--yes", "Deprecated compatibility option; init no longer prompts").hideHelp())
    .action(
      async (options: {
        yes?: boolean;
        user?: string;
        languages?: string;
        technologies?: string;
        dryRun?: boolean;
      }) => {
        const environment = { ...process.env, ...(programOptions.environment ?? {}) };
        const developer = options.user ?? defaultDeveloperId(environment);
        const profile = parseInitProfile(options.languages, options.technologies);
        const result = await initializeProject({
          developer,
          dryRun: options.dryRun,
          languages: profile.languages,
          technologies: profile.technologies,
          warnings: profile.warnings,
          root: await resolveProjectRoot(process.cwd()),
          yes: options.yes,
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      },
    );
  addPlatformFlags(program.command("setup"), (label) => `Install ${label} user-global integration`)
    .option("--dry-run", "Preview user-global changes without writing")
    .action(async (options: PlatformFlagOptions & { dryRun?: boolean }) => {
      const platforms = selectedPlatforms(options);
      const result = await setupPlatforms({
        ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
        ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
        ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
        dryRun: options.dryRun,
        platforms,
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
      reportActionableSetupReadiness(result);
    });
  addPlatformFlags(
    program
      .command("update")
      .option("--restore", "Restore explicitly deleted managed files")
      .option("--global", "Reconcile user-global platform integrations"),
    (label) => `Select ${label} for --global`,
  )
    .option("--dry-run", "Preview global changes without writing")
    .action(async (options: PlatformFlagOptions & { restore?: boolean; global?: boolean; dryRun?: boolean }) => {
      const platforms = selectedPlatforms(options);
      if (!options.global && (platforms.length > 0 || options.dryRun))
        throw new Error(`${platformFlagList(["--dry-run"])} require update --global.`);
      const result = options.global
        ? await updateGlobalPlatforms({
            ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
            ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
            ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
            dryRun: options.dryRun,
            restoreDeleted: options.restore,
            ...(platforms.length === 0 ? {} : { platforms }),
          })
        : await updateProject({ root: await resolveProjectRoot(process.cwd()), restoreDeleted: options.restore });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program
    .command("upgrade")
    .option("--apply", "Run the displayed npm upgrade command")
    .action(async (options: { apply?: boolean }) => {
      const result = await upgradeHarnix({
        installedVersion: packageVersion,
        ...(programOptions.availableVersionLookup === undefined
          ? {}
          : { availableVersion: programOptions.availableVersionLookup }),
        apply: options.apply,
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  addPlatformFlags(
    program
      .command("uninstall")
      .option("--purge", "Remove only this project's .harnix data")
      .option("--global", "Uninstall selected user-global platform integrations")
      .option("--legacy-project-surfaces", "Remove manifest-proven legacy project-local integration files"),
    (label) => `Select ${label} for --global`,
  )
    .option("--yes", "Confirm the selected destructive action")
    .action(
      async (
        options: PlatformFlagOptions & {
          purge?: boolean;
          global?: boolean;
          legacyProjectSurfaces?: boolean;
          yes?: boolean;
        },
      ) => {
        const platforms = selectedPlatforms(options);
        const projectModeCount = Number(options.purge === true) + Number(options.legacyProjectSurfaces === true);
        if (projectModeCount > 1 || (options.global === true && projectModeCount > 0))
          throw new Error("--global, --purge, and --legacy-project-surfaces are mutually exclusive.");
        if (!options.global && platforms.length > 0)
          throw new Error(`${platformFlagList()} require uninstall --global.`);
        if (options.global && platforms.length === 0)
          throw new Error("uninstall --global requires at least one platform flag.");
        if (!options.global && projectModeCount === 0)
          throw new Error("Specify one of --purge, --global, or --legacy-project-surfaces.");

        const result = options.global
          ? await uninstallGlobalIntegrations({
              ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
              ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
              platforms,
              yes: options.yes,
            })
          : options.legacyProjectSurfaces
            ? await cleanupLegacyProjectSurfaces({ root: await resolveProjectRoot(process.cwd()), yes: options.yes })
            : await uninstallProject({ root: await resolveProjectRoot(process.cwd()), purge: true, yes: options.yes });
        process.stdout.write(`${JSON.stringify(result)}\n`);
        const confirmationRequired =
          "confirmationRequired" in result
            ? result.confirmationRequired
            : result.platforms.some((platform) => platform.confirmationRequired);
        if (confirmationRequired) process.exitCode = 2;
      },
    );
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
          root: await resolveProjectRoot(process.cwd()),
          query: options.query ?? query,
          user: options.user,
          limit,
          learningOnly: options.learning,
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      },
    );
  program
    .command("status")
    .description("Summarize the active Harnix task and next action")
    .option("--explain", "Include required-check freshness and readiness/completion blockers")
    .option("--limit <count>", "Maximum required checks when --explain is set", "20")
    .action(async (options: { explain?: boolean; limit: string }) => {
      const now = programOptions.statusClock?.() ?? Date.now();
      const result =
        options.explain === true
          ? await explainProjectStatus(process.cwd(), parseReportLimit(options.limit, "status"), now)
          : await inspectProjectStatus(process.cwd(), now);
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program
    .command("tasks")
    .description("List bounded Harnix task metadata")
    .option("--limit <count>", "Maximum task records")
    .option("--status <status>", "Filter by exact task status")
    .action(async (options: { limit?: string; status?: string }) => {
      const status = parseTaskStatus(options.status);
      const result = await listProjectTasks(process.cwd(), {
        limit: parseTaskLimit(options.limit ?? "20"),
        ...(status === undefined ? {} : { status }),
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program
    .command("epic")
    .description("List epics, or show one epic with its member tasks and next task")
    .argument("[epic-id]", "Exact epic ID for the detail view")
    .option("--limit <count>", "Maximum epic records in the list view", "20")
    .option("--brief", "In the detail view, print only ids, titles, status counts and the next task (no goals)")
    .action(async (epicId: string | undefined, options: { limit: string; brief?: boolean }) => {
      const result =
        epicId === undefined
          ? await listPublicEpics(process.cwd(), parseTaskLimit(options.limit))
          : await detailPublicEpic(process.cwd(), epicId, options.brief === true);
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program
    .command("resume")
    .description("Activate an exact unfinished Harnix task")
    .argument("<task-id>", "Exact Harnix task ID")
    .option("--dry-run", "Preview without writing the active pointer")
    .action(async (taskId: string, options: { dryRun?: boolean }) => {
      process.stdout.write(
        `${JSON.stringify(await resumeProjectTask(process.cwd(), taskId, options.dryRun === true))}\n`,
      );
    });
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
    .option("--platform <platform>", "Target Kiro, Antigravity, Codex, or Claude Code")
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
    .option("--all", "Include technique skills and custom project skills in the catalog listing")
    .description("Print the canonical Harnix skill catalog, one skill's instructions, or one of its references")
    .action(async (name: string | undefined, options: { reference?: string; all?: boolean }) => {
      if (options.reference !== undefined && name === undefined) throw new Error("--reference requires a skill name.");
      let projectSkills: readonly SkillTemplate[] = [];
      try {
        const root = await resolveProjectRoot(process.cwd());
        projectSkills = await discoverProjectSkills(root);
      } catch {
        // Missing project root is expected outside initialized projects.
      }
      const result =
        name === undefined
          ? reportSkillCatalog({ all: options.all, projectSkills })
          : options.reference === undefined
            ? reportSkill(name, projectSkills)
            : reportSkillReference(name, options.reference, projectSkills);
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program
    .command("doctor")
    .option("--fix", "Repair safe, unchanged managed files")
    .option("--global", "Allow --fix to reconcile safe global integration drift")
    .action(async (options: { fix?: boolean; global?: boolean }) => {
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
      if (
        result.project.status === "invalid" ||
        result.globalIntegrations.some((integration) => integration.status === "invalid")
      )
        process.exitCode = 2;
      else if (!result.ok) process.exitCode = 1;
    });
  program
    .command("repo-map")
    .option("--query <text>", "Search the structural repository map")
    .option("--impact <path>", "Show cached dependency impact for an exact path")
    .option("--tests <path>", "Show affected test files for an exact path")
    .option("--limit <count>", "Maximum results")
    .option("--depth <count>", "Reverse-dependent traversal depth for --impact")
    .addOption(new Option("--refresh", "Rebuild the structural repository map").hideHelp())
    .action(
      async (options: {
        query?: string;
        impact?: string;
        tests?: string;
        limit?: string;
        depth?: string;
        refresh?: boolean;
      }) => {
        const actionCount =
          Number(options.query !== undefined) +
          Number(options.impact !== undefined) +
          Number(options.tests !== undefined) +
          Number(options.refresh === true);
        if (actionCount !== 1)
          throw new Error("repo-map requires exactly one of --query, --impact, --tests, or --refresh.");
        if (options.refresh) {
          if (options.limit !== undefined || options.depth !== undefined)
            throw new Error("--limit and --depth are not valid with repo-map --refresh.");
          process.stdout.write(`${JSON.stringify(await refreshRepoMapInternal(process.cwd()))}\n`);
          return;
        }
        if (options.tests !== undefined) {
          if (options.depth !== undefined) throw new Error("--depth requires repo-map --impact.");
          process.stdout.write(
            `${JSON.stringify(await testsRepoMapInternal(process.cwd(), parseRepoMapPath(options.tests, "--tests"), parseRepoMapLimit(options.limit ?? "20")))}\n`,
          );
          return;
        }
        if (options.impact !== undefined) {
          process.stdout.write(
            `${JSON.stringify(await impactRepoMapInternal(process.cwd(), parseRepoMapPath(options.impact, "--impact"), parseRepoMapDepth(options.depth ?? "2"), parseRepoMapLimit(options.limit ?? "20")))}\n`,
          );
          return;
        }
        if (options.depth !== undefined) throw new Error("--depth requires repo-map --impact.");
        process.stdout.write(
          `${JSON.stringify(await queryRepoMapInternal(process.cwd(), options.query!, parseRepoMapLimit(options.limit ?? "20")))}\n`,
        );
      },
    );
  program
    .command("verify-plan")
    .description("Inspect deterministic test, lint, typecheck, and format commands for this project and its packages")
    .action(async () => {
      const plan = await inspectVerifyPlan(process.cwd());
      process.stdout.write(`${JSON.stringify(plan)}\n`);
    });
  // A hook host that writes the event payload but never closes the child's
  // stdin must not hang this command forever; the caller's own hook timeout
  // cannot save us from that, since the process would still be blocked
  // reading rather than merely slow.
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
  registerWorkflowCommand(program, programOptions);
  return program;
}

export function defaultDeveloperId(environment: Readonly<Record<string, string | undefined>>): string {
  const candidate = environment.USERNAME ?? environment.USER ?? "developer";
  const normalized = candidate
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^[^A-Za-z0-9]+/u, "")
    .slice(0, 64);
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(normalized) ? normalized : "developer";
}

function parseRepoMapLimit(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--limit must be an integer between 1 and 20.");
  const limit = Number(value);
  if (limit < 1 || limit > 20) throw new Error("--limit must be an integer between 1 and 20.");
  return limit;
}

export async function runCli(argv = process.argv, programOptions: ProgramOptions = {}): Promise<number> {
  process.exitCode = undefined;
  const hiddenProtocol = isHiddenProtocolInvocation(argv);
  const program = createProgram(programOptions);
  if (!hiddenProtocol) program.configureOutput({ writeErr: () => undefined });
  try {
    await program.parseAsync(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error: unknown) {
    const commanderExit =
      typeof error === "object" && error !== null && "code" in error && String(error.code).startsWith("commander.");
    if (commanderExit && "exitCode" in error && error.exitCode === 0) return 0;
    const exitCode = 2;
    const message = redactPublicErrorMessage(error);
    if (!commanderExit || !hiddenProtocol) process.stderr.write(`${message}\n`);
    if (!hiddenProtocol) process.stdout.write(`${JSON.stringify(publicCliError(message, exitCode))}\n`);
    return exitCode;
  }
}

function parseRepoMapDepth(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--depth must be an integer between 1 and 3.");
  const depth = Number(value);
  if (depth < 1 || depth > 3) throw new Error("--depth must be an integer between 1 and 3.");
  return depth;
}

function parseRepoMapPath(value: string, flag: "--impact" | "--tests" = "--impact"): string {
  let normalized: string;
  try {
    normalized = normalizeRepositoryPath(value);
  } catch {
    throw new Error(`${flag} must be an exact normalized repository-relative POSIX path.`);
  }
  if (normalized !== value || value.includes("\\"))
    throw new Error(`${flag} must be an exact normalized repository-relative POSIX path.`);
  return normalized;
}

function parseTaskLimit(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--limit must be an integer between 1 and 100 for tasks.");
  const limit = Number(value);
  if (limit < 1 || limit > 100) throw new Error("--limit must be an integer between 1 and 100 for tasks.");
  return limit;
}

function parseTaskStatus(value: string | undefined): TaskStatus | undefined {
  if (value === undefined) return undefined;
  const statuses: readonly TaskStatus[] = [
    "planning",
    "ready",
    "in_progress",
    "verifying",
    "blocked",
    "completed",
    "cancelled",
  ];
  if (!statuses.includes(value as TaskStatus))
    throw new Error("--status must be planning, ready, in_progress, verifying, blocked, completed, or cancelled.");
  return value as TaskStatus;
}

function parseReportLimit(value: string, command: "context-report" | "status"): number {
  if (!/^\d+$/u.test(value)) throw new Error(`--limit must be an integer between 1 and 50 for ${command}.`);
  const limit = Number(value);
  if (limit < 1 || limit > 50) throw new Error(`--limit must be an integer between 1 and 50 for ${command}.`);
  return limit;
}

export function publicCliError(message: string, exitCode: 1 | 2): PublicCliErrorV1 {
  return { generator: "harnix", schemaVersion: 1, ok: false, error: { exitCode, message } };
}

export function redactPublicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Harnix operation failed.";
  const rollbackDetail =
    error instanceof GlobalManagedTransactionError && error.rollback.partial.length > 0
      ? ` Partial rollback preserved concurrent edits at: ${error.rollback.partial.join(", ")}.`
      : "";
  return (
    `${message}${rollbackDetail}`
      .replaceAll(process.cwd(), "[PROJECT]")
      .replace(/(['"])(?:[A-Za-z]:[\\/]|\/|\\\\)[^'"\r\n]+\1/gu, "'[PROJECT]'")
      // File-lock and filesystem errors commonly include an unquoted absolute
      // path. Redact the rest of that diagnostic segment rather than leaking a
      // user profile merely because the path contains spaces.
      .replace(
        /(?:\\\\(?:\?\\)?[^\\/\r\n]+[\\/]|[A-Za-z]:[\\/]|\/(?:home|Users|tmp|var\/folders)\/)[^\r\n]*/gu,
        "[PATH]",
      )
      .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s,]+/giu, "$1[REDACTED]")
  );
}

function isHiddenProtocolInvocation(argv: readonly string[]): boolean {
  return argv[2] === "context" || argv[2] === "workflow";
}

function reportActionableSetupReadiness(result: SetupPlatformsResult): void {
  const actionable = result.platforms.filter(
    (platform) => platform.readiness !== "installed" || platform.warnings.length > 0,
  );
  if (actionable.length === 0) return;
  for (const platform of actionable) {
    if (platform.warnings.length === 0) {
      process.stderr.write(`${platform.platform}: setup readiness is ${platform.readiness}.\n`);
      continue;
    }
    for (const warning of platform.warnings)
      process.stderr.write(`${platform.platform}: ${redactPublicErrorMessage(new Error(warning))}\n`);
  }
  process.exitCode = 1;
}

type PlatformFlagOptions = Partial<Record<PlatformId, boolean>>;

/** One `--<flag>` option per registered platform; the description is built from the platform label. */
function addPlatformFlags(command: Command, describe: (label: string) => string): Command {
  for (const record of platformRecords()) command.option(`--${record.flag}`, describe(record.label));
  return command;
}

function selectedPlatforms(options: PlatformFlagOptions): PlatformId[] {
  return platformRecords()
    .map((record) => record.id as PlatformId)
    .filter((id) => options[id] === true);
}

/** "--kiro, --antigravity, --codex, and --claude" built from the registry, plus any extra flags. */
function platformFlagList(extra: readonly string[] = []): string {
  const flags = [...platformRecords().map((record) => `--${record.flag}`), ...extra];
  return `${flags.slice(0, -1).join(", ")}, and ${flags[flags.length - 1] ?? ""}`;
}
