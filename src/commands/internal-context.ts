import { access } from "node:fs/promises";
import { join } from "node:path";
import { buildContext, loadContextManifest } from "../core/context/context.js";
import { readConfig } from "../core/config/config.js";
import { resolveActiveTask } from "../core/tasks/task.js";

export type InternalContextPlatform = "kiro" | "antigravity" | "codex";

export async function renderInternalContext(root: string, platform: InternalContextPlatform): Promise<string> {
  const harnixRoot = join(root, ".harnix");
  if (!await exists(join(harnixRoot, "config.yaml"))) return "";
  const config = await readConfig(join(harnixRoot, "config.yaml"));
  const active = await resolveActiveTask(harnixRoot);
  if (!active) return platform === "codex" ? JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: "" } }) : "";
  const contextPath = join(harnixRoot, "tasks", active.id, "context.json");
  const entries = await exists(contextPath) ? (await loadContextManifest(contextPath)).entries : active.relevantPaths.map((path) => ({ path, reason: "task reference", priority: 0, pinned: false, states: ["implementing"] }));
  const output = await buildContext(root, entries, config.context.maxCharacters, { references: active.relevantPaths }, config.runtime.fullContext);
  const text = output.text.length === 0 ? "" : `${output.text}\n\nOmitted: ${output.manifest.omitted.map((item) => item.path).join(", ") || "none"}`;
  if (platform === "codex") return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: text.slice(0, 2500) } });
  return text.slice(0, config.context.maxCharacters);
}
async function exists(path: string): Promise<boolean> { try { await access(path); return true; } catch { return false; } }
