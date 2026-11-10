/** True when `error` is an error object carrying exactly this errno-style `code` (for example `ENOENT`). */
export function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === code;
}

/** The errno-style code of an error as a string, or undefined for anything else. */
export function errorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
}

/** The one definition of "the path does not exist", used wherever a missing file is an expected outcome. */
export function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return hasErrorCode(error, "ENOENT");
}
