import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import { findAffectedTests } from "./tests.js";
import { defaultRepoMapLimits, type RepoMapRecordV1, type RepoMapV1 } from "./types.js";

export type RepoMapRefKind = "declaration" | "import" | "reference";

export interface RepoMapSymbolReferenceV1 {
  readonly path: string;
  readonly line: number;
  readonly kind: RepoMapRefKind;
  readonly preview: string;
}

export interface RepoMapRefsOptions {
  readonly symbol: string;
  readonly target?: string | undefined;
  readonly limit: number;
}

export interface RepoMapRefsResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "missing" | "invalid" | "not-found";
  readonly symbol: string;
  readonly target?: string | undefined;
  readonly limit: number;
  readonly references: readonly RepoMapSymbolReferenceV1[];
  readonly truncated: boolean;
}

const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;
const symbolIdentifierPattern = /^[A-Za-z_$][\w$]{0,127}$/u;

export async function findRepoMapReferences(
  map: RepoMapV1,
  options: RepoMapRefsOptions & { readonly root: string },
): Promise<RepoMapRefsResultV1> {
  assertRefsOptions(options);
  const symbol = options.symbol.trim();
  if (options.target !== undefined && !map.records.some((record) => record.path === options.target)) {
    return emptyRefsResult("not-found", options);
  }

  const candidatePaths = selectCandidatePaths(map, symbol, options.target);
  const resolvedRoot = resolve(options.root);
  let realRoot: string;
  try {
    realRoot = await realpath(resolvedRoot);
  } catch {
    return emptyRefsResult("not-found", options);
  }

  const wordPattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, "u");
  const declPattern = new RegExp(
    `\\b(?:class|interface|function|type|enum|const|let|var|struct|record|namespace|def|func)\\s+(?:\\([^)]*\\)\\s*)?\\*?${escapeRegExp(symbol)}\\b`,
    "u",
  );
  const collected: RepoMapSymbolReferenceV1[] = [];

  for (const path of candidatePaths) {
    const matches = await scanFileForSymbol(resolvedRoot, realRoot, path, wordPattern, declPattern);
    for (const match of matches) {
      collected.push(match);
      if (collected.length > options.limit) break;
    }
    if (collected.length > options.limit) break;
  }

  const references = collected.slice(0, options.limit);
  return {
    generator: "harnix",
    limit: options.limit,
    references,
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    symbol,
    ...(options.target === undefined ? {} : { target: options.target }),
    truncated: collected.length > references.length,
  };
}

export function createUnavailableRepoMapRefs(
  status: "missing" | "invalid",
  options: RepoMapRefsOptions,
): RepoMapRefsResultV1 {
  assertRefsOptions(options);
  return emptyRefsResult(status, options);
}

function selectCandidatePaths(map: RepoMapV1, symbol: string, target: string | undefined): string[] {
  if (target !== undefined) {
    const graph = buildRepoMapGraph(map.records);
    const dependents = collectReverseDependents(graph.reverseAdjacency, target, 3);
    const affectedTests = findAffectedTests(map, { limit: 20, target }).tests;
    const rest = [...new Set([...dependents, ...affectedTests])]
      .filter((path) => path !== target)
      .sort(compareCodeUnits);
    return [target, ...rest];
  }

  const codeRecords = map.records.filter(
    (record) => record.kind === "source" || record.kind === "test" || record.kind === "script",
  );
  const prioritized = codeRecords.filter((record) => record.identifiers.includes(symbol)).map((record) => record.path);
  const prioritizedSet = new Set(prioritized);
  const remaining = codeRecords
    .filter((record) => !prioritizedSet.has(record.path))
    .map((record: RepoMapRecordV1) => record.path);
  return [...prioritized.sort(compareCodeUnits), ...remaining.sort(compareCodeUnits)];
}

function collectReverseDependents(
  reverseAdjacency: ReadonlyMap<string, readonly string[]>,
  target: string,
  maxDepth: number,
): string[] {
  const visited = new Set<string>([target]);
  let frontier = [target];
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next = new Set<string>();
    for (const current of frontier) {
      for (const dependent of reverseAdjacency.get(current) ?? []) {
        if (visited.has(dependent)) continue;
        visited.add(dependent);
        next.add(dependent);
      }
    }
    frontier = [...next].sort(compareCodeUnits);
  }
  visited.delete(target);
  return [...visited].sort(compareCodeUnits);
}

async function scanFileForSymbol(
  resolvedRoot: string,
  realRoot: string,
  path: string,
  wordPattern: RegExp,
  declPattern: RegExp,
): Promise<RepoMapSymbolReferenceV1[]> {
  const candidate = join(resolvedRoot, path);
  try {
    const metadata = await lstat(candidate);
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > defaultRepoMapLimits.maxBytesPerFile) {
      return [];
    }
    const realFile = await realpath(candidate);
    if (!isContained(realRoot, realFile)) return [];
    const content = await readFile(candidate, "utf8");
    if (content.includes("\0")) return [];
    const lines = content.replaceAll("\r\n", "\n").split("\n");
    const results: RepoMapSymbolReferenceV1[] = [];
    for (let index = 0; index < lines.length; index += 1) {
      const trimmed = (lines[index] ?? "").trim();
      if (trimmed.length === 0 || isCommentLine(trimmed) || secretValue.test(trimmed)) continue;
      if (!wordPattern.test(trimmed)) continue;
      results.push({
        kind: classifyReferenceLine(trimmed, declPattern),
        line: index + 1,
        path,
        preview: trimmed.replace(/\s+/gu, " ").slice(0, 160),
      });
    }
    return results;
  } catch {
    return [];
  }
}

function classifyReferenceLine(trimmed: string, declPattern: RegExp): RepoMapRefKind {
  if (/^(?:import\b|from\s+\S+\s+import\b|(?:global\s+)?using\b|.*=\s*require\s*\()/u.test(trimmed)) {
    return "import";
  }
  if (declPattern.test(trimmed)) return "declaration";
  return "reference";
}

function isCommentLine(trimmed: string): boolean {
  return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function isContained(root: string, candidate: string): boolean {
  const value = relative(root, candidate);
  return value === "" || (!isAbsolute(value) && value !== ".." && !value.startsWith(`..${sep}`));
}

function emptyRefsResult(
  status: "missing" | "invalid" | "not-found",
  options: RepoMapRefsOptions,
): RepoMapRefsResultV1 {
  return {
    generator: "harnix",
    limit: options.limit,
    references: [],
    schemaVersion: 1,
    scope: "project",
    status,
    symbol: options.symbol.trim(),
    ...(options.target === undefined ? {} : { target: options.target }),
    truncated: false,
  };
}

function assertRefsOptions(options: RepoMapRefsOptions): void {
  const symbol = options.symbol.trim();
  if (!symbolIdentifierPattern.test(symbol)) {
    throw new Error("Refs symbol must be a valid identifier of 1 to 128 characters.");
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20) {
    throw new Error("Refs limit must be an integer between 1 and 20.");
  }
  if (options.target !== undefined) {
    let normalized: string;
    try {
      normalized = normalizeRepositoryPath(options.target);
    } catch {
      throw new Error("Refs path must be an exact normalized repository-relative POSIX path.");
    }
    if (normalized !== options.target || options.target.includes("\\")) {
      throw new Error("Refs path must be an exact normalized repository-relative POSIX path.");
    }
  }
}
