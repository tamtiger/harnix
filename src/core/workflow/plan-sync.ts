import { readFile } from "node:fs/promises";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { noActiveTaskError } from "src/core/workflow/no-active-task.js";
import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";

/** One unchecked checklist item of `plan.md` (`- [ ]` or `* [ ]`); the gate before `verifying` reuses it. */
export const CHECK_UNCHECKED = /^(\s*[-*]\s+)\[\s*\](\s+.*)$/u;

/** A check id such as `chk-3` (optionally in brackets): matched by its exact `[chk-3]` tag, never as a substring. */
const ID_SELECTOR = /^(?:\[[A-Za-z][\w-]*\]|chk-[\w-]+)$/u;

function allItemIndices(lines: readonly string[]): number[] {
  return lines.flatMap((line, index) => (ANY_ITEM.test(line) ? [index] : []));
}

const ANY_ITEM = /^(\s*[-*]\s+)\[[ xX]\](\s+.*)$/u;

/** Items among `indices` whose text starts with the `[id]` tag. */
function leadingTagMatches(lines: readonly string[], indices: readonly number[], selector: string): number[] {
  const tag = `[${selector.replace(/^\[|\]$/gu, "").toLowerCase()}]`;
  return indices.filter((idx) => (ANY_ITEM.exec(lines[idx]!)?.[2] ?? "").trim().toLowerCase().startsWith(tag));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export interface TickPlanResult {
  updated: number;
  remaining: number;
  total: number;
  /** Text of each ticked item (at most 80 characters), so a wrong selector is visible at once. */
  items: string[];
}

/**
 * Đánh dấu hoàn thành (- [x]) cho checklist items trong plan.md của task.
 * selector có thể là:
 * - "all": tick toàn bộ checklist item chưa tick
 * - index số 1-based (ví dụ "1", "2" hoặc "1,2"): tick theo thứ tự item chưa tick
 * - id check dạng `chk-3` hoặc `[chk-3]`: khớp chính xác thẻ `[chk-3]` (`chk-1` không chạm `chk-10`), mơ hồ thì từ chối
 * - text pattern (substring không phân biệt hoa thường): tick các item khớp nội dung
 */
export function tickPlanChecklist(harnixRoot: string, taskId: string, selector: string): Promise<TickPlanResult> {
  return withWorkflowLock(harnixRoot, () => tickPlanChecklistLocked(harnixRoot, taskId, selector));
}

async function tickPlanChecklistLocked(harnixRoot: string, taskId: string, selector: string): Promise<TickPlanResult> {
  const taskDirectory = await resolveTaskDirectory(harnixRoot, taskId);
  const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
  let content: string;
  try {
    content = await readFile(planPath, "utf8");
  } catch {
    throw new Error(`Cannot tick checklist: plan.md not found for task ${taskId}.`);
  }

  const lines = content.split(/\r?\n/u);
  const trimmed = selector.trim();
  if (trimmed.length === 0) {
    throw new Error("Selector for --tick cannot be empty.");
  }

  const uncheckedIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (CHECK_UNCHECKED.test(lines[i]!)) {
      uncheckedIndices.push(i);
    }
  }

  if (uncheckedIndices.length === 0) {
    const total = lines.filter((l) => /^\s*[-*]\s+\[[ xX]\]/u.test(l)).length;
    return { updated: 0, remaining: 0, total, items: [] };
  }

  const toTickIndices = new Set<number>();
  if (trimmed.toLowerCase() === "all") {
    for (const idx of uncheckedIndices) toTickIndices.add(idx);
  } else if (/^\d+(?:,\s*\d+)*$/u.test(trimmed)) {
    const parts = trimmed.split(",").map((s) => Number.parseInt(s.trim(), 10));
    for (const pos of parts) {
      if (pos < 1 || pos > uncheckedIndices.length) {
        throw new Error(`Index ${pos} out of range for unchecked items (1..${uncheckedIndices.length}).`);
      }
      toTickIndices.add(uncheckedIndices[pos - 1]!);
    }
  } else if (ID_SELECTOR.test(trimmed) && leadingTagMatches(lines, allItemIndices(lines), trimmed).length > 0) {
    // The id tags an item: it is exact from here on, so an already ticked item never falls back to `chk-10`.
    const tag = `[${trimmed.replace(/^\[|\]$/gu, "").toLowerCase()}]`;
    const matches = leadingTagMatches(lines, uncheckedIndices, trimmed);
    if (matches.length === 0) throw new Error(`No unchecked checklist item tagged ${tag}: it is already ticked.`);
    if (matches.length > 1) {
      throw new Error(`Selector "${selector}" is ambiguous: ${matches.length} unchecked items carry the tag ${tag}.`);
    }
    toTickIndices.add(matches[0]!);
  } else {
    const lower = trimmed.toLowerCase();
    for (const idx of uncheckedIndices) {
      if (lines[idx]!.toLowerCase().includes(lower)) {
        toTickIndices.add(idx);
      }
    }
    if (toTickIndices.size === 0) {
      throw new Error(`No unchecked checklist item matched pattern: "${selector}".`);
    }
  }

  let updated = 0;
  const items: string[] = [];
  const newLines = lines.map((line, idx) => {
    if (toTickIndices.has(idx)) {
      const match = CHECK_UNCHECKED.exec(line);
      if (match) {
        updated++;
        items.push(match[2]!.trim().slice(0, 80));
        return `${match[1]}[x]${match[2]!}`;
      }
    }
    return line;
  });

  await atomicWriteFile(planPath, `${newLines.join("\n").trimEnd()}\n`);
  const remaining = uncheckedIndices.length - updated;
  const total = newLines.filter((l) => /^\s*[-*]\s+\[[ xX]\]/u.test(l)).length;

  return { updated, remaining, total, items };
}

