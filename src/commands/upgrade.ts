import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export type AvailableVersionLookup = () => Promise<string | undefined>;
export type UpgradeRunner = (executable: string, args: string[]) => Promise<void>;
export interface UpgradeOptions { installedVersion: string; availableVersion?: AvailableVersionLookup | undefined; apply?: boolean | undefined; runner?: UpgradeRunner | undefined; }
export interface UpgradeResult { installed: string; available: string | null; command: string[]; applied: boolean; }

/** The default path is deliberately offline; callers inject registry access when they explicitly want it. */
export async function upgradeHarnix(options: UpgradeOptions): Promise<UpgradeResult> {
  const available = await (options.availableVersion ?? (async () => undefined))();
  const command = ["npm", "install", "--save-dev", "@tamtiger/harnix@latest"];
  if (options.apply) {
    const runner = options.runner ?? defaultRunner;
    await runner(command[0]!, command.slice(1));
  }
  return { installed: options.installedVersion, available: available ?? null, command, applied: options.apply === true };
}

async function defaultRunner(executable: string, args: string[]): Promise<void> { await execFileAsync(executable, args, { windowsHide: true }); }
