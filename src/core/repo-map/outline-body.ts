import { readRepoMap } from "./store.js";
import { makeResult } from "./outline-helpers.js";
import {
  repoMapRefreshHint,
  type RepoMapOutlineOptions,
  type RepoMapOutlineResultV1,
  type RepoMapSymbolOutlineV1,
} from "./types.js";

/** The most source lines one `--body` answer returns, shared by every symbol it matched. */
export const MAX_BODY_LINES = 200;

const secretKey = String.raw`(?:pass(?:word|wd)?|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|auth(?:orization)?)`;
/** Words after `password:` that are a type or a literal keyword, not a value (`password: string;`). */
const notAValue = String.raw`(?!(?:string|number|boolean|any|unknown|never|null|undefined|true|false|void|object|bigint|symbol)\b)`;
const secretLine = [
  // 'password' => '...', "password": "...", password = '...', ['password'] = '...', also in backticks
  new RegExp(String.raw`${secretKey}['"\x60\]]*\s*(?:=>|:|=)\s*['"\x60][^'"\x60\s]{4,}['"\x60]`, "iu"),
  // Password=...; in a connection string, or an unquoted assignment
  new RegExp(String.raw`${secretKey}\s*=\s*[^\s;'"\x60]{4,}`, "iu"),
  // password: value in YAML or an env file (no quotes), unless the word after the colon is a type
  new RegExp(String.raw`${secretKey}\s*:\s*${notAValue}[^\s'"\x60,;]{4,}`, "iu"),
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/u,
  /:\/\/[^/\s:@]+:[^/\s@]{3,}@/u,
  // Provider token shapes: AWS access key id, GitHub, OpenAI-style and Slack tokens
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}|\bsk-[A-Za-z0-9_-]{20,}|\bxox[abprs]-[A-Za-z0-9-]{10,}/u,
];
const privateKeyStart = /-----BEGIN [A-Z ]*PRIVATE KEY-----/u;
const privateKeyEnd = /-----END [A-Z ]*PRIVATE KEY-----/u;
const REDACTED = "[redacted]";

/**
 * Hides every line that looks like a credential, keeping the line count. It prefers hiding too much (a line that only
 * reads like a secret) to printing one: a body is source text that goes straight into an agent's context.
 */
export function redactSecretLines(lines: readonly string[]): string[] {
  let insideKey = false;
  return lines.map((line) => {
    if (insideKey || privateKeyStart.test(line)) {
      insideKey = !privateKeyEnd.test(line);
      return REDACTED;
    }
    return secretLine.some((pattern) => pattern.test(line)) ? REDACTED : line;
  });
}

/** Adds the source lines of each symbol, from `startLine` to `endLine`, inside one cap of {@link MAX_BODY_LINES}. */
export function attachSymbolBodies(text: string, symbols: readonly RepoMapSymbolOutlineV1[]): RepoMapSymbolOutlineV1[] {
  const lines = redactSecretLines(text.split(/\r?\n/u));
  let remaining = MAX_BODY_LINES;
  return symbols.map((symbol) => {
    const wanted = lines.slice(symbol.startLine - 1, symbol.endLine);
    const body = wanted.slice(0, remaining);
    remaining -= body.length;
    return { ...symbol, body, ...(body.length < wanted.length ? { bodyTruncated: true } : {}) };
  });
}

const blockedPath =
  /(?:^|\/)(?:config\/database\.[a-z]+|(?:wp-config|local[_-]?settings|secrets?|credentials?)\.[a-z]+)$/iu;

/** Configuration files that hold credentials by convention, on top of the names the inventory already keeps out. */
export function isBodyBlockedPath(path: string): boolean {
  return blockedPath.test(path);
}

/**
 * A body is only read from a file the repository map holds, which already leaves out ignored, credential-named,
 * binary and oversized files; a file the map does not hold (or a credential config) is skipped.
 */
export async function refuseBody(
  options: RepoMapOutlineOptions & { readonly root: string },
): Promise<RepoMapOutlineResultV1 | undefined> {
  if (isBodyBlockedPath(options.target)) return makeResult("skipped", options);
  try {
    const map = await readRepoMap(options.root);
    if (map.records.some((record) => record.path === options.target)) return undefined;
  } catch {
    // No readable map: the same answer as a file the map does not hold.
  }
  return { ...makeResult("skipped", options), hint: repoMapRefreshHint };
}
