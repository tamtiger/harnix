import { analyzeLearningStatement } from "src/core/journal/learning-safety.js";
import type { LearningCandidate } from "src/core/journal/learning.js";
import { promotionProposal } from "src/core/journal/promotion.js";
import { compareCodeUnits } from "src/utils/order.js";

export const LEARNED_SPEC_PATH = ".harnix/spec/learned.md";
export const MAX_LEARNED_BLOCKS = 40;
const MAX_BLOCK_PATHS = 6;
const MAX_PREFIX_SEGMENTS = 3;

export interface LearnedBlock {
  id: string;
  /** Leading path prefixes of the source task's relevant paths; empty means the lesson is general. */
  paths: string[];
  text: string;
  /** Offset of the block in the file, so removal never matches look-alike text elsewhere. */
  start: number;
}

/** Markers count only on a line of their own, so text inside a statement or a user note cannot fake one. */
const START = /^<!-- harnix-learning:([A-Za-z0-9][A-Za-z0-9._-]{0,127})(?: paths=([^\s>]*))? -->[ \t]*\r?$/gmu;
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/** Short, comma-safe path prefixes (at most three segments) that say where a lesson applies. */
export function learnedPathPrefixes(relevantPaths: readonly string[]): string[] {
  const prefixes = new Set<string>();
  for (const path of relevantPaths) {
    const segments = path.split("/").filter((segment) => segment.length > 0);
    const unsafeAt = segments.findIndex((segment) => /[,\s*<>]/u.test(segment));
    const prefix = segments
      .slice(0, Math.min(MAX_PREFIX_SEGMENTS, unsafeAt < 0 ? segments.length : unsafeAt))
      .join("/");
    if (prefix.length > 0) prefixes.add(prefix);
  }
  return [...prefixes].sort(compareCodeUnits).slice(0, MAX_BLOCK_PATHS);
}

/** Refuses a statement that trips a risk check, so a promoted rule never carries what capture would have dropped. */
export function assertPromotable(candidate: LearningCandidate): void {
  const analysis = analyzeLearningStatement(candidate.statement);
  if (analysis.oversized || analysis.findings.some((kind) => kind !== "url-like"))
    throw new Error(`Learning ${candidate.id} trips a risk check and cannot be promoted.`);
  if (/harnix-learning:|<!--|-->/u.test(candidate.statement))
    throw new Error(`Learning ${candidate.id} contains marker text and cannot be promoted.`);
}

export function renderLearnedBlock(candidate: LearningCandidate, paths: readonly string[]): string {
  const proposal = promotionProposal(candidate, LEARNED_SPEC_PATH);
  const suffix = paths.length === 0 ? "" : ` paths=${paths.join(",")}`;
  return [
    `<!-- harnix-learning:${candidate.id}${suffix} -->`,
    proposal.content.trimEnd(),
    `<!-- /harnix-learning:${candidate.id} -->`,
    "",
  ].join("\n");
}

export function parseLearnedBlocks(content: string): LearnedBlock[] {
  const blocks: LearnedBlock[] = [];
  for (const match of content.matchAll(START)) {
    const id = match[1] ?? "";
    const endMarker = `<!-- /harnix-learning:${id} -->`;
    const bodyStart = match.index + match[0].length;
    const endAt = content.slice(bodyStart).search(new RegExp(`^${escapeRegExp(endMarker)}`, "mu"));
    if (endAt < 0) continue;
    const paths = (match[2] ?? "").split(",").filter((path) => path.length > 0);
    blocks.push({
      id,
      paths,
      text: content.slice(match.index, bodyStart + endAt + endMarker.length),
      start: match.index,
    });
  }
  return blocks;
}

/** Content without the block of one learning; user text around it is kept byte for byte. */
export function withoutLearnedBlock(content: string, id: string): string {
  const block = parseLearnedBlocks(content).find((candidate) => candidate.id === id);
  if (block === undefined) return content;
  const { start } = block;
  return `${content.slice(0, start)}${content.slice(start + block.text.length).replace(/^\r?\n/u, "")}`;
}
