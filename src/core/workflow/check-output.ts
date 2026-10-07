const MAX_ITEMS = 10;
const MAX_SUMMARY = 800;
const FALLBACK_TAIL = 600;
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/gu;
const WINDOWS_PATH = /\b[A-Za-z]:[\\/][^\s"'<>|]*/gu;
const POSIX_PATH = /(?<![\w.:<])\/(?:[\w.@-]+\/)+[\w.@-]*/gu;
const FAIL_LINE = /^\s*FAIL\s+(\S+)(.*)$/u;

const LAUNCHER_ERRORS: readonly { pattern: RegExp; reason: string }[] = [
  {
    pattern: /ERR_PNPM_NO_PKG_MANIFEST|npm error (?:code )?ENOENT/iu,
    reason: "no package.json found in the working directory",
  },
  { pattern: /ERR_PNPM_NO_SCRIPT|Missing script/iu, reason: "missing script in package.json" },
  {
    pattern: /is not recognized as an internal or external command|command not found/iu,
    reason: "command not found",
  },
];

/** Output with terminal colors removed and machine paths hidden: safe to hand back to an agent. */
function clean(output: string): string {
  return output.replace(ANSI, "").replace(WINDOWS_PATH, "<path>").replace(POSIX_PATH, "<path>");
}

/**
 * The reason a red check is red, in few tokens: each failing vitest test with the first line of its message
 * (at most 10 and 800 characters), otherwise the last 600 characters. Never persisted.
 */
export function summarizeCheckOutput(output: string): string {
  const lines = clean(output).split(/\r?\n/u);
  const failures: string[] = [];
  lines.forEach((line, index) => {
    const match = FAIL_LINE.exec(line);
    if (match === null) return;
    const names = /^\s*>\s+(.+?)\s*$/u.exec(match[2] ?? "")?.[1] ?? match[1] ?? "";
    const message = lines
      .slice(index + 1)
      .find((next) => next.trim() !== "" && !next.trimStart().startsWith("⎯") && !FAIL_LINE.test(next));
    failures.push(message === undefined ? names : `${names}: ${message.trim()}`);
  });
  if (failures.length === 0) return lines.join("\n").slice(-FALLBACK_TAIL);
  const extra = failures.length > MAX_ITEMS ? `\n(+${failures.length - MAX_ITEMS} more)` : "";
  return `${failures.slice(0, MAX_ITEMS).join("\n")}${extra}`.slice(0, MAX_SUMMARY);
}

/**
 * A narrow match of launcher errors (pnpm or npm cannot find the project or script, the command does not exist):
 * the check never ran, so the run is not a red test. A report with failing tests is never a launcher error.
 */
export function launcherFailure(output: string, exitCode: number): string | undefined {
  if (exitCode === 0 || /^\s*FAIL\s/mu.test(output)) return undefined;
  return LAUNCHER_ERRORS.find(({ pattern }) => pattern.test(output))?.reason;
}
