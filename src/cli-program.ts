#!/usr/bin/env node

import { Command, Option } from "commander";

import { initializeProject, parseInitProfile } from "./commands/init.js";
import { setupPlatforms, type HookCommandLookup } from "./commands/setup.js";
import { resolveProjectRoot } from "./utils/paths.js";
import { runInternalContextCommand } from "./commands/internal-context-cli.js";
import { updateProject } from "./commands/update.js";
import { updateGlobalPlatforms } from "./commands/global-update.js";
import { upgradeHarnix } from "./commands/upgrade.js";
import { uninstallProject } from "./commands/uninstall.js";
import { uninstallGlobalIntegrations } from "./commands/global-uninstall.js";
import { cleanupLegacyProjectSurfaces } from "./commands/legacy-project-surfaces.js";
import { searchMemory } from "./commands/mem.js";
import { diagnoseProject } from "./commands/doctor.js";
import { queryRepoMapInternal, refreshRepoMapInternal } from "./commands/repo-map-internal.js";
import { finishWorkflow, inspectWorkflow, saveWorkflow, snapshotWorkflow } from "./commands/internal-workflow.js";
import { packageVersion } from "./version.js";
import type { HomeResolver } from "./utils/user-paths.js";
import type { GlobalIntegrationCapabilityLookup } from "./commands/global-doctor.js";
import { GlobalManagedTransactionError } from "./utils/global-managed-files.js";
import { readBoundedInput } from "./utils/bounded-input.js";

export interface ProgramOptions {
  interactive?: boolean | undefined;
  hookEventInput?: (() => Promise<string>) | undefined;
  workflowInput?: (() => Promise<string>) | undefined;
  homeResolver?: HomeResolver | undefined;
  environment?: Readonly<Record<string, string | undefined>> | undefined;
  commandLookup?: HookCommandLookup | undefined;
  /** Test/integration injection for externally verified platform capability evidence. */
  capabilityLookup?: GlobalIntegrationCapabilityLookup | undefined;
}

