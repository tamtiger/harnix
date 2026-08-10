import { execFile } from "node:child_process";
import { join } from "node:path";

import { readConfig, writeConfig, type PlatformId } from "../core/config/config.js";
import { applyCodexSurfaces, prepareCodexSurfaces, type CodexSurfacePlan } from "../configurators/codex.js";
import { desiredFiles, updateProject } from "./update.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { applyAntigravitySurface, prepareAntigravitySurface, type AntigravitySurfacePlan } from "../configurators/antigravity.js";

export type VersionLookup = (executable: string, args: string[]) => Promise<string | undefined>;
export interface SetupPlatformsOptions { root: string; platforms: PlatformId[]; versionLookup?: VersionLookup; }
export interface SetupPlatformsResult { configured: PlatformId[]; skipped: PlatformId[]; warnings: string[]; }

export async function setupPlatforms(options: SetupPlatformsOptions): Promise<SetupPlatformsResult> {
  if (options.platforms.length === 0) throw new Error("At least one platform must be selected.");
  const config = await readConfig(join(options.root, ".harnix", "config.yaml"));
  const configured = [...new Set(options.platforms)].sort();
  const skipped: PlatformId[] = [];
  const warnings: string[] = [];
  const nextPlatforms = [...new Set([...config.platforms, ...configured])].sort();
  let codexPlan: CodexSurfacePlan | undefined, antigravityPlan: AntigravitySurfacePlan | undefined;

  for (const file of desiredFiles(nextPlatforms, config.languages)) await resolveSafeProjectPath(options.root, file.entry.path);
  for (const platform of configured) {
    if (platform === "codex") codexPlan = await prepareCodexSurfaces(options.root, config.platforms.includes("codex"));
    if (platform === "antigravity") {
      antigravityPlan = await prepareAntigravitySurface(options.root, config.platforms.includes("antigravity"));
      const version = await (options.versionLookup ?? lookupVersion)("agy", ["--version"]);
      if (!version) warnings.push("Antigravity executable 'agy' was not found; generated project guidance remains usable offline.");
    }
  }
  await writeConfig(join(options.root, ".harnix", "config.yaml"), { ...config, platforms: nextPlatforms });
  await updateProject({ root: options.root });
  if (codexPlan) await applyCodexSurfaces(codexPlan);
  if (antigravityPlan) await applyAntigravitySurface(antigravityPlan);
  return { configured, skipped, warnings };
}

async function lookupVersion(executable: string, args: string[]): Promise<string | undefined> { return new Promise((resolve) => execFile(executable, args, { windowsHide: true }, (error, stdout) => resolve(error ? undefined : stdout.trim()))); }
