const PACKAGE_MANAGERS = new Set(["npm", "pnpm", "yarn", "bun"]);
const EXECUTABLE_SUFFIX = /\.(?:cmd|exe|bat|ps1)$/iu;
const DESCRIPTION_LIMIT = 200;

/**
 * Canonical form of a command for comparison: quotes dropped, whitespace collapsed, the executable lower-cased
 * without a Windows suffix, and the optional `run` of a package manager removed so `pnpm run test` equals `pnpm test`.
 */
export function normalizeCommand(command: string): string {
  const tokens = command
    .replace(/["']/gu, "")
    .split(/\s+/u)
    .filter((token) => token !== "");
  const [executable, ...rest] = tokens;
  if (executable === undefined) return "";
  const name = executable.replace(EXECUTABLE_SUFFIX, "").toLowerCase();
  const args = PACKAGE_MANAGERS.has(name) && rest[0] === "run" ? rest.slice(1) : rest;
  return [name, ...args].join(" ");
}

/** Argv of a declared command: split on whitespace outside single or double quotes, quotes dropped. */
export function splitCommand(command: string): string[] {
  const argv: string[] = [];
  let current = "";
  let quote: string | undefined;
  let started = false;
  for (const char of command) {
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/u.test(char)) {
      if (started) argv.push(current);
      current = "";
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (started) argv.push(current);
  return argv;
}

const unquoted = (word: string): string => word.replace(/["']/gu, "");
const hasDirectory = (word: string): boolean => /[\\/]/u.test(word);
const baseName = (path: string): string => path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
const executableName = (word: string): string => baseName(word).replace(EXECUTABLE_SUFFIX, "").toLowerCase();
const executablePath = (word: string): string => word.replace(/\\/gu, "/").replace(EXECUTABLE_SUFFIX, "").toLowerCase();

/** A word list without the optional `run` of a package manager, so `pnpm run test` equals `pnpm test`. */
function withoutRun(words: readonly string[]): string[] {
  const [first, second, ...rest] = words;
  return first !== undefined && second === "run" && PACKAGE_MANAGERS.has(executableName(first))
    ? [first, ...rest]
    : [...words];
}

/**
 * True when the argv of a run is the command a check declared: the arguments equal one by one, and the executable is
 * compared by name (directory and Windows suffix ignored) when the declaration is a bare name, so an absolute path
 * to node matches `node`. A declaration that names a directory must match that exact path.
 */
export function sameCommand(declared: string, argv: readonly string[]): boolean {
  const wanted = withoutRun(splitCommand(declared).map(unquoted));
  const actual = withoutRun(argv.map(unquoted));
  const [wantedExecutable, ...wantedArguments] = wanted;
  const [actualExecutable, ...actualArguments] = actual;
  if (wantedExecutable === undefined || actualExecutable === undefined) return false;
  if (wantedArguments.length !== actualArguments.length) return false;
  const sameExecutable = hasDirectory(wantedExecutable)
    ? executablePath(wantedExecutable) === executablePath(actualExecutable)
    : executableName(wantedExecutable) === executableName(actualExecutable);
  return sameExecutable && wantedArguments.every((word, index) => word === actualArguments[index]);
}

/** Bounded text of the command that really ran, for evidence summaries. */
export function describeCommand(argv: readonly string[]): string {
  // The executable is named, never located: evidence must not carry a machine path.
  const [executable = "", ...rest] = argv;
  const text = normalizeCommand([executableName(unquoted(executable)), ...rest].join(" "));
  return text.length <= DESCRIPTION_LIMIT ? text : `${text.slice(0, DESCRIPTION_LIMIT - 3)}...`;
}

/** Package managers that all run the same `test` script, so `npm test` and `pnpm run test` are the same suite. */
export function equivalentCommand(left: string, right: string): boolean {
  const generic = (command: string): string => {
    const [name = "", ...rest] = normalizeCommand(command).split(" ");
    return [PACKAGE_MANAGERS.has(name) ? "pm" : name, ...rest].join(" ");
  };
  return generic(left) === generic(right);
}