export function createProgram(programOptions: ProgramOptions = {}): Command {
  const program = new Command();
  program.name("harnix").description("Coding-agent harness with project-local workflow data and user-global Kiro, Antigravity, and Codex integrations.").version(packageVersion).showSuggestionAfterError().exitOverride();
  program.command("init")
    .option("--user <name>", "Override the detected developer journal ID")
    .option("--languages <csv>", "Override auto-detected language IDs")
    .option("--technologies <csv>", "Override auto-detected technology IDs")
    .option("--dry-run", "Preview without writing")
    .addOption(new Option("--yes", "Deprecated compatibility option; init no longer prompts").hideHelp())
    .action(async (options: { yes?: boolean; user?: string; languages?: string; technologies?: string; dryRun?: boolean }) => {
      const environment = { ...process.env, ...(programOptions.environment ?? {}) };
      const developer = options.user ?? defaultDeveloperId(environment);
      const profile = parseInitProfile(options.languages, options.technologies);
      const result = await initializeProject({ developer, dryRun: options.dryRun, languages: profile.languages, technologies: profile.technologies, warnings: profile.warnings, root: await resolveProjectRoot(process.cwd()), yes: options.yes });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  program.command("setup").option("--kiro", "Install Kiro user-global integration").option("--antigravity", "Install Antigravity user-global integration").option("--codex", "Install Codex user-global integration").option("--dry-run", "Preview user-global changes without writing").action(async (options: { kiro?: boolean; antigravity?: boolean; codex?: boolean; dryRun?: boolean }) => {
    const platforms = (["kiro", "antigravity", "codex"] as const).filter((platform) => options[platform]);
    const result = await setupPlatforms({
      ...(programOptions.commandLookup === undefined ? {} : { commandLookup: programOptions.commandLookup }),
      ...(programOptions.environment === undefined ? {} : { environment: programOptions.environment }),
      ...(programOptions.homeResolver === undefined ? {} : { homeResolver: programOptions.homeResolver }),
      dryRun: options.dryRun,
      platforms,
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("update").option("--restore", "Restore explicitly deleted managed files").option("--global", "Reconcile user-global platform integrations").option("--kiro", "Select Kiro for --global").option("--antigravity", "Select Antigravity for --global").option("--codex", "Select Codex for --global").option("--dry-run", "Preview global changes without writing").action(async (options: { restore?: boolean; global?: boolean; kiro?: boolean; antigravity?: boolean; codex?: boolean; dryRun?: boolean }) => {
    const platforms = (["kiro", "antigravity", "codex"] as const).filter((platform) => options[platform]);
    if (!options.global && (platforms.length > 0 || options.dryRun)) throw new Error("--kiro, --antigravity, --codex, and --dry-run require update --global.");
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
  program.command("upgrade").option("--apply", "Run the displayed npm upgrade command").action(async (options: { apply?: boolean }) => {
    const result = await upgradeHarnix({ installedVersion: packageVersion, apply: options.apply }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("uninstall")
    .option("--purge", "Remove only this project's .harnix data")
    .option("--global", "Uninstall selected user-global platform integrations")
    .option("--legacy-project-surfaces", "Remove manifest-proven legacy project-local integration files")
    .option("--kiro", "Select Kiro for --global")
    .option("--antigravity", "Select Antigravity for --global")
    .option("--codex", "Select Codex for --global")
    .option("--yes", "Confirm the selected destructive action")
    .action(async (options: { purge?: boolean; global?: boolean; legacyProjectSurfaces?: boolean; kiro?: boolean; antigravity?: boolean; codex?: boolean; yes?: boolean }) => {
      const platforms = (["kiro", "antigravity", "codex"] as const).filter((platform) => options[platform]);
      const projectModeCount = Number(options.purge === true) + Number(options.legacyProjectSurfaces === true);
      if (projectModeCount > 1 || (options.global === true && projectModeCount > 0)) throw new Error("--global, --purge, and --legacy-project-surfaces are mutually exclusive.");
      if (!options.global && platforms.length > 0) throw new Error("--kiro, --antigravity, and --codex require uninstall --global.");
      if (options.global && platforms.length === 0) throw new Error("uninstall --global requires at least one platform flag.");
      if (!options.global && projectModeCount === 0) throw new Error("Specify one of --purge, --global, or --legacy-project-surfaces.");

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
      const confirmationRequired = "confirmationRequired" in result
        ? result.confirmationRequired
        : result.platforms.some((platform) => platform.confirmationRequired);
      if (confirmationRequired) process.exitCode = 2;
    });
  program.command("mem").argument("[query]").option("--query <query>").option("--user <id>").option("--limit <count>").action(async (query: string | undefined, options: { query?: string; user?: string; limit?: string }) => {
    const limit = options.limit === undefined ? undefined : /^\d+$/u.test(options.limit) ? Number(options.limit) : Number.NaN; if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer."); const result = await searchMemory({ root: await resolveProjectRoot(process.cwd()), query: options.query ?? query, user: options.user, limit }); process.stdout.write(`${JSON.stringify(result)}\n`);
  });
  program.command("doctor").option("--fix", "Repair safe, unchanged managed files").option("--global", "Allow --fix to reconcile safe global integration drift").action(async (options: { fix?: boolean; global?: boolean }) => {
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
    if (result.project.status === "invalid" || result.globalIntegrations.some((integration) => integration.status === "invalid")) process.exitCode = 2;
    else if (!result.ok) process.exitCode = 1;
  });
  program.command("repo-map").requiredOption("--query <text>", "Search the structural repository map").option("--limit <count>", "Maximum results", "20").action(async (options: { query: string; limit: string }) => {
    process.stdout.write(`${JSON.stringify(await queryRepoMapInternal(process.cwd(), options.query, parseRepoMapLimit(options.limit)))}\n`);
  });
  const internal = new Command("internal");
  internal.command("context").option("--platform <platform>").action(async (options: { platform: "kiro" | "antigravity" | "codex" }) => {
    if (!options.platform || !["kiro", "antigravity", "codex"].includes(options.platform)) throw new Error("--platform must be kiro, antigravity, or codex.");
    const hookInput = programOptions.hookEventInput ? await programOptions.hookEventInput() : process.stdin.isTTY === true ? "" : await readBoundedInput(process.stdin);
    await runInternalContextCommand({ hookInput, platform: options.platform });
  });
  const repoMap = internal.command("repo-map", { hidden: true });
  repoMap.command("refresh").action(async () => {
    process.stdout.write(`${JSON.stringify(await refreshRepoMapInternal(process.cwd()))}\n`);
  });
  repoMap.command("query").requiredOption("--query <text>").option("--limit <count>", "Maximum results", "20").action(async (options: { query: string; limit: string }) => {
    process.stdout.write(`${JSON.stringify(await queryRepoMapInternal(process.cwd(), options.query, parseRepoMapLimit(options.limit)))}\n`);
  });
  const workflow = internal.command("workflow", { hidden: true });
  workflow.command("inspect").action(async () => {
    process.stdout.write(`${JSON.stringify(await inspectWorkflow(await resolveProjectRoot(process.cwd())))}\n`);
  });
  workflow.command("save").action(async () => {
    const input = programOptions.workflowInput ? await programOptions.workflowInput() : await readBoundedInput(process.stdin);
    if (!input) throw new Error("Workflow save requires a bounded JSON envelope on stdin.");
    let envelope: unknown;
    try { envelope = JSON.parse(input) as unknown; } catch { throw new Error("Workflow save requires valid JSON."); }
    process.stdout.write(`${JSON.stringify(await saveWorkflow(await resolveProjectRoot(process.cwd()), envelope as Parameters<typeof saveWorkflow>[1]))}\n`);
  });
  workflow.command("snapshot").requiredOption("--check <id>").action(async (options: { check: string }) => {
    process.stdout.write(`${JSON.stringify(await snapshotWorkflow(await resolveProjectRoot(process.cwd()), options.check))}\n`);
  });
  workflow.command("finish").action(async () => {
    process.stdout.write(`${JSON.stringify(await finishWorkflow(await resolveProjectRoot(process.cwd())))}\n`);
  });
  program.addCommand(internal, { hidden: true });
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
  try {
    await createProgram(programOptions).parseAsync(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error: unknown) {
    const commanderExit = typeof error === "object" && error !== null && "code" in error && String(error.code).startsWith("commander.");
    if (commanderExit) return "exitCode" in error && error.exitCode === 0 ? 0 : 2;
    process.stderr.write(`${redactPublicErrorMessage(error)}\n`);
    return 2;
  }
}

export function redactPublicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Harnix operation failed.";
  const rollbackDetail = error instanceof GlobalManagedTransactionError && error.rollback.partial.length > 0
    ? ` Partial rollback preserved concurrent edits at: ${error.rollback.partial.join(", ")}.`
    : "";
  return `${message}${rollbackDetail}`
    .replaceAll(process.cwd(), "[PROJECT]")
    .replace(/(['"])(?:[A-Za-z]:[\\/]|\/|\\\\)[^'"\r\n]+\1/gu, "'[PROJECT]'")
    // File-lock and filesystem errors commonly include an unquoted absolute
    // path. Redact the rest of that diagnostic segment rather than leaking a
    // user profile merely because the path contains spaces.
    .replace(/(?:\\\\(?:\?\\)?[^\\/\r\n]+[\\/]|[A-Za-z]:[\\/]|\/(?:home|Users|tmp|var\/folders)\/)[^\r\n]*/gu, "[PATH]")
    .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s,]+/giu, "$1[REDACTED]");
}
