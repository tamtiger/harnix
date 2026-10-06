import { runCheckProcess, type CheckRunner } from "src/utils/check-runner.js";

export type AvailableVersionLookup = () => Promise<string | undefined>;
export type UpgradeRunner = (executable: string, args: string[]) => Promise<void>;
export interface UpgradeOptions {
  installedVersion: string;
  availableVersion?: AvailableVersionLookup | undefined;
  apply?: boolean | undefined;
  runner?: UpgradeRunner | undefined;
  /** Process runner behind the default apply path; it routes `npm` through cmd.exe on Windows. */
  checkRunner?: CheckRunner | undefined;
}
export interface UpgradeResult {
  installed: string;
  available: string | null;
  command: string[];
  applied: boolean;
}

/** The default path is deliberately offline; callers inject registry access when they explicitly want it. */
export async function upgradeHarnix(options: UpgradeOptions): Promise<UpgradeResult> {
  // eslint-disable-next-line @typescript-eslint/require-await -- satisfies the async injected registry-lookup signature
  const available = await (options.availableVersion ?? (async () => undefined))();
  const command = ["npm", "install", "--save-dev", "@tamtiger/harnix@latest"];
  if (options.apply) {
    const runner =
      options.runner ?? ((executable, args) => runNpm(options.checkRunner ?? runCheckProcess, executable, args));
    await runner(command[0]!, command.slice(1));
  }
  return {
    installed: options.installedVersion,
    available: available ?? null,
    command,
    applied: options.apply === true,
  };
}

async function runNpm(run: CheckRunner, executable: string, args: string[]): Promise<void> {
  const result = await run(executable, args, process.cwd());
  if (result.exitCode !== 0) throw new Error(`The upgrade command exited with code ${result.exitCode}.`);
}
