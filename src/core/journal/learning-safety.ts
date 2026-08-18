import { Buffer } from "node:buffer";

import { sha256 } from "../../utils/hashing.js";
import { compareCodeUnits } from "../../utils/order.js";

export type LearningRiskKind = "command-like" | "credential-like" | "instruction-override" | "url-like";

export interface LearningStatementAnalysis {
  statementHash: string;
  findings: LearningRiskKind[];
  oversized: boolean;
}

export const MAX_LEARNING_STATEMENT_BYTES = 65_536;

export function analyzeLearningStatement(statement: string): LearningStatementAnalysis {
  if (typeof statement !== "string") throw new Error("Learning statement must be a string.");
  const oversized = Buffer.byteLength(statement, "utf8") > MAX_LEARNING_STATEMENT_BYTES;
  const bounded = oversized ? Buffer.from(statement, "utf8").subarray(0, MAX_LEARNING_STATEMENT_BYTES).toString("utf8") : statement;
  const findings = new Set<LearningRiskKind>();
  if (/(?:\b(?:ignore|disregard|override)\b[^\r\n]{0,80}\b(?:previous|prior|all|system|developer|instructions?)\b|\b(?:system|developer)\s+(?:prompt|message)\b)/iu.test(bounded)) findings.add("instruction-override");
  if (/^\s*(?:[$>]\s*)?(?:sudo\s+|rm\s+|curl(?:\.exe)?\s+|wget(?:\.exe)?\s+|pnpm\s+|npm\s+|npx\s+|git\s+|powershell(?:\.exe)?\s+|cmd(?:\.exe)?\s+|bash\s+|sh\s+)/imu.test(bounded)) findings.add("command-like");
  if (/(?:\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|secret)\b\s*[=:]\s*['"]?[^\s,'"]{6,}|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\bsk-[A-Za-z0-9_-]{12,})/iu.test(bounded)) findings.add("credential-like");
  if (/\bhttps?:\/\/[^\s<>"']+/iu.test(bounded)) findings.add("url-like");
  return { statementHash: sha256(statement), findings: [...findings].sort(compareCodeUnits), oversized };
}
