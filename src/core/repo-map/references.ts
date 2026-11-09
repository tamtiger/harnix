import { compareCodeUnits } from "src/utils/order.js";
import type { ExtractedRepoMapFile } from "./extract.js";
import { selectNames } from "./extract-symbols.js";
import { repoMapRecordLimits, type RepoMapRecordV1 } from "./types.js";

/** A name declared in 1 to 4 other files links its users to them; more declarers make the link ambiguous. */
export const MAX_NAME_DECLARERS = 4;
/** A name used by more files than this is a generic term (`Code`, `Status`), not a dependency signal. */
export const MAX_NAME_USERS = 200;

interface Candidate {
  readonly name: string;
  readonly declarers: number;
}

function declarerIndex(files: readonly ExtractedRepoMapFile[]): ReadonlyMap<string, readonly string[]> {
  const index = new Map<string, string[]>();
  for (const { record } of files) {
    if (record.kind !== "source") continue;
    for (const name of record.identifiers) {
      const paths = index.get(name);
      if (paths === undefined) index.set(name, [record.path]);
      else paths.push(record.path);
    }
  }
  return index;
}

function candidatesFor(
  { record, usedNames }: ExtractedRepoMapFile,
  declarers: ReadonlyMap<string, readonly string[]>,
): Candidate[] {
  const found: Candidate[] = [];
  for (const name of usedNames) {
    const paths = declarers.get(name);
    if (paths === undefined || paths.includes(record.path)) continue;
    if (paths.length > 0 && paths.length <= MAX_NAME_DECLARERS) found.push({ declarers: paths.length, name });
  }
  return found;
}

/**
 * Second pass of a refresh: with every file extracted, records the names each file uses that are declared in a few
 * other files. The result depends on the whole file set, so it is never reused from a previous run.
 */
export function attachReferences(files: readonly ExtractedRepoMapFile[]): RepoMapRecordV1[] {
  const declarers = declarerIndex(files);
  const perFile = files.map((file) => candidatesFor(file, declarers));
  const users = new Map<string, number>();
  for (const candidates of perFile) for (const { name } of candidates) users.set(name, (users.get(name) ?? 0) + 1);
  const { count, length } = repoMapRecordLimits.references;
  return files.map(({ record }, position) => {
    const ordered = (perFile[position] ?? [])
      .filter(({ name }) => (users.get(name) ?? 0) <= MAX_NAME_USERS)
      .sort((left, right) => left.declarers - right.declarers || compareCodeUnits(left.name, right.name))
      .map(({ name }) => name);
    const references = selectNames(ordered, count, length);
    return references.length === 0 ? record : { ...record, references };
  });
}
