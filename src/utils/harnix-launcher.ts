import { tmpdir } from "node:os";

import { findOnPath, runCheckProcess, type ExecutableLookup } from "src/utils/check-runner.js";

const PROBE_TIMEOUT_MS = 10_000;

export type HarnixLauncherRunner = (executable: string, args: readonly string[]) => Promise<void>;

export interface LookupHarnixLauncherOptions {
  /** Injectable for portable tests; production uses the current Node platform. */
  platform?: NodeJS.Platform | undefined;
  /** Injectable process boundary; no shell or user-provided command is used. */
  runner?: HarnixLauncherRunner | undefined;
  /** Injectable PATH lookup used on Windows; defaults to the absolute PATH entries of this process. */
  lookup?: ExecutableLookup | undefined;
}

/**
 * Probes the exact constant hook launcher. On Windows the command shim must be found on an absolute PATH entry first
 * (a `harnix.cmd` in the working directory is never run), and the probe then goes through the check runner, which
 * launches a `.cmd` shim by its resolved path from System32 and never from the working directory.
 */
export async function lookupHarnixLauncher(options: LookupHarnixLauncherOptions = {}): Promise<boolean> {
  const runner = options.runner ?? defaultRunner;
  try {
    if ((options.platform ?? process.platform) === "win32" && (options.lookup ?? findOnPath)("harnix") === undefined) {
      return false;
    }
    await runner("harnix", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/** Runs from the temporary directory so nothing in the project under inspection can influence the probe. */
async function defaultRunner(executable: string, args: readonly string[]): Promise<void> {
  const result = await runCheckProcess(executable, args, tmpdir(), { timeoutMs: PROBE_TIMEOUT_MS });
  if (result.exitCode !== 0) throw new Error(`${executable} exited with ${result.exitCode}.`);
}
