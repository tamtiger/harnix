import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import type { LanguageId, TechnologyId } from "../catalog/catalog.js";
import { guideOutputPath, guideSources, selectGuideSources } from "../guides/catalog.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { pathExists } from "../utils/filesystem.js";

export const commonRules = guideSources.find(({ descriptor }) => descriptor.id === "common-engineering")!.content;
export const attribution = { source: "Harnix-authored adaptations informed by ECC/Superpowers research", license: "MIT-compatible adaptation metadata; see NOTICE" } as const;

export interface StackSelection { languages: LanguageId[]; technologies: TechnologyId[] }
export interface SeedRulesOptions extends StackSelection { root: string; force?: boolean | undefined }
export interface SeedRulesResult { paths: string[]; preserved: string[] }

export function composeRules(selection: StackSelection): string {
  return selectGuideSources(selection).map(({ content }) => content).join("\n");
}

export async function seedRules(options: SeedRulesOptions): Promise<SeedRulesResult> {
  const files = selectGuideSources(options).map((source) => ({ content: source.content, path: guideOutputPath(source) }));
  const paths: string[] = [], preserved: string[] = [];
  for (const file of files) {
    const absolute = await resolveSafeProjectPath(options.root, file.path);
    if (!options.force && await pathExists(absolute)) { preserved.push(file.path); continue; }
    await mkdir(join(absolute, ".."), { recursive: true });
    await atomicWriteFile(absolute, file.content);
    paths.push(file.path);
  }
  return { paths, preserved };
}
