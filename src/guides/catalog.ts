import type { GuideDescriptor, LanguageId, TechnologyId } from "src/catalog/catalog.js";
import { validateStackCatalog, stackCatalog } from "src/catalog/catalog.js";
import { matchesSafeGlob } from "src/utils/safe-glob.js";
import { compareCodeUnits } from "src/utils/order.js";
import { guideSources, type GuideSource } from "./sources.js";

export type { GuideSource } from "./sources.js";
export { guideSources } from "./sources.js";

export interface GuideSelection {
  languages: LanguageId[];
  technologies: TechnologyId[];
  activePaths?: string[] | undefined;
  topics?: string[] | undefined;
}

validateStackCatalog({
  guides: guideSources.map(({ descriptor }) => descriptor),
  languages: stackCatalog.languages.map((item) => ({ ...item, guideIds: [`language-${item.id}`] })),
  technologies: stackCatalog.technologies.map((item) => ({ ...item, guideIds: [`technology-${item.id}`] })),
});

export function selectGuideSources(
  selection: GuideSelection,
  sources: readonly GuideSource[] = guideSources,
): GuideSource[] {
  const languageIds = new Set(selection.languages),
    technologyIds = new Set(selection.technologies);
  const selected = sources.filter(({ descriptor }) => {
    const applies = descriptor.appliesTo;
    if ((applies.languages?.length ?? 0) > 0 && !applies.languages!.some((id) => languageIds.has(id))) return false;
    if ((applies.technologies?.length ?? 0) > 0 && !applies.technologies!.some((id) => technologyIds.has(id)))
      return false;
    if (
      descriptor.activation === "path" &&
      !applies.paths?.some((glob) => selection.activePaths?.some((path) => matchesSafeGlob(path, glob)))
    )
      return false;
    if (descriptor.activation === "task" && !applies.topics?.some((topic) => selection.topics?.includes(topic)))
      return false;
    return true;
  });
  const byId = new Map(sources.map((source) => [source.descriptor.id, source]));
  const composed = new Map(selected.map((source) => [source.descriptor.id, source]));
  const includeExtended = (source: GuideSource): void => {
    for (const id of source.descriptor.extends ?? []) {
      const extended = byId.get(id);
      if (extended === undefined || composed.has(id)) continue;
      composed.set(id, extended);
      includeExtended(extended);
    }
  };
  for (const source of selected) includeExtended(source);
  const superseded = new Set([...composed.values()].flatMap(({ descriptor }) => descriptor.supersedes ?? []));
  const retained = new Map(
    [...composed.values()]
      .filter(({ descriptor }) => !superseded.has(descriptor.id))
      .map((source) => [source.descriptor.id, source]),
  );
  const ordered: GuideSource[] = [],
    visited = new Set<string>(),
    visiting = new Set<string>();
  const visit = (source: GuideSource): void => {
    if (visited.has(source.descriptor.id) || visiting.has(source.descriptor.id)) return;
    visiting.add(source.descriptor.id);
    for (const id of source.descriptor.extends ?? []) {
      const dependency = retained.get(id);
      if (dependency !== undefined) visit(dependency);
    }
    visiting.delete(source.descriptor.id);
    visited.add(source.descriptor.id);
    ordered.push(source);
  };
  const stable = [...retained.values()].sort(
    (left, right) =>
      layer(left.descriptor) - layer(right.descriptor) ||
      left.descriptor.priority - right.descriptor.priority ||
      compareCodeUnits(left.descriptor.id, right.descriptor.id),
  );
  for (const source of stable) visit(source);
  return ordered;
}

export function guideOutputPath(source: GuideSource): string {
  return `.harnix/spec/guides/${source.descriptor.contentPath}`;
}

function layer(descriptor: GuideDescriptor): number {
  return descriptor.appliesTo.technologies?.length ? 2 : descriptor.appliesTo.languages?.length ? 1 : 0;
}
