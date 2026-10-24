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

export function suggestSkills(query: string, options?: SkillCatalogOptions): SkillSuggestResultV1 {
  const catalog = reportSkillCatalog({ ...options, all: true });
  const rawWords = query
    .toLowerCase()
    .split(/[\s,._-]+/u)
    .filter((w) => w.length > 1);
  if (rawWords.length === 0) {
    return { generator: "harnix", schemaVersion: 1, query, suggestions: [] };
  }

  const suggestions: SkillSuggestion[] = [];

  for (const item of catalog.skills) {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const matchedRefs: string[] = [];

    for (const ref of item.references) {
      const refLower = ref.toLowerCase();
      if (rawWords.some((w) => refLower.includes(w))) {
        matchedRefs.push(ref);
        score += 3;
      }
    }

    for (const word of rawWords) {
      if (nameLower.includes(word)) score += 5;
      if (descLower.includes(word)) score += 2;
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
