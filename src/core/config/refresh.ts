import { detectProject, type ProjectDetection } from "src/core/stack/detection.js";
import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { writeConfig, type HarnixConfigV2 } from "./config.js";

export const CONFIG_REFRESH_PACKAGE_LIMIT = 20;

export interface ConfigRefreshAdded {
  packages: string[];
  languages: string[];
  technologies: string[];
}

export interface ConfigRefreshResult {
  added: ConfigRefreshAdded;
  /** Added package paths beyond the {@link CONFIG_REFRESH_PACKAGE_LIMIT} listed ones. */
  morePackages: number;
  dryRun: boolean;
}

type Detected = Pick<ProjectDetection, "languages" | "technologies" | "packages">;

const sortedUnique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort(compareCodeUnits);

function repositoryPath(path: string): string | undefined {
  try {
    return normalizeRepositoryPath(path, { allowRoot: true });
  } catch {
    return undefined;
  }
}

/**
 * Adds the packages detection sees and the config lacks, matched by normalized path, plus the languages and
 * technologies of those new packages. Nothing already in the config is removed or edited, and a language or technology
 * the user took out of the top level stays out unless a package that is new to the config uses it.
 */
export function mergeDetectedConfig(
  config: HarnixConfigV2,
  detected: Detected,
): { config: HarnixConfigV2; added: ConfigRefreshAdded } {
  const known = new Set(config.packages.map(({ path }) => repositoryPath(path) ?? path));
  const newPackages: HarnixConfigV2["packages"] = [];
  for (const item of detected.packages) {
    const path = repositoryPath(item.path);
    if (path === undefined || known.has(path)) continue;
    known.add(path);
    newPackages.push({
      languages: sortedUnique(item.languages),
      path,
      technologies: sortedUnique(item.technologies),
    });
  }
  const languages = sortedUnique(
    newPackages.flatMap((item) => item.languages).filter((id) => !config.languages.includes(id)),
  );
  const technologies = sortedUnique(
    newPackages.flatMap((item) => item.technologies).filter((id) => !config.technologies.includes(id)),
  );
  const added: ConfigRefreshAdded = {
    languages,
    packages: newPackages.map(({ path }) => path).sort(compareCodeUnits),
    technologies,
  };
  if (added.packages.length + added.languages.length + added.technologies.length === 0) return { added, config };
  return {
    added,
    config: {
      ...config,
      languages: sortedUnique([...config.languages, ...languages]),
      packages: [...config.packages, ...newPackages].sort((left, right) => compareCodeUnits(left.path, right.path)),
      technologies: sortedUnique([...config.technologies, ...technologies]),
    },
  };
}

/**
 * Re-detects the project and merges the additions into `config.yaml` (not on a dry run). A detection failure is
 * ignored so `update` never fails because of it; the returned config is the merged one even on a dry run.
 */
export async function refreshProjectConfig(
  root: string,
  configPath: string,
  config: HarnixConfigV2,
  dryRun: boolean,
  detect: (projectRoot: string) => Promise<Detected> = detectProject,
): Promise<{ config: HarnixConfigV2; refreshed: ConfigRefreshResult }> {
  const none: ConfigRefreshAdded = { languages: [], packages: [], technologies: [] };
  let merged: ReturnType<typeof mergeDetectedConfig>;
  try {
    merged = mergeDetectedConfig(config, await detect(root));
  } catch {
    return { config, refreshed: { added: none, dryRun, morePackages: 0 } };
  }
  const { added } = merged;
  if (!dryRun && merged.config !== config) await writeConfig(configPath, merged.config);
  return {
    config: merged.config,
    refreshed: {
      added: { ...added, packages: added.packages.slice(0, CONFIG_REFRESH_PACKAGE_LIMIT) },
      dryRun,
      morePackages: Math.max(0, added.packages.length - CONFIG_REFRESH_PACKAGE_LIMIT),
    },
  };
}
