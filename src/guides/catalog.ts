import type { GuideDescriptor, LanguageId, TechnologyId } from "../catalog/catalog.js";
import { validateStackCatalog, stackCatalog } from "../catalog/catalog.js";
import { matchesSafeGlob } from "../utils/safe-glob.js";
import { compareCodeUnits } from "../utils/order.js";
import commonEngineering from "./common/engineering.md";
import csharpEngineering from "./languages/csharp/engineering.md";
import goEngineering from "./languages/go/engineering.md";
import javaEngineering from "./languages/java/engineering.md";
import javascriptEngineering from "./languages/javascript/engineering.md";
import phpEngineering from "./languages/php/engineering.md";
import pythonEngineering from "./languages/python/engineering.md";
import typescriptEngineering from "./languages/typescript/engineering.md";
import abpEngineering from "./technologies/framework/abp/engineering.md";
import codeigniterEngineering from "./technologies/framework/codeigniter/engineering.md";
import nestjsEngineering from "./technologies/framework/nestjs/engineering.md";
import springEngineering from "./technologies/framework/spring/engineering.md";
import vueEngineering from "./technologies/framework/vue/engineering.md";
import reactWebEngineering from "./technologies/library/react-web/engineering.md";
import dotnetEngineering from "./technologies/runtime/dotnet/engineering.md";

export interface GuideSource { descriptor: GuideDescriptor; content: string }
export interface GuideSelection {
  languages: LanguageId[];
  technologies: TechnologyId[];
  activePaths?: string[] | undefined;
  topics?: string[] | undefined;
}

const provenance = { adaptedAt: "2026-08-13", license: "MIT-compatible adaptation metadata; see NOTICE", source: "Harnix-authored adaptations informed by ECC/Superpowers research" } as const;

function guide(id: string, title: string, contentPath: string, content: string, appliesTo: GuideDescriptor["appliesTo"], priority: number, activation: GuideDescriptor["activation"] = "always"): GuideSource {
  return { descriptor: { activation, appliesTo, category: "guide", contentPath, description: `${title} guidance`, id, priority, provenance, title }, content };
}

export const guideSources: GuideSource[] = [
  guide("common-engineering", "Common engineering", "common/engineering.md", commonEngineering, {}, 0),
  guide("language-csharp", "C#", "languages/csharp/engineering.md", csharpEngineering, { languages: ["csharp"] }, 10),
  guide("language-go", "Go", "languages/go/engineering.md", goEngineering, { languages: ["go"] }, 10),
  guide("language-java", "Java", "languages/java/engineering.md", javaEngineering, { languages: ["java"] }, 10),
  guide("language-javascript", "JavaScript", "languages/javascript/engineering.md", javascriptEngineering, { languages: ["javascript"] }, 10),
  guide("language-php", "PHP", "languages/php/engineering.md", phpEngineering, { languages: ["php"] }, 10),
  guide("language-python", "Python", "languages/python/engineering.md", pythonEngineering, { languages: ["python"] }, 10),
  guide("language-typescript", "TypeScript", "languages/typescript/engineering.md", typescriptEngineering, { languages: ["typescript"] }, 10),
  guide("technology-abp", "ABP", "technologies/framework/abp/engineering.md", abpEngineering, { technologies: ["abp"] }, 20),
  guide("technology-codeigniter", "CodeIgniter", "technologies/framework/codeigniter/engineering.md", codeigniterEngineering, { technologies: ["codeigniter"] }, 20),
  guide("technology-nestjs", "NestJS", "technologies/framework/nestjs/engineering.md", nestjsEngineering, { technologies: ["nestjs"] }, 20),
  guide("technology-spring", "Spring", "technologies/framework/spring/engineering.md", springEngineering, { technologies: ["spring"] }, 20),
  guide("technology-vue", "Vue", "technologies/framework/vue/engineering.md", vueEngineering, { technologies: ["vue"] }, 20),
  guide("technology-react-web", "React web", "technologies/library/react-web/engineering.md", reactWebEngineering, { technologies: ["react-web"] }, 20),
  guide("technology-dotnet", ".NET", "technologies/runtime/dotnet/engineering.md", dotnetEngineering, { technologies: ["dotnet"] }, 20),
];

validateStackCatalog({
  guides: guideSources.map(({ descriptor }) => descriptor),
  languages: stackCatalog.languages.map((item) => ({ ...item, guideIds: [`language-${item.id}`] })),
  technologies: stackCatalog.technologies.map((item) => ({ ...item, guideIds: [`technology-${item.id}`] })),
});

export function selectGuideSources(selection: GuideSelection, sources: readonly GuideSource[] = guideSources): GuideSource[] {
  const languageIds = new Set(selection.languages), technologyIds = new Set(selection.technologies);
  const selected = sources.filter(({ descriptor }) => {
    const applies = descriptor.appliesTo;
    if ((applies.languages?.length ?? 0) > 0 && !applies.languages!.some((id) => languageIds.has(id))) return false;
    if ((applies.technologies?.length ?? 0) > 0 && !applies.technologies!.some((id) => technologyIds.has(id))) return false;
    if (descriptor.activation === "path" && !applies.paths?.some((glob) => selection.activePaths?.some((path) => matchesSafeGlob(path, glob)))) return false;
    if (descriptor.activation === "task" && !applies.topics?.some((topic) => selection.topics?.includes(topic))) return false;
    return true;
  });
  const byId = new Map(sources.map((source) => [source.descriptor.id, source]));
  const composed = new Map(selected.map((source) => [source.descriptor.id, source]));
  const includeExtended = (source: GuideSource): void => {
    for (const id of source.descriptor.extends ?? []) {
      const extended = byId.get(id);
      if (extended === undefined || composed.has(id)) continue;
      composed.set(id, extended); includeExtended(extended);
    }
  };
  for (const source of selected) includeExtended(source);
  const superseded = new Set([...composed.values()].flatMap(({ descriptor }) => descriptor.supersedes ?? []));
  const retained = new Map(
    [...composed.values()]
      .filter(({ descriptor }) => !superseded.has(descriptor.id))
      .map((source) => [source.descriptor.id, source]),
  );
  const ordered: GuideSource[] = [], visited = new Set<string>(), visiting = new Set<string>();
  const visit = (source: GuideSource): void => {
    if (visited.has(source.descriptor.id) || visiting.has(source.descriptor.id)) return;
    visiting.add(source.descriptor.id);
    for (const id of source.descriptor.extends ?? []) {
      const dependency = retained.get(id);
      if (dependency !== undefined) visit(dependency);
    }
    visiting.delete(source.descriptor.id); visited.add(source.descriptor.id); ordered.push(source);
  };
  const stable = [...retained.values()].sort((left, right) => layer(left.descriptor) - layer(right.descriptor) || left.descriptor.priority - right.descriptor.priority || compareCodeUnits(left.descriptor.id, right.descriptor.id));
  for (const source of stable) visit(source);
  return ordered;
}

export function guideOutputPath(source: GuideSource): string { return `.harnix/spec/guides/${source.descriptor.contentPath}`; }

function layer(descriptor: GuideDescriptor): number { return descriptor.appliesTo.technologies?.length ? 2 : descriptor.appliesTo.languages?.length ? 1 : 0; }
