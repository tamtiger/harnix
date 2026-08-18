export interface LearningCandidate { id: string; statement: string; sourceTaskIds: string[]; evidenceIds: string[]; occurrences: number; confidence: number; status: "candidate" | "approved" | "promoted" | "rejected"; }
export function createLearningCandidate(candidate: Omit<LearningCandidate, "occurrences" | "confidence">): LearningCandidate {
  const sourceTaskIds = [...new Set(candidate.sourceTaskIds)].sort(), evidenceIds = [...new Set(candidate.evidenceIds)].sort();
  return { ...candidate, sourceTaskIds, evidenceIds, occurrences: sourceTaskIds.length, confidence: Math.min(1, 0.4 + 0.2 * Math.min(sourceTaskIds.length, 2) + 0.1 * Math.min(evidenceIds.length, 2)) };
}
export function isPromotionEligible(candidate: LearningCandidate): boolean { return candidate.status === "candidate" && candidate.sourceTaskIds.length >= 2 && candidate.evidenceIds.length >= 2 && candidate.confidence >= 0.8; }
export function validateLearningCandidate(value: unknown): LearningCandidate {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || typeof value.statement !== "string"
    || !stringArray(value.sourceTaskIds)
    || !stringArray(value.evidenceIds)
    || !Number.isInteger(value.occurrences)
    || (value.occurrences as number) < 0
    || typeof value.confidence !== "number"
    || !Number.isFinite(value.confidence)
    || value.confidence < 0
    || value.confidence > 1
    || !["candidate", "approved", "promoted", "rejected"].includes(String(value.status))) throw new Error("Invalid learning candidate.");
  return value as unknown as LearningCandidate;
}
function stringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
