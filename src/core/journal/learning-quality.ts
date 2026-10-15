export const MIN_LEARNING_CHARACTERS = 40;

export type LowValueReason = "too-short" | "test-string";

const FILLER_WORDS = new Set([
  "test",
  "tests",
  "testing",
  "foo",
  "bar",
  "baz",
  "lorem",
  "ipsum",
  "dummy",
  "placeholder",
  "sample",
  "asdf",
  "todo",
  "tbd",
]);
const TASK_ID = /\b\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*/u;

/**
 * Why a note is not worth keeping, or `undefined` when it is. Only two cheap, low-false-positive rules: shorter than
 * {@link MIN_LEARNING_CHARACTERS} characters, or nothing but filler words, digits or one repeated character. Unaccented
 * text and text about one task are not rejected here; 24 unaccented notes in this project carry real lessons.
 */
export function lowValueReason(statement: string): LowValueReason | undefined {
  const text = statement.replace(/\s+/gu, " ").trim();
  if (Array.from(text).length < MIN_LEARNING_CHARACTERS) return "too-short";
  if (/^(.)\1*$/u.test(text)) return "test-string";
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
  return words.every((word) => FILLER_WORDS.has(word) || /^\d+$/u.test(word)) ? "test-string" : undefined;
}

/** A note that names a task id is mostly about that task; it ranks after general notes instead of being dropped. */
export function isTaskSpecific(statement: string): boolean {
  return TASK_ID.test(statement);
}

const CONDITIONAL_OR_RULE_PATTERN =
  /\b(?:khi|nếu|neu|tránh|tranh|luôn|luon|phải|phai|nên|nen|bảo\s+đảm|bao\s+dam|không|khong|đừng|dung|quy\s+tắc|quy\s+tac|vì|vi|do|nguyên\s+nhân|nguyen\s+nhan|when|if|always|never|ensure|prefer|avoid|rule|because|do\s+not|dont|don't)\b/iu;

export function hasApplicableCondition(statement: string): boolean {
  return CONDITIONAL_OR_RULE_PATTERN.test(statement);
}

/**
 * Checks whether a decision is purely a local implementation action (referencing paths/files without an applicable rule)
 * rather than a reusable lesson for future tasks.
 */
export function isLocalDecisionOnly(statement: string): boolean {
  const text = statement.trim();
  if (hasApplicableCondition(text)) return false;
  return /(?:\b(?:src|test|lib|docs)\/|\.(?:ts|js|py|json|md|yaml|yml)\b)/u.test(text);
}