export interface WorkflowTickResult {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  updated: number;
  remaining: number;
  total: number;
  items?: string[];
}

export async function tickWorkflow(
  root: string,
  selector: string,
  options: { brief?: boolean } = {},
): Promise<WorkflowTickResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw noActiveTaskError("Workflow --tick");
  const { items, ...counts } = await tickPlanChecklist(harnixRoot, task.id, selector);
  return {
    generator: "harnix",
    schemaVersion: 1,
    taskId: task.id,
    ...counts,
    ...(options.brief === true ? {} : { items }),
  };
}

/**
 * Tự động tìm các checklist item chưa tick trong `plan.md` gắn liền với `checkId`
 * (theo dạng `[check-id]`, `\`check-id\`` hoặc bắt đầu bằng `check-id`)
 * và chuyển đổi thành `- [x]`.
 * Trả về true nếu có ít nhất một item được cập nhật, ngược lại false.
 */
export function syncPlanChecklistPass(harnixRoot: string, taskId: string, checkId: string): Promise<boolean> {
  // Called after the evidence is already saved: a lock that cannot be taken means this tick is skipped (`--tick` does
  // it later) instead of reporting a failure for a pass that was recorded.
  return withWorkflowLock(harnixRoot, () => syncPlanChecklistPassLocked(harnixRoot, taskId, checkId)).catch(
    () => false,
  );
}

async function syncPlanChecklistPassLocked(harnixRoot: string, taskId: string, checkId: string): Promise<boolean> {
  let planPath: string;
  try {
    const taskDirectory = await resolveTaskDirectory(harnixRoot, taskId);
    planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
  } catch {
    return false;
  }

  let content: string;
  try {
    content = await readFile(planPath, "utf8");
  } catch {
    return false;
  }

  const escaped = escapeRegex(checkId);
  const tagPattern = new RegExp(`\\[${escaped}\\]|\`${escaped}\`|(?<![a-z0-9-])${escaped}(?![a-z0-9-])`, "u");

  let changed = false;
  const lines = content.split(/\r?\n/u);
  const newLines = lines.map((line) => {
    const match = CHECK_UNCHECKED.exec(line);
    if (!match) return line;

    const restOfLine = match[2]!;
    if (tagPattern.test(restOfLine)) {
      changed = true;
      return `${match[1]}[x]${restOfLine}`;
    }
    return line;
  });

  if (!changed) return false;

  await atomicWriteFile(planPath, `${newLines.join("\n").trimEnd()}\n`);
  return true;
}
