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
  /** Whether a file exists; defaults to existsSync (used to find a wrapper in the working directory). */
  exists?: (path: string) => boolean;
}

const OUTPUT_LIMIT = 65_536;
const TIMEOUT_MS = 30 * 60 * 1000;
const TIMEOUT_EXIT_CODE = 124;
const CMD_METACHARACTERS = /[&|<>^%"\r\n]/u;
const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";
/** Commands that exist only inside cmd.exe, so they cannot be found on PATH. */
const CMD_BUILTINS: ReadonlySet<string> = new Set([
  "cd",
  "cls",
  "copy",
  "del",
  "dir",
  "echo",
  "exit",
  "md",
  "mkdir",
  "move",
  "rd",
  "ren",
  "rmdir",
  "set",
  "type",
  "ver",
]);
/** A wrapper the repository itself ships (gradlew.bat, mvnw.cmd): run by its own path when PATH has nothing of that name. */
const WRAPPER_EXTENSIONS = [".cmd", ".bat", ".exe", ".com"] as const;

/** A bare command name that PATH cannot resolve: the check never started, so it is a launcher error, not a red run. */
export class CommandNotFoundError extends Error {}

/**
 * cmd.exe searches the working directory first for a name PATH cannot resolve, so such a name is refused unless it is
 * a cmd built-in. Without a resolver (a bare call with no PATH knowledge) the old cmd.exe route is kept.
 */
function assertResolvable(
  executable: string,
  bareName: boolean,
  hasLookup: boolean,
  resolved: string | undefined,
): void {
  if (!bareName || !hasLookup || resolved !== undefined || CMD_BUILTINS.has(executable.toLowerCase())) return;
  throw new CommandNotFoundError(
    `Command not found on PATH: ${executable}; use its full path or a name with its extension.`,
  );
}
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
  const hasExt = extensions.some((extension) => name.toLowerCase().endsWith(extension.toLowerCase()));
  for (const directory of directories) {
    if (hasExt) {
      const candidate = win32.join(directory, name);
      if (exists(candidate)) return candidate;
    } else {
      for (const extension of extensions) {
        const candidate = win32.join(directory, `${name}${extension}`);
        if (exists(candidate)) return candidate;
      }
    }
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
  const hasSlash = /[\\/]/u.test(executable);
  const isDirectBinary = !hasSlash && /\.(?:exe|com)$/iu.test(executable);
  if (platform === "win32" && isDirectBinary) {
    if (lookup === undefined) return { executable, args: [...args] };
    const resolved = lookup(executable);
    assertResolvable(executable, true, true, resolved);
    return { executable: resolved ?? executable, args: [...args] };
  }
  const isBatchShim = /\.(?:cmd|bat)$/iu.test(executable);
  const bareName = !hasSlash && !executable.includes(".");
  const needsCmd = isBatchShim || bareName;
  if (platform !== "win32" || !needsCmd) return { executable, args: [...args] };
  const resolved = bareName ? lookup?.(executable) : undefined;
  assertResolvable(executable, bareName, lookup !== undefined, resolved);
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

/**
 * PATH decides what a bare name means; only when PATH has nothing of that name does the working directory get a say,
 * and then only for the wrapper script of that very name (gradlew, mvnw), run by its own path.
 */
function resolveForRun(
  executable: string,
  args: readonly string[],
  cwd: string,
  platform: NodeJS.Platform,
  dependencies: CheckProcessDependencies,
): Invocation {
  const lookup = dependencies.lookup ?? findOnPath;
  try {
    return resolveInvocation(executable, args, platform, lookup);
  } catch (error: unknown) {
    if (!(error instanceof CommandNotFoundError)) throw error;
    const exists = dependencies.exists ?? existsSync;
    const wrapper = WRAPPER_EXTENSIONS.map((extension) => win32.join(cwd, `${executable}${extension}`)).find(exists);
    if (wrapper === undefined) throw error;
    return resolveInvocation(wrapper, args, platform, lookup);
  }
}

export function runCheckProcess(
  executable: string,
  args: readonly string[],
  cwd: string,
  dependencies: CheckProcessDependencies = {},
): Promise<CheckRunResult> {
  const platform = dependencies.platform ?? process.platform;
  let invocation: Invocation;
  try {
    invocation = resolveForRun(executable, args, cwd, platform, dependencies);
  } catch (error: unknown) {
    // Reported as output, like any launcher that cannot find its program, so the workflow says "could not start".
    if (error instanceof CommandNotFoundError) return Promise.resolve({ exitCode: 127, output: error.message });
    throw error;
  }
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
