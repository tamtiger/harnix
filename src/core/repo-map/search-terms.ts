import type { RepoMapRecordV1 } from "./types.js";

/** `buildSessionCacheKey` becomes `build`, `session`, `cache`, `key`; digits are words of their own. */
export function splitIdentifierWords(name: string): string[] {
  return name
    .replaceAll(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replaceAll(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2")
    .replaceAll(/([A-Za-z])([0-9])/gu, "$1 $2")
    .replaceAll(/([0-9])([A-Za-z])/gu, "$1 $2")
    .split(/[^A-Za-z0-9]+/u)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
}

/** The text a record is indexed under: path, profile, names, and the words inside each name. */
export function terms(record: RepoMapRecordV1): string {
  return [
    record.path,
    record.packagePath,
    record.language ?? "",
    record.kind,
    ...record.identifiers,
    ...record.identifiers.flatMap(splitIdentifierWords),
    ...record.headings,
    ...record.importTargets,
  ].join(" ");
}

export function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}_-]+/gu, " ")
    .trim();
}
