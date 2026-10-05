import { antigravityGlobalPluginDesiredFiles } from "src/configurators/antigravity.js";
import { claudeGlobalDesiredFiles, matchesClaudeGlobalContextHookGroup } from "src/configurators/claude.js";
import { createCodexGlobalSurfacePlan, matchesCodexGlobalContextHookGroup } from "src/configurators/codex.js";
import { cursorGlobalDesiredFiles } from "src/configurators/cursor.js";
import { kiroGlobalDesiredFiles } from "src/configurators/kiro.js";
import { opencodeGlobalDesiredFiles } from "src/configurators/opencode.js";
import type { GlobalLock, GlobalLockAcquirer } from "src/core/global/locking.js";
import {
  setupGlobal,
  type GlobalIntegrationReadiness,
  type GlobalSetupPlatformResult,
  type HookCommandLookup,
  type SetupGlobalResult,
} from "src/core/global/setup.js";
import type { GlobalPlanProvider } from "src/core/global/targets.js";
import type { PlatformId } from "src/core/platform/registry.js";
import type { HomeResolver } from "src/core/platform/user-paths.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { lookupHarnixLauncher } from "src/utils/harnix-launcher.js";
import { isTestProcess } from "src/utils/test-process.js";
import { packageVersion } from "src/version.js";

export type GlobalSetupPlatform = PlatformId;
export type GlobalSetupLock = GlobalLock;
export type GlobalSetupLockAcquirer = GlobalLockAcquirer;
export type SetupPlatformsResult = SetupGlobalResult;
export type { GlobalIntegrationReadiness, GlobalSetupPlatformResult, HookCommandLookup };

export interface SetupPlatformsOptions {
  readonly platforms: readonly GlobalSetupPlatform[];
  readonly dryRun?: boolean | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly commandLookup?: HookCommandLookup | undefined;
  /** Internal lifecycle option used by `update --global` to prune unchanged retired fragments. */
  readonly removeObsolete?: boolean | undefined;
  /** Defaults to true for setup; global update opts out unless `--restore` is explicit. */
  readonly restoreDeleted?: boolean | undefined;
  /** Test-only lock injection; production uses Harnix's cross-process lock. */
  readonly lockAcquirer?: GlobalSetupLockAcquirer | undefined;
}

/** The desired files and hook matchers each registered target installs, supplied by the configurators. */
export function configuratorPlans(): GlobalPlanProvider {
  const codex = createCodexGlobalSurfacePlan();
  const desired = {
    kiro: kiroGlobalDesiredFiles(),
    "antigravity-plugin": antigravityGlobalPluginDesiredFiles(),
    claude: claudeGlobalDesiredFiles(),
    "codex-config": codex.config,
    "codex-skills": codex.skills,
    opencode: opencodeGlobalDesiredFiles(),
    cursor: cursorGlobalDesiredFiles(),
  } as const;
  const matchers = {
    claude: new Map([["claude-global-context-hook", matchesClaudeGlobalContextHookGroup]]),
    "codex-config": new Map([["codex-global-context-hook", matchesCodexGlobalContextHookGroup]]),
  } as const;
  return {
    desired: (planKey) => desired[planKey as keyof typeof desired] ?? [],
    memberMatchers: (planKey) => matchers[planKey as keyof typeof matchers],
  };
}

export async function defaultCommandLookup(command: string): Promise<boolean> {
  return command === "harnix" && lookupHarnixLauncher();
}

/** Installs only explicit user-global integrations; an uninitialized directory is a valid caller. */
export async function setupPlatforms(options: SetupPlatformsOptions): Promise<SetupPlatformsResult> {
  if (isTestProcess() && options.homeResolver === undefined) {
    throw new Error("Global setup requires an injected homeResolver in test mode.");
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    throw new Error("Global setup requires an injected commandLookup in test mode.");
  }
  return setupGlobal({
    ...options,
    commandLookup: options.commandLookup ?? defaultCommandLookup,
    generatorVersion: packageVersion,
    lockAcquirer: options.lockAcquirer ?? acquireHarnixFileLock,
    plans: configuratorPlans(),
  });
}
