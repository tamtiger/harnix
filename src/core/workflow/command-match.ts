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

/** True when the argv of a run is the command a check declared. */
export function sameCommand(declared: string, argv: readonly string[]): boolean {
  return normalizeCommand(declared) === normalizeCommand(argv.join(" "));
}

/** Bounded text of the command that really ran, for evidence summaries. */
export function describeCommand(argv: readonly string[]): string {
  const text = normalizeCommand(argv.join(" "));
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
