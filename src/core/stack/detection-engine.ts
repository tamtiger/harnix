import { readFile, stat } from "node:fs/promises";
import {
  stackCatalog,
  type DetectionConfidence,
  type DetectionEvidence,
  type DetectionMatch,
  type DetectorExpression,
  type DetectorPredicate,
  type LanguageDescriptor,
  type TechnologyDescriptor,
} from "src/catalog/catalog.js";
import { compareCodeUnits } from "src/utils/order.js";
import { matchesSafeGlob } from "src/utils/safe-glob.js";

export interface CollectedFile {
  absolute: string;
  path: string;
}

export interface DependencyFact {
  ecosystem: "npm" | "composer";
  name: string;
  path: string;
}

export interface DetectionFacts {
  files: CollectedFile[];
  dependencies: DependencyFact[];
}

const maxReadableBytes = 256 * 1024;
const maxEvidencePerMatch = 8;
const confidenceRank: Record<DetectionConfidence, number> = { weak: 0, probable: 1, confirmed: 2 };

export async function evaluateFacts(facts: DetectionFacts): Promise<DetectionMatch[]> {
  const matches: DetectionMatch[] = [];
  for (const descriptor of stackCatalog.languages) {
    const evaluated = await evaluateDescriptor(descriptor, facts);
    if (evaluated !== undefined)
      matches.push({ ...evaluated, facet: "language", id: descriptor.id, kind: "language", source: "catalog" });
  }
  for (const descriptor of stackCatalog.technologies) {
    const evaluated = await evaluateDescriptor(descriptor, facts);
    if (evaluated !== undefined)
      matches.push({ ...evaluated, facet: "technology", id: descriptor.id, kind: descriptor.kind, source: "catalog" });
  }
  applyTechnologyImplications(matches);
  return matches.sort(compareMatches);
}

async function evaluateDescriptor(
  descriptor: LanguageDescriptor | TechnologyDescriptor,
  facts: DetectionFacts,
): Promise<{ confidence: DetectionConfidence; evidence: DetectionEvidence[] } | undefined> {
  const matches: Array<{ confidence: DetectionConfidence; evidence: DetectionEvidence[] }> = [];
  for (const expression of descriptor.detectors) {
    const evidence = await evaluateExpression(expression, facts);
    if (evidence !== undefined) matches.push({ confidence: expression.confidence, evidence });
  }
  if (matches.length === 0) return undefined;
  const confidence = matches.reduce(
    (best, item) => (confidenceRank[item.confidence] > confidenceRank[best] ? item.confidence : best),
    matches[0]!.confidence,
  );
  return {
    confidence,
    evidence: uniqueEvidence(matches.flatMap(({ evidence }) => evidence)).slice(0, maxEvidencePerMatch),
  };
}

async function evaluateExpression(
  expression: DetectorExpression,
  facts: DetectionFacts,
): Promise<DetectionEvidence[] | undefined> {
  const allEvidence: DetectionEvidence[] = [];
  for (const predicate of expression.allOf ?? []) {
    const evidence = await matchPredicate(predicate, facts);
    if (evidence.length === 0) return undefined;
    allEvidence.push(...evidence);
  }
  if (expression.anyOf !== undefined) {
    const groups = await Promise.all(expression.anyOf.map(async (predicate) => matchPredicate(predicate, facts)));
    const matched = groups.filter((evidence) => evidence.length > 0);
    if (matched.length === 0) return undefined;
    allEvidence.push(...matched.flat());
  }
  for (const predicate of expression.noneOf ?? [])
    if ((await matchPredicate(predicate, facts)).length > 0) return undefined;
  return uniqueEvidence(allEvidence);
}

async function matchPredicate(predicate: DetectorPredicate, facts: DetectionFacts): Promise<DetectionEvidence[]> {
  if (predicate.kind === "file") {
    return facts.files
      .filter((file) => matchesSafeGlob(file.path, predicate.glob))
      .slice(0, maxEvidencePerMatch)
      .map((file) => ({ detail: predicate.glob, kind: "file", path: file.path }));
  }
  if (predicate.kind === "dependency") {
    return facts.dependencies
      .filter((fact) => fact.ecosystem === predicate.ecosystem && fact.name === predicate.name)
      .slice(0, maxEvidencePerMatch)
      .map((fact) => ({ detail: `${fact.ecosystem}:${fact.name}`, kind: "dependency", path: fact.path }));
  }
  const candidates = facts.files.filter((file) => matchesSafeGlob(file.path, predicate.glob));
  const evidence: DetectionEvidence[] = [];
  for (const file of candidates) {
    const content = await readBoundedText(file);
    if (content?.includes(predicate.contains))
      evidence.push({ detail: `contains:${predicate.contains}`, kind: "content", path: file.path });
    if (evidence.length >= maxEvidencePerMatch) break;
  }
  return evidence;
}

function applyTechnologyImplications(matches: DetectionMatch[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of [...matches]) {
      if (match.facet !== "technology") continue;
      const descriptor = stackCatalog.technologies.find(({ id }) => id === match.id);
      for (const id of descriptor?.implies?.technologies ?? []) {
        if (matches.some((candidate) => candidate.facet === "technology" && candidate.id === id)) continue;
        const implied = stackCatalog.technologies.find((candidate) => candidate.id === id)!;
        matches.push({
          confidence: match.confidence,
          evidence: match.evidence,
          facet: "technology",
          id,
          kind: implied.kind,
          source: "catalog",
        });
        changed = true;
      }
    }
  }
}

async function readBoundedText(file: CollectedFile): Promise<string | undefined> {
  try {
    if ((await stat(file.absolute)).size > maxReadableBytes) return undefined;
    return await readFile(file.absolute, "utf8");
  } catch {
    return undefined;
  }
}

function uniqueEvidence(values: DetectionEvidence[]): DetectionEvidence[] {
  const seen = new Set<string>();
  return values
    .filter((value) => {
      const key = `${value.path}\0${value.kind}\0${value.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) =>
      compareCodeUnits(`${left.path}\0${left.kind}\0${left.detail}`, `${right.path}\0${right.kind}\0${right.detail}`),
    );
}

function compareMatches(left: DetectionMatch, right: DetectionMatch): number {
  return compareCodeUnits(`${left.facet}\0${left.id}`, `${right.facet}\0${right.id}`);
}
