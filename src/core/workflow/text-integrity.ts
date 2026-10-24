import { autoRepairMojibake } from "src/utils/text-repair.js";

export { autoRepairMojibake };

const EXCERPT_LENGTH = 40;
const REPLACEMENT_CHARACTER = "\uFFFD";

export interface CorruptedText {
  reason: "mojibake" | "replacement-character" | "lossy-question-marks";
  excerpt: string;
}

/**
 * Shells like Windows cmd or PowerShell 5.1 convert unmapped non-ASCII characters
 * to literal question marks when piping through an encoding like cp1252. Three or
 * more question marks together (or ??? embedded in words) indicate lossy encoding damage.
 */
function isLossyQuestionMarks(text: string): boolean {
  return /\?{3,}/u.test(text);
}

function inspect(text: string): CorruptedText | undefined {
  const excerpt = text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;
  if (text.includes(REPLACEMENT_CHARACTER)) return { reason: "replacement-character", excerpt };
  if (isLossyQuestionMarks(text)) return { reason: "lossy-question-marks", excerpt };
  return autoRepairMojibake(text) !== text ? { reason: "mojibake", excerpt } : undefined;
}

/** First corrupted string value found anywhere inside `value`; object keys are not inspected. */
export function findCorruptedText(value: unknown): CorruptedText | undefined {
  if (typeof value === "string") return inspect(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCorruptedText(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      const found = findCorruptedText(item);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * Refuses text that a shell has already damaged (wrong code page or lossy
 * conversion) so it can never be persisted, even through a replan.
 */
export function assertTextIntegrity(value: unknown): void {
  const corrupted = findCorruptedText(value);
  if (corrupted === undefined) return;
  const cause =
    corrupted.reason === "replacement-character"
      ? "contains the replacement character U+FFFD"
      : corrupted.reason === "lossy-question-marks"
        ? "contains repeated question marks (???), indicating lossy encoding conversion"
        : "looks like UTF-8 text read with a legacy code page";
  throw new Error(
    `Workflow text has the wrong text encoding: "${corrupted.excerpt}" ${cause}. Nothing was saved. Edit prd.md/plan.md/design.md directly with the editor tool and use the flag transports (--set-check, --add-criterion, --set-paths) instead of piping accented text through Windows PowerShell 5.1; use bash or pwsh 7.4+ when JSON is unavoidable.`,
  );
}
