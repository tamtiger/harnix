import { redactSecrets } from "./secret-scan.js";

const MASK = "<redacted>";

/**
 * A line of a check's output longer than this is cut to its start and its end. Minified bundles and one-line dumps are
 * the only lines this long, and a pattern scanning them is the one thing that can make `--run-check` hang; the
 * dropped middle cannot leak anything. The rules below are linear on their own, so the cap is a second line of defense.
 */
export const MAX_LINE_LENGTH = 4096;

/**
 * Each rule keeps its first capture group (the name or scheme in front of the value); the rest of a match is the
 * secret. Every rule is linear: a literal keyword, then a bounded run of blanks, so no two unbounded loops sit on one
 * side of a keyword. The keyword must END the name (`secretary`, `tokenizer` and `token_count` are not credentials);
 * whatever stands in front of it (`my-api-token`, `GITHUB_TOKEN`) stays out of the match and is simply kept.
 */
export const LOG_RULES: readonly RegExp[] = [
  // An Authorization header: the scheme stays, the credential goes.
  /(\bAuthorization[ \t]{0,8}[:=][ \t]{0,8}(?:Bearer|Basic|Token|Digest)[ \t]{1,8})\S+/giu,
  // A bearer token on its own, long enough not to be a word of prose.
  /(\bBearer[ \t]{1,8})[A-Za-z0-9._~+/=-]{16,}/gu,
  // `NAME=value` or `NAME: value` where the name says it is a credential and the value is not quoted (quoted values are
  // the shared rules' job), not a placeholder and not a literal such as `null`.
  /((?:api[_-]?key|access[_-]?key|private[_-]?key|secret[_-]?key|secret|token|password|passwd|pwd)[ \t]{0,8}[:=][ \t]{0,8})(?!["'`<${(]|(?:undefined|null|true|false|none)\b)[^\s"',;]{6,}/giu,
];

const HEAD_LENGTH = 1024;
const TAIL_LENGTH = MAX_LINE_LENGTH - HEAD_LENGTH;

/** The start and the end of a too long line stay (the error is usually at the end); the middle is dropped and counted. */
function capLine(line: string): string {
  if (line.length <= MAX_LINE_LENGTH) return line;
  const dropped = line.length - MAX_LINE_LENGTH;
  return `${line.slice(0, HEAD_LENGTH)} [line truncated, ${dropped} more characters] ${line.slice(-TAIL_LENGTH)}`;
}

function capLines(text: string): string {
  return text.length <= MAX_LINE_LENGTH ? text : text.split("\n").map(capLine).join("\n");
}

/**
 * The output of a check with the values that look like credentials replaced by `<redacted>`: everything the shared
 * secret rules know (vendor tokens, JWTs, connection-string passwords, quoted assignments) plus Authorization headers
 * and unquoted `KEY=value` lines, which a failing check prints often. A line longer than `MAX_LINE_LENGTH` is cut and
 * marked. Heuristic, so a clean result proves nothing; the rules stay out of the shared list so the finish advisory
 * does not start flagging source code.
 */
export function redactCheckOutput(text: string): string {
  let result = redactSecrets(capLines(text));
  for (const rule of LOG_RULES) result = result.replace(rule, (_match: string, prefix: string) => `${prefix}${MASK}`);
  return result;
}
