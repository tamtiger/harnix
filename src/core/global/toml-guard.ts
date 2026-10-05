const HEADER = /^\s*(\[\[?)\s*([^\]]*?)\s*\]\]?\s*(?:#.*)?$/u;
const HOOKS_PATH = "hooks.UserPromptSubmit";

function keyPath(path: string): string {
  return path
    .split(".")
    .map((segment) => segment.trim().replace(/^["']|["']$/gu, ""))
    .join(".");
}

function conflict(line: number): string {
  return `The file already defines ${HOOKS_PATH} in a form that [[${HOOKS_PATH}]] cannot extend (line ${line}); Harnix left it unchanged. Convert it to [[${HOOKS_PATH}]] tables or add the Harnix hook by hand.`;
}

function definesHooksInline(line: string, table: string): boolean {
  if (table === "hooks") return /^\s*["']?UserPromptSubmit["']?\s*=/u.test(line);
  if (table !== "") return false;
  return /^\s*hooks\s*\.\s*["']?UserPromptSubmit["']?\s*[.=]/u.test(line) || /^\s*hooks\s*=\s*\{/u.test(line);
}

/**
 * Conservative line scan (no TOML library): reports the first definition of `hooks.UserPromptSubmit` that is not an
 * array of tables, because appending `[[hooks.UserPromptSubmit]]` after it would redefine the key and make the whole
 * file invalid. A false positive only leaves the file untouched, which is the safe outcome.
 */
export function findHookConflict(toml: string): string | undefined {
  let table = "";
  const lines = toml.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    const header = HEADER.exec(line);
    if (header !== null) {
      table = keyPath(header[2] ?? "");
      const isTable = header[1] === "[";
      if (isTable && (table === HOOKS_PATH || table.startsWith(`${HOOKS_PATH}.`))) return conflict(index + 1);
      continue;
    }
    if (definesHooksInline(line, table)) return conflict(index + 1);
  }
  return undefined;
}

/** The line ending that dominates a file, so text added to it matches the rest of it. */
export function detectEol(text: string): "\r\n" | "\n" {
  const crlf = text.match(/\r\n/gu)?.length ?? 0;
  const lf = (text.match(/\n/gu)?.length ?? 0) - crlf;
  return crlf > lf ? "\r\n" : "\n";
}

export function withEol(text: string, eol: "\r\n" | "\n"): string {
  const normalized = text.replaceAll("\r\n", "\n");
  return eol === "\n" ? normalized : normalized.replaceAll("\n", "\r\n");
}
