import { compareCodeUnits } from "src/utils/order.js";

/** The kinds of suspicious content a project skill or guide can carry (see `scanSkillContent`). */
export type SkillContentRule =
  "credential-read" | "env-exfiltration" | "instruction-override" | "invisible-characters" | "pipe-to-shell";

/**
 * Heuristics, not proof. Each rule needs a command shape or a hostile phrase, not a single risky word, so most text
 * that talks about these threats stays clean: a match is ignored when a prohibition or warning word (`never`,
 * `do not`, `avoid`, `không`, ...) comes earlier in the same sentence, and a sample or public-key path is ignored.
 * The cost is that an attacker can place such a word in front (`Do not forget: ignore ...`), so a clean result never
 * proves a file is safe. A token in a request header, a bare `curl | sh` without a URL and an encoded blob are
 * deliberately left out (too many honest uses).
 */

const OVERRIDE_ENGLISH = [
  /\b(?:ignore|disregard|forget|override)\s+(?:(?:all|any|the|your|every)\s+)*(?:previous|prior|above|earlier|preceding|system|developer)\s+(?:instructions?|rules|prompts?|directions?|guidelines)\b/iu,
  /\b(?:without\s+(?:telling|informing|notifying|alerting)\s+the\s+user\b)/iu,
  /\b(?:do\s+not|don't|never)\s+(?:tell|inform|notify|alert)\s+the\s+user\s+(?:that|about|of|what)\s+(?:this|that|the|these|those|it|you|any)\b[^.\n]{0,40}?\b(?:step|steps|action|actions|command|commands|change|changes|result|results|output|ran|run|did|done|happened|executed|edit|edits)\b/iu,
  /\bhide\s+(?:this|that|it|these|those|the\s+(?:result|output|step|action|change|command)s?)\s+from\s+the\s+user\b/iu,
];

/** Matched against lower-case text with diacritics removed, so it covers accented and unaccented Vietnamese. */
const OVERRIDE_VIETNAMESE = [
  /\bbo qua\s+(?:(?:moi|tat ca|cac)\s+)?(?:chi dan|huong dan|quy tac|lenh)\s+(?:truoc|tren|ben tren)/u,
  /\b(?:dung|khong(?:\s+duoc)?)\s+(?:bao|noi|thong bao)\s+cho\s+nguoi dung\s+(?:biet\s+|ve\s+|rang\s+)?[^.\n]{0,40}?\b(?:buoc|hanh dong|lenh|viec|ket qua|thay doi)\b/u,
];

/** Every gap between two parts of a command is bounded: an open-ended `[^\n|]*` retried at each `curl` is quadratic. */
const PIPE_TO_SHELL = [
  /\b(?:curl|wget)(?:\.exe)?\b[^\n|]{0,200}?\bhttps?:\/\/[^\n|]{0,300}\|\s{0,20}(?:sudo\s{1,5}(?:-\S{1,20}\s{1,5}){0,3})?(?:ba|z|da|k)?sh\b/iu,
  /\b(?:iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^\n|]{0,300}\|\s{0,20}(?:iex|Invoke-Expression)\b/iu,
  /\b(?:iex|Invoke-Expression)\b\s{0,20}\(?\s{0,20}\(?\s{0,20}(?:iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b/iu,
];

const CREDENTIAL_READ = [
  /\b(?:cat|type|more|less|head|tail|Get-Content|gc|scp|rsync|tar|zip|base64|xxd|cp|copy)[ \t]{1,5}(?:-{1,2}\S{1,40}[ \t]{1,5}){0,6}["']?[^\s"'|;&]{0,200}?(?:\.ssh[\\/]|\.aws[\\/]credentials|\.gnupg[\\/]|[\\/]etc[\\/]shadow|id_rsa\b|id_ed25519\b)/iu,
];

/** A path that ends like this is a sample or a public file, not a secret. */
const HARMLESS_PATH_END = /\.(?:example|sample|template|dist|pub)$/iu;

const ENV_EXFILTRATION = [
  /\b(?:curl|wget|iwr|irm|Invoke-WebRequest|Invoke-RestMethod|nc|ncat)(?:\.exe)?\b[^\n]{0,240}?(?:\$\(\s*(?:env|printenv)\s*\)|`\s*(?:env|printenv)\s*`)/iu,
  /\b(?:printenv|env|Get-ChildItem\s+env:|gci\s+env:)\s*\|\s*(?:curl|wget|nc|ncat|iwr|irm|Invoke-WebRequest|Invoke-RestMethod|base64)\b/iu,
  /\b(?:fetch|axios\.\w+|https?\.request|requests\.(?:post|put)|urlopen|httpx\.\w+)\s*\([^\n]{0,240}\b(?:process\.env|os\.environ)\b(?!\.\w|\[)/iu,
  /\b(?:process\.env|os\.environ)\b(?!\.\w|\[)[^\n]{0,120}\b(?:fetch|axios\.\w+|https?\.request|requests\.(?:post|put)|urlopen)\s*\(/iu,
];

/** Words that turn a nearby command or phrase into a warning about it. */
const WARNING_ENGLISH =
  /\b(?:never|do not|don't|does not|doesn't|must not|mustn't|should not|shouldn't|cannot|can't|won't|will not|avoid|forbidden|prohibited|not allowed|beware|warn(?:s|ed|ing)?|refuse[sd]?)\b/iu;
const WARNING_VIETNAMESE = /(?<!\p{L})(?:không|đừng|cấm|tránh|chớ|nghiêm cấm)(?!\p{L})/iu;
/** Diacritics removed; `dung` is left out because it also reads `dùng` (use) and `đúng` (right). */
const WARNING_VIETNAMESE_PLAIN = /(?<![a-z])(?:khong|cam|tranh|nghiem cam)(?![a-z])/u;
const ENGLISH_AND_VIETNAMESE = [WARNING_ENGLISH, WARNING_VIETNAMESE] as const;
const SENTENCE_BOUNDARY = /(?:[.!?]\s|\n\s*\n)/gu;
const LOOK_BACK = 160;

/** Zero-width and bidirectional controls and the tag block; a joiner (emoji) and a leading byte order mark are normal. */
const INVISIBLE_RANGES: readonly (readonly [number, number])[] = [
  [0x200b, 0x200c],
  [0x200e, 0x200f],
  [0x2060, 0x2060],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
  [0xe0000, 0xe007f],
];
const BYTE_ORDER_MARK = 0xfeff;

function hasInvisibleCharacter(text: string): boolean {
  let index = 0;
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    const leadingMark = index === 0 && code === BYTE_ORDER_MARK;
    index += 1;
    if (!leadingMark && INVISIBLE_RANGES.some(([from, to]) => code >= from && code <= to)) return true;
  }
  return false;
}

/** Text with fences, inline code and quoted strings removed: an example of an attack is not an instruction to follow. */
function proseOnly(text: string): string {
  return text
    .replace(/(```|~~~)[\s\S]*?\1/gu, " ")
    .replace(/`[^`\n]*`/gu, " ")
    .replace(/"[^"\n]*"/gu, " ")
    .replace(/“[^”\n]*”/gu, " ");
}

function withoutDiacritics(text: string): string {
  return text.toLowerCase().replace(/đ/gu, "d").normalize("NFD").replace(/\p{M}/gu, "");
}

/** True when a warning word stands between the start of the sentence (or paragraph) and `index`. */
function warnedBefore(text: string, index: number, cues: readonly RegExp[]): boolean {
  const window = text.slice(Math.max(0, index - LOOK_BACK), index);
  let start = 0;
  for (const boundary of window.matchAll(SENTENCE_BOUNDARY)) start = boundary.index + boundary[0].length;
  const sentence = window.slice(start);
  return cues.some((cue) => cue.test(sentence));
}

/** True when a pattern matches somewhere that no warning word precedes and `accept` (if given) does not reject. */
function hasUnwarnedMatch(
  patterns: readonly RegExp[],
  text: string,
  cues: readonly RegExp[],
  accept: (text: string, match: RegExpMatchArray) => boolean = () => true,
  cueText: string = text,
): boolean {
  for (const pattern of patterns) {
    for (const match of text.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))) {
      if (!warnedBefore(cueText, match.index ?? 0, cues) && accept(text, match)) return true;
    }
  }
  return false;
}

/** The Vietnamese override rules run on text without diacritics; the warning words are read from the accented text. */
function hasUnwarnedVietnameseOverride(prose: string): boolean {
  const plain = withoutDiacritics(prose);
  const aligned = plain.length === prose.length;
  const cues = aligned ? ENGLISH_AND_VIETNAMESE : [WARNING_ENGLISH, WARNING_VIETNAMESE_PLAIN];
  return hasUnwarnedMatch(OVERRIDE_VIETNAMESE, plain, cues, () => true, aligned ? prose : plain);
}

/** A credential read is ignored when the path it names is a sample or a public key. */
function readsSecretPath(text: string, match: RegExpMatchArray): boolean {
  const tail = /^[^\s"'|;&`)]*/u.exec(text.slice((match.index ?? 0) + match[0].length))?.[0] ?? "";
  const token = `${match[0].split(/\s/u).pop() ?? ""}${tail}`;
  return !HARMLESS_PATH_END.test(token);
}

/**
 * Returns the sorted rules the text matches, each once, and never the text itself. Matching runs on the NFKC form with
 * format characters removed, so a zero-width space cannot split a phrase; only `invisible-characters` reads the raw
 * text. An instruction override is looked for in prose only, and a match after a warning word in the same sentence
 * does not count.
 */
export function scanSkillContent(text: string): SkillContentRule[] {
  const normalized = text.normalize("NFKC").replace(/\p{Cf}/gu, "");
  const prose = proseOnly(normalized);
  const found = new Set<SkillContentRule>();

  if (hasUnwarnedMatch(OVERRIDE_ENGLISH, prose, ENGLISH_AND_VIETNAMESE) || hasUnwarnedVietnameseOverride(prose)) {
    found.add("instruction-override");
  }
  if (hasUnwarnedMatch(PIPE_TO_SHELL, normalized, ENGLISH_AND_VIETNAMESE)) found.add("pipe-to-shell");
  if (hasUnwarnedMatch(CREDENTIAL_READ, normalized, ENGLISH_AND_VIETNAMESE, readsSecretPath)) {
    found.add("credential-read");
  }
  if (hasUnwarnedMatch(ENV_EXFILTRATION, normalized, ENGLISH_AND_VIETNAMESE)) found.add("env-exfiltration");
  if (hasInvisibleCharacter(text)) found.add("invisible-characters");

  return [...found].sort(compareCodeUnits);
}
