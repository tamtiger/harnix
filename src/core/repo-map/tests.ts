import { posix } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import type { RepoMapRecordV1, RepoMapV1 } from "./types.js";

export interface RepoMapTestsOptions {
  readonly target: string;
  readonly limit: number;
}

export interface RepoMapTestsResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "missing" | "invalid" | "not-found";
  readonly target: string;
  readonly limit: number;
  readonly tests: readonly string[];
  readonly truncated: boolean;
}

export function findAffectedTests(map: RepoMapV1, options: RepoMapTestsOptions): RepoMapTestsResultV1 {
  assertTestsOptions(options);
  const targetRecord = map.records.find((record) => record.path === options.target);
  if (!targetRecord) return emptyResult("not-found", options);

  if (targetRecord.kind === "test") {
    return {
      generator: "harnix",
      limit: options.limit,
      scope: "project",
      schemaVersion: 1,
      status: "ready",
      target: options.target,
      tests: [options.target],
      truncated: false,
    };
  }

  const recordsMap = new Map(map.records.map((record) => [record.path, record]));
  const graph = buildRepoMapGraph(map.records);
  const affectedDistances = new Map<string, number>();

  // 1. Tests paired by naming convention with target directly
  for (const testPath of findNamingConventionTests(options.target, map.records)) {
    affectedDistances.set(testPath, 1);
  }

  // 1b. Tests referencing target symbols (e.g. for C# .NET where tests are named by scenario)
  findSymbolMatchingTests(targetRecord, map.records, affectedDistances);

  // 2. Reverse dependents traversal up to depth 5
  traverseDependents(options.target, graph, recordsMap, map.records, affectedDistances);

  const sortedTests = [...affectedDistances.entries()]
    .sort((left, right) => left[1] - right[1] || compareCodeUnits(left[0], right[0]))
    .map(([testPath]) => testPath);

  const tests = sortedTests.slice(0, options.limit);
  return {
    generator: "harnix",
    limit: options.limit,
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    target: options.target,
    tests,
    truncated: sortedTests.length > tests.length,
  };
}

function collectTargetSymbols(target: string, identifiers: readonly string[]): Set<string> {
  const targetStem = posix.basename(target).replace(/\.[^.]+$/u, "");
  const symbols = new Set<string>();
  const addVariants = (name: string) => {
    symbols.add(name);
    if (!name.startsWith("I") && name.length > 1) {
      symbols.add(`I${name}`);
    } else if (name.startsWith("I") && name.length > 1 && /[A-Z]/u.test(name[1]!)) {
      symbols.add(name.slice(1));
    }
  };
  addVariants(targetStem);
  for (const id of identifiers) addVariants(id);
  return symbols;
}

function findSymbolMatchingTests(
  targetRecord: RepoMapRecordV1,
  records: readonly RepoMapRecordV1[],
  affectedDistances: Map<string, number>,
): void {
  const targetSymbols = collectTargetSymbols(targetRecord.path, targetRecord.identifiers);
  for (const record of records) {
    if (record.kind !== "test") continue;
    if (record.identifiers.some((id) => targetSymbols.has(id)) && !affectedDistances.has(record.path)) {
      affectedDistances.set(record.path, 1);
    }
  }
}

function traverseDependents(
  target: string,
  graph: ReturnType<typeof buildRepoMapGraph>,
  recordsMap: Map<string, RepoMapRecordV1>,
  records: readonly RepoMapRecordV1[],
  affectedDistances: Map<string, number>,
): void {
  const visited = new Set<string>([target]);
  let frontier = [target];
  for (let distance = 1; distance <= 5 && frontier.length > 0; distance += 1) {
    const nextFrontier = new Set<string>();
    for (const current of frontier) {
      for (const dependent of graph.reverseAdjacency.get(current) ?? []) {
        if (visited.has(dependent)) continue;
        visited.add(dependent);

        const depRecord = recordsMap.get(dependent);
        if (depRecord?.kind === "test") {
          if (!affectedDistances.has(dependent)) affectedDistances.set(dependent, distance);
        } else {
          for (const testPath of findNamingConventionTests(dependent, records)) {
            if (!affectedDistances.has(testPath)) affectedDistances.set(testPath, distance + 1);
          }
          nextFrontier.add(dependent);
        }
      }
    }
    frontier = [...nextFrontier].sort(compareCodeUnits);
  }
}

export function createUnavailableRepoMapTests(
  status: "missing" | "invalid",
  options: RepoMapTestsOptions,
): RepoMapTestsResultV1 {
  assertTestsOptions(options);
  return emptyResult(status, options);
}

function emptyResult(status: "missing" | "invalid" | "not-found", options: RepoMapTestsOptions): RepoMapTestsResultV1 {
  return {
    generator: "harnix",
    limit: options.limit,
    schemaVersion: 1,
    scope: "project",
    status,
    target: options.target,
    tests: [],
    truncated: false,
  };
}

function findNamingConventionTests(sourcePath: string, records: readonly RepoMapRecordV1[]): string[] {
  const sourceDir = posix.dirname(sourcePath);
  const sourceBase = posix.basename(sourcePath);
  const sourceStem = sourceBase.replace(/\.[^.]+$/u, "").toLowerCase();
  const cleanSourceDir = sourceDir.replace(/^(?:src|lib|pkg|app)(?:\/|$)/u, "");

  const matched = new Set<string>();
  for (const record of records) {
    if (record.kind !== "test") continue;
    const testBase = posix.basename(record.path);
    const testStem = extractTestStem(testBase);
    if (!testStem || testStem.toLowerCase() !== sourceStem) continue;

    const testDir = posix.dirname(record.path);
    // 1. Same directory
    if (testDir === sourceDir) {
      matched.add(record.path);
      continue;
    }
    // 2. Colocated in __tests__
    if (testDir === posix.join(sourceDir, "__tests__")) {
      matched.add(record.path);
      continue;
    }
    // 3. Mirrored test directory
    const cleanTestDir = testDir.replace(/^(?:test|tests|spec|specs)(?:\/(?:unit|integration))?(?:\/|$)/u, "");
    if (cleanTestDir === cleanSourceDir || cleanTestDir === "" || cleanSourceDir.endsWith(cleanTestDir)) {
      matched.add(record.path);
    }
  }
  return [...matched].sort(compareCodeUnits);
}

function extractTestStem(filename: string): string | undefined {
  const withoutExt = filename.replace(/\.[^.]+$/u, "");
  if (withoutExt.endsWith(".test") || withoutExt.endsWith(".spec") || withoutExt.endsWith("_test"))
    return withoutExt.slice(0, -5);
  if (withoutExt.startsWith("test_")) return withoutExt.slice(5);
  if (/(?:Test|Tests|TestCase)$/u.test(withoutExt)) return withoutExt.replace(/(?:Test|Tests|TestCase)$/u, "");
  return undefined;
}

function assertTestsOptions(options: RepoMapTestsOptions): void {
  let normalized: string;
  try {
    normalized = normalizeRepositoryPath(options.target);
  } catch {
    throw new Error("Tests target must be an exact normalized repository-relative POSIX path.");
  }
  if (normalized !== options.target || options.target.includes("\\"))
    throw new Error("Tests target must be an exact normalized repository-relative POSIX path.");
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20)
    throw new Error("Tests limit must be an integer between 1 and 20.");
}
