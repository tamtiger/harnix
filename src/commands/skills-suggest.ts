import { reportSkillCatalog, type SkillCatalogOptions } from "./skills.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface SkillSuggestion {
  name: string;
  description: string;
  score: number;
  matchedReferences?: string[];
  kind: "workflow" | "technique" | "project";
}

export interface SkillSuggestResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  query: string;
  suggestions: SkillSuggestion[];
}

/** Words that say nothing about which skill fits; matching them as text made every unrelated prompt score. */
const STOPWORDS = new Set(
  "a an and are as at be but by can do does for from has have how i if in is it its me my no not of on or so that the this to we what when where which who with you your use".split(
    " ",
  ),
);

const MIN_PREFIX_LENGTH = 4;

/** Light stem: a plural `s`, then `-ing` or `-ed` with a doubled final letter undone (`debugging` becomes `debug`). */
function stem(word: string): string {
  const base = word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
  for (const suffix of ["ing", "ed"]) {
    if (base.endsWith(suffix) && base.length - suffix.length >= MIN_PREFIX_LENGTH) {
      return base.slice(0, -suffix.length).replace(/([^aeiou\d])\1$/u, "$1");
    }
  }
  return base;
}

/** Lower-case word tokens (any script, so accented words stay whole), stemmed, without stopwords. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFC")
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 1 && !STOPWORDS.has(word))
      .map(stem),
  );
}

/** 2 for a whole word, 1 when the query token (4+ characters) is the start of one, else 0. */
function match(words: ReadonlySet<string>, token: string): 0 | 1 | 2 {
  if (words.has(token)) return 2;
  if (token.length < MIN_PREFIX_LENGTH) return 0;
  for (const word of words) if (word.startsWith(token)) return 1;
  return 0;
}

export function suggestSkills(query: string, options?: SkillCatalogOptions): SkillSuggestResultV1 {
  const catalog = reportSkillCatalog({ ...options, all: true });
  const rawWords = [...tokenize(query)];
  if (rawWords.length === 0) {
    return { generator: "harnix", schemaVersion: 1, query, suggestions: [] };
  }

  const suggestions: SkillSuggestion[] = [];

  for (const item of catalog.skills) {
    let score = 0;
    const nameWords = tokenize(item.name);
    const descWords = tokenize(item.description);
    const matchedRefs: string[] = [];

    for (const ref of item.references) {
      const refWords = tokenize(ref);
      const best = Math.max(...rawWords.map((w) => match(refWords, w)));
      if (best > 0) {
        matchedRefs.push(ref);
        score += best === 2 ? 3 : 2;
      }
    }

    for (const word of rawWords) {
      score += [0, 3, 5][match(nameWords, word)] ?? 0;
      score += [0, 1, 2][match(descWords, word)] ?? 0;
    }

    if (score > 0) {
      suggestions.push({
        name: item.name,
        description: item.description,
        score,
        ...(matchedRefs.length > 0 ? { matchedReferences: matchedRefs } : {}),
        kind: item.kind ?? "workflow",
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score || compareCodeUnits(a.name, b.name));

  return {
    generator: "harnix",
    schemaVersion: 1,
    query,
    suggestions,
  };
}
