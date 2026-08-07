import type { LearningCandidate } from "./learning.js";
import { isPromotionEligible } from "./learning.js";
export function promotionProposal(candidate: LearningCandidate, specPath: string): { eligible: boolean; specPath: string; content: string } {
  return { eligible: isPromotionEligible(candidate), specPath, content: `## Proposed learning: ${candidate.id}\n\n${candidate.statement}\n\nEvidence: ${candidate.evidenceIds.join(", ")}\n` };
}
