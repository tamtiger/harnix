import MiniSearch from "minisearch";

import { normalizeRepositoryPath } from "../../utils/paths.js";
import type { RepoMapQueryResult, RepoMapQuerySignals, RepoMapRecordV1, RepoMapV1 } from "./types.js";
import { compareCodeUnits } from "./order.js";

interface SearchDocument {
  id: string;
  path: string;
  terms: string;
}

export function searchRepoMap(map: RepoMapV1, query: string, limit = 20, signals: RepoMapQuerySignals = {}): RepoMapQueryResult[] {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0 || normalizedQuery.length > 256) throw new Error("Repo map query must contain 1 to 256 characters.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Repo map query limit must be between 1 and 20.");
  const index = new MiniSearch<SearchDocument>({ fields: ["path", "terms"], storeFields: ["path"] });
  index.addAll(map.records.map((record) => ({ id: record.path, path: record.path, terms: terms(record) })));
  const records = new Map(map.records.map((record) => [record.path, record]));
  const taskTerms = new Set((signals.taskTerms ?? []).map(normalizeTerm).filter(Boolean));
  const relevant = new Set((signals.relevantPaths ?? []).flatMap((path) => {
    try { return [normalizeRepositoryPath(path)]; } catch { return []; }
  }));
  const languageTerms = new Set([...(signals.languages ?? []), ...(signals.technologies ?? [])].map(normalizeTerm).filter(Boolean));

  return index.search(normalizedQuery, { fuzzy: 0.2, prefix: true }).slice(0, 50).flatMap((candidate) => {
    const record = records.get(String(candidate.id));
    if (record === undefined) return [];
    const ranked = rank(record, Math.round(candidate.score * 10), taskTerms, relevant, signals.packagePath, languageTerms);
    return [ranked];
  }).sort((left, right) => right.score - left.score || compareCodeUnits(left.path, right.path)).slice(0, limit);
}

function rank(record: RepoMapRecordV1, base: number, taskTerms: Set<string>, relevant: Set<string>, packagePath: string | undefined, languageTerms: Set<string>): RepoMapQueryResult {
  let score = base;
  const reasons = ["lexical match"];
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
    reasons: reasons.sort(compareCodeUnits),
    score,
  };
}

function terms(record: RepoMapRecordV1): string {
  return [record.path, record.packagePath, record.language ?? "", record.kind, ...record.identifiers, ...record.headings, ...record.importTargets].join(" ");
}

function normalizeTerm(value: string): string {
  return value.toLocaleLowerCase().replaceAll(/[^\p{L}\p{N}_-]+/gu, " ").trim();
}
