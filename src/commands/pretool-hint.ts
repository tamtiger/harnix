/**
 * Pure `PreToolUse` reminder for Claude Code: when the agent is about to search for one identifier with Grep or a
 * recursive `grep`/`rg`, point at `harnix repo-map --refs`. It never blocks, decides no permission and keeps no state,
 * so a wrong guess costs one short line of context and nothing else.
 */

export const PRETOOL_EVENT_NAME = "PreToolUse";

/** One identifier of at least three characters; anything with spaces, regex syntax or accents is a text search. */
const SYMBOL = /^[A-Za-z_][A-Za-z0-9_]{2,79}$/u;
const SEPARATORS = new Set(["&&", "||", ";", "|"]);
const RECURSIVE_GREP_FLAG = /^-[A-Za-z]*[rR][A-Za-z]*$/u;

export function isPreToolUseEvent(value: unknown): boolean {
  return isRecord(value) && value.hook_event_name === PRETOOL_EVENT_NAME;
}

/** The JSON document Claude Code reads from stdout, or `undefined` when the call is not a symbol search. */
export function pretoolHintFor(event: unknown): string | undefined {
  if (!isPreToolUseEvent(event)) return undefined;
  const record = event as Record<string, unknown>;
  const input = record.tool_input;
  if (!isRecord(input)) return undefined;
  const symbol =
    record.tool_name === "Grep"
      ? grepToolSymbol(input.pattern)
      : record.tool_name === "Bash"
        ? bashSymbol(input.command)
        : record.tool_name === "PowerShell"
          ? powershellSymbol(input.command)
          : undefined;
  if (symbol === undefined) return undefined;
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: PRETOOL_EVENT_NAME,
      additionalContext: `Harnix: for a symbol use \`harnix repo-map --refs ${symbol}\` (call sites) or \`--outline <path> --symbol ${symbol} --body\` before Grep or grep -r; Grep stays right for text searches.`,
    },
  });
}

function grepToolSymbol(pattern: unknown): string | undefined {
  return typeof pattern === "string" ? symbolOf(pattern) : undefined;
}

function bashSymbol(command: unknown): string | undefined {
  if (typeof command !== "string" || command.length > 4096) return undefined;
  const tokens = tokenize(command);
  if (tokens === undefined) return undefined;
  let segment: string[] = [];
  for (const token of [...tokens, ";"]) {
    if (SEPARATORS.has(token)) {
      const symbol = segmentSymbol(segment);
      if (symbol !== undefined) return symbol;
      segment = [];
    } else segment.push(token);
  }
  return undefined;
}

const SELECT_STRING = new Set(["select-string", "sls"]);
const POWERSHELL_RECURSE = /^-r(?:e(?:c(?:u(?:r(?:s(?:e)?)?)?)?)?)?$/iu;

/**
 * `Select-String` (alias `sls`) over a recursive listing or a wildcard path is the PowerShell form of `grep -r`; a single
 * file stays silent, like a non-recursive `grep`. The pattern is `-Pattern <p>` or the first bare token.
 */
function powershellSymbol(command: unknown): string | undefined {
  if (typeof command !== "string" || command.length > 4096) return undefined;
  const tokens = tokenize(command);
  if (tokens === undefined) return undefined;
  const recursive = tokens.some(
    (token) => POWERSHELL_RECURSE.test(token) || token.includes("*") || /^\(?(?:get-childitem|gci|dir)$/iu.test(token),
  );
  if (!recursive) return undefined;
  for (let index = 0; index < tokens.length; index += 1) {
    if (!SELECT_STRING.has(tokens[index]!.toLowerCase())) continue;
    const rest = tokens.slice(index + 1);
    const flag = rest.findIndex((token) => /^-pat(?:t(?:e(?:r(?:n)?)?)?)?$/iu.test(token));
    const pattern = flag >= 0 ? rest[flag + 1] : firstPositional(rest);
    const symbol = pattern === undefined ? undefined : symbolOf(pattern);
    if (symbol !== undefined) return symbol;
  }
  return undefined;
}

const VALUE_PARAMETERS = /^-(?:path|literalpath|include|exclude|context|encoding|filter)$/iu;

/** The first token that is neither a parameter nor the value of a value-taking one. */
function firstPositional(tokens: readonly string[]): string | undefined {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (VALUE_PARAMETERS.test(token)) index += 1;
    else if (!token.startsWith("-")) return token;
  }
  return undefined;
}

function segmentSymbol(segment: string[]): string | undefined {
  const [tool, ...rest] = segment;
  if (tool !== "grep" && tool !== "rg") return undefined;
  const flags = rest.filter((token) => token.startsWith("-"));
  if (tool === "grep" && !flags.some((flag) => RECURSIVE_GREP_FLAG.test(flag) || flag === "--recursive")) {
    return undefined;
  }
  const pattern = rest.find((token) => !token.startsWith("-"));
  return pattern === undefined ? undefined : symbolOf(pattern);
}

function symbolOf(pattern: string): string | undefined {
  const bare = pattern.replace(/^\\b/u, "").replace(/\\b$/u, "");
  return SYMBOL.test(bare) ? bare : undefined;
}

/** Splits on whitespace and unquoted `&& || ; |`; a quoted separator stays inside its token. An open quote gives up. */
function tokenize(command: string): string[] | undefined {
  const tokens: string[] = [];
  let current = "";
  let quote: string | undefined;
  const flush = (): void => {
    if (current.length > 0) tokens.push(current);
    current = "";
  };
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]!;
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      else current += char;
    } else if (char === "'" || char === '"') quote = char;
    else if (/\s/u.test(char)) flush();
    else if (char === ";" || char === "|" || char === "&") {
      flush();
      const pair = command.slice(index, index + 2);
      if (pair === "&&" || pair === "||") {
        tokens.push(pair);
        index += 1;
      } else tokens.push(char === "&" ? ";" : char);
    } else current += char;
  }
  if (quote !== undefined) return undefined;
  flush();
  return tokens;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
