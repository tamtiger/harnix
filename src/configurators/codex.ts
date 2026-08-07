import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { ensureManagedWorkflow } from "../templates/harnix/managed-workflow.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";

export async function configureCodex(root: string): Promise<void> {
  const agentsPath = join(root, "AGENTS.md"), existing = await readOptionalFile(agentsPath);
  const block = `${begin}\n## Harnix\n\nUse .harnix/workflow.md and Harnix skills for project-local workflow guidance.\n${end}`;
  const start = existing.indexOf(begin), finish = existing.indexOf(end);
  const agents = start >= 0 && finish >= start ? `${existing.slice(0, start)}${block}${existing.slice(finish + end.length)}` : existing.length === 0 ? `${block}\n` : `${existing.trimEnd()}\n\n${block}\n`;
  const configPath = join(root, ".codex", "config.toml"), hooksPath = join(root, ".codex", "hooks.json");
  const skills = workflowSkills.map((skill) => atomicWriteFile(join(root, ".agents", "skills", skill.name, "SKILL.md"), renderSkill(skill)));
  await Promise.all([atomicWriteFile(agentsPath, agents), ...skills, ensureManagedWorkflow(root), atomicWriteFile(configPath, mergeCodexConfig(await readOptionalFile(configPath))), atomicWriteFile(hooksPath, `${JSON.stringify(mergeCodexHooks(await readOptionalFile(hooksPath)), null, 2)}\n`)]);
}
export function mergeCodexConfig(existing: string): string { const withoutHarnix = existing.split(/(?=^\[[^\r\n]+\])/mu).filter((section) => !section.startsWith("[harnix]")).join("").trimEnd(); return `${withoutHarnix}${withoutHarnix.length === 0 ? "" : "\n\n"}[harnix]\nenabled = true\n`; }
export function mergeCodexHooks(existing: string): { hooks: Record<string, unknown[]> } {
  const harnixHook = { command: "harnix internal context --platform codex", commandWindows: "harnix.exe internal context --platform codex", timeout: 5, additionalContextLimit: 2500 };
  if (existing.length === 0) return { hooks: { UserPromptSubmit: [harnixHook] } };
  let parsed: unknown; try { parsed = JSON.parse(existing); } catch { throw new Error("Cannot merge .codex/hooks.json because it is not valid JSON."); }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Cannot merge .codex/hooks.json because it must be an object.");
  const hooks = (parsed as Record<string, unknown>).hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) throw new Error("Cannot merge .codex/hooks.json because hooks must be an object.");
  const prompt = (hooks as Record<string, unknown>).UserPromptSubmit;
  if (prompt !== undefined && !Array.isArray(prompt)) throw new Error("Cannot merge .codex/hooks.json because UserPromptSubmit must be an array.");
  const retained = (prompt ?? []).filter((hook) => !(typeof hook === "object" && hook !== null && "command" in hook && (hook as { command?: unknown }).command === harnixHook.command));
  return { hooks: { ...(hooks as Record<string, unknown[]>), UserPromptSubmit: [...retained, harnixHook] } };
}
async function readOptionalFile(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
