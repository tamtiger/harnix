import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";

export interface CheckRunResult {
  exitCode: number;
  output: string;
}

/** Runs an executable with an argument array; never a shell string. */
export type CheckRunner = (executable: string, args: readonly string[], cwd: string) => Promise<CheckRunResult>;

export interface Invocation {
  executable: string;
  args: string[];
  /** Arguments are one pre-quoted command line that Node must not quote again (cmd.exe `/s /c "..."`). */
  verbatim?: true;
}

export type ProcessSpawner = (executable: string, args: string[], options: SpawnOptions) => ChildProcess;

export interface CheckProcessDependencies {
  platform?: NodeJS.Platform;
  spawner?: ProcessSpawner;
  /** Ends the child and everything it started; defaults to {@link killProcessTree}. */
  killer?: (pid: number, platform: NodeJS.Platform) => void;
  timeoutMs?: number;
}

const OUTPUT_LIMIT = 65_536;
const TIMEOUT_MS = 30 * 60 * 1000;
const TIMEOUT_EXIT_CODE = 124;
const CMD_METACHARACTERS = /[&|<>^%"\r\n]/u;
const UNSAFE_MESSAGE =
  "A command contains characters that are unsafe for cmd.exe; run the program by a name with its extension (for example pwsh.exe) or by its full path.";

/**
 * Windows command shims (`pnpm`, `npm`, `npx`) are `.cmd` files that cannot be
 * launched directly, so a bare command name goes through the fixed
 * `cmd.exe /d /s /c` route (as the hook launcher probe does). The executable and
 * every argument that cmd would interpret are rejected instead of quoted; a path
 * with spaces is passed as one quoted command line so `/s` strips the right quotes.
 */
export function resolveInvocation(
  executable: string,
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
): Invocation {
  if (platform === "win32" && (executable.toLowerCase() === "cmd" || executable.toLowerCase() === "cmd.exe")) {
    return { executable: "cmd.exe", args: [...args] };
  }
  const isBatchShim = /\.(?:cmd|bat)$/iu.test(executable);
  const bareName = !/[\\/]/u.test(executable) && !executable.includes(".");
  const needsCmd = isBatchShim || bareName;
  if (platform !== "win32" || !needsCmd) return { executable, args: [...args] };
  if (CMD_METACHARACTERS.test(executable) || args.some((argument) => CMD_METACHARACTERS.test(argument)))
    throw new Error(UNSAFE_MESSAGE);
  if (!/\s/u.test(executable)) return { executable: "cmd.exe", args: ["/d", "/s", "/c", executable, ...args] };
  const quote = (value: string): string => (/\s/u.test(value) || value === "" ? `"${value}"` : value);
  const commandLine = `"${[quote(executable), ...args.map(quote)].join(" ")}"`;
  return { executable: "cmd.exe", args: ["/d", "/s", "/c", commandLine], verbatim: true };
}

/** `taskkill /T /F` on Windows (a plain kill leaves the cmd.exe children running); a plain kill elsewhere. */
export function killProcessTree(
  pid: number,
  platform: NodeJS.Platform = process.platform,
  spawner: ProcessSpawner = spawn,
): void {
  if (platform === "win32") {
    spawner("taskkill", ["/pid", String(pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore" });
    return;
  }
  try {
    process.kill(pid);
  } catch {
    /* already gone */
  }
}

export function runCheckProcess(
  executable: string,
  args: readonly string[],
  cwd: string,
  dependencies: CheckProcessDependencies = {},
): Promise<CheckRunResult> {
  const platform = dependencies.platform ?? process.platform;
  const invocation = resolveInvocation(executable, args, platform);
  const spawner = dependencies.spawner ?? spawn;
  return new Promise((resolve, reject) => {
    const child = spawner(invocation.executable, invocation.args, {
      cwd,
      shell: false,
      windowsHide: true,
      ...(invocation.verbatim ? { windowsVerbatimArguments: true } : {}),
    });
    let output = "";
    const collect = (chunk: Buffer): void => {
      output = (output + chunk.toString("utf8")).slice(-OUTPUT_LIMIT);
    };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
    const timer = setTimeout(() => {
      output = `${output}\n[timed out]`.slice(-OUTPUT_LIMIT);
      if (child.pid === undefined) child.kill();
      else (dependencies.killer ?? ((pid, target) => killProcessTree(pid, target)))(child.pid, platform);
    }, dependencies.timeoutMs ?? TIMEOUT_MS);
    child.once("error", () => {
      clearTimeout(timer);
      reject(new Error(`Could not start executable ${executable}.`));
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? (signal === null ? 1 : TIMEOUT_EXIT_CODE), output });
    });
  });
}
