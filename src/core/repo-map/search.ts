import MiniSearch from "minisearch";

import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import type { RepoMapQueryResult, RepoMapQuerySignals, RepoMapRankingOptions, RepoMapRecordV1, RepoMapV1 } from "./types.js";

interface SearchDocument { id: string; path: string; terms: string; }
interface GraphSignals {
  directDependencies: ReadonlySet<string>;
  directImporters: ReadonlySet<string>;
  depthTwoDirections: ReadonlyMap<string, "dependency-neighbor" | "referenced-by">;
  inboundCount: number;
}

const MAX_LEXICAL_SEEDS = 50;
const MAX_EXPANDED_CANDIDATES = 200;

export function searchRepoMap(map: RepoMapV1, query: string, limit = 20, signals: RepoMapQuerySignals = {}, options: RepoMapRankingOptions = {}): RepoMapQueryResult[] {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0 || normalizedQuery.length > 256) throw new Error("Repo map query must contain 1 to 256 characters.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Repo map query limit must be between 1 and 20.");
  const rankerVersion = options.rankerVersion ?? 2;
  if (rankerVersion !== 1 && rankerVersion !== 2) throw new Error("Repo map ranker version is invalid.");
  const index = new MiniSearch<SearchDocument>({ fields: ["path", "terms"], storeFields: ["path"] });
  index.addAll(map.records.map((record) => ({ id: record.path, path: record.path, terms: terms(record) })));
  const records = new Map(map.records.map((record) => [record.path, record]));
  const taskTerms = new Set((signals.taskTerms ?? []).map(normalizeTerm).filter(Boolean));
  const relevant = new Set((signals.relevantPaths ?? []).flatMap((path) => {
    try { return [normalizeRepositoryPath(path)]; } catch { return []; }
  }));
  const languageTerms = new Set([...(signals.languages ?? []), ...(signals.technologies ?? [])].map(normalizeTerm).filter(Boolean));
  const lexical = index.search(normalizedQuery, { fuzzy: 0.2, prefix: true }).slice(0, MAX_LEXICAL_SEEDS);
  if (rankerVersion === 1) {
    return lexical.flatMap((candidate) => {
      const record = records.get(String(candidate.id));
      return record === undefined ? [] : [rank(record, Math.round(candidate.score * 10), true, taskTerms, relevant, signals.packagePath, languageTerms)];
    }).sort(compareResults).slice(0, limit);
  }

  const lexicalBase = new Map(lexical.map((candidate) => [String(candidate.id), Math.round(candidate.score * 10)]));
  const graph = buildRepoMapGraph(map.records);
  const seedPaths = sortedUnique([...lexicalBase.keys(), ...[...relevant].filter((path) => records.has(path))]).slice(0, MAX_EXPANDED_CANDIDATES);
  const directDependencies = new Set<string>();
  const directImporters = new Set<string>();
  for (const seed of seedPaths) {
    for (const path of graph.adjacency.get(seed) ?? []) directDependencies.add(path);
    for (const path of graph.reverseAdjacency.get(seed) ?? []) directImporters.add(path);
  }
  const depthTwoDirections = new Map<string, "dependency-neighbor" | "referenced-by">();
  const firstHops = [
    ...[...directDependencies].sort(compareCodeUnits).map((path) => [path, "dependency-neighbor"] as const),
    ...[...directImporters].sort(compareCodeUnits).map((path) => [path, "referenced-by"] as const),
  ];
  for (const [firstHop, direction] of firstHops) {
    const secondHops = sortedUnique([...(graph.adjacency.get(firstHop) ?? []), ...(graph.reverseAdjacency.get(firstHop) ?? [])]);
    for (const path of secondHops) {
      if (seedPaths.includes(path) || directDependencies.has(path) || directImporters.has(path) || depthTwoDirections.has(path)) continue;
      depthTwoDirections.set(path, direction);
    }
  }

  const candidates: string[] = [];
  const addCandidates = (values: Iterable<string>): void => {
    for (const path of [...values].sort(compareCodeUnits)) {
      if (candidates.length >= MAX_EXPANDED_CANDIDATES) return;
      if (records.has(path) && !candidates.includes(path)) candidates.push(path);
    }
  };
  addCandidates(seedPaths);
  addCandidates(directDependencies);
  addCandidates(directImporters);
  addCandidates(depthTwoDirections.keys());

  return candidates.flatMap((path) => {
    const record = records.get(path);
    if (record === undefined) return [];
    const result = rank(record, lexicalBase.get(path) ?? 0, lexicalBase.has(path), taskTerms, relevant, signals.packagePath, languageTerms);
    return [applyGraphSignals(result, path, {
      directDependencies,
      directImporters,
      depthTwoDirections,
      inboundCount: graph.reverseAdjacency.get(path)?.length ?? 0,
    })];
  }).sort(compareResults).slice(0, limit);
}

