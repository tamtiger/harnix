import { readFile } from "node:fs/promises";

import { atomicWriteFile } from "../utils/atomic-write.js";
import type { DesiredManagedFile } from "../utils/managed-files.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { packageVersion } from "../version.js";

export const antigravityManagedBlock = "<!-- harnix:begin -->\n## Harnix\n\nUse .harnix/workflow.md and Harnix skills. Load bounded context with `harnix internal context --platform antigravity` when needed.\n<!-- harnix:end -->";

export function antigravityDesiredFiles(): DesiredManagedFile[] {
  return workflowSkills.map((skill) => ({ entry: { path: `.gemini/skills/${skill.name}/SKILL.md`, sourceId: skill.name, scope: "antigravity", generatedHash: "0".repeat(64), generatorVersion: packageVersion }, content: renderSkill(skill) }));
}

export interface AntigravitySurfacePlan { path: string; content: string; }
export async function prepareAntigravitySurface(root: string, preserveModifiedBlock = false): Promise<AntigravitySurfacePlan> {
  const path = await resolveSafeProjectPath(root, "GEMINI.md");
  const existing = await optional(path);
  return { path, content: mergeManagedBlock(existing, antigravityManagedBlock, preserveModifiedBlock) };
}
export async function applyAntigravitySurface(plan: AntigravitySurfacePlan): Promise<void> { await atomicWriteFile(plan.path, plan.content); }
export async function configureAntigravity(root: string, preserveModifiedBlock = false): Promise<void> {
  await applyAntigravitySurface(await prepareAntigravitySurface(root, preserveModifiedBlock));
}

function mergeManagedBlock(existing: string, block: string, preserveModified: boolean): string {
  const begin = "<!-- harnix:begin -->", end = "<!-- harnix:end -->";
  const start = existing.indexOf(begin), finish = existing.indexOf(end);
  if (start >= 0 && finish >= start) {
    if (preserveModified && existing.slice(start, finish + end.length) !== block) return existing;
    return `${existing.slice(0, start)}${block}${existing.slice(finish + end.length)}`;
  }
  if (start >= 0 || finish >= 0) throw new Error("Cannot merge GEMINI.md because Harnix markers are unbalanced.");
  return existing.length === 0 ? `${block}\n` : `${existing.trimEnd()}\n\n${block}\n`;
}

async function optional(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
