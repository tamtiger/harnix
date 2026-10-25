import { readFile } from "node:fs/promises";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

const CHECK_UNCHECKED = /^(\s*[-*]\s+)\[\s*\](\s+.*)$/u;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export interface TickPlanResult {
  updated: number;
  remaining: number;
  total: number;
}

/**
 * Đánh dấu hoàn thành (- [x]) cho checklist items trong plan.md của task.
 * selector có thể là:
 * - "all": tick toàn bộ checklist item chưa tick
 * - index số 1-based (ví dụ "1", "2" hoặc "1,2"): tick theo thứ tự item chưa tick
 * - text pattern (substring không phân biệt hoa thường): tick các item khớp nội dung
 */
export async function tickPlanChecklist(harnixRoot: string, taskId: string, selector: string): Promise<TickPlanResult> {
  const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}`);
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
    return { updated: 0, remaining: 0, total };
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
  const newLines = lines.map((line, idx) => {
    if (toTickIndices.has(idx)) {
      const match = CHECK_UNCHECKED.exec(line);
      if (match) {
        updated++;
        return `${match[1]}[x]${match[2]!}`;
      }
    }
    return line;
  });

  await atomicWriteFile(planPath, `${newLines.join("\n").trimEnd()}\n`);
  const remaining = uncheckedIndices.length - updated;
  const total = newLines.filter((l) => /^\s*[-*]\s+\[[ xX]\]/u.test(l)).length;

  return { updated, remaining, total };
}

export interface WorkflowTickResult {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  updated: number;
  remaining: number;
  total: number;
}

export async function tickWorkflow(root: string, selector: string): Promise<WorkflowTickResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow --tick requires an active task.");
  const result = await tickPlanChecklist(harnixRoot, task.id, selector);
  return {
    generator: "harnix",
    schemaVersion: 1,
    taskId: task.id,
    ...result,
  };
}

/**
 * Tự động tìm các checklist item chưa tick trong `plan.md` gắn liền với `checkId`
 * (theo dạng `[check-id]`, `\`check-id\`` hoặc bắt đầu bằng `check-id`)
 * và chuyển đổi thành `- [x]`.
 * Trả về true nếu có ít nhất một item được cập nhật, ngược lại false.
 */
export async function syncPlanChecklistPass(harnixRoot: string, taskId: string, checkId: string): Promise<boolean> {
  let planPath: string;
  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}`);
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
