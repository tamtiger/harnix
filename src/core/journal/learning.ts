import { sha256 } from "src/utils/hashing.js";
import { compareCodeUnits } from "src/utils/order.js";

export type LearningStatus = "draft" | "candidate" | "approved" | "promoted" | "rejected" | "archived";

/** A `draft` or `candidate` nobody promoted within this many days reads as `archived` (computed on read, never written). */
export const LEARNING_TTL_DAYS = 28;

export interface LearningCandidate {
  id: string;
  statement: string;
  sourceTaskIds: string[];
  evidenceIds: string[];
  occurrences: number;
  confidence: number;
  status: LearningStatus;
}
export interface LearningCaptureInput {
  id: string;
  statement: string;
  sourceTaskIds: string[];
  evidenceIds: string[];
}
export function createLearningCandidate(
  candidate: Omit<LearningCandidate, "occurrences" | "confidence">,
): LearningCandidate {
  const sourceTaskIds = [...new Set(candidate.sourceTaskIds)].sort(compareCodeUnits),
    evidenceIds = [...new Set(candidate.evidenceIds)].sort(compareCodeUnits);
  return {
    ...candidate,
    sourceTaskIds,
    evidenceIds,
    occurrences: sourceTaskIds.length,
    confidence: Math.min(1, 0.4 + 0.2 * Math.min(sourceTaskIds.length, 2) + 0.1 * Math.min(evidenceIds.length, 2)),
  };
}
export function isPromotionEligible(candidate: LearningCandidate): boolean {
  return (
    candidate.status === "candidate" &&
    candidate.sourceTaskIds.length >= 2 &&
    candidate.evidenceIds.length >= 2 &&
    candidate.confidence >= 0.8
  );
}
export function createCapturedLearningCandidate(value: unknown): LearningCandidate {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["evidenceIds", "id", "sourceTaskIds", "statement"]) ||
    typeof value.id !== "string" ||
    !safeId(value.id) ||
    typeof value.statement !== "string" ||
    !value.statement.trim() ||
    !stringArray(value.sourceTaskIds) ||
    !stringArray(value.evidenceIds) ||
    !value.sourceTaskIds.every(safeId) ||
    !value.evidenceIds.every(safeId)
  ) {
    throw new Error("Workflow learning candidate input is invalid.");
  }
  const candidate = createLearningCandidate({
    id: value.id,
    statement: value.statement,
    sourceTaskIds: value.sourceTaskIds,
    evidenceIds: value.evidenceIds,
    status: "candidate",
  });
  if (!isPromotionEligible(candidate)) throw new Error("Workflow learning candidate is not eligible for review.");
  return candidate;
}
export function validateLearningCandidate(value: unknown): LearningCandidate {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.statement !== "string" ||
    !stringArray(value.sourceTaskIds) ||
    !stringArray(value.evidenceIds) ||
    !Number.isInteger(value.occurrences) ||
    (value.occurrences as number) < 0 ||
    typeof value.confidence !== "number" ||
    !Number.isFinite(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1 ||
    !["draft", "candidate", "approved", "promoted", "rejected", "archived"].includes(String(value.status))
  )
    throw new Error("Invalid learning candidate.");
  return value as unknown as LearningCandidate;
}
/** Status a reader should act on: only unpromoted `draft`/`candidate` entries can lapse. */
export function effectiveLearningStatus(status: LearningStatus, recordedAt: string, now: number): LearningStatus {
  if (status !== "draft" && status !== "candidate") return status;
  const recorded = Date.parse(recordedAt);
  return Number.isFinite(recorded) && now - recorded > LEARNING_TTL_DAYS * 86_400_000 ? "archived" : status;
}

/** Case, spacing and edge-punctuation insensitive form used to recognise the same observation across tasks. */
export function normalizeObservation(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/^[\s.;:!,-]+|[\s.;:!,-]+$/gu, "");
}

/** Stable candidate ID for an observation, so a later task finds and extends the same candidate. */
export function observationCandidateId(text: string): string {
  return `obs-${sha256(normalizeObservation(text)).slice(0, 16)}`;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function safeId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value);
}
function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return JSON.stringify(Object.keys(value).sort(compareCodeUnits)) === JSON.stringify(keys);
}
