import type { Command } from "commander";
import { normalizeRepositoryPath } from "./utils/paths.js";
import type { HomeResolver } from "./core/platform/user-paths.js";
import type { GlobalIntegrationCapabilityLookup } from "./commands/global-doctor.js";
import { GlobalManagedTransactionError } from "./core/global/managed-files.js";
import { platformRecords, type PlatformId } from "./core/platform/registry.js";
import type { TaskStatus } from "./core/tasks/task.js";
import type { CheckRunner } from "./utils/check-runner.js";
import type { HookCommandLookup, SetupPlatformsResult } from "./commands/setup.js";
import type { AvailableVersionLookup } from "./commands/upgrade.js";

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

export function defaultDeveloperId(environment: Readonly<Record<string, string | undefined>>): string {
  const candidate = environment.USERNAME ?? environment.USER ?? "developer";
  const normalized = candidate
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^[^A-Za-z0-9]+/u, "")
    .slice(0, 64);
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(normalized) ? normalized : "developer";
}

export function parseRepoMapLimit(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--limit must be an integer between 1 and 20.");
  const limit = Number(value);
  if (limit < 1 || limit > 20) throw new Error("--limit must be an integer between 1 and 20.");
  return limit;
}

export function parseRepoMapDepth(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--depth must be an integer between 1 and 3.");
  const depth = Number(value);
  if (depth < 1 || depth > 3) throw new Error("--depth must be an integer between 1 and 3.");
  return depth;
}

export function parseRepoMapPath(value: string, flag: "--impact" | "--tests" = "--impact"): string {
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

export function parseTaskLimit(value: string): number {
  if (!/^\d+$/u.test(value)) throw new Error("--limit must be an integer between 1 and 100 for tasks.");
  const limit = Number(value);
  if (limit < 1 || limit > 100) throw new Error("--limit must be an integer between 1 and 100 for tasks.");
  return limit;
}

export function parseTaskStatus(value: string | undefined): TaskStatus | undefined {
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

export function parseReportLimit(value: string, command: "context-report" | "status"): number {
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
  return `${message}${rollbackDetail}`
    .replaceAll(process.cwd(), "[PROJECT]")
    .replace(/(['"])(?:[A-Za-z]:[\\/]|\/|\\\\)[^'"\r\n]+\1/gu, "'[PROJECT]'")
    .replace(/(?:\\\\(?:\?\\)?[^\\/\r\n]+[\\/]|[A-Za-z]:[\\/]|\/(?:home|Users|tmp|var\/folders)\/)[^\r\n]*/gu, "[PATH]")
    .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s,]+/giu, "$1[REDACTED]");
}

export function isHiddenProtocolInvocation(argv: readonly string[]): boolean {
  return argv[2] === "context" || argv[2] === "workflow";
}

export function reportActionableSetupReadiness(result: SetupPlatformsResult): void {
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

export type PlatformFlagOptions = Partial<Record<PlatformId, boolean>>;

/** One `--<flag>` option per registered platform; the description is built from the platform label. */
export function addPlatformFlags(command: Command, describe: (label: string) => string): Command {
  for (const record of platformRecords()) command.option(`--${record.flag}`, describe(record.label));
  return command;
}

export function selectedPlatforms(options: PlatformFlagOptions): PlatformId[] {
  return platformRecords()
    .map((record) => record.id as PlatformId)
    .filter((id) => options[id] === true);
}

/** "--kiro, --antigravity, --codex, and --claude" built from the registry, plus any extra flags. */
export function platformFlagList(extra: readonly string[] = []): string {
  const flags = [...platformRecords().map((record) => `--${record.flag}`), ...extra];
  return `${flags.slice(0, -1).join(", ")}, and ${flags[flags.length - 1] ?? ""}`;
}
