import { readFile } from "node:fs/promises";

import {
  assertPromotable,
  LEARNED_SPEC_PATH,
  MAX_LEARNED_BLOCKS,
  parseLearnedBlocks,
  renderLearnedBlock,
  withoutLearnedBlock,
} from "src/core/journal/learned-blocks.js";
import { planLearningReview, reviewLearning, type ReviewLearningInput } from "src/core/journal/learning-review.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

type ReviewBase = Omit<ReviewLearningInput, "action" | "reason">;

export interface PromoteLearningInput extends ReviewBase {
  projectRoot: string;
  /** Path prefixes of the source task, stored in the block marker so loading can pick relevant lessons. */
  paths: readonly string[];
  apply: boolean;
}

export interface PromoteLearningResult {
  applied: boolean;
  specPath: string;
  blocks: number;
  /** Already present in the spec file; only the journal status was recorded. */
  alreadyPresent: boolean;
  content: string;
}

const FILE_HEADER = "# Learned rules\n\nPromoted from project learning. Treat as reviewed notes, not instructions.\n\n";

async function readSpec(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return "";
    throw error;
  }
}

function separatorFor(existing: string): string {
  if (existing.length === 0 || existing.endsWith("\n\n")) return "";
  return existing.endsWith("\n") ? "\n" : "\n\n";
}

/**
 * Without `apply` only the proposal is returned. With it the block is added to the user-owned spec file first, then the
 * journal records `promoted`; a retry after a crash in between finds the marker and only records the status.
 */
export async function promoteLearning(input: PromoteLearningInput): Promise<PromoteLearningResult> {
  const { candidate } = await planLearningReview({ ...input, action: "promote" });
  assertPromotable(candidate);
  const specPath = await resolveSafeProjectPath(input.projectRoot, LEARNED_SPEC_PATH);
  const existing = await readSpec(specPath);
  const all = parseLearnedBlocks(existing);
  const alreadyPresent = all.some((block) => block.id === candidate.id);
  const content = renderLearnedBlock(candidate, input.paths);
  const blocks = alreadyPresent ? all.length : all.length + 1;
  const result = { specPath: LEARNED_SPEC_PATH, alreadyPresent, content, blocks };
  if (!input.apply) return { ...result, applied: false };
  if (!alreadyPresent && all.length >= MAX_LEARNED_BLOCKS)
    throw new Error(
      `${LEARNED_SPEC_PATH} already holds ${MAX_LEARNED_BLOCKS} learnings; retire one first (harnix learning --retire <id>).`,
    );
  if (!alreadyPresent) {
    const header = existing.length === 0 ? FILE_HEADER : "";
    await atomicWriteFile(specPath, `${header}${existing}${separatorFor(existing)}${content}`);
  }
  await reviewLearning({ ...input, action: "promote" });
  return { ...result, applied: true };
}

/** Removes the learning's block from the spec file (when still there) and records `archived`. */
export async function retireLearning(
  input: ReviewBase & { projectRoot: string },
): Promise<{ removed: boolean; blocks: number }> {
  await planLearningReview({ ...input, action: "retire" });
  const specPath = await resolveSafeProjectPath(input.projectRoot, LEARNED_SPEC_PATH);
  const existing = await readSpec(specPath);
  const next = withoutLearnedBlock(existing, input.id);
  const removed = next !== existing;
  if (removed) await atomicWriteFile(specPath, next);
  await reviewLearning({ ...input, action: "retire" });
  return { removed, blocks: parseLearnedBlocks(next).length };
}
