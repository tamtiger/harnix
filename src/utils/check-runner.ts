import { spawn } from "node:child_process";

export interface CheckRunResult {
  exitCode: number;
  output: string;
}

/** Runs an executable with an argument array; never a shell string. */
export type CheckRunner = (executable: string, args: readonly string[], cwd: string) => Promise<CheckRunResult>;

interface Invocation {
  executable: string;
  args: string[];
}

const OUTPUT_LIMIT = 65_536;
const TIMEOUT_MS = 30 * 60 * 1000;
const TIMEOUT_EXIT_CODE = 124;
const CMD_METACHARACTERS = /[&|<>^%"\r\n]/u;

/**
 * Windows command shims (`pnpm`, `npm`, `npx`) are `.cmd` files that cannot be
 * launched directly, so a bare command name goes through the fixed
 * `cmd.exe /d /s /c` route (as the hook launcher probe does). Arguments that
 * cmd would interpret are rejected instead of quoted.
 */
export function resolveInvocation(
  executable: string,
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
): Invocation {
  const isBatchShim = /\.(?:cmd|bat)$/iu.test(executable);
  const bareName = !/[\\/]/u.test(executable) && !executable.includes(".");
  const needsCmd = isBatchShim || bareName;
  if (platform !== "win32" || !needsCmd) return { executable, args: [...args] };
  const unsafe = args.find((argument) => CMD_METACHARACTERS.test(argument));
  if (unsafe !== undefined)
    throw new Error(
      "A command argument contains characters that are unsafe for cmd.exe; run the program by a name with its extension (for example pwsh.exe) or by its full path.",
    );
  return { executable: "cmd.exe", args: ["/d", "/s", "/c", executable, ...args] };
}

export function runCheckProcess(executable: string, args: readonly string[], cwd: string): Promise<CheckRunResult> {
  const invocation = resolveInvocation(executable, args);
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.executable, invocation.args, { cwd, shell: false, windowsHide: true });
    let output = "";
    const collect = (chunk: Buffer): void => {
      output = (output + chunk.toString("utf8")).slice(-OUTPUT_LIMIT);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    const timer = setTimeout(() => {
      output = `${output}\n[timed out]`.slice(-OUTPUT_LIMIT);
      child.kill();
    }, TIMEOUT_MS);
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
