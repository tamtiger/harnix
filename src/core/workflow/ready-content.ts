import type { TaskRecord } from "src/core/tasks/task.js";

export interface ContentFindings {
  issues: string[];
  advisories: string[];
}

const FENCE = /^\s*(```|~~~)/u;
const INLINE_CODE = /`[^`]*`/gu;
const HARD_TOKEN =
  /(?<![A-Za-z0-9])(TBD|TODO|FIXME)(?![A-Za-z0-9])|\?\?\?|<[Pp][Ll][Aa][Cc][Ee][Hh][Oo][Ll][Dd][Ee][Rr]>/gu;

/** Matched on text with diacritics removed and lowercased, so Vietnamese and English variants share one list. */
const SOFT_PHRASES = [
  "to be decided",
  "decide later",
  "if needed later",
  "handle appropriately",
  "similar to above",
  "se quyet dinh sau",
  "tinh sau",
  "xu ly phu hop",
  "tuong tu nhu tren",
  "tuy tinh hinh",
  "neu can thi",
] as const;

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu, "d").replace(/Đ/gu, "D").toLowerCase();
}

/** Lines of prose only: fenced code and inline code are blanked so a plan may quote the tokens it describes. */
function proseLines(text: string): { line: number; text: string }[] {
  const lines: { line: number; text: string }[] = [];
  let inFence = false;
  text.split(/\r?\n/u).forEach((raw, index) => {
    if (FENCE.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (!inFence) lines.push({ line: index + 1, text: raw.replace(INLINE_CODE, (code) => " ".repeat(code.length)) });
  });
  return lines;
}

/** Hard placeholder tokens block ready; soft deferral phrases are only advisories. */
export function scanPlaceholders(file: string, text: string): ContentFindings {
  const findings: ContentFindings = { issues: [], advisories: [] };
  for (const { line, text: prose } of proseLines(text)) {
    for (const match of prose.matchAll(HARD_TOKEN)) {
      const token = match[0].toLowerCase() === "<placeholder>" ? "<placeholder>" : match[0];
      findings.issues.push(`${file}:${line} placeholder '${token}'`);
    }
    const folded = fold(prose);
    for (const phrase of SOFT_PHRASES) {
      if (folded.includes(phrase)) findings.advisories.push(`${file}:${line} deferred decision '${phrase}'`);
    }
  }
  return findings;
}

function openCriteria(task: TaskRecord): string[] {
  return task.acceptanceCriteria.filter((criterion) => criterion.status !== "waived").map((criterion) => criterion.id);
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** Criterion ids that `plan.md` never names (whole-id, case-sensitive match), so a requirement has no slice. */
export function missingCriteriaInPlan(task: TaskRecord, plan: string): string[] {
  return openCriteria(task).filter(
    (id) => !new RegExp(`(?<![A-Za-z0-9-])${escapePattern(id)}(?![A-Za-z0-9-])`, "u").test(plan),
  );
}

/** Open criteria that no required focused check covers; the project suite check (scope full) does not count. */
export function criteriaWithoutFocusedCheck(task: TaskRecord): string[] {
  const covered = new Set<string>();
  for (const check of task.validationPlan) {
    if (!check.required || check.scope !== "focused" || !("criterionIds" in check)) continue;
    for (const id of check.criterionIds) covered.add(id);
  }
  return openCriteria(task).filter((id) => !covered.has(id));
}

const CHECK_ID = "check-[a-z0-9]+(?:-[a-z0-9]+)*";
const CHECK_IN_CODE = new RegExp(`\`(${CHECK_ID})\``, "gu");
const CHECK_STARTING_ITEM = new RegExp(`^\\s*[-*]\\s+\\[[ xX]\\]\\s+(${CHECK_ID})(?![A-Za-z0-9-])`, "u");

/**
 * Check ids (the `check-` naming of Harnix) that `plan.md` names in inline code or at the start of a checklist item
 * but `validationPlan` does not declare: a renamed or newly added check the plan and the task disagree about.
 */
export function unknownCheckReferences(task: TaskRecord, plan: string): string[] {
  const declared = new Set(task.validationPlan.map((check) => check.id));
  const found = new Set<string>();
  let inFence = false;
  for (const line of plan.split(/\r?\n/u)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const match of line.matchAll(CHECK_IN_CODE)) found.add(match[1] as string);
    const first = CHECK_STARTING_ITEM.exec(line)?.[1];
    if (first !== undefined) found.add(first);
  }
  return [...found].filter((id) => !declared.has(id)).sort();
}