function rank(record: RepoMapRecordV1, base: number, lexicalMatch: boolean, taskTerms: Set<string>, relevant: Set<string>, packagePath: string | undefined, languageTerms: Set<string>): RepoMapQueryResult {
  let score = base;
  const reasons: string[] = lexicalMatch ? ["lexical match"] : [];
  if (relevant.has(record.path)) { score += 500; reasons.push("task reference"); }
  const recordTerms = normalizeTerm(terms(record));
  const matchedTaskTerms = [...taskTerms].filter((term) => recordTerms.includes(term));
  if (matchedTaskTerms.length > 0) { score += matchedTaskTerms.length * 100; reasons.push("task terms"); }
  if (packagePath !== undefined && record.packagePath === packagePath) { score += 50; reasons.push("same package"); }
  if (record.language !== undefined && languageTerms.has(normalizeTerm(record.language))) { score += 25; reasons.push("profile language"); }
  if (record.kind === "manifest" || record.kind === "config") { score += 10; reasons.push("project metadata"); }
  if (record.kind === "test" && /(?:service|controller|handler|component)/iu.test(record.path)) { score += 20; reasons.push("implementation-test pairing"); }
  return {
    outline: { extension: record.extension, headings: record.headings, identifiers: record.identifiers, importTargets: record.importTargets, kind: record.kind, packagePath: record.packagePath, ...(record.language === undefined ? {} : { language: record.language }) },
    path: record.path,
    reasons: sortedUnique(reasons),
    score,
  };
}

function applyGraphSignals(result: RepoMapQueryResult, path: string, graph: GraphSignals): RepoMapQueryResult {
  let score = result.score;
  const reasons = new Set(result.reasons);
  if (graph.directDependencies.has(path)) { score += 120; reasons.add("dependency-neighbor"); }
  if (graph.directImporters.has(path)) { score += 100; reasons.add("referenced-by"); }
  if (!graph.directDependencies.has(path) && !graph.directImporters.has(path)) {
    const direction = graph.depthTwoDirections.get(path);
    if (direction !== undefined) { score += 40; reasons.add(direction); }
  }
  const centrality = Math.min(50, 5 * graph.inboundCount);
  if (centrality > 0) { score += centrality; reasons.add("dependency-centrality"); }
  return { ...result, score, reasons: [...reasons].sort(compareCodeUnits) };
}

function compareResults(left: RepoMapQueryResult, right: RepoMapQueryResult): number { return right.score - left.score || compareCodeUnits(left.path, right.path); }
function terms(record: RepoMapRecordV1): string { return [record.path, record.packagePath, record.language ?? "", record.kind, ...record.identifiers, ...record.headings, ...record.importTargets].join(" "); }
function normalizeTerm(value: string): string { return value.toLowerCase().replaceAll(/[^\p{L}\p{N}_-]+/gu, " ").trim(); }
function sortedUnique(values: readonly string[]): string[] { return [...new Set(values)].sort(compareCodeUnits); }
