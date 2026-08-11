import { readFile, rm } from "node:fs/promises";

import { ownershipState, readManifest, type ManagedEntry } from "../utils/managed-files.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { readConfig, writeConfig } from "../core/config/config.js";
import { writeManifest } from "../utils/managed-files.js";
import { codexManagedBlock } from "../configurators/codex.js";

const begin = "<!-- harnix:begin -->";
const end = "<!-- harnix:end -->";
const harnixCommand = "harnix internal context --platform codex";
export interface UninstallOptions { root: string; purge?: boolean | undefined; yes?: boolean | undefined; }
export interface UninstallResult { removed: string[]; preserved: string[]; purgeTargets: string[]; confirmationRequired: boolean; }

export async function uninstallProject(options: UninstallOptions): Promise<UninstallResult> {
  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const manifest = await optionalManifest(manifestPath);
  const removed: string[] = [], preserved: string[] = [];
  const purgeTargets = options.purge ? [".harnix"] : [];
  const harnixRoot = options.purge ? await resolveSafeHarnixPath(options.root) : undefined;
  if (options.purge && !options.yes) return { removed, preserved, purgeTargets, confirmationRequired: true };
  await Promise.all([
    ...(manifest?.entries ?? []).filter((entry) => entry.scope !== "project").map((entry) => resolveSafeProjectPath(options.root, entry.path)),
    ...["AGENTS.md", "GEMINI.md", ".codex/hooks.json"].map((path) => resolveSafeProjectPath(options.root, path)),
  ]);
  const retainedEntries: ManagedEntry[] = [];
  for (const entry of manifest?.entries ?? []) {
    if (entry.scope === "project") { retainedEntries.push(entry); continue; }
    const state = await ownershipState(options.root, entry, entry);
    if (state === "unchanged") { await rm(await resolveSafeProjectPath(options.root, entry.path), { force: true }); removed.push(entry.path); }
    else { preserved.push(entry.path); retainedEntries.push(entry); }
  }
  await removeInjectionSurfaces(options.root, removed, preserved);
  if (options.purge) { await rm(harnixRoot!, { force: true, recursive: true }); removed.push(".harnix"); }
  else {
    const config = await readConfig(configPath);
    await writeConfig(configPath, { ...config, platforms: [] });
    if (manifest) await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries: retainedEntries.sort((left, right) => left.path.localeCompare(right.path)) });
  }
  return { removed: removed.sort(), preserved: preserved.sort(), purgeTargets, confirmationRequired: false };
}

async function optionalManifest(path: string): Promise<{ entries: ManagedEntry[] } | undefined> { try { return await readManifest(path); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return undefined; throw error; } }
async function removeInjectionSurfaces(root: string, removed: string[], preserved: string[]): Promise<void> {
  const blocks: Record<string, string> = {
    "AGENTS.md": codexManagedBlock,
    "GEMINI.md": `${begin}\n## Harnix\n\nUse .harnix/workflow.md and Harnix skills. Load bounded context with \`harnix internal context --platform antigravity\` when needed.\n${end}`,
  };
  for (const [relative, expectedBlock] of Object.entries(blocks)) {
    const path = await resolveSafeProjectPath(root, relative); const text = await optional(path); const start = text.indexOf(begin), finish = text.indexOf(end);
    if (start < 0 && finish < 0) continue;
    if (start < 0 || finish < start) { preserved.push(relative); continue; }
    const actualBlock = text.slice(start, finish + end.length);
    if (actualBlock !== expectedBlock) { preserved.push(relative); continue; }
    await atomicWriteFile(path, `${text.slice(0, start)}${text.slice(finish + end.length)}`.replace(/^\s+|\s+$/gu, "").concat("\n")); removed.push(`${relative}#harnix`);
  }
  const hookPath = await resolveSafeProjectPath(root, ".codex/hooks.json"); const hookText = await optional(hookPath);
  if (hookText) {
    try {
      const value = JSON.parse(hookText) as { hooks?: { UserPromptSubmit?: unknown[] } };
      const hooks = value.hooks?.UserPromptSubmit;
      if (hooks) {
        const retained = hooks.filter((hook) => !isUnmodifiedHarnixHook(hook));
        const modifiedHarnix = hooks.some((hook) => typeof hook === "object" && hook !== null && (hook as { command?: string }).command === harnixCommand && !isUnmodifiedHarnixHook(hook));
        if (modifiedHarnix) preserved.push(".codex/hooks.json");
        else if (retained.length !== hooks.length) { value.hooks!.UserPromptSubmit = retained; await atomicWriteFile(hookPath, `${JSON.stringify(value, null, 2)}\n`); removed.push(".codex/hooks.json#harnix"); }
      }
    } catch { preserved.push(".codex/hooks.json"); }
  }
}
function isUnmodifiedHarnixHook(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const hook = value as Record<string, unknown>;
  return Object.keys(hook).length === 4 && hook.command === harnixCommand && hook.commandWindows === "harnix.exe internal context --platform codex" && hook.timeout === 5 && hook.additionalContextLimit === 2500;
}
async function optional(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
