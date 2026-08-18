import type { LanguageId, TechnologyId } from "../catalog/catalog.js";
import { compareCodeUnits } from "./order.js";

export type LegacyStackId = "csharp-dotnet-abp" | "typescript-nestjs" | "php" | "python" | "java-spring" | "go" | "react-web" | "vue";

export interface StackProfile {
  languages: LanguageId[];
  technologies: TechnologyId[];
}

const legacyMappings: Record<LegacyStackId, StackProfile> = {
  "csharp-dotnet-abp": { languages: ["csharp"], technologies: ["abp", "dotnet"] },
  "typescript-nestjs": { languages: ["typescript"], technologies: ["nestjs"] },
  php: { languages: ["php"], technologies: [] },
  python: { languages: ["python"], technologies: [] },
  "java-spring": { languages: ["java"], technologies: ["spring"] },
  go: { languages: ["go"], technologies: [] },
  "react-web": { languages: [], technologies: ["react-web"] },
  vue: { languages: [], technologies: ["vue"] },
};

export const legacyStackIds = Object.freeze(Object.keys(legacyMappings).sort()) as readonly LegacyStackId[];

export function normalizeLegacyStackIds(ids: readonly LegacyStackId[]): StackProfile {
  return {
    languages: sorted(ids.flatMap((id) => legacyMappings[id].languages)),
    technologies: sorted(ids.flatMap((id) => legacyMappings[id].technologies)),
  };
}

function sorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort(compareCodeUnits);
}
