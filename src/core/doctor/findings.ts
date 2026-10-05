import { compareCodeUnits } from "src/utils/order.js";

/** The single finding shape shared by project and user-global diagnostics. */
export interface DoctorFinding {
  code: string;
  severity: "error" | "warning" | "info";
  path?: string;
  message: string;
  fixable: boolean;
}

export function finding(
  code: string,
  severity: DoctorFinding["severity"],
  path: string | undefined,
  message: string,
  fixable: boolean,
): DoctorFinding {
  return { code, severity, ...(path === undefined ? {} : { path }), message, fixable };
}

export function sortFindings(findings: readonly DoctorFinding[]): DoctorFinding[] {
  const order = { error: 0, warning: 1, info: 2 } as const;
  return [...findings].sort(
    (left, right) =>
      order[left.severity] - order[right.severity] ||
      compareCodeUnits(left.code, right.code) ||
      compareCodeUnits(left.path ?? "", right.path ?? ""),
  );
}

export function isMissing(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

/** Strips the project root and secret-looking assignments from an error before it reaches a report. */
export function redact(value: unknown, root: string): string {
  return String(value instanceof Error ? value.message : value)
    .replaceAll(root, "[PROJECT]")
    .replace(/(token|secret|password|api[_-]?key)\s*[=:]\s*[^\s,]+/giu, "$1=[REDACTED]");
}

export function containsSecret(value: string): boolean {
  return /(?:token|secret|password|api[_-]?key)\s*[=:]\s*['"]?[^\s,'"]{8,}/iu.test(value);
}
