import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type HarnixLauncherRunner = (executable: string, args: readonly string[]) => Promise<void>;

export interface LookupHarnixLauncherOptions {
  /** Injectable for portable tests; production uses the current Node platform. */
  platform?: NodeJS.Platform | undefined;
  /** Injectable process boundary; no shell or user-provided command is used. */
  runner?: HarnixLauncherRunner | undefined;
}

/**
 * Probes the exact constant hook launcher. Windows command shims are `.cmd`
 * files, so they must run through the fixed `cmd.exe /c` route instead of
 * `execFile("harnix")`, which cannot launch batch files directly.
 */
export async function lookupHarnixLauncher(options: LookupHarnixLauncherOptions = {}): Promise<boolean> {
  const runner = options.runner ?? defaultRunner;
  try {
    if ((options.platform ?? process.platform) === "win32") {
      await runner("cmd.exe", ["/d", "/s", "/c", "harnix --version"]);
    } else {
      await runner("harnix", ["--version"]);
    }
    return true;
  } catch {
    return false;
  }
}

async function defaultRunner(executable: string, args: readonly string[]): Promise<void> {
  await execFileAsync(executable, [...args], { windowsHide: true });
}
