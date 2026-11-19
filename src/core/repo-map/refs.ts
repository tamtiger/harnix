import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import { extractFileSymbols } from "./outline.js";
import { findAffectedTests } from "./tests.js";
import { defaultRepoMapLimits, type RepoMapRecordV1, type RepoMapV1, repoMapRefreshHint } from "./types.js";

/** `string`: the symbol appears only inside a quoted string (a log message, a `load->model('Name')` argument). */
export type RepoMapRefKind = "declaration" | "import" | "reference" | "string";

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
  /** References to skip before the first one listed; the `nextOffset` of the previous page. */
  readonly offset?: number | undefined;
}

export interface RepoMapRefsResultV1 {
  readonly hint?: string | undefined;
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "missing" | "invalid" | "not-found";
  readonly symbol: string;
  readonly target?: string | undefined;
  readonly limit: number;
  readonly references: readonly RepoMapSymbolReferenceV1[];
  readonly truncated: boolean;
  /** The `--offset` that lists the next page; present only when `truncated`. */
  readonly nextOffset?: number;
}

const secretValue = /(?:api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,]{8,}/iu;
/** An identifier, or a code such as an error number: word characters only, so a regex or a phrase is refused. */
const symbolIdentifierPattern = /^[\w$]{1,128}$/u;

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
  const offset = options.offset ?? 0;
  // One more than the page is read, which is how a following page is known to exist.
  const wanted = offset + options.limit + 1;

  for (const path of candidatePaths) {
    const matches = await scanFileForSymbol(resolvedRoot, realRoot, path, wordPattern, declPattern, symbol);
    for (const match of matches) {
      collected.push(match);
      if (collected.length >= wanted) break;
    }
    if (collected.length >= wanted) break;
  }

  const references = collected.slice(offset, offset + options.limit);
  const truncated = collected.length > offset + options.limit;
  return {
    generator: "harnix",
    limit: options.limit,
    references,
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    symbol,
    ...(options.target === undefined ? {} : { target: options.target }),
    truncated,
    ...(truncated ? { nextOffset: offset + options.limit } : {}),
  };
}

export function createUnavailableRepoMapRefs(
  status: "missing" | "invalid",
  options: RepoMapRefsOptions,
): RepoMapRefsResultV1 {
  assertRefsOptions(options);
  return { ...emptyRefsResult(status, options), hint: repoMapRefreshHint };
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
  symbol: string,
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
    let declaredAt: ReadonlySet<number> | undefined;
    for (let index = 0; index < lines.length; index += 1) {
      const trimmed = (lines[index] ?? "").trim();
      if (trimmed.length === 0 || isCommentLine(trimmed) || secretValue.test(trimmed)) continue;
      if (!wordPattern.test(trimmed)) continue;
      declaredAt ??= declarationLines(content, path, symbol);
      const kind = classifyReferenceLine(trimmed, declPattern, wordPattern);
      results.push({
        kind: kind === "reference" && declaredAt.has(index + 1) ? "declaration" : kind,
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

/** The lines on which the outline extractor sees `symbol` declared: methods and classes of every language it reads. */
function declarationLines(content: string, path: string, symbol: string): Set<number> {
  const extension = path.slice(path.lastIndexOf(".") + 1);
  return new Set(
    extractFileSymbols(content, extension)
      .filter((outline) => outline.name === symbol)
      .map((outline) => outline.startLine),
  );
}

const quotedString = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gu;

function classifyReferenceLine(trimmed: string, declPattern: RegExp, wordPattern: RegExp): RepoMapRefKind {
  if (/^(?:import\b|from\s+\S+\s+import\b|(?:global\s+)?using\b|.*=\s*require\s*\()/u.test(trimmed)) {
    return "import";
  }
  if (declPattern.test(trimmed)) return "declaration";
  return wordPattern.test(trimmed.replace(quotedString, '""')) ? "reference" : "string";
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
    throw new Error("Refs symbol must be a valid identifier or code of 1 to 128 characters.");
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20) {
    throw new Error("Refs limit must be an integer between 1 and 20.");
  }
  if (
    options.offset !== undefined &&
    (!Number.isInteger(options.offset) || options.offset < 0 || options.offset > 10_000)
  ) {
    throw new Error("Refs offset must be an integer between 0 and 10000.");
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
