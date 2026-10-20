import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { win32 } from "node:path";

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

/** Finds the file a bare command name runs as on Windows; `undefined` when the name is not on the path. */
export type ExecutableLookup = (name: string) => string | undefined;

export type ProcessSpawner = (executable: string, args: string[], options: SpawnOptions) => ChildProcess;

export interface CheckProcessDependencies {
  platform?: NodeJS.Platform;
  spawner?: ProcessSpawner;
  /** Ends the child and everything it started; defaults to {@link killProcessTree}. */
  killer?: (pid: number, platform: NodeJS.Platform) => void;
  /** Resolves a bare command name on Windows; defaults to {@link findOnPath}. */
  lookup?: ExecutableLookup;
  /** The Windows directory holding System32; defaults to the SystemRoot variable of this process. */
  systemRoot?: string;
  timeoutMs?: number;
}

const OUTPUT_LIMIT = 65_536;
const TIMEOUT_MS = 30 * 60 * 1000;
const TIMEOUT_EXIT_CODE = 124;
const CMD_METACHARACTERS = /[&|<>^%"\r\n]/u;
const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";
const UNSAFE_MESSAGE =
  "A command contains characters that are unsafe for cmd.exe; run the program by a name with its extension (for example pwsh.exe) or by its full path.";

/**
 * Windows resolution of a bare command name: for each absolute directory of PATH, in order, the first file named
 * `<name><ext>` for the extensions of PATHEXT. Relative and empty entries are skipped so a program in the working
 * directory of the repository under check is never picked up by name.
 */
export function findOnPath(
  name: string,
  env: { PATH?: string | undefined; PATHEXT?: string | undefined } = process.env,
  exists: (candidate: string) => boolean = existsSync,
): string | undefined {
  const directories = (env.PATH ?? "")
    .split(";")
    .map((directory) => directory.replace(/^"|"$/gu, ""))
    .filter((directory) => win32.isAbsolute(directory));
  const extensions = (env.PATHEXT ?? DEFAULT_PATHEXT).split(";").filter((extension) => extension !== "");
  for (const directory of directories)
    for (const extension of extensions) {
      const candidate = win32.join(directory, `${name}${extension}`);
      if (exists(candidate)) return candidate;
    }
  return undefined;
}

/** The resolved path of a `.cmd`/`.bat` shim found on PATH; refuses one whose path cmd.exe would misread. */
function shimPath(resolved: string | undefined): string | undefined {
  if (resolved === undefined || !/\.(?:cmd|bat)$/iu.test(resolved)) return undefined;
  if (CMD_METACHARACTERS.test(resolved)) throw new Error(UNSAFE_MESSAGE);
  return resolved;
}

/**
 * Windows command shims (`pnpm`, `npm`, `npx`) are `.cmd` files that cannot be
 * launched directly, so a bare command name goes through the fixed
 * `cmd.exe /d /s /c` route (as the hook launcher probe does). The executable and
 * every argument that cmd would interpret are rejected instead of quoted; a path
 * with spaces is passed as one quoted command line so `/s` strips the right quotes. When a `lookup` finds that a
 * bare name is a real executable (`dotnet.exe`), it is launched directly: no shell sees its arguments, so a `|` in a
 * test filter is just an argument.
 */
export function resolveInvocation(
  executable: string,
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
  lookup?: ExecutableLookup,
): Invocation {
  if (platform === "win32" && (executable.toLowerCase() === "cmd" || executable.toLowerCase() === "cmd.exe")) {
    return { executable: "cmd.exe", args: [...args] };
  }
  const isBatchShim = /\.(?:cmd|bat)$/iu.test(executable);
  const bareName = !/[\\/]/u.test(executable) && !executable.includes(".");
  const needsCmd = isBatchShim || bareName;
  if (platform !== "win32" || !needsCmd) return { executable, args: [...args] };
  const resolved = bareName ? lookup?.(executable) : undefined;
  if (resolved !== undefined && /\.(?:exe|com)$/iu.test(resolved)) return { executable: resolved, args: [...args] };
  // A shim found on PATH runs by its resolved path: cmd.exe would otherwise look in the working directory first.
  const command = shimPath(resolved) ?? executable;
  if (CMD_METACHARACTERS.test(command) || args.some((argument) => CMD_METACHARACTERS.test(argument)))
    throw new Error(UNSAFE_MESSAGE);
  if (!/\s/u.test(command)) return { executable: "cmd.exe", args: ["/d", "/s", "/c", command, ...args] };
  const quote = (value: string): string => (/\s/u.test(value) || value === "" ? `"${value}"` : value);
  const commandLine = `"${[quote(command), ...args.map(quote)].join(" ")}"`;
  return { executable: "cmd.exe", args: ["/d", "/s", "/c", commandLine], verbatim: true };
}

/** The Windows directory, from the environment of the process (never from the repository under check). */
function defaultSystemRoot(): string {
  return process.env.SystemRoot ?? "C:\\Windows";
}

/** An executable of the Windows System32 directory by absolute path, so a copy planted in the working directory never wins. */
function systemExecutable(systemRoot: string, name: string): string {
  return win32.join(systemRoot, "System32", name);
}

/** `taskkill /T /F` on Windows (a plain kill leaves the cmd.exe children running); a plain kill elsewhere. */
export function killProcessTree(
  pid: number,
  platform: NodeJS.Platform = process.platform,
  spawner: ProcessSpawner = spawn,
  systemRoot: string = defaultSystemRoot(),
): void {
  if (platform === "win32") {
    spawner(systemExecutable(systemRoot, "taskkill.exe"), ["/pid", String(pid), "/T", "/F"], {
      shell: false,
      windowsHide: true,
      stdio: "ignore",
    });
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
  const invocation = resolveInvocation(executable, args, platform, dependencies.lookup ?? findOnPath);
  const spawner = dependencies.spawner ?? spawn;
  return new Promise((resolve, reject) => {
    const file =
      platform === "win32" && invocation.executable === "cmd.exe"
        ? systemExecutable(dependencies.systemRoot ?? defaultSystemRoot(), "cmd.exe")
        : invocation.executable;
    const child = spawner(file, invocation.args, {
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
      else
        (dependencies.killer ?? ((pid, target) => killProcessTree(pid, target, spawn, dependencies.systemRoot)))(
          child.pid,
          platform,
        );
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
