import type { DetectionMatch, LanguageId } from "src/catalog/catalog.js";
import { compareCodeUnits } from "src/utils/order.js";

/**
 * A stray script (one `.py` or `.mjs` beside a TypeScript project) is only weak evidence: a language found through a
 * manifest or config file replaces every weak one, and weak languages count only when nothing stronger was found.
 */
export function selectedLanguages(matches: DetectionMatch[]): LanguageId[] {
  const languages = matches.filter((match): match is DetectionMatch & { id: LanguageId } => match.facet === "language");
  const strong = languages.filter(({ confidence }) => confidence !== "weak");
  return sortedUnique((strong.length > 0 ? strong : languages).map(({ id }) => id));
}

/** With packages the project languages are theirs, since each package already dropped its own stray weak evidence. */
export function projectLanguages(
  matches: DetectionMatch[],
  packages: Array<{ languages: LanguageId[] }>,
): LanguageId[] {
  return packages.length > 0
    ? sortedUnique(packages.flatMap(({ languages }) => languages))
    : selectedLanguages(matches);
}

function sortedUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort(compareCodeUnits);
}
