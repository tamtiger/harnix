export interface LearningCandidate { id: string; statement: string; sourceTaskIds: string[]; evidenceIds: string[]; occurrences: number; confidence: number; status: "candidate" | "approved" | "promoted" | "rejected"; }
export function createLearningCandidate(candidate: Omit<LearningCandidate, "occurrences" | "confidence">): LearningCandidate {
  const sourceTaskIds = [...new Set(candidate.sourceTaskIds)].sort(), evidenceIds = [...new Set(candidate.evidenceIds)].sort();
  return { ...candidate, sourceTaskIds, evidenceIds, occurrences: sourceTaskIds.length, confidence: Math.min(1, 0.4 + 0.2 * Math.min(sourceTaskIds.length, 2) + 0.1 * Math.min(evidenceIds.length, 2)) };
}
export function isPromotionEligible(candidate: LearningCandidate): boolean { return candidate.status === "candidate" && candidate.sourceTaskIds.length >= 2 && candidate.evidenceIds.length >= 2 && candidate.confidence >= 0.8; }
