import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve, sep } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { defaultRepoMapLimits, type RepoMapRecordV1, type RepoMapV1 } from "./types.js";

/** Most test files read for one lookup; the rest are left to the naming and dependency links. */
export const MAX_SCANNED_TESTS = 500;
const MIN_NAME_LENGTH = 4;

/** The class-like names a file declares under its own file name (`M17C71Model` in `M17C71Model.php`). */
function primaryNames(target: RepoMapRecordV1): string[] {
  const stem = posix
    .basename(target.path)
    .replace(/\.[^.]+$/u, "")
    .toLowerCase();
  return target.identifiers.filter((name) => name.length >= MIN_NAME_LENGTH && name.toLowerCase() === stem);
}

/**
 * Tests whose text names the target's class, which no `use`/`require` shows when the framework loads it by name
 * (`$this->load->model('M17C71Model')`); the map keeps only a capped list of the names a file uses, so the files are read.
 */
export async function findContentTests(map: RepoMapV1, root: string, target: string): Promise<string[]> {
  const record = map.records.find((candidate) => candidate.path === target);
  if (record === undefined || record.kind === "test") return [];
  const names = primaryNames(record);
  if (names.length === 0) return [];
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"));
  const pattern = new RegExp(`\\b(?:${escaped.join("|")})\\b`, "u");
  const resolvedRoot = resolve(root);
  const realRoot = await realpath(resolvedRoot).catch(() => undefined);
  if (realRoot === undefined) return [];
  const matched: string[] = [];
  const tests = map.records.filter((candidate) => candidate.kind === "test").slice(0, MAX_SCANNED_TESTS);
  for (const test of tests) {
    try {
      const file = join(resolvedRoot, test.path);
      const metadata = await lstat(file);
      if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > defaultRepoMapLimits.maxBytesPerFile)
        continue;
      const outside = relative(realRoot, await realpath(file));
      if (isAbsolute(outside) || outside === ".." || outside.startsWith(`..${sep}`)) continue;
      if (pattern.test(await readFile(file, "utf8"))) matched.push(test.path);
    } catch {
      // An unreadable test is simply not matched.
    }
  }
  return matched.sort(compareCodeUnits);
}
