import { readFile } from "node:fs/promises";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import type { DesiredManagedFile } from "../utils/managed-files.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { harnixAgentsBlock } from "../templates/harnix/agents.js";
import { packageVersion } from "../version.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

export const codexManagedBlock = harnixAgentsBlock;

export function codexDesiredFiles(): DesiredManagedFile[] {
  return workflowSkills.map((skill) => ({ entry: { path: `.agents/skills/${skill.name}/SKILL.md`, sourceId: skill.name, scope: "codex", generatedHash: "0".repeat(64), generatorVersion: packageVersion }, content: renderSkill(skill) }));
}

export interface CodexSurfacePlan { agentsPath: string; agents: string; configPath: string; config: string; hooksPath: string; hooks: string; }

export async function prepareCodexSurfaces(root: string, preserveModifiedBlock = false, preserveModifiedConfiguration = preserveModifiedBlock): Promise<CodexSurfacePlan> {
  const agentsPath = await resolveSafeProjectPath(root, "AGENTS.md"), existing = await readOptionalFile(agentsPath);
  const start = existing.indexOf(begin), finish = existing.indexOf(end);
  if (start >= 0 && finish < start) throw new Error("Cannot merge AGENTS.md because Harnix markers are unbalanced.");
  const modified = start >= 0 && finish >= start && existing.slice(start, finish + end.length) !== codexManagedBlock;
  const agents = modified && preserveModifiedBlock ? existing : start >= 0 && finish >= start ? `${existing.slice(0, start)}${codexManagedBlock}${existing.slice(finish + end.length)}` : existing.length === 0 ? `${codexManagedBlock}\n` : `${existing.trimEnd()}\n\n${codexManagedBlock}\n`;
  const configPath = await resolveSafeProjectPath(root, ".codex/config.toml"), hooksPath = await resolveSafeProjectPath(root, ".codex/hooks.json");
  const config = mergeCodexConfig(await readOptionalFile(configPath), !preserveModifiedConfiguration);
  const hooks = `${JSON.stringify(mergeCodexHooks(await readOptionalFile(hooksPath), !preserveModifiedConfiguration), null, 2)}\n`;
  return { agentsPath, agents, configPath, config, hooksPath, hooks };
}
export async function applyCodexSurfaces(plan: CodexSurfacePlan): Promise<void> {
  await Promise.all([atomicWriteFile(plan.agentsPath, plan.agents), atomicWriteFile(plan.configPath, plan.config), atomicWriteFile(plan.hooksPath, plan.hooks)]);
}
export async function configureCodex(root: string, preserveModifiedSurfaces = false): Promise<void> {
  await applyCodexSurfaces(await prepareCodexSurfaces(root, preserveModifiedSurfaces));
}
export function mergeCodexConfig(existing: string, replaceOwned = true): string {
  const sections = tomlSections(existing), owned = sections.filter((section) => section.name === "harnix");
  if (owned.length > 1) throw new Error("Cannot merge .codex/config.toml because [harnix] is duplicated.");
  if (!replaceOwned && owned.length === 1) return existing;
  let withoutHarnix = existing;
  if (owned[0]) withoutHarnix = `${existing.slice(0, owned[0].start)}${existing.slice(owned[0].end)}`;
  withoutHarnix = withoutHarnix.trimEnd();
  return `${withoutHarnix}${withoutHarnix.length === 0 ? "" : "\n\n"}[harnix]\nenabled = true\n`;
}
export function mergeCodexHooks(existing: string, replaceOwned = true): { hooks: Record<string, unknown[]> } {
  const harnixHook = { command: "harnix internal context --platform codex", commandWindows: "harnix.exe internal context --platform codex", timeout: 5, additionalContextLimit: 2500 };
  if (existing.length === 0) return { hooks: { UserPromptSubmit: [harnixHook] } };
  let parsed: unknown; try { parsed = JSON.parse(existing); } catch { throw new Error("Cannot merge .codex/hooks.json because it is not valid JSON."); }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Cannot merge .codex/hooks.json because it must be an object.");
  const hooks = (parsed as Record<string, unknown>).hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) throw new Error("Cannot merge .codex/hooks.json because hooks must be an object.");
  const prompt = (hooks as Record<string, unknown>).UserPromptSubmit;
  if (prompt !== undefined && !Array.isArray(prompt)) throw new Error("Cannot merge .codex/hooks.json because UserPromptSubmit must be an array.");
  if (!replaceOwned && (prompt ?? []).some((hook) => typeof hook === "object" && hook !== null && "command" in hook && (hook as { command?: unknown }).command === harnixHook.command)) return parsed as { hooks: Record<string, unknown[]> };
  const retained = (prompt ?? []).filter((hook) => !(typeof hook === "object" && hook !== null && "command" in hook && (hook as { command?: unknown }).command === harnixHook.command));
  return { ...(parsed as Record<string, unknown>), hooks: { ...(hooks as Record<string, unknown[]>), UserPromptSubmit: [...retained, harnixHook] } };
}
async function readOptionalFile(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
function tomlSections(source: string): Array<{ name?: string; start: number; end: number }> {
  const starts: Array<{ name?: string; start: number }> = [];
  let offset = 0;
  for (const line of source.split(/(?<=\n)/u)) {
    const value = line.replace(/\r?\n$/u, "").trim();
    if (value.startsWith("[")) {
      const table = /^\[([A-Za-z0-9_.-]+)\](?:\s*#.*)?$/u.exec(value);
      const arrayTable = /^\[\[[A-Za-z0-9_.-]+\]\](?:\s*#.*)?$/u.test(value);
      if (!table && !arrayTable) throw new Error("Cannot merge .codex/config.toml because a table header is malformed.");
      starts.push({ ...(table ? { name: table[1] } : {}), start: offset });
    }
    offset += line.length;
  }
  return starts.map((section, index) => ({ ...section, end: starts[index + 1]?.start ?? source.length }));
}
