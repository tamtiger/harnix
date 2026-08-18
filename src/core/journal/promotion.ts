import type { LearningCandidate } from "./learning.js";
import { isPromotionEligible } from "./learning.js";
import { analyzeLearningStatement, type LearningRiskKind } from "./learning-safety.js";
import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";

export interface LearningReviewMetadataV1 {
  statementHash: string;
  sourceTaskIds: string[];
  evidenceIds: string[];
  findings: LearningRiskKind[];
}

export interface PromotionProposalV2 {
  eligible: boolean;
  specPath: string;
  content: string;
  review: LearningReviewMetadataV1;
}

export function promotionProposal(candidate: LearningCandidate, specPath: string): PromotionProposalV2 {
  assertSafeId(candidate.id, "candidate");
  const sourceTaskIds = sortedSafeIds(candidate.sourceTaskIds, "source task");
  const evidenceIds = sortedSafeIds(candidate.evidenceIds, "evidence");
  const normalizedSpecPath = normalizeRepositoryPath(specPath);
  const analysis = analyzeLearningStatement(candidate.statement);
  if (analysis.oversized) throw new Error("Learning statement exceeds the 64 KiB review limit.");
  const findings = [...analysis.findings];
  const content = [
    `## Proposed learning: ${candidate.id}`,
    "",
    "<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>",
    `Candidate: ${candidate.id}`,
    `Statement-SHA256: ${analysis.statementHash}`,
    `Source-Tasks: ${sourceTaskIds.join(", ") || "none"}`,
    `Evidence: ${evidenceIds.join(", ") || "none"}`,
    `Findings: ${findings.join(", ") || "none"}`,
    `Statement-JSON: ${JSON.stringify(candidate.statement)}`,
    "<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>",
    "",
  ].join("\n");
  return {
    eligible: isPromotionEligible(candidate),
    specPath: normalizedSpecPath,
    content,
    review: { statementHash: analysis.statementHash, sourceTaskIds, evidenceIds, findings },
  };
}

function sortedSafeIds(values: readonly string[], label: string): string[] {
  for (const value of values) assertSafeId(value, label);
  return [...new Set(values)].sort(compareCodeUnits);
}

function assertSafeId(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value)) throw new Error(`Learning ${label} ID is invalid.`);
}
