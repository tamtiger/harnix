import { readFile } from "node:fs/promises";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

const CHECK_UNCHECKED = /^(\s*[-*]\s+)\[\s*\](\s+.*)$/u;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * Tự động tìm các checklist item chưa tick trong `plan.md` gắn liền với `checkId`
 * (theo dạng `[check-id]`, `\`check-id\`` hoặc bắt đầu bằng `check-id`)
 * và chuyển đổi thành `- [x]`.
 * Trả về true nếu có ít nhất một item được cập nhật, ngược lại false.
 */
export async function syncPlanChecklistPass(
  harnixRoot: string,
  taskId: string,
  checkId: string,
): Promise<boolean> {
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
