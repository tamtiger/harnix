import { Buffer } from "node:buffer";

import { sha256 } from "src/utils/hashing.js";
import { compareCodeUnits } from "src/utils/order.js";

export type LearningRiskKind = "command-like" | "credential-like" | "instruction-override" | "path-like" | "url-like";

export interface LearningStatementAnalysis {
  statementHash: string;
  findings: LearningRiskKind[];
  oversized: boolean;
}

export const MAX_LEARNING_STATEMENT_BYTES = 65_536;

const OVERRIDE_ENGLISH =
  /(?:\b(?:ignore|disregard|override)\b[^\r\n]{0,80}\b(?:previous|prior|all|system|developer|instructions?)\b|\b(?:system|developer)\s+(?:prompt|message)\b)/iu;
/** Matched against lower-case text with diacritics removed, so it covers both accented and unaccented Vietnamese. */
const OVERRIDE_VIETNAMESE =
  /(?:\b(?:bo qua|phot lo|bo mac|vo hieu hoa)\b[^\r\n]{0,80}\b(?:truoc|tren|moi|tat ca|he thong|huong dan|chi dan|quy tac|lenh)\b|\b(?:loi nhac|thong diep|prompt)\s+(?:he thong|nha phat trien)\b)/u;
const COMMAND_AT_STATEMENT_START =
  /^[^\S\n]*(?:[$>][^\S\n]*)?(?:sudo\s+|rm\s+|curl(?:\.exe)?\s+|wget(?:\.exe)?\s+|pnpm\s+|npm\s+|npx\s+|git\s+|powershell(?:\.exe)?\s+|cmd(?:\.exe)?\s+|bash\s+|sh\s+)/imu;
const COMMAND_ANYWHERE =
  /(?:\b(?:sudo|curl|wget|iex|pwsh|powershell|npx|Invoke-Expression|Invoke-WebRequest)(?:\.exe)?\s+\S|\brm\s+-|\b(?:bash|sh)\s+-c\b|\bcmd(?:\.exe)?\s+\/[a-z]|\bnpm\s+(?:i|install|run|publish|exec)\b|\bpnpm\s+(?:i|add|install|run|dlx|publish|exec)\b|\bgit\s+(?:push|reset|clean|checkout|commit|remote)\b)/iu;
const CREDENTIAL =
  /(?:[\w-]{0,40}(?:api[_-]?key|access[_-]?token|auth[_-]?token|token|password|passwd|secret)\b\s*[=:]\s*['"]?[^\s,'"]{6,}|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\bsk-[A-Za-z0-9_-]{12,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAKIA[0-9A-Z]{12,}|\bxox[abprs]-[A-Za-z0-9-]{8,}|-----BEGIN [A-Z0-9 ]+-----)/iu;
const ABSOLUTE_PATH =
  /(?:(?:^|[\s"'(=,])\/[\w.@~-]+\/[\w.@~/-]*|(?:^|\s)~\/|\b[A-Za-z]:[\\/][^\s]|\\\\[\w.$-]+\\[\w$])/u;

/**
 * The text every check looks at: compatibility forms folded (NFKC), invisible format characters (`\p{Cf}`, for example
 * zero-width spaces) removed, and runs of blanks collapsed. Line breaks survive so line-anchored checks still work.
 */
function normalizeStatement(statement: string): string {
  return statement
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .replace(/[^\S\n]+/gu, " ")
    .replace(/ ?\n[ \n]*/gu, "\n");
}

function withoutDiacritics(text: string): string {
  return text.toLowerCase().replace(/đ/gu, "d").normalize("NFD").replace(/\p{M}/gu, "");
}

export function analyzeLearningStatement(statement: string): LearningStatementAnalysis {
  if (typeof statement !== "string") throw new Error("Learning statement must be a string.");
  const oversized = Buffer.byteLength(statement, "utf8") > MAX_LEARNING_STATEMENT_BYTES;
  const bounded = oversized
    ? Buffer.from(statement, "utf8").subarray(0, MAX_LEARNING_STATEMENT_BYTES).toString("utf8")
    : statement;
  const text = normalizeStatement(bounded);
  const plain = withoutDiacritics(text);
  const findings = new Set<LearningRiskKind>();
  if (OVERRIDE_ENGLISH.test(text) || OVERRIDE_VIETNAMESE.test(plain)) findings.add("instruction-override");
  if (COMMAND_AT_STATEMENT_START.test(text) || COMMAND_ANYWHERE.test(text)) findings.add("command-like");
  if (CREDENTIAL.test(text)) findings.add("credential-like");
  if (ABSOLUTE_PATH.test(text)) findings.add("path-like");
  if (/\bhttps?:\/\/[^\s<>"']+/iu.test(text)) findings.add("url-like");
  return { statementHash: sha256(statement), findings: [...findings].sort(compareCodeUnits), oversized };
}
